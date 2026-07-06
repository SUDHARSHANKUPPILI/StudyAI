import api from './api';

export const aiService = {
  /**
   * Generates a studyガイド summary.
   * 
   * @param {string} text - Source text.
   * @param {string} length - Summary length ('short' | 'medium' | 'long').
   * @param {string} materialId - Optional study material ID.
   */
  generateSummary: (text, length, materialId = null, focus = 'general') => {
    const payload = { text, length, focus };
    if (materialId) {
      payload.material_id = materialId;
    }
    return api.post('/api/ai/summary', payload);
  },

  /**
   * Fetches tutor chat history.
   */
  getTutorHistory: () => {
    return api.get('/api/ai/tutor');
  },

  /**
   * Sends a message to the AI tutor chatbot.
   * 
   * @param {string} message - User chat query.
   */
  chatTutor: (message, materialId = null) => {
    const payload = { message };
    if (materialId) {
      payload.material_id = materialId;
    }
    return api.post('/api/ai/tutor', payload);
  },

  /**
   * Generates flashcard decks via LLM.
   * 
   * @param {string} text - Source text.
   * @param {number} count - Flashcard count to generate.
   * @param {string} materialId - Document material ID.
   */
  generateFlashcards: (text, count, materialId = 'manual_input') => {
    return api.post('/api/ai/flashcards', { text, count, material_id: materialId });
  },

  /**
   * Fetches saved flashcards for a specific document.
   * 
   * @param {string} materialId - Document ID.
   */
  getFlashcards: (materialId) => {
    const url = materialId ? `/api/study/flashcards?material_id=${materialId}` : '/api/study/flashcards';
    return api.get(url);
  },

  /**
   * Generates quiz questions from source text.
   * 
   * @param {string} text - Source text.
   * @param {number} count - Question count.
   * @param {string} materialId - Document ID.
   */
  generateQuiz: (text, count, materialId = 'manual_input') => {
    return api.post('/api/ai/quiz', { text, count, material_id: materialId });
  },

  /**
   * Fetches study quiz scores.
   */
  getQuizzes: () => {
    return api.get('/api/study/quizzes');
  },

  /**
   * Generates a study planner agenda.
   * 
   * @param {string} goals - Study objectives.
   * @param {number} studyHours - Dedicated study hours per day.
   */
  generateSchedule: (goals, studyHours) => {
    return api.post('/api/ai/schedule', { goals, study_hours: studyHours });
  },

  /**
   * Fetches study planner tasks checklist.
   */
  getSchedule: () => {
    return api.get('/api/study/schedule');
  },

  /**
   * Synchronizes planner tasks status updates to backend database.
   * 
   * @param {Array} tasks - Entire array of tasks.
   */
  updateSchedule: (tasks) => {
    return api.put('/api/study/schedule', { tasks });
  },

  /**
   * Fetches student stats/progress analytics telemetry.
   */
  getAnalytics: () => {
    return api.get('/api/study/analytics');
  },

  /**
   * Saves completed quiz score details.
   * 
   * @param {Object} resultData - { material_id, quiz_id, score, total_questions }
   */
  saveQuizResult: (resultData) => {
    return api.post('/api/study/quiz-results', resultData);
  },

  /**
   * Diagnoses weak topics based on quiz attempts.
   * 
   * @param {Array} attempts - List of quiz attempts.
   */
  analyzeWeakTopics: (attempts) => {
    return api.post('/api/ai/weak-analysis', { attempts });
  }
};

export default aiService;
