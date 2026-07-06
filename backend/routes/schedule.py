import logging
from flask import Blueprint, request
from pydantic import ValidationError

from utils.decorators import auth_required
from services.groq_service import GroqService
from services.firebase_service import FirebaseService
from models.schemas import ScheduleRequestSchema
from utils.response import make_success_response
from utils.errors import AppValidationError, AppAIProcessingError, AppDatabaseError

logger = logging.getLogger(__name__)
schedule_bp = Blueprint('schedule', __name__)

@schedule_bp.route('/api/ai/schedule', methods=['POST'])
@auth_required
def generate_schedule():
    """Generates study schedule task lists from learning goals and hourly dedication."""
    try:
        data = request.get_json() or {}
        req = ScheduleRequestSchema(**data)
    except ValidationError as e:
        raise AppValidationError(detail="Input validation failed.", error_code="VALIDATION_FAILED")
        
    try:
        saved_record = GroqService.generate_and_save_schedule(
            user_id=request.user['uid'],
            goals=req.goals,
            study_hours=req.study_hours
        )
        return make_success_response(
            message="Schedule generated successfully.",
            data=saved_record
        )
    except Exception as e:
        logger.error(f"Error in generate_schedule: {e}")
        raise AppAIProcessingError("Failed to generate study planner schedule.")

@schedule_bp.route('/api/study/schedule', methods=['GET'])
@auth_required
def get_schedule():
    """Retrieve study planner schedules and tasks."""
    try:
        schedule = FirebaseService.get_schedule(request.user['uid'])
        return make_success_response(
            message="Schedule retrieved successfully.",
            data=schedule
        )
    except Exception as e:
        logger.error(f"Error fetching study schedule: {e}")
        raise AppDatabaseError("Failed to load study planner.")

@schedule_bp.route('/api/study/schedule', methods=['PUT'])
@auth_required
def update_schedule():
    """Update active study tasks list (status progress checks)."""
    try:
        data = request.get_json() or {}
        tasks = data.get("tasks", [])
        
        updated = FirebaseService.save_schedule(request.user['uid'], tasks)
        return make_success_response(
            message="Schedule updated successfully.",
            data=updated
        )
    except Exception as e:
        logger.error(f"Error updating study schedule: {e}")
        raise AppDatabaseError("Failed to update study planner.")
