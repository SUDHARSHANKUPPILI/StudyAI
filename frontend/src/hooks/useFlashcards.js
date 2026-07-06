import { useState, useEffect } from 'react';
import aiService from '../services/aiService';

/**
 * Custom React Hook to manage state and actions for the Flashcards page.
 * 
 * @param {Object} initialMaterial - The initially selected study material, if any.
 */
export const useFlashcards = (initialMaterial) => {
  const [selectedMaterial, setSelectedMaterial] = useState(initialMaterial);
  const [flashcards, setFlashcards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ratings, setRatings] = useState({});

  useEffect(() => {
    const loadFlashcards = async () => {
      if (!selectedMaterial) return;
      setLoading(true);
      try {
        const res = await aiService.getFlashcards(selectedMaterial.id);
        if (res.data && res.data.cards) {
          setFlashcards(res.data.cards);
        } else {
          setFlashcards([]);
        }
      } catch (err) {
        console.error("Error fetching flashcards:", err);
        setFlashcards([]);
      } finally {
        setLoading(false);
      }
    };
    loadFlashcards();
  }, [selectedMaterial]);

  const generateCards = async () => {
    if (!selectedMaterial) return;
    setLoading(true);
    try {
      const response = await aiService.generateFlashcards(
        selectedMaterial.extracted_text,
        5,
        selectedMaterial.id
      );
      setFlashcards(response.data.cards || []);
      setCurrentIndex(0);
      setIsFlipped(false);
    } catch (err) {
      console.error("Error generating flashcards:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (currentIndex < flashcards.length - 1) {
      setIsFlipped(false);
      setTimeout(() => {
        setCurrentIndex(currentIndex + 1);
      }, 150);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setIsFlipped(false);
      setTimeout(() => {
        setCurrentIndex(currentIndex - 1);
      }, 150);
    }
  };

  const rateCard = (difficulty) => {
    setRatings(prev => ({ ...prev, [currentIndex]: difficulty }));
    handleNext();
  };

  return {
    selectedMaterial,
    setSelectedMaterial,
    flashcards,
    setFlashcards,
    currentIndex,
    setCurrentIndex,
    isFlipped,
    setIsFlipped,
    loading,
    ratings,
    generateCards,
    handleNext,
    handlePrev,
    rateCard,
  };
};

export default useFlashcards;
