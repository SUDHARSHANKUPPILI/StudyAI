import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import studyService from '../services/studyService';
import useQuiz from '../hooks/useQuiz';
import { Brain, Sparkles, Check, X, Award, RotateCcw } from 'lucide-react';

const QuizPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [materials, setMaterials] = useState([]);
  const [selectedMaterial, setSelectedMaterial] = useState(location.state?.material || null);

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

  const {
    quizQuestions,
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
  } = useQuiz(selectedMaterial);

  const handleGenerateQuiz = async () => {
    try {
      await generateQuiz();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="h-full flex flex-col gap-6 pb-6">
      {/* Title */}
      <div className="flex justify-between items-center shrink-0">
        <div className="space-y-1">
          <h2 className="font-display font-bold text-2xl text-slate-900 dark:text-white">Exam Evaluation</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Generate customized practice tests to evaluate concept understanding.</p>
        </div>
      </div>

      {materials.length === 0 ? (
        <div className="flex-1 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col items-center justify-center text-center p-8 gap-4">
          <Brain className="text-slate-400 dark:text-slate-600" size={48} />
          <div className="space-y-1">
            <h3 className="font-semibold text-md text-slate-900 dark:text-white">No materials uploaded yet</h3>
            <p className="text-xs text-slate-555 text-slate-500 dark:text-slate-400 max-w-sm">
              Please upload documents to generate structured quiz assessments.
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
          {/* Left doc list */}
          <div className="lg:col-span-1 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/60 shadow-sm p-4 flex flex-col min-h-0">
            <h3 className="font-semibold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 px-2">
              Select Subject
            </h3>
            <div className="flex-1 overflow-y-auto space-y-1 px-1">
              {materials.map((m) => (
                <button
                  key={m.id}
                  onClick={() => { setSelectedMaterial(m); handleReset(); }}
                  className={`flex items-center gap-2.5 w-full p-3 rounded-xl transition-all text-left text-xs font-semibold ${
                    selectedMaterial?.id === m.id
                      ? 'bg-brand-50 dark:bg-indigo-950/20 text-brand-600 dark:text-brand-400 border-l-4 border-brand-500'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/50 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Brain size={16} className="shrink-0" />
                  <span className="truncate">{m.filename}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Right quiz canvas */}
          <div className="lg:col-span-3 flex flex-col justify-center gap-6 min-h-0">
            {loading ? (
              <div className="flex flex-col flex-grow items-center justify-center gap-4 bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/60 rounded-3xl shadow-sm">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
                <span className="text-xs text-slate-500">Formulating active exam queries...</span>
              </div>
            ) : showResults ? (
              /* Quiz results summary */
              <div className="flex flex-col flex-grow items-center justify-center text-center p-8 bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/60 rounded-3xl shadow-sm gap-6">
                <div className="h-16 w-16 rounded-full bg-brand-500/10 text-brand-500 flex items-center justify-center border border-brand-500/20">
                  <Award size={36} />
                </div>
                <div>
                  <h3 className="font-display font-bold text-xl text-slate-900 dark:text-white">Quiz Completed!</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                    Evaluation score overview for <strong>{selectedMaterial?.filename}</strong>.
                  </p>
                </div>

                <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 w-full max-w-sm flex justify-around">
                  <div className="text-center">
                    <span className="text-xs text-slate-450 block">Accuracy</span>
                    <span className="font-display font-bold text-3xl text-brand-500">
                      {Math.round((score / quizQuestions.length) * 100)}%
                    </span>
                  </div>
                  <div className="w-px bg-slate-200 dark:bg-slate-800"></div>
                  <div className="text-center">
                    <span className="text-xs text-slate-450 block">Correct</span>
                    <span className="font-display font-bold text-3xl text-emerald-500">{score} / {quizQuestions.length}</span>
                  </div>
                </div>

                <button
                  onClick={handleReset}
                  className="flex items-center gap-1.5 px-5 py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs transition-all shadow-glow-brand"
                >
                  <RotateCcw size={14} />
                  <span>Retake Quiz</span>
                </button>
              </div>
            ) : quizQuestions.length > 0 ? (
              /* Active Quiz Question Card */
              <div className="flex flex-col flex-grow justify-between p-8 bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/60 rounded-3xl shadow-sm min-h-0 overflow-y-auto">
                <div className="space-y-6">
                  {/* Progress Header */}
                  <div className="flex justify-between items-center text-xs font-semibold text-slate-500 dark:text-slate-400">
                    <span>Question {currentQuestionIndex + 1} of {quizQuestions.length}</span>
                    <span>Score: {score}</span>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand-500 rounded-full transition-all duration-300"
                      style={{ width: `${((currentQuestionIndex + 1) / quizQuestions.length) * 100}%` }}
                    ></div>
                  </div>

                  {/* Question */}
                  <h4 className="font-display font-bold text-base text-slate-900 dark:text-white leading-normal">
                    {quizQuestions[currentQuestionIndex]?.question}
                  </h4>

                  {/* Options */}
                  <div className="grid grid-cols-1 gap-3">
                    {quizQuestions[currentQuestionIndex]?.options.map((opt) => {
                      const isSelected = selectedOption === opt;
                      const isCorrectAnswer = opt === quizQuestions[currentQuestionIndex].answer;
                      let btnStyle = 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/20 hover:border-brand-500/30';
                      
                      if (submitted) {
                        if (isCorrectAnswer) {
                          btnStyle = 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
                        } else if (isSelected) {
                          btnStyle = 'border-rose-500 bg-rose-500/10 text-rose-600 dark:text-rose-455';
                        } else {
                          btnStyle = 'border-slate-200 dark:border-slate-800 opacity-60 bg-transparent';
                        }
                      } else if (isSelected) {
                        btnStyle = 'border-brand-500 bg-brand-500/5 text-brand-600 dark:text-brand-400';
                      }

                      return (
                        <button
                          key={opt}
                          onClick={() => handleOptionSelect(opt)}
                          disabled={submitted}
                          className={`flex items-center justify-between p-4 rounded-xl border text-xs font-semibold text-left transition-all ${btnStyle}`}
                        >
                          <span>{opt}</span>
                          {submitted && isCorrectAnswer && <Check size={16} className="text-emerald-500 shrink-0" />}
                          {submitted && isSelected && !isCorrectAnswer && <X size={16} className="text-rose-500 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>

                  {/* Explanation feedback */}
                  {submitted && (
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 space-y-1">
                      <span className="text-[10px] font-semibold text-brand-500 uppercase tracking-wider block">Explanation</span>
                      <p className="text-[11px] text-slate-650 text-slate-600 dark:text-slate-400 leading-normal">
                        {quizQuestions[currentQuestionIndex]?.explanation}
                      </p>
                    </div>
                  )}
                </div>

                {/* Submissions Action bar */}
                <div className="mt-8 flex justify-end">
                  {!submitted ? (
                    <button
                      onClick={handleSubmitAnswer}
                      disabled={selectedOption === null}
                      className="px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-semibold text-xs transition-all shadow-glow-brand"
                    >
                      Check Answer
                    </button>
                  ) : (
                    <button
                      onClick={handleNextQuestion}
                      className="px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs transition-all shadow-glow-brand"
                    >
                      {currentQuestionIndex < quizQuestions.length - 1 ? 'Next Question' : 'View Summary'}
                    </button>
                  )}
                </div>
              </div>
            ) : loading ? (
              <div className="flex flex-col flex-grow items-center justify-center text-center p-8 bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/60 rounded-3xl shadow-sm gap-6 animate-pulse">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent shrink-0"></div>
                <div className="space-y-2.5 w-full max-w-sm flex flex-col items-center">
                  <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded-md w-3/4"></div>
                  <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-md w-full"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mt-4">
                  {[1, 2, 3, 4].map(o => (
                    <div key={o} className="h-14 bg-slate-100 dark:bg-slate-850 border border-slate-150 dark:border-slate-800 rounded-xl w-full"></div>
                  ))}
                </div>
              </div>
            ) : (
              /* Generate Quiz Setup */
              <div className="flex flex-col flex-grow items-center justify-center text-center p-8 bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/60 rounded-3xl shadow-sm gap-4">
                <Sparkles className="text-slate-350 dark:text-slate-700 animate-bounce" size={48} />
                <div>
                  <h4 className="font-semibold text-sm text-slate-900 dark:text-white">Formulate Quiz Assessment</h4>
                  <p className="text-xs text-slate-550 text-slate-500 dark:text-slate-400 mt-1 max-w-xs leading-normal">
                    Generate a multiple-choice practice evaluation covering topics in the selected document.
                  </p>
                </div>
                <button
                  onClick={handleGenerateQuiz}
                  className="px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs transition-all shadow-glow-brand"
                >
                  Generate Quiz
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizPage;
