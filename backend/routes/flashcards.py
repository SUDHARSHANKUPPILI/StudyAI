import logging
from flask import Blueprint, request
from pydantic import ValidationError

from utils.decorators import auth_required
from services.groq_service import GroqService
from services.firebase_service import FirebaseService
from models.schemas import FlashcardsRequestSchema
from utils.response import make_success_response
from utils.errors import AppValidationError, AppAIProcessingError, AppDatabaseError

logger = logging.getLogger(__name__)
flashcards_bp = Blueprint('flashcards', __name__)

@flashcards_bp.route('/api/ai/flashcards', methods=['POST'])
@auth_required
def generate_flashcards():
    """Generates revision flashcards from source text."""
    try:
        data = request.get_json() or {}
        req = FlashcardsRequestSchema(**data)
    except ValidationError as e:
        raise AppValidationError(detail="Input validation failed.", error_code="VALIDATION_FAILED")
        
    try:
        user_id = request.user['uid']
        material_id = data.get("material_id", "manual_input")
        
        # Verify material ownership before AI generation
        if material_id and material_id != "manual_input":
            material = FirebaseService.get_study_material(user_id, material_id)
            if not material:
                raise AppValidationError(detail="Material not found or access denied.", error_code="OWNERSHIP_VIOLATION")
        
        saved_record = GroqService.generate_and_save_flashcards(
            user_id=user_id,
            text=req.text,
            count=req.count,
            material_id=material_id
        )
        return make_success_response(
            message="Flashcards generated successfully.",
            data=saved_record
        )
    except Exception as e:
        if isinstance(e, (AppValidationError, AppAIProcessingError)):
            raise e
        logger.error(f"Error in generate_flashcards: {e}")
        raise AppAIProcessingError("Failed to generate flashcards.")

@flashcards_bp.route('/api/study/flashcards', methods=['GET'])
@auth_required
def get_flashcards():
    """Retrieve flashcards. Optional query param 'material_id' filters by document."""
    try:
        material_id = request.args.get('material_id')
        cards = FirebaseService.get_flashcards(request.user['uid'], material_id)
        return make_success_response(
            message="Flashcards retrieved successfully.",
            data=cards
        )
    except Exception as e:
        logger.error(f"Error fetching flashcards: {e}")
        raise AppDatabaseError("Failed to load flashcards.")
