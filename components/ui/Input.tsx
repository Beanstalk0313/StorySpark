import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

const Input: React.FC<InputProps> = ({ label, id, className, ...props }) => {
  return (
    <div className="group">
      <label htmlFor={id} className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5 transition-colors group-focus-within:text-[var(--accent-color)]">
        {label}
      </label>
      <input
        id={id}
        className={`w-full bg-white/60 dark:bg-slate-900/50 backdrop-blur-sm border border-slate-200 dark:border-white/10 rounded-xl py-3 px-4 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 shadow-inner focus:ring-2 focus:ring-[var(--accent-ring)] focus:border-[var(--accent-ring)] transition-all duration-300 outline-none hover:bg-white/80 dark:hover:bg-slate-900/70 ${className}`}
        {...props}
      />
    </div>
  );
};

export default Input;