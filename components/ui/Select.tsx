import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
}

const Select: React.FC<SelectProps> = ({ label, id, children, className, ...props }) => {
  return (
    <div className="group">
      <label htmlFor={id} className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5 transition-colors group-focus-within:text-[var(--accent-color)]">
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          className={`appearance-none w-full bg-white/60 dark:bg-slate-900/50 backdrop-blur-sm border border-slate-200 dark:border-white/10 rounded-xl py-3 px-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-[var(--accent-ring)] focus:border-[var(--accent-ring)] transition-all duration-300 outline-none hover:bg-white/80 dark:hover:bg-slate-900/70 ${className}`}
          {...props}
        >
          {children}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500 dark:text-slate-400">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default Select;