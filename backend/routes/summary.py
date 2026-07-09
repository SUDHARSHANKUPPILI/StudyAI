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
        
        logger.info(f"[Summary] Request from user={user_id}, material_id={material_id}, text_length={len(req.text)}")
        
        # Verify material ownership before AI generation
        if material_id:
            material = FirebaseService.get_study_material(user_id, material_id)
            if not material:
                logger.warning(f"[Summary] Ownership check FAILED: user={user_id}, material_id={material_id}")
                raise AppValidationError(
                    detail=f"Material '{material_id}' not found or you do not have access. It may have been uploaded before the ownership update — please re-upload the document.",
                    error_code="MATERIAL_NOT_FOUND"
                )
            logger.info(f"[Summary] Ownership verified for material={material_id}")
        
        # Verify Groq client is ready
        if not GroqService._get_client():
            logger.error("[Summary] Groq client is not initialized — GROQ_API_KEY may be missing on server.")
            raise AppAIProcessingError("AI service is temporarily unavailable. The server administrator must configure the GROQ_API_KEY.")
        
        summary = GroqService.generate_and_save_summary(
            user_id=user_id,
            text=req.text,
            length=req.length,
            focus=req.focus,
            material_id=material_id
        )
        
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
