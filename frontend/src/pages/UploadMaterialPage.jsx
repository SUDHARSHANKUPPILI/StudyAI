import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import studyService from '../services/studyService';
import aiService from '../services/aiService';
import { useToast } from '../context/ToastContext';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import { Upload, FileText, ClipboardList, AlertCircle, Sparkles, Loader2 } from 'lucide-react';

const UploadMaterialPage = () => {
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' or 'paste'
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [pastedText, setPastedText] = useState('');
  const [pastedTitle, setPastedTitle] = useState('');
  const [summaryLength, setSummaryLength] = useState('medium');
  const [focusArea, setFocusArea] = useState('general');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const triggerUpload = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setProgress(0);

    try {
      let material = null;

      if (activeTab === 'upload') {
        if (!file) {
          setError('Please select a file to upload first.');
          setLoading(false);
          return;
        }

        const formData = new FormData();
        formData.append('file', file);
        
        const uploadRes = await studyService.uploadDocument(formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (progressEvent) => {
            const total = progressEvent.total || progressEvent.loaded;
            const percentCompleted = Math.round((progressEvent.loaded * 100) / total);
            setProgress(percentCompleted);
          }
        });
        material = uploadRes.data.material;
      } else {
        if (!pastedText || !pastedTitle) {
          setError('Please enter a title and text contents.');
          setLoading(false);
          return;
        }

        setProgress(50);
        const blob = new Blob([pastedText], { type: 'text/plain' });
        const textFile = new File([blob], `${pastedTitle.replace(/\s+/g, '_')}.txt`, { type: 'text/plain' });
        
        const formData = new FormData();
        formData.append('file', textFile);
        
        const uploadRes = await studyService.uploadDocument(formData);
        material = uploadRes.data.material;
        setProgress(100);
      }

      if (material) {
        // Strict Validation (Requirement 3)
        if (!material.id) {
          throw new Error("Validation Error: Document was successfully processed but is missing a valid ID.");
        }
        if (!material.extracted_text || material.extracted_text.trim().length === 0) {
          throw new Error("Validation Error: The document contains no extractable text content. Please try another file.");
        }

        const summaryRes = await aiService.generateSummary(
          material.extracted_text,
          summaryLength,
          material.id,
          focusArea
        );
        
        material.summary = summaryRes.data.summary;
        showToast('Document uploaded and summarized successfully!', 'success');
        navigate('/summary', { state: { material } });
      }
    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to process document. Please try again.';
      setError(errorMsg);
      showToast(errorMsg, 'error');
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-10">
      <div className="space-y-2">
        <h2 className="font-display font-bold text-2xl text-slate-900 dark:text-white">
          Ingest Study Material
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Feed PDF textbooks, lecture slides, or handwritten notes into StudyAI's knowledge base.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-455 text-sm flex gap-3 items-center">
          <AlertCircle size={20} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Tabs Menu */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => { setActiveTab('upload'); setError(''); }}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 font-medium text-sm transition-all -mb-px ${
            activeTab === 'upload'
              ? 'border-brand-500 text-brand-600 dark:text-brand-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Upload size={16} />
          <span>Upload File</span>
        </button>
        <button
          onClick={() => { setActiveTab('paste'); setError(''); }}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 font-medium text-sm transition-all -mb-px ${
            activeTab === 'paste'
              ? 'border-brand-500 text-brand-600 dark:text-brand-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <ClipboardList size={16} />
          <span>Paste Notes</span>
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        {/* Left columns: Uploader/Paster panel */}
        <div className="md:col-span-2 space-y-6">
          {activeTab === 'upload' ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current.click()}
              className={`h-72 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 p-6 ${
                dragOver
                  ? 'border-brand-500 bg-brand-50/20 dark:bg-brand-950/10'
                  : 'border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-brand-500/40 dark:hover:border-brand-500/30'
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept=".pdf,.txt,.md,.docx"
                className="hidden"
              />
              
              {file ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="h-16 w-16 rounded-2xl bg-indigo-50 dark:bg-slate-800/80 flex items-center justify-center text-brand-500">
                    <FileText size={32} />
                  </div>
                  <span className="font-semibold text-sm text-slate-900 dark:text-white max-w-xs truncate">
                    {file.name}
                  </span>
                  <span className="text-xs text-slate-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); setFile(null); }}
                    className="text-xs text-rose-500 font-semibold hover:underline mt-2"
                  >
                    Remove File
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div className="h-16 w-16 rounded-2xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center text-slate-400">
                    <Upload size={32} />
                  </div>
                  <p className="font-semibold text-sm text-slate-700 dark:text-slate-300">
                    Drag and drop file here, or <span className="text-brand-500">browse</span>
                  </p>
                  <p className="text-xs text-slate-500 max-w-xs leading-normal">
                    Supports PDF, TXT, MD, and DOCX (up to 10MB)
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <Input
                type="text"
                value={pastedTitle}
                onChange={(e) => setPastedTitle(e.target.value)}
                placeholder="Material Topic Title (e.g. Backpropagation Algorithm)"
              />
              <textarea
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Paste your study notes, transcription text, or curriculum outline here (minimum 10 characters)..."
                rows={10}
                className="w-full p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-brand-500 text-sm text-slate-900 dark:text-white outline-none resize-none"
              ></textarea>
            </div>
          )}
        </div>

        {/* Right column: Config Card */}
        <Card className="space-y-6">
          <h3 className="font-display font-bold text-md text-slate-900 dark:text-white">
            AI Summary Config
          </h3>
          
          {/* Summary length */}
          <div className="space-y-2 text-xs">
            <label className="font-semibold text-slate-500 uppercase tracking-wider">
              Summary Depth
            </label>
            <div className="grid grid-cols-3 gap-2">
              {['short', 'medium', 'long'].map((len) => (
                <button
                  key={len}
                  onClick={() => setSummaryLength(len)}
                  className={`py-2 text-xs font-medium capitalize rounded-xl border transition-all ${
                    summaryLength === len
                      ? 'border-brand-500 bg-brand-50 dark:bg-indigo-950/20 text-brand-600 dark:text-brand-400'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  {len}
                </button>
              ))}
            </div>
          </div>

          {/* Focus Area */}
          <div className="space-y-2 text-xs">
            <label className="font-semibold text-slate-500 uppercase tracking-wider">
              Focus Focus
            </label>
            <select
              value={focusArea}
              onChange={(e) => setFocusArea(e.target.value)}
              className="w-full h-11 px-3 rounded-xl bg-slate-50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-350 outline-none"
            >
              <option value="general">Comprehensive (General)</option>
              <option value="concepts">Key Concepts & Definitions</option>
              <option value="formulas">Formulas, Methods & Code</option>
              <option value="outline">High Level Syllabus Outline</option>
            </select>
          </div>

          {/* Atomic Button */}
          <Button
            onClick={triggerUpload}
            disabled={loading || (activeTab === 'upload' ? !file : !pastedText)}
            loading={loading}
            className="w-full h-12"
          >
            Analyze & Scaffold
          </Button>
        </Card>
      </div>

      {/* Processing Loader Backdrop */}
      {loading && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 animate-in fade-in duration-200">
          <Card
            variant="glass"
            className="w-full max-w-sm p-8 text-center text-white space-y-6 border-white/5 bg-slate-900"
          >
            <div className="h-14 w-14 rounded-full bg-brand-500/10 text-brand-400 flex items-center justify-center mx-auto border border-brand-500/20 animate-pulse">
              {progress < 100 ? (
                <Upload className="animate-bounce" size={24} />
              ) : (
                <Loader2 className="animate-spin" size={24} />
              )}
            </div>
            
            <div className="space-y-1">
              <h3 className="font-display font-bold text-lg">
                {progress < 100 ? 'Ingesting Document' : 'Running AI Summary'}
              </h3>
              <p className="text-xs text-slate-405 dark:text-slate-400 leading-normal">
                {progress < 100 
                  ? 'Uploading material securely to Firebase Storage...' 
                  : 'Scaffolding Llama 3.3 study summary outlines...'}
              </p>
            </div>

            {/* Progress indicator */}
            <div className="space-y-2">
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-brand-500 rounded-full animate-pulse"
                  style={{ width: `${progress}%` }}
                ></motion.div>
              </div>
              <span className="text-[10px] text-slate-500 font-semibold">{progress}% Uploaded</span>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default UploadMaterialPage;
