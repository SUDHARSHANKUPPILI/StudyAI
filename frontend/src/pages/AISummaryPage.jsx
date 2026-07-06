import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { marked } from 'marked';
import studyService from '../services/studyService';
import aiService from '../services/aiService';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { FileText, Layers, Brain, MessageSquare, ChevronRight, BookOpen, Send, X, Loader2 } from 'lucide-react';

const AISummaryPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [materials, setMaterials] = useState([]);
  const [selectedMaterial, setSelectedMaterial] = useState(location.state?.material || null);
  const [loading, setLoading] = useState(false);
  
  // Chat Tutor Drawer states
  const [tutorOpen, setTutorOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [chatMessage, setChatMessage] = useState('');
  const [tutorLoading, setTutorLoading] = useState(false);
  
  const chatEndRef = useRef(null);

  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        const response = await studyService.getMaterials();
        setMaterials(response.data);
        if (!selectedMaterial && response.data.length > 0) {
          setSelectedMaterial(response.data[0]);
        }
      } catch (err) {
        console.error("Error loading study materials:", err);
      }
    };
    fetchMaterials();
  }, []);

  // Fetch tutor chat history when drawer is opened
  useEffect(() => {
    if (tutorOpen) {
      const fetchTutorHistory = async () => {
        try {
          const res = await aiService.getTutorHistory();
          setChatHistory(res.data.history || []);
        } catch (err) {
          console.error("Error loading tutor chat logs:", err);
        }
      };
      fetchTutorHistory();
    }
  }, [tutorOpen]);

  // Scroll to bottom when history updates
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, tutorLoading]);

  const parseMarkdown = (md) => {
    if (!md) return "<p class='text-slate-500 italic'>No summary generated for this document yet. Click 'Generate Summary' to start.</p>";
    try {
      return marked.parse(md);
    } catch (err) {
      console.error("Failed to parse markdown:", err);
      return `<p class="text-xs leading-relaxed text-slate-700 dark:text-slate-300 mb-3">${md}</p>`;
    }
  };

  const handleAction = (route) => {
    if (!selectedMaterial) return;
    navigate(route, { state: { material: selectedMaterial } });
  };

  const handleGenerateSummary = async () => {
    if (!selectedMaterial) return;
    setLoading(true);
    try {
      const response = await aiService.generateSummary(
        selectedMaterial.extracted_text,
        'medium',
        selectedMaterial.id
      );
      setSelectedMaterial({ ...selectedMaterial, summary: response.data.summary });
      setMaterials(materials.map(m => m.id === selectedMaterial.id ? { ...m, summary: response.data.summary } : m));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Submit new user message to Flask AI tutor endpoint
  const handleSendChatMessage = async (e) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    const userMessage = chatMessage;
    setChatMessage('');
    
    // Add user message locally first for instant feedback
    setChatHistory(prev => [...prev, { role: 'user', content: userMessage }]);
    setTutorLoading(true);
    
    try {
      const res = await aiService.chatTutor(userMessage, selectedMaterial?.id);
      // Replace with full history synced from Firestore
      setChatHistory(res.data.history || []);
    } catch (err) {
      console.error("Chat transmission failed:", err);
      setChatHistory(prev => [...prev, { role: 'assistant', content: 'Connection lost. Please check if your local Flask server is running.' }]);
    } finally {
      setTutorLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col gap-6 pb-6 relative overflow-hidden">
      {/* Page Header */}
      <div className="flex justify-between items-center shrink-0">
        <div className="space-y-1">
          <h2 className="font-display font-bold text-2xl text-slate-900 dark:text-white">AI Study Guide</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">View generated study summaries and trigger active recall sets.</p>
        </div>
      </div>

      {materials.length === 0 ? (
        <div className="flex-1 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col items-center justify-center text-center p-8 gap-4">
          <BookOpen className="text-slate-400 dark:text-slate-600" size={48} />
          <div className="space-y-1">
            <h3 className="font-semibold text-md text-slate-900 dark:text-white">No materials uploaded yet</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
              Please upload course material files or paste notes in the upload tab to generate AI study guides.
            </p>
          </div>
          <Button
            onClick={() => navigate('/upload')}
            className="px-5 py-2.5"
          >
            Go to Upload
          </Button>
        </div>
      ) : (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-0 overflow-hidden relative">
          {/* Left Navigation: Study Documents Panel */}
          <div className="lg:col-span-1 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/60 shadow-sm p-4 flex flex-col min-h-0">
            <h3 className="font-semibold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 px-2">
              Select Document
            </h3>
            <div className="flex-1 overflow-y-auto space-y-1 px-1">
              {materials.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSelectedMaterial(m)}
                  className={`flex items-center justify-between w-full p-3 rounded-xl transition-all text-left ${
                    selectedMaterial?.id === m.id
                      ? 'bg-brand-50 dark:bg-indigo-950/20 text-brand-600 dark:text-brand-400 border-l-4 border-brand-500'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/50 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FileText size={16} className="shrink-0" />
                    <span className="text-xs font-semibold truncate">{m.filename}</span>
                  </div>
                  <ChevronRight size={14} className="shrink-0 opacity-60" />
                </button>
              ))}
            </div>
          </div>

          {/* Right Area: Study Guide & Actions */}
          <div className="lg:col-span-3 flex flex-col gap-6 min-h-0 relative">
            {/* Quick Actions Panel */}
            <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200/70 dark:border-slate-800/60 shadow-sm flex flex-wrap justify-between items-center gap-4 shrink-0">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                <FileText size={16} />
                <span className="truncate max-w-[200px]">{selectedMaterial?.filename}</span>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={() => handleAction('/flashcards')}
                  icon={Layers}
                >
                  Flashcards
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => handleAction('/quiz')}
                  icon={Brain}
                >
                  Practice Quiz
                </Button>
                <Button
                  onClick={() => setTutorOpen(true)}
                  icon={MessageSquare}
                >
                  Ask Tutor
                </Button>
              </div>
            </div>

            {/* Scrollable Summary Text Body */}
            <div className="flex-1 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/60 shadow-sm p-8 overflow-y-auto">
              {loading ? (
                <div className="space-y-5 animate-pulse">
                  <div className="h-7 bg-slate-200 dark:bg-slate-800 rounded-md w-3/4"></div>
                  <div className="space-y-3">
                    <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-md w-full"></div>
                    <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-md w-11/12"></div>
                    <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-md w-5/6"></div>
                  </div>
                  <div className="h-32 bg-slate-100 dark:bg-slate-850 rounded-xl w-full my-6"></div>
                  <div className="space-y-3">
                    <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-md w-full"></div>
                    <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-md w-4/5"></div>
                  </div>
                </div>
              ) : selectedMaterial?.summary ? (
                <div
                  className="prose dark:prose-invert max-w-none prose-headings:font-display prose-p:leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: parseMarkdown(selectedMaterial.summary) }}
                ></div>
              ) : (
                <div className="flex flex-col h-full items-center justify-center gap-4 text-center">
                  <FileText className="text-slate-350 dark:text-slate-700" size={48} />
                  <div>
                    <h4 className="font-semibold text-sm text-slate-900 dark:text-white">No Summary Generated</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
                      Run semantic analysis on this document to generate structured study outlines.
                    </p>
                  </div>
                  <Button
                    onClick={handleGenerateSummary}
                  >
                    Generate Summary
                  </Button>
                </div>
              )}
            </div>

            {/* Slide-over AI Chat Tutor Drawer */}
            <AnimatePresence>
              {tutorOpen && (
                <>
                  {/* Backdrop blur */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.5 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setTutorOpen(false)}
                    className="absolute inset-0 bg-slate-950 z-30"
                  />
                  
                  {/* Drawer Panel */}
                  <motion.div
                    initial={{ x: '100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-glass-dark z-40 flex flex-col min-h-0"
                  >
                    {/* Header */}
                    <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center shrink-0">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="text-brand-500" size={20} />
                        <span className="font-display font-bold text-sm text-slate-900 dark:text-white">AI Chat Tutor</span>
                      </div>
                      <button
                        onClick={() => setTutorOpen(false)}
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all outline-none"
                      >
                        <X size={18} />
                      </button>
                    </div>

                    {/* Chat Messages Log */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                      {chatHistory.length === 0 && !tutorLoading ? (
                        <div className="flex flex-col h-full items-center justify-center text-center p-6 gap-2">
                          <MessageSquare className="text-slate-300 dark:text-slate-700" size={32} />
                          <span className="text-xs font-semibold text-slate-900 dark:text-white">Start a Conversation</span>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 max-w-[200px] leading-normal">
                            Ask Llama 3.3 any clarifying questions regarding "{selectedMaterial?.filename}".
                          </p>
                        </div>
                      ) : (
                        chatHistory.map((msg, i) => {
                          const isAI = msg.role === 'assistant';
                          return (
                            <div
                              key={i}
                              className={`flex ${isAI ? 'justify-start' : 'justify-end'}`}
                            >
                              <div
                                className={`max-w-[85%] p-3.5 rounded-2xl text-[11px] leading-relaxed font-sans ${
                                  isAI
                                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-250 rounded-tl-none'
                                    : 'bg-brand-500 text-white rounded-tr-none shadow-sm'
                                }`}
                              >
                                {msg.content}
                              </div>
                            </div>
                          );
                        })
                      )}
                      
                      {tutorLoading && (
                        <div className="flex justify-start">
                          <div className="bg-slate-100 dark:bg-slate-800 text-slate-500 p-3.5 rounded-2xl rounded-tl-none flex items-center gap-2 text-[11px] font-semibold">
                            <Loader2 className="animate-spin text-brand-500" size={14} />
                            <span>Tutor is formulating response...</span>
                          </div>
                        </div>
                      )}
                      
                      <div ref={chatEndRef} />
                    </div>

                    {/* Chat Footer Form */}
                    <form
                      onSubmit={handleSendChatMessage}
                      className="p-4 border-t border-slate-200 dark:border-slate-800 flex gap-2 shrink-0 bg-slate-50/50 dark:bg-slate-900/50"
                    >
                      <input
                        type="text"
                        value={chatMessage}
                        onChange={(e) => setChatMessage(e.target.value)}
                        placeholder="Ask tutor something..."
                        disabled={tutorLoading}
                        className="flex-1 h-11 px-4 rounded-xl bg-white dark:bg-slate-950 border border-slate-250 dark:border-slate-850 border-slate-200 dark:border-slate-800 text-xs placeholder-slate-500 text-slate-900 dark:text-white outline-none"
                      />
                      <Button
                        type="submit"
                        disabled={tutorLoading || !chatMessage.trim()}
                        icon={Send}
                        className="h-11 px-4"
                      >
                        Send
                      </Button>
                    </form>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
};

export default AISummaryPage;
