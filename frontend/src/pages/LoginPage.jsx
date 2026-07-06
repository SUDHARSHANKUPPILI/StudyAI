import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import { Mail, Lock, LogIn } from 'lucide-react';

const LoginPage = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('student@studyai.edu');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError('Login connection failed. Check if backend is active.');
      setSubmitting(false);
    }
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

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Reusable Input Elements */}
          <Input
            label="Email Address"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@university.edu"
            icon={Mail}
          />

          <Input
            label="Password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••••"
            icon={Lock}
          />

          {/* Reusable Glassmorphic Button */}
          <Button
            type="submit"
            loading={submitting}
            icon={LogIn}
            className="w-full h-12"
          >
            Sign In to Workspace
          </Button>
        </form>

        <div className="mt-8 pt-6 border-t border-white/5 text-center">
          <p className="text-xs text-slate-500">
            For local review, click log in to bypass setup automatically.
          </p>
        </div>
      </Card>
    </div>
  );
};

export default LoginPage;
