import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
}

const Button: React.FC<ButtonProps> = ({ children, className, variant = 'primary', ...props }) => {
  const baseClasses = 'relative px-6 py-2.5 font-semibold rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-100 dark:focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95 overflow-hidden';
  
  const variantClasses = {
    // Primary uses dynamic CSS variables set in ThemeContext
    primary: 'bg-[var(--accent-color)] text-white hover:bg-[var(--accent-hover)] shadow-lg hover:-translate-y-0.5 border border-white/10',
    secondary: 'bg-white/50 dark:bg-white/5 backdrop-blur-md text-slate-700 dark:text-slate-100 border border-slate-200 dark:border-white/10 hover:bg-white/80 dark:hover:bg-white/10 hover:border-slate-300 dark:hover:border-white/20 shadow-lg shadow-black/5',
    danger: 'bg-gradient-to-br from-red-500 to-red-600 text-white shadow-[0_4px_14px_0_rgba(220,38,38,0.39)] hover:shadow-[0_6px_20px_rgba(220,38,38,0.23)] hover:-translate-y-0.5 border border-white/10',
    ghost: 'bg-transparent hover:bg-slate-200/50 dark:hover:bg-white/5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white',
  };

  return (
    <button className={`${baseClasses} ${variantClasses[variant]} ${className}`} {...props}>
      {/* Subtle shine effect on top */}
      {variant !== 'ghost' && <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-50"></div>}
      <span className="relative z-10 flex items-center justify-center gap-2">{children}</span>
    </button>
  );
};

export default Button;