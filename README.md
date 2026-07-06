# StudyAI - AI-Powered Personal Study Assistant

StudyAI is a modern web application designed to accelerate learning using Large Language Models (LLMs) and cognitive science techniques. It extracts content from course materials (PDF, DOCX, TXT) and generates study guides, active recall flashcard decks, interactive quizzes, and hosts a context-aware AI Study Tutor.

---

## Key Features

1. **Material Extraction & Analysis**: Production-grade document parsing (PDF, Word, Text) that preserves structural order (paragraphs, tables) for analysis.
2. **AI Study Guides**: Generates structured summaries with focus area steering (e.g., Key Concepts, Formulas, Syllabus outlines).
3. **Flashcard Arenas**: Creates active-recall revision card decks from uploaded material.
4. **Practice Quizzes**: Generates multiple-choice questions to test your comprehension.
5. **AI Chat Tutor**: A conversational chatbot that is context-aware of the specific document you are studying.

---

## Directory Structure

```
├── backend/            # Flask API Server
│   ├── models/         # Pydantic schema validation models
│   ├── routes/         # Blueprints for authentication, summaries, flashcards, etc.
│   ├── services/       # Core business logic (Groq API service, File parsing, Firebase integration)
│   └── utils/          # Decorators, error handlers, and custom response wrappers
├── frontend/           # React + Vite Client
│   ├── src/
│   │   ├── components/ # Reusable UI components
│   │   ├── hooks/      # Custom stateful React hooks
│   │   ├── pages/      # Route pages (AISummary, Flashcards, Quiz, Dashboard)
│   │   └── services/   # Axios API integrations
```

---

## Getting Started

### Prerequisites
- Python 3.11+
- Node.js 18+
- Groq API Key (with access to Llama 3.3 70B)

### 1. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Create a `.env` file from the example configuration:
   ```bash
   cp .env.example .env
   ```
4. Insert your live credentials:
   ```env
   GROQ_API_KEY=your_groq_api_key_here
   ```
5. Run the Flask server:
   ```bash
   python run.py
   ```
   The backend will start on [http://127.0.0.1:5000](http://127.0.0.1:5000).

### 2. Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install Node packages:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
   The application UI will launch on [http://localhost:5173/](http://localhost:5173/).

---

## Technology Stack
- **Backend**: Python, Flask, Pydantic, Firebase Admin SDK, Groq SDK
- **Frontend**: React 19, Vite, Tailwind CSS, Framer Motion, Axios, Marked
