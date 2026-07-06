import React from 'react';

const Input = ({
  label,
  error,
  icon: Icon,
  type = 'text',
  placeholder,
  value,
  onChange,
  className = '',
  required = false,
  ...props
}) => {
  return (
    <div className="flex flex-col gap-1.5 w-full text-xs">
      {label && (
        <label className="font-semibold tracking-wider text-slate-500 uppercase">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
          className={`w-full h-11 pr-4 rounded-xl border bg-slate-50 dark:bg-slate-950/20 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-500 transition-all outline-none ${
            Icon ? 'pl-11' : 'pl-4'
          } ${
            error
              ? 'border-rose-500 focus:border-rose-500'
              : 'focus:border-brand-500'
          } ${className}`}
          {...props}
        />
        {Icon && (
          <Icon
            size={16}
            className={`absolute left-4 top-3.5 ${
              error ? 'text-rose-500' : 'text-slate-500'
            }`}
          />
        )}
      </div>
      {error && (
        <span className="text-[10px] text-rose-500 font-semibold mt-0.5">
          {error}
        </span>
      )}
    </div>
  );
};

export default Input;
