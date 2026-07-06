import logging
from functools import wraps
from flask import request, jsonify
import firebase_admin
from firebase_admin import auth

from utils.errors import AppAuthenticationError

logger = logging.getLogger(__name__)

def auth_required(f):
    """
    Decorator to protect API routes with Firebase Authentication.
    Extracts Bearer Token from Authorization Header.
    Falls back to mock user if Firebase is unconfigured or a mock token is sent.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get("Authorization")
        
        if not auth_header or not auth_header.startswith("Bearer "):
            raise AppAuthenticationError("Missing or invalid authorization header. Expected Bearer <Token>.")
            
        token = auth_header.split(" ")[1]
        
        # Developer/Testing Bypass for easy out-of-the-box experience
        if token == "mock-token-123":
            request.user = {
                "uid": "dev_user_123",
                "email": "student@studyai.edu",
                "name": "Dev Student",
                "is_mock": True
            }
            return f(*args, **kwargs)
            
        # Verify with Firebase Auth
        if len(firebase_admin._apps) > 0:
            try:
                decoded_token = auth.verify_id_token(token)
                request.user = {
                    "uid": decoded_token.get("uid"),
                    "email": decoded_token.get("email"),
                    "name": decoded_token.get("name", "Student"),
                    "is_mock": False
                }
                return f(*args, **kwargs)
            except Exception as e:
                logger.error(f"Firebase token verification failed: {e}")
                raise AppAuthenticationError(f"Invalid or expired authorization token: {str(e)}")
        else:
            # Firebase is not initialized, mock login success to allow local testing
            logger.warning("Firebase Auth unavailable. Permitting bypass via mock user configuration.")
            request.user = {
                "uid": "dev_user_123",
                "email": "student@studyai.edu",
                "name": "Dev Student",
                "is_mock": True
            }
            return f(*args, **kwargs)
            
    return decorated_function
