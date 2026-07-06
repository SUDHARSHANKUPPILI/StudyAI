import React from 'react';
import { Loader2 } from 'lucide-react';

const Button = ({
  children,
  onClick,
  type = 'button',
  variant = 'primary', // 'primary' | 'secondary' | 'outline' | 'danger' | 'success'
  size = 'md', // 'sm' | 'md' | 'lg'
  disabled = false,
  loading = false,
  icon: Icon,
  className = '',
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-sans font-semibold rounded-xl transition-all duration-200 outline-none select-none';
  
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-5 py-2.5 text-xs',
    lg: 'px-6 py-3.5 text-sm'
  };

  const variantStyles = {
    primary: 'bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-600 text-white shadow-glow-brand disabled:opacity-50',
    secondary: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50',
    outline: 'border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800/40 disabled:opacity-50',
    danger: 'bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-455 hover:bg-rose-500/20 disabled:opacity-50',
    success: 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-450 hover:bg-emerald-500/20 disabled:opacity-50'
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin shrink-0 mr-2" />
      ) : Icon ? (
        <Icon className="h-4 w-4 shrink-0 mr-2" />
      ) : null}
      <span>{children}</span>
    </button>
  );
};

export default Button;
