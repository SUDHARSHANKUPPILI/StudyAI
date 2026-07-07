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
        raise AppValidationError(detail="Input validation failed.", error_code="VALIDATION_FAILED")
        
    try:
        user_id = request.user['uid']
        material_id = data.get("material_id")
        
        # Verify material ownership before AI generation
        if material_id:
            material = FirebaseService.get_study_material(user_id, material_id)
            if not material:
                raise AppValidationError(detail="Material not found or access denied.", error_code="OWNERSHIP_VIOLATION")
        
        summary = GroqService.generate_and_save_summary(
            user_id=user_id,
            text=req.text,
            length=req.length,
            focus=req.focus,
            material_id=material_id
        )
        return make_success_response(
            message="Summary generated successfully.",
            data={
                "summary": summary,
                "material_id": material_id
            }
        )
    except Exception as e:
        if isinstance(e, (AppValidationError, AppAIProcessingError)):
            raise e
        logger.error(f"Error in generate_summary: {e}")
        raise AppAIProcessingError("Failed to generate AI summary. Try again later.")

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
