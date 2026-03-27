import React from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  cornerHint?: React.ReactNode;
}

const Textarea: React.FC<TextareaProps> = ({ label, id, className, cornerHint, ...props }) => {
  return (
    <div className="group">
      <div className="flex justify-between items-center mb-1.5">
        <label htmlFor={id} className="block text-sm font-medium text-slate-600 dark:text-slate-400 transition-colors group-focus-within:text-[var(--accent-color)]">
          {label}
        </label>
        {cornerHint}
      </div>
      <textarea
        id={id}
        className={`w-full bg-white/60 dark:bg-slate-900/50 backdrop-blur-sm border border-slate-200 dark:border-white/10 rounded-xl py-3 px-4 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 shadow-inner focus:ring-2 focus:ring-[var(--accent-ring)] focus:border-[var(--accent-ring)] transition-all duration-300 outline-none hover:bg-white/80 dark:hover:bg-slate-900/70 resize-y ${className}`}
        rows={10}
        {...props}
      />
    </div>
  );
};

export default Textarea;