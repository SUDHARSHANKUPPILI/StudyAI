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
        material = FileService.process_and_store_document(
            user_id=request.user['uid'],
            file=file,
            owner_email=request.user.get('email')
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
        materials = FirebaseService.get_study_materials(request.user['uid'])
        return make_success_response(
            message="Study materials retrieved successfully.",
            data=materials
        )
    except Exception as e:
        logger.error(f"Error fetching study materials: {e}")
        raise AppDatabaseError("Failed to load study materials.")
