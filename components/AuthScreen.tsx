import React, { useState } from 'react';
import { signInWithEmail, signUpWithEmail } from '../services/authService';
import Button from './ui/Button';
import Input from './ui/Input';

interface AuthScreenProps {
  onGuestLogin: () => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onGuestLogin }) => {
  const [isLoginView, setIsLoginView] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleAuthAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (isLoginView) {
        await signInWithEmail(email, password);
      } else {
        if (!displayName.trim()) {
            throw new Error("Display name is required.");
        }
        await signUpWithEmail(email, password, displayName);
      }
      // onAuthStateChanged in App.tsx will handle the redirect
    } catch (authError: any) {
      let errorMessage = "An unknown error occurred. Please try again.";
      // Firebase provides detailed error codes
      switch(authError.code) {
        case 'auth/invalid-email':
          errorMessage = 'Please enter a valid email address.';
          break;
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          errorMessage = 'Invalid email or password.';
          break;
        case 'auth/email-already-in-use':
          errorMessage = 'An account with this email address already exists.';
          break;
        case 'auth/weak-password':
          errorMessage = 'Password should be at least 6 characters long.';
          break;
        default:
          errorMessage = authError.message || errorMessage;
          break;
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };
  
  const toggleView = () => {
      setIsLoginView(!isLoginView);
      setError(null);
      setEmail('');
      setPassword('');
      setDisplayName('');
  }

  return (
    <div className="max-w-md mx-auto flex flex-col items-center text-center p-8 bg-white/40 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 mt-10 shadow-lg">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-16 w-16 mb-4" aria-hidden="true">
        <g transform="translate(1.2, 3.3) scale(0.9)">
          <path fill="#38BDF8" d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
          <path fill="#38BDF8" d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
        </g>
        <g transform="translate(7.2, 4.2) scale(0.4)">
          <polygon fill="#FBBF24" points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </g>
      </svg>
      <h2 className="text-3xl font-semibold mb-2 text-slate-900 dark:text-slate-100">{isLoginView ? 'Welcome Back!' : 'Join StorySpark'}</h2>
      <p className="text-lg text-slate-600 dark:text-slate-400 mb-8 max-w-2xl">{isLoginView ? 'Log in to continue your journey.' : 'Create an account to save your stories.'}</p>
      
      <form onSubmit={handleAuthAction} className="w-full space-y-4 text-left">
        {!isLoginView && (
            <Input 
                id="displayName"
                label="Display Name"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                placeholder="Your Name"
            />
        )}
        <Input 
            id="email"
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="you@example.com"
        />
        <Input 
            id="password"
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
        />

        {error && <p className="text-red-500 dark:text-red-400 text-sm text-center">{error}</p>}

        <div className="pt-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (isLoginView ? 'Logging in...' : 'Creating account...') : (isLoginView ? 'Login' : 'Create Account')}
            </Button>
        </div>
      </form>
      
      <p className="mt-6 text-sm text-slate-600 dark:text-slate-400">
        {isLoginView ? "Don't have an account?" : "Already have an account?"}
        <button onClick={toggleView} className="font-semibold text-amber-600 dark:text-amber-400 hover:text-amber-500 dark:hover:text-amber-300 ml-2 focus:outline-none">
            {isLoginView ? 'Sign up' : 'Log in'}
        </button>
      </p>

      <div className="flex items-center gap-4 py-4 w-full">
          <div className="flex-grow border-t border-slate-300 dark:border-slate-700"></div>
          <span className="text-slate-500 dark:text-slate-400 text-xs font-semibold">OR</span>
          <div className="flex-grow border-t border-slate-300 dark:border-slate-700"></div>
      </div>

      <Button variant="secondary" onClick={onGuestLogin} className="w-full">
        Continue as Guest
      </Button>
    </div>
  );
};

export default AuthScreen;