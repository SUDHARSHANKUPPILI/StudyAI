import React from 'react';
import { motion } from 'framer-motion';

const Card = ({
  children,
  onClick,
  variant = 'default', // 'default' | 'glass' | 'glow'
  className = '',
  animate = false,
  ...props
}) => {
  const baseStyles = 'p-6 rounded-2xl border transition-all duration-300';
  
  const variantStyles = {
    default: 'bg-white dark:bg-slate-900 border-slate-200/70 dark:border-slate-800/60 shadow-sm hover:border-brand-500/10',
    glass: 'bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl border-slate-200/70 dark:border-slate-800/60 shadow-sm',
    glow: 'bg-white dark:bg-slate-900 border-slate-200/70 dark:border-slate-800/60 shadow-sm hover:border-brand-500/40 dark:hover:border-brand-500/30 hover:shadow-md glow-card-brand'
  };

  const Component = animate ? motion.div : 'div';
  const animProps = animate
    ? {
        initial: { opacity: 0, y: 15 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.35, ease: 'easeOut' }
      }
    : {};

  return (
    <Component
      onClick={onClick}
      className={`${baseStyles} ${variantStyles[variant]} ${onClick ? 'cursor-pointer' : ''} ${className}`}
      {...animProps}
      {...props}
    >
      {children}
    </Component>
  );
};

export default Card;
