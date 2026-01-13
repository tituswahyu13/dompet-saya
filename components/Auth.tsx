'use client';

import { useState } from 'react';
import { supabase } from '../lib/supabase';
import PWAInstallPrompt from './PWAInstallPrompt';

interface AuthProps {
  isDark: boolean;
}

export default function Auth({ isDark }: AuthProps) {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setMessage({ type: 'success', text: 'Registration successful! Please check your email for confirmation.' });
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'An error occurred' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      <PWAInstallPrompt isDark={isDark} />
      
      {/* Background Animated Blobs */}
      <div className="absolute top-0 left-0 w-full h-full -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/20 rounded-full blur-[120px] animate-pulse delay-1000" />
      </div>

      <div className={`w-full max-w-md p-10 rounded-[3rem] border transition-all duration-500 ${
        isDark ? 'glass-dark border-white/5 shadow-2xl shadow-black/40' : 'glass border-white shadow-xl shadow-slate-200/50'
      }`}>
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-500/20 overflow-hidden border-4 border-white/10">
            <img src="/icon-192.png" alt="Dompet Saya Pro Logo" className="w-14 h-14 object-contain" />
          </div>
          <h2 className={`text-2xl font-black uppercase tracking-[0.2em] ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {isSignUp ? 'New Account' : 'Gateway Access'}
          </h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Dompet Saya Pro - Auth Protocol</p>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-2xl text-xs font-bold uppercase tracking-wider text-center border ${
            message.type === 'error' 
              ? 'bg-red-500/10 text-red-500 border-red-500/20' 
              : 'bg-green-500/10 text-green-500 border-green-500/20'
          }`}>
            {message.type === 'error' ? '⚠️ ' : '✅ '} {message.text}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-6">
          <div className="space-y-2">
            <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Identity Marker (Email)</label>
            <input 
              type="email" 
              required
              placeholder="user@nexus.io"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full p-4 rounded-2xl border outline-none transition-all font-bold text-sm ${
                isDark ? 'bg-slate-900/50 border-white/5 text-white focus:border-blue-500/50' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-500/50'
              }`}
            />
          </div>

          <div className="space-y-2">
            <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Security Key (Password)</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full p-4 pr-12 rounded-2xl border outline-none transition-all font-bold text-sm ${
                  isDark ? 'bg-slate-900/50 border-white/5 text-white focus:border-blue-500/50' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-500/50'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-xl transition-all ${
                  isDark ? 'text-slate-500 hover:text-white hover:bg-white/5' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-500/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                Processing...
              </span>
            ) : isSignUp ? 'Initiate Register' : 'Execute Login'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button 
            onClick={() => { setIsSignUp(!isSignUp); setMessage(null); }}
            className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-blue-600'} transition-all`}
          >
            {isSignUp ? 'Already have access? Back to Gateway' : "Don't have access? Create Identity"}
          </button>
        </div>
      </div>
    </div>
  );
}
