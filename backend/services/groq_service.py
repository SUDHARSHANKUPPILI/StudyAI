import os
import json
import time
import logging
from groq import Groq
from prompts.loader import load_prompt
from utils.json_parser import safe_json_parse
from services.firebase_service import FirebaseService

logger = logging.getLogger(__name__)

class GroqService:
    _client = None
    _client_checked = False

    @classmethod
    def initialize(cls):
        """
        Initializes the Groq client once at application startup.
        Called from app.py during boot to validate the API key early.
        Logs diagnostic status without exposing the key.
        """
        api_key = os.environ.get('GROQ_API_KEY')

        if not api_key:
            logger.error("[Groq] GROQ_API_KEY environment variable is NOT SET. All AI features will be unavailable.")
            cls._client = None
            cls._client_checked = True
            return False

        if api_key == "gsk_your_groq_api_key_here":
            logger.error("[Groq] GROQ_API_KEY contains the placeholder value. Replace it with your real key from console.groq.com.")
            cls._client = None
            cls._client_checked = True
            return False

        # Mask the key for safe logging: show first 4 and last 4 chars
        masked = api_key[:4] + "****" + api_key[-4:] if len(api_key) > 8 else "****"
        logger.info(f"[Groq] GROQ_API_KEY detected (masked: {masked}, length: {len(api_key)})")

        try:
            cls._client = Groq(api_key=api_key)
            logger.info("[Groq] ✓ Groq client initialized successfully.")
            cls._client_checked = True
            return True
        except Exception as e:
            logger.error(f"[Groq] Failed to initialize Groq SDK client: {e}")
            cls._client = None
            cls._client_checked = True
            return False

    @classmethod
    def _get_client(cls):
        """
        Returns the cached Groq client instance.
        If not yet initialized (e.g. called before startup), performs lazy init.
        """
        if not cls._client_checked:
            cls.initialize()
        return cls._client

    @classmethod
    def _call_groq_with_retry(cls, messages, model="llama-3.3-70b-versatile", response_format=None, max_retries=3, initial_delay=1.0, timeout=15.0):
        """
        Helper method to run Groq API chat completions with:
        - Strict timeout handling
        - Exponential backoff retry loops
        """
        client = cls._get_client()
        if not client:
            logger.warning("[Groq] Cannot execute AI request — Groq client is not initialized. Check GROQ_API_KEY.")
            return None

        delay = initial_delay
        for attempt in range(max_retries):
            try:
                response = client.chat.completions.create(
                    messages=messages,
                    model=model,
                    temperature=0.3,
                    max_tokens=2048,
                    response_format=response_format,
                    timeout=timeout
                )
                return response.choices[0].message.content
            except Exception as e:
                logger.warning(f"[Groq] API call attempt {attempt + 1}/{max_retries} failed: {e}. Retrying in {delay}s...")
                if attempt == max_retries - 1:
                    logger.error(f"[Groq] API call failed permanently after {max_retries} attempts.")
                    break
                time.sleep(delay)
                delay *= 2

        return None

    @classmethod
    def generate_summary(cls, text, length="medium", focus="general"):
        """Generates a study summary with custom depth and focus area steering."""
        system_prompt = load_prompt("summary.txt").format(length=length)
        
        # Inject focus directive to steer Llama 3.3 outputs
        if focus and focus != "general":
            focus_directives = {
                "concepts": "Key Concepts & Definitions (bolded terms with explicit academic definitions)",
                "formulas": "Formulas, Methods, Proofs & Code (equations, step-by-step algorithms, derivations)",
                "outline": "High Level Syllabus Outline (hierarchical bullet outline structure covering headings)"
            }
            directive = focus_directives.get(focus, focus)
            system_prompt += f"\n\nFocus heavily on extracting: {directive}."
            
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Please summarize the following material:\n\n{text}"}
        ]
        
        response_text = cls._call_groq_with_retry(messages, timeout=25.0)
        if response_text:
            return response_text

        # Fallback response — only used when Groq is genuinely unreachable
        focus_title = f"Focus: {focus.capitalize()}" if focus != "general" else "General Overview"
        return f"""# Study Guide: {text[:50]}... ({focus_title})

## Executive Key Concepts
*   **Core Concept**: An analysis of the supplied educational document, breaking down central themes.
*   **Operational Mechanism**: How these topics relate to modern academic and practical applications.

## Technical Summary
This document provides an overview of the content. Here are the primary insights:
1.  **Fundamental Principles**: The material highlights structural definitions and processes.
2.  **Implementation**: Best practices emphasize iterative learning and verification.

> **Note**: This is a fallback summary generated because the Groq AI service could not be reached. Please verify your GROQ_API_KEY environment variable is correctly set.
"""

    @classmethod
    def generate_and_save_summary(cls, user_id, text, length, focus="general", material_id=None):
        """Generates study notes summary from input text and saves it back to the summaries collection."""
        summary = cls.generate_summary(text=text, length=length, focus=focus)
        if material_id:
            FirebaseService.save_summary(
                user_id=user_id,
                material_id=material_id,
                summary=summary,
                length=length
            )
        return summary

    @classmethod
    def generate_flashcards(cls, text, count=5):
        """Generates flashcards from document content."""
        messages = [
            {"role": "system", "content": load_prompt("flashcards.txt")},
            {"role": "user", "content": f"Generate {count} flashcards for:\n\n{text}"}
        ]
        
        # Use JSON response format if client is available
        client = cls._get_client()
        response_format = {"type": "json_object"} if client else None
        
        response_text = cls._call_groq_with_retry(messages, response_format=response_format)
        
        fallback = [
            {
                "front": f"What is the core subject of the uploaded material? ({text[:25]}...)",
                "back": "The primary focus resides in breaking down educational concepts and study objectives."
            },
            {
                "front": "What does StudyAI use to generate summary text?",
                "back": "StudyAI utilizes the Groq Llama 3.3 70B Versatile API to run lightning-fast text summaries."
            }
        ]
        
        parsed = safe_json_parse(response_text, fallback)
        if isinstance(parsed, dict):
            for key in ["flashcards", "cards", "items"]:
                if key in parsed:
                    return parsed[key]
        return parsed

    @classmethod
    def generate_and_save_flashcards(cls, user_id, text, count, material_id):
        """Generates revision flashcards and saves them to user repository."""
        cards = cls.generate_flashcards(text=text, count=count)
        saved_record = FirebaseService.save_flashcards(
            user_id=user_id,
            material_id=material_id,
            cards=cards
        )
        return saved_record

    @classmethod
    def generate_quiz(cls, text, count=5):
        """Generates dynamic quizzes from document content."""
        messages = [
            {"role": "system", "content": load_prompt("quiz.txt")},
            {"role": "user", "content": f"Generate a quiz with {count} questions for:\n\n{text}"}
        ]
        
        response_text = cls._call_groq_with_retry(messages)
        
        fallback = [
            {
                "question": "Which large language model powers StudyAI's cognitive features?",
                "options": ["GPT-4o", "Claude 3.5 Sonnet", "Llama 3.3 70B", "Gemini 1.5 Pro"],
                "answer": "Llama 3.3 70B",
                "explanation": "StudyAI is configured with Groq API which serves Llama 3.3 70B Versatile with sub-second latencies."
            }
        ]
        
        parsed = safe_json_parse(response_text, fallback)
        if isinstance(parsed, dict):
            for key in ["questions", "quiz", "items"]:
                if key in parsed:
                    return parsed[key]
        return parsed

    @classmethod
    def generate_and_save_quiz(cls, user_id, text, count, material_id):
        """Generates quiz questions and saves them to user repository."""
        questions = cls.generate_quiz(text=text, count=count)
        saved_record = FirebaseService.save_quiz(
            user_id=user_id,
            material_id=material_id,
            questions=questions
        )
        return saved_record

    @classmethod
    def generate_schedule(cls, goals, study_hours):
        """Generates a personalized study calendar/tasks list."""
        messages = [
            {"role": "system", "content": load_prompt("schedule.txt")},
            {"role": "user", "content": f"Goals: {goals}. Available hours per day: {study_hours}."}
        ]
        
        response_text = cls._call_groq_with_retry(messages)
        
        import datetime
        today = datetime.date.today()
        fallback = [
            {
                "id": "t1",
                "title": f"Review: {goals if goals else 'General Materials'}",
                "subject": "Core Study",
                "duration_minutes": int(study_hours * 30),
                "priority": "High",
                "status": "todo",
                "scheduled_date": today.isoformat()
            }
        ]
        
        return safe_json_parse(response_text, fallback)

    @classmethod
    def generate_and_save_schedule(cls, user_id, goals, study_hours):
        """Generates personalized study calendar task lists and saves them."""
        schedule = cls.generate_schedule(goals=goals, study_hours=study_hours)
        saved_record = FirebaseService.save_schedule(
            user_id=user_id,
            schedule=schedule
        )
        return saved_record

    @classmethod
    def chat_tutor(cls, history, new_message, system_prompt=None):
        """Interactive chatbot tutor conversation loop."""
        if not system_prompt:
            system_prompt = load_prompt("tutor.txt")
            
        messages = [{"role": "system", "content": system_prompt}]
        for msg in history:
            messages.append({"role": msg.get("role", "user"), "content": msg.get("content", "")})
        messages.append({"role": "user", "content": new_message})

        response_text = cls._call_groq_with_retry(messages)
        if response_text:
            return response_text
            
        return f"Hello! I am your StudyAI Tutor. I received your query: '{new_message}'. To help you study effectively, let's break this topic down into smaller chunks."

    @classmethod
    def chat_with_tutor(cls, user_id, message, material_id=None):
        """Coordinates message storing, chat generation, and assistant reply storing."""
        # Save user message event
        FirebaseService.save_chat_message(user_id, {"role": "user", "content": message})
        
        # Load entire conversation history
        history = FirebaseService.get_chat_history(user_id)
        
        # Build contextual system prompt
        system_prompt = load_prompt("tutor.txt")
        if material_id:
            material = FirebaseService.get_study_material(user_id, material_id)
            if material and material.get("extracted_text"):
                system_prompt += f"\n\nThe student is currently studying a document titled '{material.get('filename')}' with the following contents:\n{material.get('extracted_text')[:3000]}"
        
        # Invoke Groq Llama with historical context
        tutor_response = cls.chat_tutor(history=history[:-1], new_message=message, system_prompt=system_prompt)
        
        # Save assistant reply event
        FirebaseService.save_chat_message(user_id, {"role": "assistant", "content": tutor_response})
        
        return tutor_response

    @classmethod
    def analyze_weak_topics(cls, quiz_results):
        """
        Parses a history of quiz attempts to extract concepts that the user got incorrect,
        recommending actionable review steps.
        """
        messages = [
            {"role": "system", "content": load_prompt("weak_topics.txt")},
            {"role": "user", "content": f"Please analyze these quiz results:\n\n{json.dumps(quiz_results)}"}
        ]
        
        response_text = cls._call_groq_with_retry(messages)
        
        fallback = {
            "weak_topics": ["General Comprehension of Input Material"],
            "actionable_steps": ["Reread the summary study guide and use flashcards to verify definitions."],
            "study_suggestion": "Review the summary guide and take another quiz to reinforce accuracy."
        }
        
        return safe_json_parse(response_text, fallback)
