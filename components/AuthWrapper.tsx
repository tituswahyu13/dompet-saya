'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import Auth from './Auth';
import { User } from '@supabase/supabase-js';

interface AuthWrapperProps {
  children: (user: User) => React.ReactNode;
  isDark: boolean;
}

export default function AuthWrapper({ children, isDark }: AuthWrapperProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-950">
        <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-4" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 animate-pulse">Syncing Protocols...</p>
      </div>
    );
  }

  if (!user) {
    return <Auth isDark={isDark} />;
  }

  return <>{children(user)}</>;
}
