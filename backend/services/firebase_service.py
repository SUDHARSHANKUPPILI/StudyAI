import logging
import uuid
from datetime import datetime
import firebase_admin
from firebase_admin import firestore, storage
from google.cloud.firestore import FieldFilter

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

    # ──────────────────────────────────────────────
    # MATERIALS (Upload / Read / Update)
    # ──────────────────────────────────────────────

    @classmethod
    def store_document(cls, user_id, filename, file_bytes, content_type, owner_email=None):
        """
        Uploads document to Firebase Storage and saves metadata in Firestore.
        Falls back to in-memory mocks if Firebase is unavailable.

        Storage path: uploads/{uid}/{filename}
        """
        doc_id = str(uuid.uuid4())
        bucket = cls.get_storage_bucket()
        db = cls.get_firestore_client()
        now = datetime.utcnow().isoformat()
        
        file_url = f"/mock-storage/{user_id}/{doc_id}/{filename}"
        
        # 1. Upload to Storage if available — tenant-isolated path (Requirement 5)
        if bucket:
            try:
                blob = bucket.blob(f"uploads/{user_id}/{filename}")
                blob.upload_from_string(file_bytes, content_type=content_type)
                blob.make_public()
                file_url = blob.public_url
                logger.info(f"Successfully uploaded {filename} to Firebase Storage: {file_url}")
            except Exception as e:
                logger.error(f"Failed to upload to Firebase Storage: {e}")
                raise ValueError(f"Failed to upload to Firebase Storage: {str(e)}")
        
        material_meta = {
            "id": doc_id,
            "ownerUid": user_id,
            "ownerEmail": owner_email or "",
            "filename": filename,
            "file_url": file_url,
            "content_type": content_type,
            "createdAt": now,
            "updatedAt": now,
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
        """Saves or updates study material. Verifies ownership before updating."""
        db = cls.get_firestore_client()
        data["updatedAt"] = datetime.utcnow().isoformat()

        if db:
            try:
                doc = db.collection("materials").document(material_id).get()
                if doc.exists and doc.to_dict().get("ownerUid") != user_id:
                    logger.warning(f"Ownership violation: user {user_id} tried to update material {material_id}")
                    return False
                db.collection("materials").document(material_id).update(data)
                return True
            except Exception as e:
                logger.error(f"Error updating study material in Firestore: {e}")
        
        material = _MOCK_DB["materials"].get(material_id)
        if material and material.get("ownerUid") == user_id:
            material.update(data)
            return True
        return False

    @classmethod
    def get_study_materials(cls, user_id):
        """Retrieves study materials owned by a specific user, attaching their summary metadata if present.
        
        Backward compatible: queries both 'ownerUid' (new) and 'user_id' (legacy) fields.
        """
        db = cls.get_firestore_client()
        materials = []
        if db:
            try:
                # Query new ownerUid field (Requirement 9)
                docs = db.collection("materials").filter(filter=FieldFilter("ownerUid", "==", user_id)).stream()
                seen_ids = set()
                for doc in docs:
                    data = doc.to_dict()
                    seen_ids.add(data.get("id", doc.id))
                    materials.append(data)
                
                # Also query legacy user_id field for backward compatibility
                legacy_docs = db.collection("materials").filter(filter=FieldFilter("user_id", "==", user_id)).stream()
                for doc in legacy_docs:
                    data = doc.to_dict()
                    doc_id = data.get("id", doc.id)
                    if doc_id not in seen_ids:
                        materials.append(data)
                        seen_ids.add(doc_id)
                
                # Relational Join: Fetch summaries from separate 'summaries' collection
                for m in materials:
                    summary_doc = db.collection("summaries").document(f"{user_id}_{m['id']}").get()
                    if summary_doc.exists:
                        m["summary"] = summary_doc.to_dict().get("summary")
                return materials
            except Exception as e:
                logger.error(f"Error fetching study materials from Firestore: {e}")
                
        # In-memory fallback
        materials_list = [
            m.copy() for m in _MOCK_DB["materials"].values()
            if m.get("ownerUid") == user_id or m.get("user_id") == user_id
        ]
        for m in materials_list:
            summary_key = f"{user_id}_{m['id']}"
            if summary_key in _MOCK_DB["summaries"]:
                m["summary"] = _MOCK_DB["summaries"][summary_key].get("summary")
        return materials_list

    @classmethod
    def get_study_material(cls, user_id, material_id):
        """Retrieves a single study material by ID with built-in retries for consistency.
        
        Backward compatible: checks both 'ownerUid' (new) and 'user_id' (legacy) fields.
        """
        db = cls.get_firestore_client()
        if db:
            import time
            for attempt in range(3):
                try:
                    doc = db.collection("materials").document(material_id).get()
                    if doc.exists:
                        data = doc.to_dict()
                        doc_owner = data.get("ownerUid") or data.get("user_id")
                        if doc_owner == user_id:
                            # Auto-migrate legacy documents to use ownerUid
                            if "ownerUid" not in data:
                                logger.info(f"[Firebase] Auto-migrating legacy material {material_id} to ownerUid format")
                                db.collection("materials").document(material_id).update({"ownerUid": user_id})
                                data["ownerUid"] = user_id
                            return data
                        logger.warning(f"[Firebase] Ownership mismatch for material {material_id}: doc_owner={doc_owner}, requesting_user={user_id}")
                except Exception as e:
                    logger.error(f"Error fetching study material {material_id} (attempt {attempt + 1}): {e}")
                
                if attempt < 2:
                    logger.info(f"[Firebase] Material {material_id} not found or ownership mismatch. Retrying in 500ms... (attempt {attempt + 1}/3)")
                    time.sleep(0.5)
        
        # Fallback to mock db
        material = _MOCK_DB["materials"].get(material_id)
        if material:
            mat_owner = material.get("ownerUid") or material.get("user_id")
            if mat_owner == user_id:
                return material
        return None

    # ──────────────────────────────────────────────
    # SUMMARIES
    # ──────────────────────────────────────────────

    @classmethod
    def save_summary(cls, user_id, material_id, summary, length, owner_email=None):
        """Saves generated summary to the 'summaries' collection in Firestore."""
        record_id = f"{user_id}_{material_id}"
        now = datetime.utcnow().isoformat()
        record = {
            "id": record_id,
            "ownerUid": user_id,
            "ownerEmail": owner_email or "",
            "material_id": material_id,
            "summary": summary,
            "length": length,
            "createdAt": now,
            "updatedAt": now
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

    # ──────────────────────────────────────────────
    # FLASHCARDS
    # ──────────────────────────────────────────────

    @classmethod
    def save_flashcards(cls, user_id, material_id, cards, owner_email=None):
        """Saves AI generated flashcards."""
        db = cls.get_firestore_client()
        record_id = f"{user_id}_{material_id}"
        now = datetime.utcnow().isoformat()
        record = {
            "id": record_id,
            "ownerUid": user_id,
            "ownerEmail": owner_email or "",
            "material_id": material_id,
            "cards": cards,
            "createdAt": now,
            "updatedAt": now
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
        """Retrieves flashcards owned by the user."""
        db = cls.get_firestore_client()
        if db:
            try:
                if material_id:
                    doc = db.collection("flashcards").document(f"{user_id}_{material_id}").get()
                    if doc.exists:
                        data = doc.to_dict()
                        if data.get("ownerUid") == user_id:
                            return data
                    return None
                else:
                    docs = db.collection("flashcards").filter(filter=FieldFilter("ownerUid", "==", user_id)).stream()
                    return [doc.to_dict() for doc in docs]
            except Exception as e:
                logger.error(f"Error fetching flashcards from Firestore: {e}")
        
        # In-memory fallback
        if material_id:
            record = _MOCK_DB["flashcards"].get(f"{user_id}_{material_id}")
            if record and record.get("ownerUid") == user_id:
                return record
            return None
        else:
            return [f for f in _MOCK_DB["flashcards"].values() if f.get("ownerUid") == user_id]

    # ──────────────────────────────────────────────
    # QUIZZES
    # ──────────────────────────────────────────────

    @classmethod
    def save_quiz(cls, user_id, material_id, questions, owner_email=None):
        """Saves generated quiz questions."""
        quiz_id = str(uuid.uuid4())
        now = datetime.utcnow().isoformat()
        record = {
            "id": quiz_id,
            "ownerUid": user_id,
            "ownerEmail": owner_email or "",
            "material_id": material_id,
            "questions": questions,
            "createdAt": now,
            "updatedAt": now
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
        """Retrieves quizzes owned by the user."""
        db = cls.get_firestore_client()
        if db:
            try:
                docs = db.collection("quizzes").filter(filter=FieldFilter("ownerUid", "==", user_id)).stream()
                return [doc.to_dict() for doc in docs]
            except Exception as e:
                logger.error(f"Error fetching quizzes from Firestore: {e}")
                
        return [q for q in _MOCK_DB["quizzes"].values() if q.get("ownerUid") == user_id]

    # ──────────────────────────────────────────────
    # QUIZ RESULTS
    # ──────────────────────────────────────────────

    @classmethod
    def save_quiz_result(cls, user_id, material_id, quiz_id, score, total_questions, owner_email=None):
        """Saves quiz score results in Firestore 'quiz_results' collection."""
        result_id = str(uuid.uuid4())
        percentage = round((score / total_questions) * 100, 1) if total_questions > 0 else 0.0
        now = datetime.utcnow().isoformat()
        record = {
            "id": result_id,
            "ownerUid": user_id,
            "ownerEmail": owner_email or "",
            "material_id": material_id,
            "quiz_id": quiz_id,
            "score": score,
            "total_questions": total_questions,
            "percentage": percentage,
            "createdAt": now,
            "updatedAt": now
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
        """Retrieves all quiz results owned by the user."""
        db = cls.get_firestore_client()
        if db:
            try:
                docs = db.collection("quiz_results").filter(filter=FieldFilter("ownerUid", "==", user_id)).stream()
                return [doc.to_dict() for doc in docs]
            except Exception as e:
                logger.error(f"Error fetching quiz results from Firestore: {e}")
                
        return [r for r in _MOCK_DB["quiz_results"].values() if r.get("ownerUid") == user_id]

    # ──────────────────────────────────────────────
    # STUDY PLANNER
    # ──────────────────────────────────────────────

    @classmethod
    def save_schedule(cls, user_id, schedule):
        """Saves generated study schedule/planner tasks to 'study_plans' collection."""
        db = cls.get_firestore_client()
        now = datetime.utcnow().isoformat()
        record = {
            "ownerUid": user_id,
            "tasks": schedule,
            "createdAt": now,
            "updatedAt": now
        }
        if db:
            try:
                db.collection("study_plans").document(user_id).set(record, merge=True)
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
                    data = doc.to_dict()
                    if data.get("ownerUid") == user_id:
                        return data
            except Exception as e:
                logger.error(f"Error fetching study plan from Firestore: {e}")
                
        return _MOCK_DB["study_plans"].get(user_id, {"ownerUid": user_id, "tasks": []})

    # ──────────────────────────────────────────────
    # ANALYTICS
    # ──────────────────────────────────────────────

    @classmethod
    def get_analytics(cls, user_id):
        """Generates or fetches study analytics metrics dynamically from user-owned data only."""
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
                    if data.get("ownerUid") == user_id:
                        data["materials_count"] = materials_count
                        data["quizzes_completed"] = quizzes_completed
                        data["average_quiz_score"] = avg_score
                        return data
            except Exception as e:
                logger.error(f"Error fetching analytics from Firestore: {e}")
                
        mock_analytics = {
            "ownerUid": user_id,
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

    # ──────────────────────────────────────────────
    # USER PROFILE
    # ──────────────────────────────────────────────

    @classmethod
    def save_user_profile(cls, user_id, profile_data):
        """Saves user custom profile details in Firestore."""
        db = cls.get_firestore_client()
        profile_data["ownerUid"] = user_id
        profile_data["updatedAt"] = datetime.utcnow().isoformat()
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
        """Retrieves user custom profile details from Firestore. Returns only if owned by user."""
        db = cls.get_firestore_client()
        if db:
            try:
                doc = db.collection("users").document(user_id).get()
                if doc.exists:
                    data = doc.to_dict()
                    if data.get("ownerUid") == user_id:
                        return data
            except Exception as e:
                logger.error(f"Error fetching user profile from Firestore: {e}")
                
        return _MOCK_DB["users"].get(user_id, {
            "uid": user_id,
            "ownerUid": user_id,
            "name": "Dev Student",
            "major": "Computer Science & Data AI",
            "level": "4 (Sophomore)"
        })

    # ──────────────────────────────────────────────
    # TUTOR CONVERSATIONS
    # ──────────────────────────────────────────────

    @classmethod
    def save_chat_message(cls, user_id, message):
        """Appends a new message to the user's tutor chat history in Firestore."""
        db = cls.get_firestore_client()
        now = datetime.utcnow().isoformat()
        if db:
            try:
                doc_ref = db.collection("conversations").document(user_id)
                doc = doc_ref.get()
                messages = []
                if doc.exists:
                    data = doc.to_dict()
                    if data.get("ownerUid") != user_id:
                        logger.warning(f"Ownership violation: user {user_id} tried to access conversation owned by {data.get('ownerUid')}")
                        return []
                    messages = data.get("messages", [])
                messages.append(message)
                doc_ref.set({
                    "ownerUid": user_id,
                    "messages": messages,
                    "updatedAt": now
                }, merge=True)
                return messages
            except Exception as e:
                logger.error(f"Error saving chat message to Firestore: {e}")
        
        # Mock DB fallback
        if "conversations" not in _MOCK_DB:
            _MOCK_DB["conversations"] = {}
        if user_id not in _MOCK_DB["conversations"]:
            _MOCK_DB["conversations"][user_id] = {"ownerUid": user_id, "messages": []}
        _MOCK_DB["conversations"][user_id]["messages"].append(message)
        return _MOCK_DB["conversations"][user_id]["messages"]

    @classmethod
    def get_chat_history(cls, user_id):
        """Retrieves user's tutor chat history from Firestore. Returns only if owned by user."""
        db = cls.get_firestore_client()
        if db:
            try:
                doc = db.collection("conversations").document(user_id).get()
                if doc.exists:
                    data = doc.to_dict()
                    if data.get("ownerUid") == user_id:
                        return data.get("messages", [])
                    return []
            except Exception as e:
                logger.error(f"Error fetching chat history from Firestore: {e}")
                
        # Mock DB fallback
        if "conversations" not in _MOCK_DB:
            _MOCK_DB["conversations"] = {}
        conv = _MOCK_DB["conversations"].get(user_id, {})
        if conv.get("ownerUid", user_id) == user_id:
            return conv.get("messages", [])
        return []

    @classmethod
    def delete_study_material(cls, user_id, material_id):
        """
        Deletes a study material from Firebase Storage, Firestore,
        and all related records (summaries, flashcards, quizzes, quiz_results, analytics, study_plans).
        
        Verifies ownership before deletion.
        """
        # 1. Verify ownerUid and get material metadata (Requirement 1)
        material = cls.get_study_material(user_id, material_id)
        if not material:
            raise ValueError("Material not found or access denied.")

        filename = material.get("filename")
        
        db = cls.get_firestore_client()
        bucket = cls.get_storage_bucket()
        
        # 2. Delete file from Firebase Storage (Requirement 2)
        if bucket and filename:
            try:
                blob = bucket.blob(f"uploads/{user_id}/{filename}")
                if blob.exists():
                    blob.delete()
                    logger.info(f"[Firebase] Deleted Storage file: uploads/{user_id}/{filename}")
            except Exception as e:
                logger.error(f"[Firebase] Error deleting Storage file: {e}")
                
        # 3. Delete Firestore documents (Requirement 3 & 4)
        if db:
            try:
                # Delete material document
                db.collection("materials").document(material_id).delete()
                logger.info(f"[Firebase] Deleted materials document: {material_id}")
                
                # Delete related summaries
                db.collection("summaries").document(f"{user_id}_{material_id}").delete()
                
                # Delete related flashcards
                db.collection("flashcards").document(f"{user_id}_{material_id}").delete()
                
                # Delete related quizzes (Requirement 9)
                quizzes = db.collection("quizzes") \
                    .filter(filter=FieldFilter("ownerUid", "==", user_id)) \
                    .filter(filter=FieldFilter("material_id", "==", material_id)) \
                    .stream()
                for q in quizzes:
                    q.reference.delete()
                
                # Delete related quiz_results
                quiz_results = db.collection("quiz_results") \
                    .filter(filter=FieldFilter("ownerUid", "==", user_id)) \
                    .filter(filter=FieldFilter("material_id", "==", material_id)) \
                    .stream()
                for qr in quiz_results:
                    qr.reference.delete()
                    
                # Delete related analytics & study plans
                db.collection("analytics").document(user_id).delete()
                db.collection("study_plans").document(user_id).delete()
                logger.info(f"[Firebase] Deleted all related Firestore records for material: {material_id}")
            except Exception as e:
                logger.error(f"[Firebase] Error deleting Firestore records for material {material_id}: {e}")
                raise e
                
        # 4. In-memory Mock DB cleanup
        _MOCK_DB["materials"].pop(material_id, None)
        _MOCK_DB["summaries"].pop(f"{user_id}_{material_id}", None)
        _MOCK_DB["flashcards"].pop(f"{user_id}_{material_id}", None)
        _MOCK_DB["study_plans"].pop(user_id, None)
        _MOCK_DB["analytics"].pop(user_id, None)
        
        quizzes_to_del = [qid for qid, q in _MOCK_DB["quizzes"].items() if q.get("ownerUid") == user_id and q.get("material_id") == material_id]
        for qid in quizzes_to_del:
            _MOCK_DB["quizzes"].pop(qid, None)
            
        results_to_del = [rid for rid, r in _MOCK_DB["quiz_results"].items() if r.get("ownerUid") == user_id and r.get("material_id") == material_id]
        for rid in results_to_del:
            _MOCK_DB["quiz_results"].pop(rid, None)
            
        return True
