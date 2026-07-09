import logging
from flask import Blueprint, request
from utils.decorators import auth_required
from services.file_service import FileService
from services.firebase_service import FirebaseService
from utils.response import make_success_response
from utils.errors import APIException, AppDatabaseError, AppValidationError

logger = logging.getLogger(__name__)
upload_bp = Blueprint('upload', __name__)

@upload_bp.route('/api/uploads/document', methods=['POST'])
@auth_required
def upload_document():
    """
    Handles document file uploads.
    """
    if 'file' not in request.files:
        raise AppValidationError("No file payload found under 'file' multipart key.")
        
    file = request.files['file']
    
    if file.filename == '':
        raise AppValidationError("No selected filename.")
        
    try:
        user_id = request.user['uid']
        logger.info(f"[Upload Audit] Starting document upload. auth_uid={user_id}")
        
        material = FileService.process_and_store_document(
            user_id=user_id,
            file=file,
            owner_email=request.user.get('email')
        )
        
        # Immediate read-back verification (Requirement 3 & 4)
        logger.info(f"[Upload Audit] Saved material metadata. doc_id={material.get('id')}, ownerUid={material.get('ownerUid')}")
        verified = FirebaseService.get_study_material(user_id, material.get('id'))
        
        logger.info(
            f"[Upload Audit] Immediate read-back result: exists={verified is not None}, "
            f"verified_ownerUid={verified.get('ownerUid') if verified else 'N/A'}, "
            f"extracted_text_len={len(verified.get('extracted_text', '')) if verified else 0}"
        )
        
        return make_success_response(
            message="File successfully uploaded and processed.",
            data={"material": material},
            status_code=201
        )
    except ValueError as val_err:
        raise AppValidationError(str(val_err))
    except Exception as e:
        if isinstance(e, APIException):
            raise e
        logger.error(f"Error handling document upload: {e}")
        raise AppDatabaseError(f"Internal document upload processing failure: {str(e)}")

@upload_bp.route('/api/study/materials', methods=['GET'])
@auth_required
def get_materials():
    """Retrieve all study materials uploaded by the user."""
    try:
        user_id = request.user['uid']
        logger.info(f"[List Audit] Fetching materials. auth_uid={user_id}")
        
        materials = FirebaseService.get_study_materials(user_id)
        
        logger.info(
            f"[List Audit] Query completed. auth_uid={user_id}, "
            f"returned_documents_count={len(materials)}"
        )
        for idx, m in enumerate(materials):
            logger.info(
                f"[List Audit] Doc #{idx}: id={m.get('id')}, "
                f"ownerUid={m.get('ownerUid')}, user_id_legacy={m.get('user_id')}, "
                f"filename={m.get('filename')}"
            )
            
        return make_success_response(
            message="Study materials retrieved successfully.",
            data=materials
        )
    except Exception as e:
        logger.error(f"Error fetching study materials: {e}")
        raise AppDatabaseError("Failed to load study materials.")

@upload_bp.route('/api/study/materials/<material_id>', methods=['DELETE'])
@auth_required
def delete_material(material_id):
    """Deletes study material, storage file, and related documents."""
    try:
        user_id = request.user['uid']
        # Call FirebaseService delete (performs verification internally)
        FirebaseService.delete_study_material(user_id, material_id)
        return make_success_response(
            message="Material and all related records deleted successfully.",
            data={"material_id": material_id}
        )
    except ValueError as val_err:
        raise AppValidationError(str(val_err))
    except Exception as e:
        logger.error(f"Error deleting material {material_id}: {e}")
        raise AppDatabaseError(f"Failed to delete study material: {str(e)}")
