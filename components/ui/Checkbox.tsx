
import React from 'react';

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

const Checkbox: React.FC<CheckboxProps> = ({ label, id, className, ...props }) => {
  return (
    <div className="flex items-center">
      <input
        id={id}
        type="checkbox"
        className={`h-4 w-4 rounded border-slate-500 bg-slate-700 text-[var(--accent-color)] focus:ring-[var(--accent-color)] transition ${className}`}
        style={{ accentColor: 'var(--accent-color)' }}
        {...props}
      />
      <label htmlFor={id} className="ml-2 block text-sm text-slate-300 select-none cursor-pointer">
        {label}
      </label>
    </div>
  );
};

export default Checkbox;