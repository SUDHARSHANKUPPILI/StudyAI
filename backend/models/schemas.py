from typing import List, Optional
from pydantic import BaseModel, Field

class SummaryRequestSchema(BaseModel):
    text: str = Field(..., min_length=10, description="The educational text content to summarize")
    length: Optional[str] = Field("medium", pattern="^(short|medium|long)$", description="Desired length of summary")
    focus: Optional[str] = Field("general", description="Focus area of the summary")

class FlashcardsRequestSchema(BaseModel):
    text: str = Field(..., min_length=10, description="Text source to generate flashcards from")
    count: Optional[int] = Field(5, ge=1, le=20, description="Number of flashcards to generate")

class QuizRequestSchema(BaseModel):
    text: str = Field(..., min_length=10, description="Text source to generate quiz from")
    count: Optional[int] = Field(5, ge=1, le=10, description="Number of questions to generate")

class ScheduleRequestSchema(BaseModel):
    goals: str = Field(..., min_length=3, description="User learning objectives or target syllabus")
    study_hours: float = Field(..., ge=0.5, le=24.0, description="Study hours dedicated per day")

class ChatMessage(BaseModel):
    role: str = Field(..., pattern="^(user|assistant)$")
    content: str = Field(..., min_length=1)

class ChatRequestSchema(BaseModel):
    history: List[ChatMessage] = Field(default=[], description="Chat dialogue history list")
    message: str = Field(..., min_length=1, description="New user query message")

class QuizResultRequestSchema(BaseModel):
    material_id: str = Field(..., min_length=1, description="ID of the associated study material")
    quiz_id: str = Field(..., min_length=1, description="ID of the completed quiz")
    score: int = Field(..., ge=0, description="The quiz score achieved")
    total_questions: int = Field(..., ge=1, description="Total count of questions in the quiz")

class ProfileRequestSchema(BaseModel):
    name: str = Field(..., min_length=2, max_length=50, description="The display name of the student")
    major: str = Field(..., min_length=2, max_length=50, description="The academic major")
    level: str = Field(..., min_length=1, max_length=50, description="The grade level or sophomore index")

class TutorChatRequestSchema(BaseModel):
    message: str = Field(..., min_length=1, max_length=5000, description="The message sent to the tutor")
    material_id: Optional[str] = Field(None, description="Optional ID of the current study material")

class WeakAnalysisRequestSchema(BaseModel):
    attempts: List[dict] = Field(..., description="List of student quiz attempts details")
