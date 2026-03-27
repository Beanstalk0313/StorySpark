
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  accentColor: string;
  setAccentColor: (color: string) => void;
  isLiteMode: boolean;
  toggleLiteMode: () => void;
  setIsLiteMode: (isLite: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('storyspark-theme');
    return (saved as 'light' | 'dark') || 'dark';
  });

  const [accentColor, setAccentColor] = useState(() => {
    return localStorage.getItem('storyspark-accent-color') || '#f59e0b';
  });

  const [isLiteMode, setIsLiteModeState] = useState(() => {
    const saved = localStorage.getItem('storyspark-lite-mode');
    // Default to TRUE (Lite Mode ON) for performance safety if not set
    return saved === null ? true : saved === 'true';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('storyspark-theme', theme);
  }, [theme]);

  useEffect(() => {
    const root = window.document.documentElement;
    root.style.setProperty('--accent-color', accentColor);
    // Rough calculation for hover state (darker)
    root.style.setProperty('--accent-hover', accentColor + 'ee');
    root.style.setProperty('--accent-ring', accentColor + '80');
    localStorage.setItem('storyspark-accent-color', accentColor);
  }, [accentColor]);

  useEffect(() => {
    const root = window.document.documentElement;
    if (isLiteMode) {
      root.classList.add('lite-mode');
    } else {
      root.classList.remove('lite-mode');
    }
    localStorage.setItem('storyspark-lite-mode', String(isLiteMode));
  }, [isLiteMode]);

  const toggleTheme = () => setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  const toggleLiteMode = () => setIsLiteModeState(prev => !prev);
  const setIsLiteMode = (val: boolean) => setIsLiteModeState(val);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, accentColor, setAccentColor, isLiteMode, toggleLiteMode, setIsLiteMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
