import React from 'react';

interface SpinnerProps {
  className?: string;
}

const Spinner: React.FC<SpinnerProps> = ({ className }) => {
  if (className) {
      return (
          <div className={`animate-spin rounded-full border-b-2 border-current ${className}`}></div>
      );
  }

  return (
    <div className="flex justify-center items-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-400"></div>
    </div>
  );
};

export default Spinner;