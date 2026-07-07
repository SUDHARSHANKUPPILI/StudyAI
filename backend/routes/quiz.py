import logging
from flask import Blueprint, request
from pydantic import ValidationError

from utils.decorators import auth_required
from services.groq_service import GroqService
from services.firebase_service import FirebaseService
from models.schemas import QuizRequestSchema, QuizResultRequestSchema
from utils.response import make_success_response
from utils.errors import AppValidationError, AppAIProcessingError, AppDatabaseError

logger = logging.getLogger(__name__)
quiz_bp = Blueprint('quiz', __name__)

@quiz_bp.route('/api/ai/quiz', methods=['POST'])
@auth_required
def generate_quiz():
    """Generates quiz questions from source text."""
    try:
        data = request.get_json() or {}
        req = QuizRequestSchema(**data)
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
        
        saved_record = GroqService.generate_and_save_quiz(
            user_id=user_id,
            text=req.text,
            count=req.count,
            material_id=material_id
        )
        return make_success_response(
            message="Quiz generated successfully.",
            data=saved_record
        )
    except Exception as e:
        if isinstance(e, (AppValidationError, AppAIProcessingError)):
            raise e
        logger.error(f"Error in generate_quiz: {e}")
        raise AppAIProcessingError("Failed to generate quiz questions.")

@quiz_bp.route('/api/study/quizzes', methods=['GET'])
@auth_required
def get_quizzes():
    """Retrieve all quiz summaries completed by the user."""
    try:
        quizzes = FirebaseService.get_quizzes(request.user['uid'])
        return make_success_response(
            message="Quizzes retrieved successfully.",
            data=quizzes
        )
    except Exception as e:
        logger.error(f"Error fetching quizzes: {e}")
        raise AppDatabaseError("Failed to load quizzes.")

@quiz_bp.route('/api/study/quiz-results', methods=['POST'])
@auth_required
def save_quiz_result():
    """Saves a quiz attempt result for the student."""
    try:
        data = request.get_json() or {}
        req = QuizResultRequestSchema(**data)
    except ValidationError as e:
        raise AppValidationError(detail="Input validation failed.", error_code="VALIDATION_FAILED")
        
    try:
        result = FirebaseService.save_quiz_result(
            user_id=request.user['uid'],
            material_id=req.material_id,
            quiz_id=req.quiz_id,
            score=req.score,
            total_questions=req.total_questions
        )
        return make_success_response(
            message="Quiz result score recorded successfully.",
            data=result,
            status_code=201
        )
    except Exception as e:
        logger.error(f"Error saving quiz result: {e}")
        raise AppDatabaseError("Failed to save quiz result.")
