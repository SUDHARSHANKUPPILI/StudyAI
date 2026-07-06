import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Search, Bell, Sparkles } from 'lucide-react';

const Navbar = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Map pathways to friendly page header titles
  const getPageTitle = (path) => {
    switch (path) {
      case '/':
        return 'Dashboard';
      case '/upload':
        return 'Upload Material';
      case '/summary':
        return 'AI Study Summaries';
      case '/flashcards':
        return 'Flashcards Arena';
      case '/quiz':
        return 'Exam Evaluation';
      case '/analytics':
        return 'Analytics & Telemetry';
      case '/planner':
        return 'Study Planner';
      case '/profile':
        return 'User Workspace Profile';
      case '/settings':
        return 'System Preferences';
      default:
        return 'StudyAI';
    }
  };

  const notifications = [
    { id: 1, text: "AI Summary for 'Deep Learning Intro' is ready!", time: "2m ago" },
    { id: 2, text: "Your daily study goal is 75% complete.", time: "1h ago" },
    { id: 3, text: "Reminder: Quiz on 'Machine Learning' scheduled today.", time: "5h ago" }
  ];

  return (
    <header className="flex items-center justify-between h-20 px-8 border-b bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl border-slate-200 dark:border-slate-800 z-20">
      {/* Route Title */}
      <div className="flex flex-col">
        <h1 className="font-display font-bold text-xl text-slate-900 dark:text-white leading-none">
          {getPageTitle(location.pathname)}
        </h1>
        <span className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
          StudyAI Platform Workspace
        </span>
      </div>

      {/* Global Actions Bar */}
      <div className="flex items-center gap-6">
        {/* Search Bar */}
        <div className="relative w-80 max-md:hidden">
          <input
            type="text"
            placeholder="Ask StudyAI anything..."
            className="w-full h-10 pl-10 pr-4 rounded-xl bg-slate-100/70 dark:bg-slate-800/60 border border-transparent focus:border-brand-500 text-sm placeholder-slate-550 placeholder-slate-500 text-slate-900 dark:text-white transition-all outline-none"
          />
          <Search size={16} className="absolute left-3.5 top-3 text-slate-500 dark:text-slate-400" />
        </div>

        {/* AI Action Indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 text-brand-600 dark:text-brand-400 border border-indigo-100/50 dark:border-brand-900/20 text-xs font-semibold">
          <Sparkles size={14} className="animate-pulse" />
          <span>Llama 3.3 Active</span>
        </div>

        {/* Notifications Drawer */}
        <div className="relative">
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100/50 dark:hover:bg-slate-800/40 hover:text-slate-950 dark:hover:text-white transition-all outline-none"
          >
            <Bell size={20} />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-brand-500 animate-ping"></span>
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-brand-500"></span>
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-3 w-80 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-glass-light dark:shadow-glass-dark p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <span className="text-sm font-semibold text-slate-900 dark:text-white">Notifications</span>
                <button
                  onClick={() => setNotificationsOpen(false)}
                  className="text-xs text-brand-500 hover:underline"
                >
                  Clear all
                </button>
              </div>
              <div className="mt-2 divide-y divide-slate-100 dark:divide-slate-800">
                {notifications.map((n) => (
                  <div key={n.id} className="py-2.5 flex flex-col gap-0.5">
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-normal">
                      {n.text}
                    </p>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                      {n.time}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
