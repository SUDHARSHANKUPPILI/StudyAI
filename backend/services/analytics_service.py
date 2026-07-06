import logging
from services.firebase_service import FirebaseService
from services.groq_service import GroqService

logger = logging.getLogger(__name__)

class AnalyticsService:
    @classmethod
    def get_student_analytics(cls, user_id):
        """Retrieves student study hours, subject breakdown, and progress telemetry."""
        return FirebaseService.get_analytics(user_id)

    @classmethod
    def analyze_weakness_telemetry(cls, attempts):
        """Analyzes student weak topics based on quiz attempt details."""
        return GroqService.analyze_weak_topics(quiz_results=attempts)
