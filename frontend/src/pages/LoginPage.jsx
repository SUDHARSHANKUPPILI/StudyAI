import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { LogIn } from 'lucide-react';

const LoginPage = () => {
  const { loginWithGoogle, loginMock } = useAuth();
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    setError('');
    setSubmitting(true);
    try {
      await loginWithGoogle();
      navigate('/');
    } catch (err) {
      console.error("Google Sign-In failed:", err);
      setError('Google Sign-In failed. Please try again or use Mock Bypass.');
      setSubmitting(false);
    }
  };

  const handleMockLogin = () => {
    loginMock();
    navigate('/');
  };

  return (
    <div className="relative flex h-screen w-screen items-center justify-center bg-slate-955 bg-slate-950 overflow-hidden text-white font-sans">
      {/* Dynamic Glow Blobs */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-brand-500/10 blur-[120px] animate-pulse duration-10000"></div>
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 rounded-full bg-accent-500/10 blur-[120px] animate-pulse duration-7000"></div>

      {/* Reusable Glassmorphism Card */}
      <Card
        variant="glass"
        animate
        className="w-full max-w-md p-8 border-white/5 bg-slate-900/40 shadow-glass-dark z-10"
      >
        {/* Header */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-brand-600 to-accent-500 text-white font-display font-extrabold text-2xl shadow-glow-brand mb-4">
            S
          </div>
          <h2 className="font-display font-bold text-3xl tracking-tight text-white flex items-center gap-2">
            Welcome to <span className="bg-gradient-to-r from-brand-400 to-accent-400 bg-clip-text text-transparent">StudyAI</span>
          </h2>
          <p className="text-xs text-slate-400 mt-2">
            Your production-ready educational AI tutor companion
          </p>
        </div>

        {error && (
          <div className="p-3 mb-6 rounded-xl bg-rose-500/15 border border-rose-500/20 text-rose-455 text-xs text-center">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {/* Google Login Button */}
          <Button
            type="button"
            onClick={handleGoogleLogin}
            loading={submitting}
            className="w-full h-12 bg-white text-slate-900 hover:bg-slate-100 font-semibold flex items-center justify-center gap-3 border border-slate-200 transition-colors shadow-sm"
          >
            {!submitting && (
              <svg className="w-5 h-5 mr-1" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.555 0-6.437-2.883-6.437-6.437 0-3.555 2.882-6.437 6.437-6.437 1.487 0 2.85.508 3.93 1.358l3.053-3.053C18.9 2.062 15.777 1 12.24 1 6.033 1 1 6.033 1 12.24s5.033 11.24 11.24 11.24c5.836 0 10.745-4.22 10.745-11.24 0-.613-.075-1.285-.245-1.955H12.24z"
                />
              </svg>
            )}
            Continue with Google
          </Button>

          <div className="relative flex items-center justify-center my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/5"></div>
            </div>
            <span className="relative px-3 bg-slate-950/40 text-xs text-slate-500 uppercase tracking-widest font-semibold">
              Or
            </span>
          </div>

          {/* Reusable Glassmorphic Button for Mock login */}
          <Button
            type="button"
            onClick={handleMockLogin}
            icon={LogIn}
            variant="outline"
            className="w-full h-12 border-white/10 hover:bg-white/5"
          >
            Bypass Authentication (Mock Mode)
          </Button>
        </div>

        <div className="mt-8 pt-6 border-t border-white/5 text-center">
          <p className="text-xs text-slate-500">
            Google authentication links securely with your live Firebase instance.
          </p>
        </div>
      </Card>
    </div>
  );
};

export default LoginPage;
