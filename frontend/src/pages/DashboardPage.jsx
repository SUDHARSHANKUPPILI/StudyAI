import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import studyService from '../services/studyService';
import aiService from '../services/aiService';
import { formatDate } from '../utils/formatDate';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import {
  Sparkles,
  BookOpen,
  Award,
  Clock,
  Upload,
  ArrowRight,
  TrendingUp,
  Brain,
  Layers,
  Calendar,
  AlertTriangle,
  ChevronRight,
  CheckCircle2,
  FileText
} from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const DashboardPage = () => {
  const [materials, setMaterials] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [flashcardsCount, setFlashcardsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [materialsRes, analyticsRes, scheduleRes, flashcardsRes] = await Promise.all([
          studyService.getMaterials(),
          aiService.getAnalytics(),
          aiService.getSchedule(),
          aiService.getFlashcards()
        ]);
        
        const materialsList = materialsRes.data || [];
        setMaterials(materialsList);
        setAnalytics(analyticsRes.data);
        setTasks(scheduleRes.data.tasks || []);

        // Aggregate total flashcard count across all decks
        const decks = flashcardsRes.data || [];
        const totalCards = Array.isArray(decks)
          ? decks.reduce((acc, d) => acc + (d.cards?.length || 0), 0)
          : (decks.cards?.length || 0);
        setFlashcardsCount(totalCards);
      } catch (err) {
        console.error("Error loading dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const handleToggleTask = async (taskId) => {
    const updatedTasks = tasks.map((t) => {
      if (t.id === taskId) {
        return { ...t, status: t.status === 'done' ? 'todo' : 'done' };
      }
      return t;
    });
    setTasks(updatedTasks);
    try {
      await aiService.updateSchedule(updatedTasks);
    } catch (err) {
      console.error("Failed to sync task update from dashboard:", err);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse pb-10">
        {/* Welcome Header Skeleton */}
        <div className="h-36 bg-slate-200 dark:bg-slate-800 rounded-3xl w-full"></div>

        {/* 4 Cards Grid Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-6 h-24 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
          ))}
        </div>

        {/* Bottom Area Skeletons */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Resume summary skeleton */}
            <div className="p-6 h-48 bg-slate-200 dark:bg-slate-800 rounded-3xl"></div>
            {/* Schedule tasks skeleton */}
            <div className="p-6 h-56 bg-slate-200 dark:bg-slate-800 rounded-3xl"></div>
          </div>
          <div className="space-y-8">
            {/* Focus Hours chart skeleton */}
            <div className="p-6 h-48 bg-slate-200 dark:bg-slate-800 rounded-3xl"></div>
            {/* Weak topics skeleton */}
            <div className="p-6 h-48 bg-slate-200 dark:bg-slate-800 rounded-3xl"></div>
          </div>
        </div>
      </div>
    );
  }

  // --- KPI Cards Definition ---
  const kpis = [
    {
      name: 'Uploaded Materials',
      value: `${materials.length} Documents`,
      description: 'Course notes, PDFs, or slides',
      icon: BookOpen,
      color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/20 border-indigo-150',
      route: '/summary'
    },
    {
      name: 'Flashcards Created',
      value: `${flashcardsCount} Cards`,
      description: 'Active revision recall items',
      icon: Layers,
      color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-150',
      route: '/flashcards'
    },
    {
      name: 'Quiz Accuracy',
      value: analytics ? `${analytics.average_quiz_score}%` : '80%',
      description: 'Overall completed practice scores',
      icon: Award,
      color: 'text-purple-500 bg-purple-50 dark:bg-purple-950/20 border-purple-150',
      route: '/analytics'
    },
    {
      name: 'Study Streak',
      value: '5 Days',
      description: 'Daily concept retention rate',
      icon: TrendingUp,
      color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/20 border-amber-150',
      route: '/analytics'
    }
  ];

  // --- Chart Setup (Weekly study hours) ---
  const chartLabels = analytics?.weekly_progress?.map(d => d.day) || ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const chartDataValues = analytics?.weekly_progress?.map(d => d.hours) || [2, 3, 1, 4, 2, 5, 1];
  
  const chartData = {
    labels: chartLabels,
    datasets: [{
      label: 'Hours',
      data: chartDataValues,
      backgroundColor: 'rgba(99, 102, 241, 0.55)',
      borderColor: '#6366f1',
      borderWidth: 1.5,
      borderRadius: 6
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { cornerRadius: 6 }
    },
    scales: {
      y: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#94a3b8', font: { size: 9 } } },
      x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 9 } } }
    }
  };

  // Find the latest document with a summary
  const latestMaterialWithSummary = materials.find(m => m.summary);
  // Get upcoming uncompleted tasks
  const upcomingTasks = tasks.filter(t => t.status !== 'done').slice(0, 3);

  return (
    <div className="space-y-8 pb-10">
      {/* Dynamic Greetings Welcome Header */}
      <div className="relative p-8 rounded-3xl overflow-hidden bg-gradient-to-r from-brand-900/90 to-brand-950/95 text-white border border-brand-800/40 glow-effect-brand">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <h2 className="font-display font-bold text-2xl tracking-tight flex items-center gap-2">
              <span>Optimize Your Study Workflow</span>
              <Sparkles className="text-brand-300 animate-pulse" size={22} />
            </h2>
            <p className="text-xs text-brand-200/90 max-w-xl leading-relaxed">
              Upload textbook PDFs, generate custom AI study guides, take recall quizzes, and review dynamic weakness suggestions compiled from quiz history.
            </p>
          </div>
          <button
            onClick={() => navigate('/upload')}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white text-brand-900 font-semibold text-xs hover:bg-brand-50 transition-all shadow-md shrink-0 outline-none"
          >
            <span>Upload Course Notes</span>
            <Upload size={14} />
          </button>
        </div>
      </div>

      {/* Redesigned Insight KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, idx) => (
          <motion.div
            key={kpi.name}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            onClick={() => navigate(kpi.route)}
            className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/60 shadow-sm hover:border-brand-500/30 cursor-pointer transition-all duration-300 flex items-center justify-between group"
          >
            <div className="space-y-1">
              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                {kpi.name}
              </span>
              <span className="font-display font-bold text-xl text-slate-950 dark:text-white block">
                {kpi.value}
              </span>
              <span className="text-[9px] text-slate-400 block leading-tight">
                {kpi.description}
              </span>
            </div>
            <div className={`p-3 rounded-xl ${kpi.color} transition-transform group-hover:scale-105`}>
              <kpi.icon size={18} />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Split section: left details list, right dynamic telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left columns (Summary Preview & Schedule List) */}
        <div className="lg:col-span-2 space-y-8">
          {/* Latest Summary Resume Reading Panel */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/60 shadow-sm space-y-4">
            <h3 className="font-display font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <FileText size={16} className="text-brand-500" />
              <span>Resume Reading Summary</span>
            </h3>

            {latestMaterialWithSummary ? (
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-955 border border-slate-100 dark:border-slate-850 space-y-3 flex flex-col justify-between min-h-[140px]">
                <div>
                  <div className="flex justify-between items-center">
                    <h4 className="font-semibold text-xs text-slate-900 dark:text-white truncate max-w-md">
                      {latestMaterialWithSummary.filename}
                    </h4>
                    <span className="text-[9px] text-slate-450">
                      Uploaded {formatDate(latestMaterialWithSummary.uploaded_at)}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2 line-clamp-3 leading-relaxed">
                    {latestMaterialWithSummary.summary.replace(/[#*`>]/g, '')}
                  </p>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => navigate('/summary', { state: { material: latestMaterialWithSummary } })}
                    className="flex items-center gap-1 text-[10px] font-bold text-brand-500 hover:text-brand-600 hover:underline outline-none"
                  >
                    <span>Open Full Summary Guide</span>
                    <ArrowRight size={12} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-8 rounded-2xl bg-slate-50 dark:bg-slate-955 border border-dashed border-slate-200 dark:border-slate-800 text-center flex flex-col items-center justify-center gap-2">
                <BookOpen className="text-slate-400" size={32} />
                <span className="text-xs text-slate-550 leading-normal">
                  No summaries generated yet. Upload text files or PDFs to begin.
                </span>
              </div>
            )}
          </div>

          {/* Upcoming Schedule Checklist */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/60 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-display font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar size={16} className="text-brand-500" />
                <span>Upcoming Study Schedule</span>
              </h3>
              <button
                onClick={() => navigate('/planner')}
                className="text-[10px] font-semibold text-brand-500 hover:underline outline-none"
              >
                Open Full Planner
              </button>
            </div>

            {upcomingTasks.length === 0 ? (
              <div className="p-8 rounded-2xl bg-slate-50 dark:bg-slate-955 border border-dashed border-slate-200 dark:border-slate-800 text-center flex flex-col items-center justify-center gap-2">
                <CheckCircle2 className="text-emerald-500" size={32} />
                <span className="text-xs text-slate-550 leading-normal">
                  You are all caught up! Create timelines to add study checklists.
                </span>
              </div>
            ) : (
              <div className="space-y-2">
                {upcomingTasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-850 bg-slate-50 dark:bg-slate-955 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        onClick={() => handleToggleTask(task.id)}
                        className="text-slate-400 hover:text-brand-500 transition-colors outline-none shrink-0"
                      >
                        <div className="h-4.5 w-4.5 rounded border border-slate-350 dark:border-slate-700 flex items-center justify-center text-[10px] text-white font-bold h-4.5 w-4.5"></div>
                      </button>
                      <div className="min-w-0">
                        <span className="text-xs font-semibold text-slate-950 dark:text-white block truncate leading-tight">
                          {task.title}
                        </span>
                        <div className="flex gap-2 items-center text-[9px] text-slate-500 dark:text-slate-400 mt-0.5">
                          <span>{task.subject}</span>
                          <span>•</span>
                          <span>{task.duration_minutes}m</span>
                          <span>•</span>
                          <span className={`font-extrabold uppercase ${task.priority === 'High' ? 'text-rose-500' : 'text-blue-500'}`}>
                            {task.priority} Priority
                          </span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight size={14} className="text-slate-400 shrink-0" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Area (Weekly progress chart & Weak topics diagnostic) */}
        <div className="space-y-8">
          {/* Progress Chart */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/60 shadow-sm space-y-4">
            <h3 className="font-display font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Clock size={16} className="text-brand-500" />
              <span>Weekly Focus Hours</span>
            </h3>
            <div className="h-44 relative">
              <Bar data={chartData} options={chartOptions} />
            </div>
          </div>

          {/* AI Weakness Callout card */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/60 shadow-sm space-y-4">
            <h3 className="font-display font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Brain size={16} className="text-brand-500" />
              <span>AI Weak Concepts revision</span>
            </h3>

            <div className="space-y-4 text-[11px] leading-relaxed">
              <div className="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/10 border border-indigo-100/30 text-indigo-700 dark:text-brand-400 font-semibold flex gap-2.5 items-start">
                <Sparkles size={16} className="shrink-0 mt-0.5" />
                <p>
                  "Reviewing your latest quiz performance shows you would benefit from dedicated flashcards review on Binary Search Trees (BST Worst Case) today."
                </p>
              </div>

              <div className="p-4 rounded-xl bg-rose-500/5 dark:bg-rose-955/10 border border-rose-500/10 text-slate-700 dark:text-slate-350 space-y-2.5">
                <div className="flex items-center gap-1.5 text-rose-500 font-bold">
                  <AlertTriangle size={14} />
                  <span>Topics Requiring Review</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {['Recursion limits', 'BST worst case search', 'Backpropagation updates'].map(t => (
                    <span key={t} className="px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-455 font-semibold text-[9px]">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
