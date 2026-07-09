import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import studyService from '../services/studyService';
import useFlashcards from '../hooks/useFlashcards';
import { Layers, ChevronLeft, ChevronRight, RotateCw, Check, BookOpen, Sparkles } from 'lucide-react';

const FlashcardsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [materials, setMaterials] = useState([]);
  
  const {
    selectedMaterial,
    setSelectedMaterial,
    flashcards,
    currentIndex,
    isFlipped,
    setIsFlipped,
    loading,
    ratings,
    generateCards,
    handleNext,
    handlePrev,
    rateCard,
  } = useFlashcards(location.state?.material || null);

  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        const response = await studyService.getMaterials();
        let list = response.data || [];
        
        // Eventual consistency index lag fix
        if (location.state?.material) {
          const fresh = location.state.material;
          if (!list.some(m => m.id === fresh.id)) {
            list = [fresh, ...list];
          }
        }
        
        setMaterials(list);
        if (location.state?.material) {
          setSelectedMaterial(location.state.material);
        } else if (!selectedMaterial && list.length > 0) {
          setSelectedMaterial(list[0]);
        }
      } catch (err) {
        console.error("Error loading documents:", err);
      }
    };
    fetchMaterials();
  }, [location.state?.material]);

  const handleGenerateCards = async () => {
    try {
      await generateCards();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="h-full flex flex-col gap-6 pb-6">
      {/* Title */}
      <div className="flex justify-between items-center shrink-0">
        <div className="space-y-1">
          <h2 className="font-display font-bold text-2xl text-slate-900 dark:text-white">Flashcard Arenas</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Trigger active recall and leverage spaced-repetition schedules.</p>
        </div>
      </div>

      {materials.length === 0 ? (
        <div className="flex-1 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col items-center justify-center text-center p-8 gap-4">
          <Layers className="text-slate-400 dark:text-slate-600" size={48} />
          <div className="space-y-1">
            <h3 className="font-semibold text-md text-slate-900 dark:text-white">No materials uploaded yet</h3>
            <p className="text-xs text-slate-550 text-slate-500 dark:text-slate-400 max-w-sm">
              Please upload documents to generate structured revision card decks.
            </p>
          </div>
          <button
            onClick={() => navigate('/upload')}
            className="px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs transition-all shadow-glow-brand"
          >
            Go to Upload
          </button>
        </div>
      ) : (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-0 overflow-hidden">
          {/* Document list */}
          <div className="lg:col-span-1 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/60 shadow-sm p-4 flex flex-col min-h-0">
            <h3 className="font-semibold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 px-2">
              Select Deck
            </h3>
            <div className="flex-1 overflow-y-auto space-y-1 px-1">
              {materials.map((m) => (
                <button
                  key={m.id}
                  onClick={() => { setSelectedMaterial(m); }}
                  className={`flex items-center gap-2.5 w-full p-3 rounded-xl transition-all text-left text-xs font-semibold ${
                    selectedMaterial?.id === m.id
                      ? 'bg-brand-50 dark:bg-indigo-950/20 text-brand-600 dark:text-brand-400 border-l-4 border-brand-500'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/50 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Layers size={16} className="shrink-0" />
                  <span className="truncate">{m.filename}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Flashcard sandbox */}
          <div className="lg:col-span-3 flex flex-col justify-center gap-6 min-h-0">
            {loading ? (
              <div className="flex flex-col flex-grow items-center justify-center gap-4 bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/60 rounded-3xl shadow-sm">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
                <span className="text-xs text-slate-550">Retrieving flashcard details...</span>
              </div>
            ) : flashcards.length > 0 ? (
              <div className="flex flex-col items-center justify-between flex-grow py-6 gap-6 bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/60 rounded-3xl shadow-sm relative overflow-hidden px-8">
                {/* Score & Progress */}
                <div className="w-full flex justify-between items-center text-xs font-semibold text-slate-500 dark:text-slate-400">
                  <span>Progress: {currentIndex + 1} / {flashcards.length}</span>
                  {ratings[currentIndex] && (
                    <span className="flex items-center gap-1 text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full">
                      <Check size={12} />
                      <span className="capitalize">{ratings[currentIndex]}</span>
                    </span>
                  )}
                </div>

                {/* 3D Flashcard */}
                <div
                  onClick={() => setIsFlipped(!isFlipped)}
                  className="w-full max-w-xl h-72 cursor-pointer relative"
                  style={{ perspective: '1000px' }}
                >
                  <div
                    className="w-full h-full duration-500 transition-transform relative rounded-3xl shadow-glass-light dark:shadow-glass-dark border border-slate-200 dark:border-slate-800"
                    style={{
                      transformStyle: 'preserve-3d',
                      transform: isFlipped ? 'rotateY(180deg)' : 'none'
                    }}
                  >
                    {/* Front Side */}
                    <div
                      className="absolute inset-0 w-full h-full bg-slate-50 dark:bg-slate-955 dark:bg-slate-950/40 rounded-3xl flex flex-col justify-center items-center text-center p-8 gap-4"
                      style={{ backfaceVisibility: 'hidden' }}
                    >
                      <span className="text-[10px] font-semibold text-brand-500 uppercase tracking-widest bg-brand-50 dark:bg-brand-950/40 px-2.5 py-1 rounded-full">
                        Question / Concept
                      </span>
                      <p className="font-display font-bold text-sm text-slate-900 dark:text-white leading-relaxed max-w-md">
                        {flashcards[currentIndex]?.front}
                      </p>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-4">
                        <RotateCw size={12} className="animate-spin duration-5000" />
                        <span>Click card to reveal answer</span>
                      </span>
                    </div>

                    {/* Back Side */}
                    <div
                      className="absolute inset-0 w-full h-full bg-slate-50 dark:bg-slate-955 dark:bg-slate-955/40 rounded-3xl flex flex-col justify-center items-center text-center p-8 gap-4"
                      style={{
                        backfaceVisibility: 'hidden',
                        transform: 'rotateY(180deg)'
                      }}
                    >
                      <span className="text-[10px] font-semibold text-accent-500 uppercase tracking-widest bg-accent-50 dark:bg-accent-950/40 px-2.5 py-1 rounded-full">
                        Answer / Explanation
                      </span>
                      <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300 max-w-md font-sans">
                        {flashcards[currentIndex]?.back}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Rating / Difficulty selections */}
                <div className="w-full flex flex-col items-center gap-4">
                  {isFlipped && (
                    <div className="flex gap-2">
                      {['easy', 'medium', 'hard'].map((difficulty) => (
                        <button
                          key={difficulty}
                          onClick={() => rateCard(difficulty)}
                          className={`px-4 py-2 text-xs font-semibold rounded-xl border capitalize transition-all ${
                            difficulty === 'easy'
                              ? 'border-emerald-200 bg-emerald-50 dark:bg-emerald-950/10 text-emerald-600 dark:text-emerald-450'
                              : difficulty === 'medium'
                              ? 'border-amber-200 bg-amber-50 dark:bg-amber-950/10 text-amber-600 dark:text-amber-450'
                              : 'border-rose-200 bg-rose-50 dark:bg-rose-950/10 text-rose-600 dark:text-rose-455'
                          }`}
                        >
                          {difficulty}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Navigation Chevrons */}
                  <div className="flex gap-4">
                    <button
                      onClick={handlePrev}
                      disabled={currentIndex === 0}
                      className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-455 hover:bg-slate-200 disabled:opacity-40 transition-all outline-none"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <button
                      onClick={handleNext}
                      disabled={currentIndex === flashcards.length - 1}
                      className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-455 hover:bg-slate-200 disabled:opacity-40 transition-all outline-none"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ) : loading ? (
              <div className="flex flex-col flex-grow items-center justify-center text-center p-8 bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/60 rounded-3xl shadow-sm gap-6 animate-pulse">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent shrink-0"></div>
                <div className="space-y-2.5 w-full max-w-xs flex flex-col items-center">
                  <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-md w-3/4"></div>
                  <div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded-md w-1/2"></div>
                </div>
                <div className="h-44 bg-slate-100 dark:bg-slate-850 border border-slate-150 dark:border-slate-800 rounded-2xl w-full max-w-md"></div>
              </div>
            ) : (
              /* Generate Flashcard Deck */
              <div className="flex flex-col flex-grow items-center justify-center text-center p-8 bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/60 rounded-3xl shadow-sm gap-4">
                <Sparkles className="text-slate-350 dark:text-slate-700 animate-bounce" size={48} />
                <div>
                  <h4 className="font-semibold text-sm text-slate-900 dark:text-white">Generate Flashcard Deck</h4>
                  <p className="text-xs text-slate-550 text-slate-500 dark:text-slate-400 mt-1 max-w-xs leading-normal">
                    Transform the selected document into interactive flashcards via Groq Llama 3.3.
                  </p>
                </div>
                <button
                  onClick={handleGenerateCards}
                  className="px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs transition-all shadow-glow-brand"
                >
                  Generate Deck
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FlashcardsPage;
