import logging
from flask import Blueprint, request
from pydantic import ValidationError
from utils.decorators import auth_required
from services.analytics_service import AnalyticsService
from models.schemas import WeakAnalysisRequestSchema
from utils.response import make_success_response
from utils.errors import AppDatabaseError, AppValidationError

logger = logging.getLogger(__name__)
analytics_bp = Blueprint('analytics', __name__)

@analytics_bp.route('/api/study/analytics', methods=['GET'])
@auth_required
def get_analytics():
    """Retrieve student study hours, subject breakdown, and progress telemetry."""
    try:
        analytics = AnalyticsService.get_student_analytics(request.user['uid'])
        return make_success_response(
            message="Analytics retrieved successfully.",
            data=analytics
        )
    except Exception as e:
        logger.error(f"Error fetching analytics data: {e}")
        raise AppDatabaseError("Failed to load analytics dashboard.")

@analytics_bp.route('/api/ai/weak-analysis', methods=['POST'])
@auth_required
def weak_analysis():
    """Analyze student weak topics based on quiz attempt details."""
    try:
        data = request.get_json() or {}
        req = WeakAnalysisRequestSchema(**data)
    except ValidationError as e:
        raise AppValidationError(detail="Input validation failed.", error_code="VALIDATION_FAILED")
        
    try:
        analysis = AnalyticsService.analyze_weakness_telemetry(req.attempts)
        return make_success_response(
            message="Weakness analysis completed successfully.",
            data=analysis
        )
    except Exception as e:
        logger.error(f"Error in weak_analysis: {e}")
        raise AppDatabaseError("Failed to analyze quiz attempt results.")
