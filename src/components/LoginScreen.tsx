import React, { useState } from 'react';
import { motion } from 'motion/react';
import { KeyRound, ShieldAlert, User as UserIcon, Lock, Compass } from 'lucide-react';
import { loginUser, User } from '../lib/userDb';
import { Button, Field } from './ui';

interface LoginScreenProps {
  onLoginSuccess: (user: User) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }

    const sessionUser = loginUser(username, password);
    if (sessionUser) {
      onLoginSuccess(sessionUser);
    } else {
      setError('Invalid username or password.');
    }
  };

  return (
    <div
      id="login_container"
      className="dark min-h-screen bg-[var(--bg)] text-[var(--label)] flex flex-col items-center justify-center p-[var(--space-4)] selection:bg-[var(--tint-soft)]"
    >
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-[400px] relative z-10 rounded-[var(--radius-window)] p-[var(--space-8)] bg-[var(--material-thick-fill)] backdrop-blur-[var(--material-blur-thick)] backdrop-saturate-[var(--material-saturate)] shadow-[var(--glass-highlight),var(--shadow-sheet)]"
      >
        <div className="flex flex-col items-center text-center mb-[var(--space-8)]">
          <div className="w-14 h-14 mb-[var(--space-4)] rounded-[var(--radius-card)] bg-[var(--tint)] flex items-center justify-center">
            <Compass className="w-7 h-7 text-[var(--on-tint)]" />
          </div>
          <h1
            className="font-[family-name:var(--font-title)] text-[length:var(--text-title-2-size)] leading-[var(--text-title-2-line)] tracking-[var(--text-title-2-tracking)] font-bold text-[var(--label)]"
          >
            Red Pill
          </h1>
          <p className="mt-[var(--space-1)] font-[family-name:var(--font-text)] text-[length:var(--text-footnote-size)] leading-[var(--text-footnote-line)] tracking-[var(--text-footnote-tracking)] text-[var(--label-secondary)]">
            Operational and financial simulation
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-[var(--space-5)]">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-[var(--space-2)] p-[var(--space-3)] rounded-[var(--radius-element)] bg-[var(--tint-soft)] text-[var(--system-red)] font-[family-name:var(--font-text)] text-[length:var(--text-footnote-size)] leading-[var(--text-footnote-line)]"
            >
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </motion.div>
          )}

          <div className="flex flex-col gap-[var(--space-4)]">
            <Field
              label="Username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              autoFocus
              prefix={<UserIcon className="w-4 h-4" />}
            />
            <Field
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              prefix={<Lock className="w-4 h-4" />}
            />
          </div>

          <Button type="submit" variant="filled" className="w-full">
            <KeyRound className="w-4 h-4" />
            Sign in
          </Button>
        </form>
      </motion.div>
    </div>
  );
};
