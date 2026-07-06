import { useState } from 'react';
import aiService from '../services/aiService';

/**
 * Custom React Hook to manage state and actions for the Quiz page.
 * 
 * @param {Object} selectedMaterial - The selected study material.
 */
export const useQuiz = (selectedMaterial) => {
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [activeQuizId, setActiveQuizId] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);

  const generateQuiz = async () => {
    if (!selectedMaterial) return;
    setLoading(true);
    try {
      const response = await aiService.generateQuiz(
        selectedMaterial.extracted_text,
        5,
        selectedMaterial.id
      );
      setQuizQuestions(response.data.questions || []);
      setActiveQuizId(response.data.id);
      setCurrentQuestionIndex(0);
      setSelectedOption(null);
      setSubmitted(false);
      setScore(0);
      setShowResults(false);
    } catch (err) {
      console.error("Error generating quiz questions:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleOptionSelect = (option) => {
    if (submitted) return;
    setSelectedOption(option);
  };

  const handleSubmitAnswer = () => {
    if (selectedOption === null || submitted) return;
    
    const currentQuestion = quizQuestions[currentQuestionIndex];
    const isCorrect = selectedOption === currentQuestion.answer;
    
    if (isCorrect) {
      setScore(prev => prev + 1);
    }
    setSubmitted(true);
  };

  const handleNextQuestion = async () => {
    const isCorrect = selectedOption === quizQuestions[currentQuestionIndex].answer;
    const finalScore = isCorrect ? score + 1 : score;
    
    setSelectedOption(null);
    setSubmitted(false);
    
    if (currentQuestionIndex < quizQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setShowResults(true);
      
      // Auto-save completed quiz result telemetry back to DB
      if (selectedMaterial && activeQuizId) {
        try {
          await aiService.saveQuizResult({
            material_id: selectedMaterial.id,
            quiz_id: activeQuizId,
            score: finalScore,
            total_questions: quizQuestions.length
          });
        } catch (err) {
          console.error("Failed to sync quiz score result to DB:", err);
        }
      }
    }
  };

  const handleReset = () => {
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setSubmitted(false);
    setScore(0);
    setShowResults(false);
  };

  return {
    quizQuestions,
    setQuizQuestions,
    activeQuizId,
    currentQuestionIndex,
    selectedOption,
    submitted,
    score,
    showResults,
    loading,
    generateQuiz,
    handleOptionSelect,
    handleSubmitAnswer,
    handleNextQuestion,
    handleReset,
  };
};

export default useQuiz;
