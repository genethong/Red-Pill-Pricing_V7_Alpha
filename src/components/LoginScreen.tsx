import React, { useState } from 'react';
import { motion } from 'motion/react';
import { KeyRound, ShieldAlert, User as UserIcon, Lock, Compass } from 'lucide-react';
import { loginUser, User } from '../lib/userDb';

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
    <div id="login_container" className="min-h-screen bg-black flex flex-col items-center justify-center p-4 selection:bg-red-500/30 selection:text-white">
      {/* Dynamic Background Accents */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-600/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-red-600/5 rounded-full blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md bg-gray-950 border border-white/5 rounded-3xl p-8 md:p-10 shadow-2xl relative z-10"
      >
        {/* Brand / Logo */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="p-4 bg-red-500/10 rounded-2xl mb-4 border border-red-500/20 relative group overflow-hidden">
            <div className="absolute inset-0 bg-red-500/10 scale-0 group-hover:scale-100 transition-transform duration-500 rounded-2xl" />
            <Compass className="w-8 h-8 text-red-500 group-hover:rotate-45 transition-transform duration-500 relative z-10" />
          </div>
          <h1 className="text-xl font-black text-white uppercase tracking-widest leading-none">
            REDPILL MODELLER
          </h1>
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1.5">
            Operational & Financial Simulation Platform
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-start gap-2.5 p-3.5 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl"
            >
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </motion.div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                Username
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 text-sm font-medium transition-all"
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 text-sm font-medium transition-all"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-red-600/10 hover:shadow-red-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <KeyRound className="w-4 h-4" />
            Sign In
          </button>
        </form>
      </motion.div>
    </div>
  );
};
