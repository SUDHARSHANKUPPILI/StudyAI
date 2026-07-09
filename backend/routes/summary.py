import logging
from flask import Blueprint, request
from pydantic import ValidationError

from utils.decorators import auth_required
from services.groq_service import GroqService
from services.firebase_service import FirebaseService
from models.schemas import SummaryRequestSchema, TutorChatRequestSchema
from utils.response import make_success_response
from utils.errors import AppValidationError, AppAIProcessingError, AppDatabaseError

logger = logging.getLogger(__name__)
summary_bp = Blueprint('summary', __name__)

@summary_bp.route('/api/ai/summary', methods=['POST'])
@auth_required
def generate_summary():
    """Generates study notes summary from input text."""
    try:
        data = request.get_json() or {}
        req = SummaryRequestSchema(**data)
    except ValidationError as e:
        logger.warning(f"[Summary] Validation failed: {e}")
        raise AppValidationError(detail="Input validation failed. 'text' field requires at least 10 characters.", error_code="VALIDATION_FAILED")
        
    try:
        user_id = request.user['uid']
        material_id = data.get("material_id")
        extracted_text = req.text
        
        # Validation checks (Requirement 3)
        if not material_id:
            raise AppValidationError(detail="Validation Error: material_id is required.", error_code="MISSING_MATERIAL_ID")
        if not extracted_text or len(extracted_text.strip()) == 0:
            raise AppValidationError(detail="Validation Error: extracted_text cannot be empty.", error_code="EMPTY_TEXT")

        # Verify material ownership before AI generation
        material = FirebaseService.get_study_material(user_id, material_id)
        material_found = material is not None

        # Structured summary logs (Requirement 4)
        logger.info(
            f"[Summary Log] uid={user_id}, "
            f"material_id={material_id}, "
            f"material_found={material_found}, "
            f"extracted_text_length={len(extracted_text) if extracted_text else 0}"
        )

        if not material_found:
            logger.warning(f"[Summary] Ownership check FAILED: user={user_id}, material_id={material_id}")
            raise AppValidationError(
                detail=f"Material '{material_id}' not found or you do not have access. Please re-upload the document.",
                error_code="MATERIAL_NOT_FOUND"
            )
        
        logger.info(f"[Summary] Ownership verified for material={material_id}")
        
        # Verify Groq client is ready
        if not GroqService._get_client():
            logger.error("[Summary] Groq client is not initialized — GROQ_API_KEY may be missing on server.")
            raise AppAIProcessingError("AI service is temporarily unavailable. The server administrator must configure the GROQ_API_KEY.")
        
        # Structured Groq logs (Requirement 4)
        logger.info(f"[Summary Log] Groq request started for user={user_id}, material_id={material_id}")
        
        summary = GroqService.generate_and_save_summary(
            user_id=user_id,
            text=extracted_text,
            length=req.length,
            focus=req.focus,
            material_id=material_id
        )
        
        logger.info(f"[Summary Log] Groq response received for user={user_id}, material_id={material_id}")
        logger.info(f"[Summary] Successfully generated summary for user={user_id}, material_id={material_id}, summary_length={len(summary)}")
        
        return make_success_response(
            message="Summary generated successfully.",
            data={
                "summary": summary,
                "material_id": material_id
            }
        )
    except Exception as e:
        if isinstance(e, (AppValidationError, AppAIProcessingError, AppDatabaseError)):
            raise e
        logger.error(f"[Summary] Unhandled error: {type(e).__name__}: {e}", exc_info=True)
        raise AppAIProcessingError(f"Failed to generate AI summary: {type(e).__name__}. Check server logs for details.")

@summary_bp.route('/api/ai/tutor', methods=['POST'])
@auth_required
def tutor_chat():
    """Tutor dialogue loop endpoint."""
    try:
        data = request.get_json() or {}
        req = TutorChatRequestSchema(**data)
    except ValidationError as e:
        raise AppValidationError(detail="Input validation failed.", error_code="VALIDATION_FAILED")
        
    try:
        user_id = request.user['uid']
        tutor_response = GroqService.chat_with_tutor(user_id, req.message, req.material_id)
        history = FirebaseService.get_chat_history(user_id)
        
        return make_success_response(
            message="Tutor response generated successfully.",
            data={
                "response": tutor_response,
                "history": history
            }
        )
    except Exception as e:
        logger.error(f"Error in tutor_chat: {e}")
        raise AppAIProcessingError("AI Tutor connection lost.")

@summary_bp.route('/api/ai/tutor', methods=['GET'])
@auth_required
def get_tutor_history():
    """Retrieve user's tutor chat history logs."""
    try:
        history = FirebaseService.get_chat_history(request.user['uid'])
        return make_success_response(
            message="Tutor history retrieved successfully.",
            data={
                "history": history
            }
        )
    except Exception as e:
        logger.error(f"Error fetching tutor chat history: {e}")
        raise AppDatabaseError("Failed to load chat history.")
