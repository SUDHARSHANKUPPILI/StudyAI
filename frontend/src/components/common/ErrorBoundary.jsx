import React from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an uncaught exception:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen w-screen items-center justify-center bg-slate-950 text-white font-sans p-6">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-rose-500/10 blur-[120px] pointer-events-none"></div>
          <div className="w-full max-w-md p-8 rounded-3xl bg-slate-900/50 border border-white/5 backdrop-blur-2xl shadow-glass-dark text-center space-y-6 z-10">
            <div className="h-14 w-14 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto border border-rose-500/20">
              <AlertCircle size={28} />
            </div>

            <div className="space-y-2">
              <h3 className="font-display font-bold text-xl">Something went wrong</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                An unexpected runtime crash occurred. Please reload the dashboard or head back to your workspace home.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 bg-slate-950/80 border border-white/5 rounded-xl text-left overflow-x-auto text-[10px] font-mono text-rose-400 max-h-32">
                {this.state.error.toString()}
              </div>
            )}

            <div className="flex gap-3 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold border border-white/5 transition-all"
              >
                <RefreshCw size={14} />
                <span>Reload Page</span>
              </button>
              <button
                onClick={() => { window.location.href = '/'; }}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold transition-all shadow-glow-brand"
              >
                <Home size={14} />
                <span>Workspace Home</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
