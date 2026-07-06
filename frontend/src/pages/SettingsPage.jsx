import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Settings, Sliders, Brain, ToggleLeft, ToggleRight, Database, Key } from 'lucide-react';

const SettingsPage = () => {
  const { theme, toggleTheme } = useTheme();

  // Mock settings sliders/toggles
  const [modelTemperature, setModelTemperature] = useState(0.3);
  const [activeModel, setActiveModel] = useState('llama-3.3-70b-versatile');
  const [enableSpacedRepetition, setEnableSpacedRepetition] = useState(true);
  const [enableFirebaseCache, setEnableFirebaseCache] = useState(true);
  const [groqKeyPlaceholder, setGroqKeyPlaceholder] = useState('gsk_••••••••••••••••••••');

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-10 text-slate-700 dark:text-slate-350">
      {/* Title */}
      <div className="space-y-2">
        <h2 className="font-display font-bold text-2xl text-slate-900 dark:text-white">System Preferences</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Configure AI inference engine thresholds, integrations, and cache layers.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        {/* Left 2 Cols: LLM Tunings */}
        <div className="md:col-span-2 space-y-6">
          {/* Section 1: LLM Engine Configuration */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/60 shadow-sm space-y-6">
            <h3 className="font-display font-bold text-md text-slate-900 dark:text-white flex items-center gap-2">
              <Brain size={18} className="text-brand-500" />
              <span>AI Inference Engine Settings</span>
            </h3>

            <div className="space-y-4 text-xs">
              {/* Select Active Model */}
              <div className="flex flex-col gap-1.5">
                <label className="font-semibold text-slate-500 uppercase tracking-wider">Active Inference Model</label>
                <select
                  value={activeModel}
                  onChange={(e) => setActiveModel(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl bg-slate-50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 text-slate-750 outline-none"
                >
                  <option value="llama-3.3-70b-versatile">Llama 3.3 70B Versatile (Recommended)</option>
                  <option value="llama3-8b-8192">Llama 3 8B (Sub-second Latency)</option>
                  <option value="mixtral-8x7b-32768">Mixtral 8x7B (Deep reasoning)</option>
                </select>
              </div>

              {/* Slider for temperature */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center">
                  <label className="font-semibold text-slate-500 uppercase tracking-wider">LLM Temperature: {modelTemperature}</label>
                  <span className="text-[10px] text-slate-400">Lower = More precise/academic</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="1.0"
                  step="0.1"
                  value={modelTemperature}
                  onChange={(e) => setModelTemperature(parseFloat(e.target.value))}
                  className="w-full accent-brand-500 bg-slate-200 dark:bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Integrations Keys */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/60 shadow-sm space-y-6">
            <h3 className="font-display font-bold text-md text-slate-900 dark:text-white flex items-center gap-2">
              <Key size={18} className="text-accent-500" />
              <span>API Credentials</span>
            </h3>

            <div className="space-y-4 text-xs">
              <div className="flex flex-col gap-1.5">
                <label className="font-semibold text-slate-500 uppercase tracking-wider">Groq API Key</label>
                <input
                  type="text"
                  value={groqKeyPlaceholder}
                  onChange={(e) => setGroqKeyPlaceholder(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl bg-slate-50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 text-slate-500 outline-none"
                />
                <span className="text-[10px] text-slate-500 mt-1 leading-normal">
                  To secure your keys, values are passed to the Flask backend context and never stored in the client-side state.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Quick toggles */}
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/60 shadow-sm space-y-5 text-xs">
            <h3 className="font-display font-bold text-md text-slate-900 dark:text-white flex items-center gap-2">
              <Sliders size={18} className="text-brand-500" />
              <span>Features Toggles</span>
            </h3>

            {/* Spaced repetition */}
            <div className="flex justify-between items-center">
              <div>
                <span className="font-semibold text-slate-900 dark:text-white block">Active Spaced Repetition</span>
                <span className="text-[10px] text-slate-500">Auto-schedules cards review</span>
              </div>
              <button
                onClick={() => setEnableSpacedRepetition(!enableSpacedRepetition)}
                className={`transition-colors outline-none shrink-0 ${enableSpacedRepetition ? 'text-brand-500' : 'text-slate-400'}`}
              >
                {enableSpacedRepetition ? <ToggleRight size={36} /> : <ToggleLeft size={36} />}
              </button>
            </div>

            {/* Firebase cache */}
            <div className="flex justify-between items-center border-t border-slate-100 dark:border-slate-800/80 pt-4">
              <div>
                <span className="font-semibold text-slate-900 dark:text-white block">Firestore Live Cache</span>
                <span className="text-[10px] text-slate-500">Saves API usage queries</span>
              </div>
              <button
                onClick={() => setEnableFirebaseCache(!enableFirebaseCache)}
                className={`transition-colors outline-none shrink-0 ${enableFirebaseCache ? 'text-brand-500' : 'text-slate-400'}`}
              >
                {enableFirebaseCache ? <ToggleRight size={36} /> : <ToggleLeft size={36} />}
              </button>
            </div>

            {/* Theme selector */}
            <div className="flex justify-between items-center border-t border-slate-100 dark:border-slate-800/80 pt-4">
              <div>
                <span className="font-semibold text-slate-900 dark:text-white block">Dark Mode</span>
                <span className="text-[10px] text-slate-550 text-slate-500">System dark layout styles</span>
              </div>
              <button
                onClick={toggleTheme}
                className={`transition-colors outline-none shrink-0 ${theme === 'dark' ? 'text-brand-500' : 'text-slate-400'}`}
              >
                {theme === 'dark' ? <ToggleRight size={36} /> : <ToggleLeft size={36} />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
