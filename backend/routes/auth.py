import logging
from flask import Blueprint, request
from pydantic import ValidationError
from utils.decorators import auth_required
from services.firebase_service import FirebaseService
from models.schemas import ProfileRequestSchema
from utils.response import make_success_response
from utils.errors import APIException, AppDatabaseError, AppValidationError

logger = logging.getLogger(__name__)
auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/api/auth/session', methods=['GET'])
@auth_required
def get_session():
    """
    Verifies the user session.
    """
    return make_success_response(
        message="Session verified successfully.",
        data={
            "authenticated": True,
            "user": request.user
        }
    )

@auth_bp.route('/api/auth/login-mock', methods=['POST'])
def mock_login():
    """
    Mock login endpoint to quickly return testing tokens for development.
    """
    data = request.get_json() or {}
    email = data.get("email", "student@studyai.edu")
    
    return make_success_response(
        message="Mock login successful.",
        data={
            "token": "mock-token-123",
            "user": {
                "uid": "dev_user_123",
                "email": email,
                "name": "Dev Student"
            }
        }
    )

@auth_bp.route('/api/study/profile', methods=['GET'])
@auth_required
def get_profile():
    """Retrieve custom user details from DB."""
    try:
        profile = FirebaseService.get_user_profile(request.user['uid'])
        return make_success_response(
            message="User profile retrieved successfully.",
            data=profile
        )
    except Exception as e:
        logger.error(f"Error fetching user profile: {e}")
        raise AppDatabaseError("Failed to load user profile details.")

@auth_bp.route('/api/study/profile', methods=['PUT'])
@auth_required
def update_profile():
    """Update custom user details in DB."""
    try:
        data = request.get_json() or {}
        req = ProfileRequestSchema(**data)
    except ValidationError as e:
        raise AppValidationError(detail="Input validation failed.", error_code="VALIDATION_FAILED")
        
    try:
        payload = {
            "name": req.name,
            "major": req.major,
            "level": req.level
        }
        success = FirebaseService.save_user_profile(request.user['uid'], payload)
        if success:
            return make_success_response(
                message="Profile updated successfully.",
                data=payload
            )
        raise AppValidationError("Failed to update profile.")
    except Exception as e:
        if isinstance(e, APIException):
            raise e
        logger.error(f"Error updating user profile: {e}")
        raise AppDatabaseError("Failed to save user profile changes.")
