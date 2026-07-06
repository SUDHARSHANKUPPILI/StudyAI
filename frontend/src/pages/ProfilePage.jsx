import React, { useState, useEffect } from 'react';
import authService from '../services/authService';
import { useAuth } from '../context/AuthContext';
import { User, Award, BookOpen, Brain, Sparkles, Save, ShieldAlert } from 'lucide-react';

const ProfilePage = () => {
  const { user } = useAuth();
  
  const [profile, setProfile] = useState(null);
  const [name, setName] = useState('');
  const [major, setMajor] = useState('');
  const [level, setLevel] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await authService.getProfile();
        setProfile(response.data);
        setName(response.data.name || user?.name || '');
        setMajor(response.data.major || '');
        setLevel(response.data.level || '');
      } catch (err) {
        console.error("Error loading user profile:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');
    try {
      const payload = { ...profile, name, major, level };
      await authService.updateProfile(payload);
      setProfile(payload);
      setMsg('Profile changes saved successfully!');
    } catch (err) {
      console.error("Error saving profile details:", err);
      setMsg('Error saving profile.');
    } finally {
      setSaving(false);
    }
  };

  const badges = [
    { name: 'Llama Pioneer', desc: 'Generate first study summary', unlocked: true, icon: Sparkles, color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/20' },
    { name: 'Quiz Master', desc: 'Achieve 100% on any quiz', unlocked: profile?.average_quiz_score >= 90 || true, icon: Award, color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/20' },
    { name: 'Bibliophile', desc: 'Upload 5 study documents', unlocked: false, icon: BookOpen, color: 'text-slate-400 bg-slate-50 dark:bg-slate-800/50' },
    { name: 'Memory Wizard', desc: 'Review 5 flashcard decks', unlocked: false, icon: Brain, color: 'text-slate-400 bg-slate-50 dark:bg-slate-800/50' }
  ];

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 animate-pulse pb-10">
        <div className="space-y-2">
          <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-md w-32"></div>
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-md w-64"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 h-80 bg-slate-200 dark:bg-slate-800 rounded-3xl"></div>
          <div className="h-80 bg-slate-200 dark:bg-slate-800 rounded-3xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-10">
      {/* Title */}
      <div className="space-y-2">
        <h2 className="font-display font-bold text-2xl text-slate-900 dark:text-white">Workspace Profile</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Customize academic settings, details, and view achievements badges.</p>
      </div>

      {msg && (
        <div className={`p-4 rounded-xl text-xs font-semibold ${msg.includes('successfully') ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'}`}>
          {msg}
        </div>
      )}

      {/* Main grids: left forms, right badges */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        {/* Profile edit forms */}
        <div className="md:col-span-2 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/60 shadow-sm space-y-6">
          <h3 className="font-display font-bold text-md text-slate-900 dark:text-white flex items-center gap-2">
            <User size={18} className="text-brand-500" />
            <span>Academic Profile Details</span>
          </h3>

          <form onSubmit={handleSave} className="space-y-5 text-xs">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5 col-span-2">
                <label className="font-semibold text-slate-500 uppercase tracking-wider">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Sudharshan"
                  className="w-full h-11 px-4 rounded-xl bg-slate-50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 focus:border-brand-500 text-slate-900 dark:text-white outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5 col-span-2 md:col-span-1">
                <label className="font-semibold text-slate-500 uppercase tracking-wider">Major Subject</label>
                <input
                  type="text"
                  value={major}
                  onChange={(e) => setMajor(e.target.value)}
                  placeholder="e.g. Computer Science"
                  className="w-full h-11 px-4 rounded-xl bg-slate-50 dark:bg-slate-955 dark:bg-slate-955/20 border border-slate-200 dark:border-slate-800 focus:border-brand-500 text-slate-900 dark:text-white outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5 col-span-2 md:col-span-1">
                <label className="font-semibold text-slate-500 uppercase tracking-wider">Degree Level Year</label>
                <input
                  type="text"
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  placeholder="e.g. Sophomore"
                  className="w-full h-11 px-4 rounded-xl bg-slate-55 bg-slate-50 dark:bg-slate-955 dark:bg-slate-955/20 border border-slate-200 dark:border-slate-800 focus:border-brand-500 text-slate-900 dark:text-white outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold shadow-glow-brand transition-all outline-none"
              >
                {saving ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                ) : (
                  <>
                    <Save size={14} />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Gamified Achievements sidebar */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/60 shadow-sm space-y-6">
          <h3 className="font-display font-bold text-md text-slate-900 dark:text-white flex items-center gap-2">
            <Award size={18} className="text-amber-500" />
            <span>Achievements</span>
          </h3>

          <div className="space-y-4">
            {badges.map((badge) => (
              <div
                key={badge.name}
                className={`p-3 rounded-2xl border flex items-center gap-3 transition-all ${
                  badge.unlocked
                    ? 'border-slate-200 dark:border-slate-800'
                    : 'border-slate-100 dark:border-slate-900/40 opacity-50'
                }`}
              >
                <div className={`p-2.5 rounded-xl shrink-0 ${badge.color}`}>
                  <badge.icon size={18} />
                </div>
                <div className="space-y-0.5">
                  <span className="font-semibold text-xs text-slate-900 dark:text-white block leading-tight">{badge.name}</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">{badge.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
