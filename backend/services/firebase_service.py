import logging
import uuid
from datetime import datetime
import firebase_admin
from firebase_admin import firestore, storage

logger = logging.getLogger(__name__)

# Fallback in-memory database for local testing when Firebase is not fully configured
_MOCK_DB = {
    "users": {},
    "materials": {},
    "summaries": {},
    "flashcards": {},
    "quizzes": {},
    "quiz_results": {},
    "study_plans": {},
    "analytics": {},
    "conversations": {}
}

class FirebaseService:
    _firestore_client = None
    _firestore_checked = False
    _storage_bucket = None
    _storage_checked = False

    @staticmethod
    def is_initialized():
        """Check if Firebase Admin SDK is initialized."""
        return len(firebase_admin._apps) > 0

    @classmethod
    def get_firestore_client(cls):
        """Retrieve Firestore client or return None if unconfigured (cached)."""
        if not cls.is_initialized():
            return None
        if cls._firestore_checked:
            return cls._firestore_client
            
        try:
            cls._firestore_client = firestore.client()
            logger.info("Successfully obtained Firestore client connection.")
        except Exception as e:
            logger.error(f"Failed to get Firestore client (using in-memory fallback): {e}")
            cls._firestore_client = None
        cls._firestore_checked = True
        return cls._firestore_client

    @classmethod
    def get_storage_bucket(cls):
        """Retrieve Storage bucket or return None if unconfigured (cached)."""
        if not cls.is_initialized():
            return None
        if cls._storage_checked:
            return cls._storage_bucket
            
        try:
            cls._storage_bucket = storage.bucket()
            logger.info("Successfully obtained Firebase Storage bucket connection.")
        except Exception as e:
            logger.error(f"Failed to get Storage bucket (using in-memory fallback): {e}")
            cls._storage_bucket = None
        cls._storage_checked = True
        return cls._storage_bucket

    @classmethod
    def store_document(cls, user_id, filename, file_bytes, content_type):
        """
        Uploads document to Firebase Storage and saves metadata in Firestore.
        Falls back to in-memory mocks if Firebase is unavailable.
        """
        doc_id = str(uuid.uuid4())
        bucket = cls.get_storage_bucket()
        db = cls.get_firestore_client()
        
        file_url = f"/mock-storage/{user_id}/{doc_id}/{filename}"
        
        # 1. Upload to Storage if available
        if bucket:
            try:
                blob = bucket.blob(f"documents/{user_id}/{doc_id}/{filename}")
                blob.upload_from_string(file_bytes, content_type=content_type)
                blob.make_public()
                file_url = blob.public_url
                logger.info(f"Successfully uploaded {filename} to Firebase Storage: {file_url}")
            except Exception as e:
                logger.error(f"Failed to upload to Firebase Storage, using mock URL: {e}")
        
        material_meta = {
            "id": doc_id,
            "user_id": user_id,
            "filename": filename,
            "file_url": file_url,
            "content_type": content_type,
            "uploaded_at": datetime.utcnow().isoformat(),
            "status": "processed"
        }
        
        # 2. Save metadata to Firestore if available
        if db:
            try:
                db.collection("materials").document(doc_id).set(material_meta)
                logger.info(f"Saved metadata to Firestore for document: {doc_id}")
            except Exception as e:
                logger.error(f"Failed to save metadata to Firestore: {e}")
                _MOCK_DB["materials"][doc_id] = material_meta
        else:
            logger.info("Firebase Firestore unconfigured. Saving metadata to mock database.")
            _MOCK_DB["materials"][doc_id] = material_meta
            
        return material_meta

    @classmethod
    def save_study_material(cls, user_id, material_id, data):
        """Saves or updates study material."""
        db = cls.get_firestore_client()
        if db:
            try:
                db.collection("materials").document(material_id).update(data)
                return True
            except Exception as e:
                logger.error(f"Error updating study material in Firestore: {e}")
        
        if material_id in _MOCK_DB["materials"]:
            _MOCK_DB["materials"][material_id].update(data)
            return True
        return False

    @classmethod
    def get_study_materials(cls, user_id):
        """Retrieves study materials for a specific user, attaching their summary metadata if present."""
        db = cls.get_firestore_client()
        materials = []
        if db:
            try:
                docs = db.collection("materials").where("user_id", "==", user_id).stream()
                materials = [doc.to_dict() for doc in docs]
                
                # Relational Join: Fetch summaries from separate 'summaries' collection
                for m in materials:
                    summary_doc = db.collection("summaries").document(f"{user_id}_{m['id']}").get()
                    if summary_doc.exists:
                        m["summary"] = summary_doc.to_dict().get("summary")
                return materials
            except Exception as e:
                logger.error(f"Error fetching study materials from Firestore: {e}")
                
        # In-memory fallback
        materials_list = [m.copy() for m in _MOCK_DB["materials"].values() if m.get("user_id") == user_id]
        for m in materials_list:
            summary_key = f"{user_id}_{m['id']}"
            if summary_key in _MOCK_DB["summaries"]:
                m["summary"] = _MOCK_DB["summaries"][summary_key].get("summary")
        return materials_list

    @classmethod
    def get_study_material(cls, user_id, material_id):
        """Retrieves a single study material by ID."""
        db = cls.get_firestore_client()
        if db:
            try:
                doc = db.collection("materials").document(material_id).get()
                if doc.exists:
                    data = doc.to_dict()
                    if data.get("user_id") == user_id:
                        return data
            except Exception as e:
                logger.error(f"Error fetching study material {material_id}: {e}")
        
        # Fallback to mock db
        material = _MOCK_DB["materials"].get(material_id)
        if material and material.get("user_id") == user_id:
            return material
        return None

    @classmethod
    def save_summary(cls, user_id, material_id, summary, length):
        """Saves generated summary to the 'summaries' collection in Firestore."""
        record_id = f"{user_id}_{material_id}"
        record = {
            "id": record_id,
            "user_id": user_id,
            "material_id": material_id,
            "summary": summary,
            "length": length,
            "created_at": datetime.utcnow().isoformat()
        }
        db = cls.get_firestore_client()
        if db:
            try:
                db.collection("summaries").document(record_id).set(record)
                return record
            except Exception as e:
                logger.error(f"Error saving summary to Firestore: {e}")
                
        _MOCK_DB["summaries"][record_id] = record
        return record

    @classmethod
    def save_flashcards(cls, user_id, material_id, cards):
        """Saves AI generated flashcards."""
        db = cls.get_firestore_client()
        record_id = f"{user_id}_{material_id}"
        record = {
            "id": record_id,
            "user_id": user_id,
            "material_id": material_id,
            "cards": cards,
            "created_at": datetime.utcnow().isoformat()
        }
        if db:
            try:
                db.collection("flashcards").document(record_id).set(record)
                return record
            except Exception as e:
                logger.error(f"Error saving flashcards to Firestore: {e}")
                
        _MOCK_DB["flashcards"][record_id] = record
        return record

    @classmethod
    def get_flashcards(cls, user_id, material_id=None):
        """Retrieves flashcards."""
        db = cls.get_firestore_client()
        if db:
            try:
                if material_id:
                    doc = db.collection("flashcards").document(f"{user_id}_{material_id}").get()
                    return doc.to_dict() if doc.exists else None
                else:
                    docs = db.collection("flashcards").where("user_id", "==", user_id).stream()
                    return [doc.to_dict() for doc in docs]
            except Exception as e:
                logger.error(f"Error fetching flashcards from Firestore: {e}")
        
        # In-memory fallback
        if material_id:
            return _MOCK_DB["flashcards"].get(f"{user_id}_{material_id}")
        else:
            return [f for f in _MOCK_DB["flashcards"].values() if f.get("user_id") == user_id]

    @classmethod
    def save_quiz(cls, user_id, material_id, questions):
        """Saves generated quiz questions."""
        quiz_id = str(uuid.uuid4())
        record = {
            "id": quiz_id,
            "user_id": user_id,
            "material_id": material_id,
            "questions": questions,
            "created_at": datetime.utcnow().isoformat()
        }
        db = cls.get_firestore_client()
        if db:
            try:
                db.collection("quizzes").document(quiz_id).set(record)
                return record
            except Exception as e:
                logger.error(f"Error saving quiz to Firestore: {e}")
                
        _MOCK_DB["quizzes"][quiz_id] = record
        return record

    @classmethod
    def get_quizzes(cls, user_id):
        """Retrieves quizzes generated for a user."""
        db = cls.get_firestore_client()
        if db:
            try:
                docs = db.collection("quizzes").where("user_id", "==", user_id).stream()
                return [doc.to_dict() for doc in docs]
            except Exception as e:
                logger.error(f"Error fetching quizzes from Firestore: {e}")
                
        return [q for q in _MOCK_DB["quizzes"].values() if q.get("user_id") == user_id]

    @classmethod
    def save_quiz_result(cls, user_id, material_id, quiz_id, score, total_questions):
        """Saves quiz score results in Firestore 'quiz_results' collection."""
        result_id = str(uuid.uuid4())
        percentage = round((score / total_questions) * 100, 1) if total_questions > 0 else 0.0
        record = {
            "id": result_id,
            "user_id": user_id,
            "material_id": material_id,
            "quiz_id": quiz_id,
            "score": score,
            "total_questions": total_questions,
            "percentage": percentage,
            "created_at": datetime.utcnow().isoformat()
        }
        db = cls.get_firestore_client()
        if db:
            try:
                db.collection("quiz_results").document(result_id).set(record)
                return record
            except Exception as e:
                logger.error(f"Error saving quiz result to Firestore: {e}")
                
        _MOCK_DB["quiz_results"][result_id] = record
        return record

    @classmethod
    def get_quiz_results(cls, user_id):
        """Retrieves all quiz results details completed by a user."""
        db = cls.get_firestore_client()
        if db:
            try:
                docs = db.collection("quiz_results").where("user_id", "==", user_id).stream()
                return [doc.to_dict() for doc in docs]
            except Exception as e:
                logger.error(f"Error fetching quiz results from Firestore: {e}")
                
        return [r for r in _MOCK_DB["quiz_results"].values() if r.get("user_id") == user_id]

    @classmethod
    def save_schedule(cls, user_id, schedule):
        """Saves generated study schedule/planner tasks to 'study_plans' collection."""
        db = cls.get_firestore_client()
        record = {
            "user_id": user_id,
            "tasks": schedule,
            "updated_at": datetime.utcnow().isoformat()
        }
        if db:
            try:
                db.collection("study_plans").document(user_id).set(record)
                return record
            except Exception as e:
                logger.error(f"Error saving study plan to Firestore: {e}")
                
        _MOCK_DB["study_plans"][user_id] = record
        return record

    @classmethod
    def get_schedule(cls, user_id):
        """Retrieves study schedule for a user from 'study_plans' collection."""
        db = cls.get_firestore_client()
        if db:
            try:
                doc = db.collection("study_plans").document(user_id).get()
                if doc.exists:
                    return doc.to_dict()
            except Exception as e:
                logger.error(f"Error fetching study plan from Firestore: {e}")
                
        return _MOCK_DB["study_plans"].get(user_id, {"user_id": user_id, "tasks": []})

    @classmethod
    def get_analytics(cls, user_id):
        """Generates or fetches study analytics metrics dynamically."""
        db = cls.get_firestore_client()
        materials_count = len(cls.get_study_materials(user_id))
        quiz_results = cls.get_quiz_results(user_id)
        quizzes_completed = len(quiz_results)
        
        # Calculate dynamic quiz average score from actual results
        avg_score = 80.0
        if quizzes_completed > 0:
            total_score = 0
            for r in quiz_results:
                total_score += r.get("percentage", 80.0)
            avg_score = round(total_score / quizzes_completed, 1)

        if db:
            try:
                doc_ref = db.collection("analytics").document(user_id)
                doc = doc_ref.get()
                if doc.exists:
                    data = doc.to_dict()
                    data["materials_count"] = materials_count
                    data["quizzes_completed"] = quizzes_completed
                    data["average_quiz_score"] = avg_score
                    return data
            except Exception as e:
                logger.error(f"Error fetching analytics from Firestore: {e}")
                
        mock_analytics = {
            "user_id": user_id,
            "study_time_hours": 18.5,
            "materials_count": materials_count,
            "quizzes_completed": quizzes_completed,
            "average_quiz_score": avg_score,
            "weekly_progress": [
                {"day": "Mon", "hours": 2.5},
                {"day": "Tue", "hours": 3.0},
                {"day": "Wed", "hours": 1.5},
                {"day": "Thu", "hours": 4.0},
                {"day": "Fri", "hours": 2.0},
                {"day": "Sat", "hours": 4.5},
                {"day": "Sun", "hours": 1.0}
            ],
            "subject_breakdown": [
                {"subject": "Computer Science", "percentage": 45},
                {"subject": "Mathematics", "percentage": 30},
                {"subject": "Physics", "percentage": 25}
            ]
        }
        return mock_analytics

    @classmethod
    def save_user_profile(cls, user_id, profile_data):
        """Saves user custom profile details in Firestore."""
        db = cls.get_firestore_client()
        if db:
            try:
                db.collection("users").document(user_id).set(profile_data, merge=True)
                return True
            except Exception as e:
                logger.error(f"Error saving user profile to Firestore: {e}")
        
        if user_id not in _MOCK_DB["users"]:
            _MOCK_DB["users"][user_id] = {}
        _MOCK_DB["users"][user_id].update(profile_data)
        return True

    @classmethod
    def get_user_profile(cls, user_id):
        """Retrieves user custom profile details from Firestore."""
        db = cls.get_firestore_client()
        if db:
            try:
                doc = db.collection("users").document(user_id).get()
                if doc.exists:
                    return doc.to_dict()
            except Exception as e:
                logger.error(f"Error fetching user profile from Firestore: {e}")
                
        return _MOCK_DB["users"].get(user_id, {
            "uid": user_id,
            "name": "Dev Student",
            "major": "Computer Science & Data AI",
            "level": "4 (Sophomore)"
        })

    @classmethod
    def save_chat_message(cls, user_id, message):
        """Appends a new message to the user's tutor chat history in Firestore."""
        db = cls.get_firestore_client()
        if db:
            try:
                doc_ref = db.collection("conversations").document(user_id)
                doc = doc_ref.get()
                messages = []
                if doc.exists:
                    messages = doc.to_dict().get("messages", [])
                messages.append(message)
                doc_ref.set({"user_id": user_id, "messages": messages, "updated_at": datetime.utcnow().isoformat()}, merge=True)
                return messages
            except Exception as e:
                logger.error(f"Error saving chat message to Firestore: {e}")
        
        # Mock DB fallback
        if "conversations" not in _MOCK_DB:
            _MOCK_DB["conversations"] = {}
        if user_id not in _MOCK_DB["conversations"]:
            _MOCK_DB["conversations"][user_id] = {"messages": []}
        _MOCK_DB["conversations"][user_id]["messages"].append(message)
        return _MOCK_DB["conversations"][user_id]["messages"]

    @classmethod
    def get_chat_history(cls, user_id):
        """Retrieves user's tutor chat history from Firestore."""
        db = cls.get_firestore_client()
        if db:
            try:
                doc = db.collection("conversations").document(user_id).get()
                if doc.exists:
                    return doc.to_dict().get("messages", [])
            except Exception as e:
                logger.error(f"Error fetching chat history from Firestore: {e}")
                
        # Mock DB fallback
        if "conversations" not in _MOCK_DB:
            _MOCK_DB["conversations"] = {}
        return _MOCK_DB["conversations"].get(user_id, {}).get("messages", [])
