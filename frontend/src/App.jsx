import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ErrorBoundary from './components/common/ErrorBoundary';
import PrivateRoute from './routes/PrivateRoute';
import AppLayout from './layouts/AppLayout';
import { isFirebaseConfigValid } from './config/firebase';

// Page Imports
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import UploadMaterialPage from './pages/UploadMaterialPage';
import AISummaryPage from './pages/AISummaryPage';
import FlashcardsPage from './pages/FlashcardsPage';
import QuizPage from './pages/QuizPage';
import AnalyticsPage from './pages/AnalyticsPage';
import StudyPlannerPage from './pages/StudyPlannerPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';

function App() {
  if (!isFirebaseConfigValid) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-center p-6 text-white font-sans selection:bg-rose-500/30 selection:text-rose-200">
        <div className="max-w-md w-full p-8 rounded-3xl bg-slate-900/40 backdrop-blur-xl border border-slate-800/80 shadow-2xl space-y-6 relative overflow-hidden">
          {/* Subtle gradient glow */}
          <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-rose-500/10 blur-3xl" />
          <div className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full bg-indigo-500/10 blur-3xl" />
          
          <div className="h-16 w-16 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-2xl flex items-center justify-center mx-auto text-3xl font-display font-bold shadow-lg shadow-rose-500/5 animate-pulse">
            ⚠️
          </div>
          
          <div className="space-y-2">
            <h1 className="text-xl font-bold font-display text-slate-100">
              Firebase configuration is incomplete.
            </h1>
            <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
              Required client-side configuration parameters are missing or default placeholders. Update Vercel dashboard or local environment setup.
            </p>
          </div>
          
          <div className="text-[10px] text-slate-400 bg-slate-950/60 backdrop-blur-md p-4 rounded-2xl text-left font-mono border border-slate-850/50 space-y-1.5 shadow-inner">
            <span className="font-semibold text-rose-400 block mb-1 text-[11px]">Required Variables Status:</span>
            <div className="flex justify-between items-center py-0.5">
              <span>VITE_FIREBASE_API_KEY</span>
              <span className={import.meta.env.VITE_FIREBASE_API_KEY ? "text-emerald-400" : "text-rose-500 font-bold"}>
                {import.meta.env.VITE_FIREBASE_API_KEY ? "✓ Loaded" : "✗ Missing"}
              </span>
            </div>
            <div className="flex justify-between items-center py-0.5">
              <span>VITE_FIREBASE_AUTH_DOMAIN</span>
              <span className={import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ? "text-emerald-400" : "text-rose-500 font-bold"}>
                {import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ? "✓ Loaded" : "✗ Missing"}
              </span>
            </div>
            <div className="flex justify-between items-center py-0.5">
              <span>VITE_FIREBASE_PROJECT_ID</span>
              <span className={import.meta.env.VITE_FIREBASE_PROJECT_ID ? "text-emerald-400" : "text-rose-500 font-bold"}>
                {import.meta.env.VITE_FIREBASE_PROJECT_ID ? "✓ Loaded" : "✗ Missing"}
              </span>
            </div>
            <div className="flex justify-between items-center py-0.5">
              <span>VITE_FIREBASE_STORAGE_BUCKET</span>
              <span className={import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ? "text-emerald-400" : "text-rose-500 font-bold"}>
                {import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ? "✓ Loaded" : "✗ Missing"}
              </span>
            </div>
            <div className="flex justify-between items-center py-0.5">
              <span>VITE_FIREBASE_MESSAGING_SENDER_ID</span>
              <span className={import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ? "text-emerald-400" : "text-rose-500 font-bold"}>
                {import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ? "✓ Loaded" : "✗ Missing"}
              </span>
            </div>
            <div className="flex justify-between items-center py-0.5">
              <span>VITE_FIREBASE_APP_ID</span>
              <span className={import.meta.env.VITE_FIREBASE_APP_ID ? "text-emerald-400" : "text-rose-500 font-bold"}>
                {import.meta.env.VITE_FIREBASE_APP_ID ? "✓ Loaded" : "✗ Missing"}
              </span>
            </div>
            <div className="flex justify-between items-center py-0.5">
              <span>VITE_FIREBASE_MEASUREMENT_ID</span>
              <span className={import.meta.env.VITE_FIREBASE_MEASUREMENT_ID ? "text-emerald-400" : "text-rose-500 font-bold"}>
                {import.meta.env.VITE_FIREBASE_MEASUREMENT_ID ? "✓ Loaded" : "✗ Missing"}
              </span>
            </div>
            <div className="flex justify-between items-center py-0.5 border-t border-slate-800/40 pt-1.5 mt-1.5">
              <span>VITE_API_BASE_URL (Backend API)</span>
              <span className={import.meta.env.VITE_API_BASE_URL ? "text-emerald-400" : "text-rose-500 font-bold"}>
                {import.meta.env.VITE_API_BASE_URL ? "✓ Loaded" : "✗ Missing"}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <Routes>
              {/* Public Auth Routes */}
              <Route path="/login" element={<LoginPage />} />

              {/* Secure Layout Routes */}
              <Route element={<PrivateRoute />}>
                <Route element={<AppLayout />}>
                  <Route path="/" element={<DashboardPage />} />
                  <Route path="/upload" element={<UploadMaterialPage />} />
                  <Route path="/summary" element={<AISummaryPage />} />
                  <Route path="/flashcards" element={<FlashcardsPage />} />
                  <Route path="/quiz" element={<QuizPage />} />
                  <Route path="/analytics" element={<AnalyticsPage />} />
                  <Route path="/planner" element={<StudyPlannerPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                </Route>
              </Route>

              {/* Fallback Redirect */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
