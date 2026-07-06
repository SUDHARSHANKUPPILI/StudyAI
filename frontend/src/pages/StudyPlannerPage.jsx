import React from 'react';
import useSchedule from '../hooks/useSchedule';
import { CalendarDays, Trash2, CheckCircle, Circle, Sparkles, Clock } from 'lucide-react';

const StudyPlannerPage = () => {
  const {
    goals,
    setGoals,
    studyHours,
    setStudyHours,
    tasks,
    loading,
    fetching,
    generatePlanner,
    toggleTaskStatus,
    deleteTask,
  } = useSchedule();

  const handleGeneratePlanner = async (e) => {
    e.preventDefault();
    if (!goals) return;
    try {
      await generatePlanner(goals, studyHours);
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportCSV = () => {
    if (tasks.length === 0) return;
    const headers = ["Title", "Subject", "Duration (Minutes)", "Priority", "Status", "Scheduled Date"];
    const rows = tasks.map(t => [
      `"${t.title.replace(/"/g, '""')}"`,
      `"${t.subject.replace(/"/g, '""')}"`,
      t.duration_minutes,
      `"${t.priority}"`,
      `"${t.status}"`,
      `"${t.scheduled_date || ''}"`
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `study_schedule_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (fetching) {
    return (
      <div className="space-y-8 animate-pulse pb-10">
        <div className="space-y-2">
          <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-md w-40"></div>
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-md w-80"></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="h-80 bg-slate-200 dark:bg-slate-800 rounded-3xl"></div>
          <div className="lg:col-span-2 space-y-4">
            <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-md w-36"></div>
            <div className="h-16 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
            <div className="h-16 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
            <div className="h-16 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      {/* Title */}
      <div className="space-y-2">
        <h2 className="font-display font-bold text-2xl text-slate-900 dark:text-white">Study Planner</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Formulate learning timelines and organize dynamic revision agendas.
        </p>
      </div>

      {/* Forms & Checklist split layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Col: Setup form */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/60 shadow-sm space-y-6">
          <h3 className="font-display font-bold text-md text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="text-brand-500" size={18} />
            <span>Generate Study Plan</span>
          </h3>

          <form onSubmit={handleGeneratePlanner} className="space-y-5">
            {/* Target Syllabus Objectives */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Learning Objectives
              </label>
              <textarea
                value={goals}
                onChange={(e) => setGoals(e.target.value)}
                placeholder="Enter what you want to study (e.g. Master React Hooks, Study Machine Learning basics for midterms)..."
                rows={4}
                required
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 focus:border-brand-500 text-xs text-slate-900 dark:text-white outline-none resize-none"
              ></textarea>
            </div>

            {/* Hourly Dedication */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Daily Study Hours: {studyHours} hrs
              </label>
              <input
                type="range"
                min="0.5"
                max="8"
                step="0.5"
                value={studyHours}
                onChange={(e) => setStudyHours(parseFloat(e.target.value))}
                className="w-full accent-brand-500 bg-slate-200 dark:bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !goals}
              className="flex items-center justify-center gap-2 w-full h-12 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-600 text-white font-semibold text-sm transition-all shadow-glow-brand disabled:opacity-50"
            >
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              ) : (
                <>
                  <span>Create Timeline</span>
                  <CalendarDays size={16} />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right 2 Cols: Checklist Agenda */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white">
              Revision Tasks Agenda
            </h3>
            {tasks.length > 0 && (
              <button
                onClick={handleExportCSV}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-[10px] font-bold text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-all outline-none"
              >
                Export Schedule (CSV)
              </button>
            )}
          </div>

          {tasks.length === 0 ? (
            <div className="p-12 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/60 shadow-sm text-center flex flex-col items-center justify-center gap-3">
              <CalendarDays className="text-slate-300 dark:text-slate-700" size={48} />
              <h4 className="font-semibold text-sm text-slate-900 dark:text-white">No Tasks Scheduled</h4>
              <p className="text-xs text-slate-550 text-slate-500 dark:text-slate-400 max-w-xs leading-normal">
                Define your learning target syllabus goals to compute a dynamic study checklist.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map((task) => {
                const isDone = task.status === 'done';
                return (
                  <div
                    key={task.id}
                    className={`p-4 rounded-2xl border transition-all duration-300 flex items-center justify-between gap-4 bg-white dark:bg-slate-900 shadow-sm ${
                      isDone
                        ? 'border-slate-100 dark:border-slate-900/60 opacity-60'
                        : 'border-slate-200/75 dark:border-slate-800/60 hover:border-brand-500/20'
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <button
                        onClick={() => toggleTaskStatus(task.id)}
                        className={`mt-0.5 shrink-0 transition-colors duration-200 outline-none ${
                          isDone ? 'text-emerald-500' : 'text-slate-400 hover:text-brand-500'
                        }`}
                      >
                        {isDone ? <CheckCircle size={18} /> : <Circle size={18} />}
                      </button>
                      
                      <div className="space-y-1 min-w-0">
                        <span
                          className={`font-semibold text-xs text-slate-900 dark:text-white block leading-tight ${
                            isDone ? 'line-through text-slate-500' : ''
                          }`}
                        >
                          {task.title}
                        </span>
                        
                        <div className="flex flex-wrap gap-2 items-center text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                          <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-350">
                            {task.subject}
                          </span>
                          <span className="flex items-center gap-0.5 text-slate-500 dark:text-slate-400">
                            <Clock size={10} />
                            <span>{task.duration_minutes}m</span>
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase ${
                              task.priority === 'High'
                                ? 'bg-rose-50 dark:bg-rose-950/20 text-rose-500'
                                : 'bg-blue-50 dark:bg-blue-950/20 text-blue-500'
                            }`}
                          >
                            {task.priority} Priority
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => deleteTask(task.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-955/20 transition-all outline-none"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudyPlannerPage;
