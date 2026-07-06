from utils.response import make_error_response

class APIException(Exception):
    """Base exception class conforming to the standard success/error format."""
    status_code = 500
    error_code = "INTERNAL_ERROR"
    title = "Internal Server Error"
    
    def __init__(self, detail=None, error_code=None, title=None, status_code=None):
        super().__init__(detail or self.title)
        self.detail = detail or self.title
        if error_code:
            self.error_code = error_code
        if title:
            self.title = title
        if status_code is not None:
            self.status_code = status_code

    def to_response(self):
        """Generates a standardized JSON response."""
        return make_error_response(
            message=self.detail,
            error_code=self.error_code,
            status_code=self.status_code
        )

class AppValidationError(APIException):
    """Raised when request inputs fail schema validation checks."""
    status_code = 400
    error_code = "VALIDATION_FAILED"
    title = "Input Validation Failed"

class AppAuthenticationError(APIException):
    """Raised when authentication tokens are missing or fail verification."""
    status_code = 401
    error_code = "UNAUTHENTICATED"
    title = "Authentication Required"

class AppNotFoundError(APIException):
    """Raised when resources (e.g. materials, quizzes) are not found."""
    status_code = 404
    error_code = "NOT_FOUND"
    title = "Resource Not Found"

class AppAIProcessingError(APIException):
    """Raised when LLM calls (e.g. Groq completions) timeout or fail."""
    status_code = 502
    error_code = "AI_PROCESSING_FAILED"
    title = "AI Model Engine Failure"

class AppDatabaseError(APIException):
    """Raised when database (e.g. Firestore) connections encounter errors."""
    status_code = 503
    error_code = "DATABASE_FAILED"
    title = "Data Persistence Failure"
