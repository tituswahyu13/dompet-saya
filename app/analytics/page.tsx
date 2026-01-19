"use client"
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import AuthWrapper from '@/components/AuthWrapper';
import AIInsights from '@/components/AIInsights';
import AdvancedCharts from '@/components/AdvancedCharts';
import Insights from '@/components/Insights';
import Navigation from '@/components/Navigation';
import UpgradeModal from '@/components/UpgradeModal';
import { useSubscription } from '@/hooks/useSubscription';
import { User } from '@supabase/supabase-js';
import Link from 'next/link';
import { Sun, Moon, LogOut, BarChart3, TrendingUp as TrendIcon, Bot, Sparkles, Zap, Plus } from 'lucide-react';

function AnalyticsContent({ user, isDark, setIsDark }: { user: User, isDark: boolean, setIsDark: (val: boolean) => void }) {
  const { subscription } = useSubscription();
  const isPro = subscription?.is_pro;
  const [transactions, setTransactions] = useState<any[]>([]);
  const [wallets, setWallets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdvanced, setIsAdvanced] = useState(false);
  const [showUpgradeModalCharts, setShowUpgradeModalCharts] = useState(false);

  const fetchData = async (user: User) => {
    setLoading(true);
    const { data: txData } = await supabase
      .from('transaction')
      .select('*')
      .eq('user_id', user.id)
      .order('tanggal', { ascending: false });

    if (txData) setTransactions(txData);

    const { data: wData } = await supabase
      .from('wallet_balances')
      .select('*')
      .eq('user_id', user.id);
    
    if (wData) setWallets(wData);
    
    setLoading(false);
  };

  useEffect(() => {
    fetchData(user);
  }, [user]);

  return (
    <div className={`min-h-screen transition-all duration-700 relative overflow-hidden ${isDark ? 'bg-[#020617] text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <div className="absolute top-[-15%] left-[-15%] w-[50%] h-[50%] bg-emerald-600/10 rounded-full blur-[160px] animate-float opacity-50" />
      <div className="absolute bottom-[-15%] right-[-15%] w-[50%] h-[50%] bg-purple-600/10 rounded-full blur-[160px] animate-float opacity-50" style={{ animationDelay: '-3s' }} />

      <header className={`sticky top-0 z-50 border-b backdrop-blur-xl transition-all duration-500 ${isDark ? 'bg-slate-950/40 border-white/5 shadow-2xl shadow-black/20' : 'bg-white/60 border-slate-200/50 shadow-xl shadow-slate-200/20'}`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4 group cursor-pointer">
            <div className="w-11 h-11 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 overflow-hidden border border-white/20">
              <img src="/DompetSaya.svg" alt="Dompet Saya Mascot" className="w-full h-full object-contain p-1" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-tight">Kecerdasan Finansial</p>
              <h1 className={`text-sm font-black uppercase tracking-widest ${isDark ? 'text-white' : 'text-slate-900'}`}>{isDark ? 'Pro' : 'Dompet'} Saya</h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsDark(!isDark)}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isDark ? 'bg-slate-800 text-amber-400 border border-white/5' : 'bg-slate-100 text-slate-500 border border-slate-200'} hover:scale-105 active:scale-95`}
            >
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <Link 
              href="/transactions"
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isDark ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' : 'bg-rose-600 text-white shadow-lg shadow-rose-500/20'} hover:scale-105 active:scale-95`}
            >
              <Plus size={20} />
            </Link>
            <button 
              onClick={async () => {
                const { error } = await supabase.auth.signOut();
                if (error) alert("Gagal keluar: " + error.message);
              }}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isDark ? 'bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20' : 'bg-red-50 text-red-600 border border-red-100 hover:bg-red-100'} hover:scale-105 active:scale-95`}
              title="Keluar"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8 sm:space-y-12 pb-32">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
          <div>
            <h2 className="text-xl sm:text-3xl font-black mb-1 sm:mb-2 tracking-tighter uppercase flex items-center gap-2 sm:gap-3">
              Pusat Kecerdasan <BarChart3 className="text-rose-500" size={20} />
            </h2>
            <p className="text-[8px] sm:text-sm font-bold opacity-50 uppercase tracking-widest leading-relaxed">Analisis Data & Prediksi AI</p>
          </div>
          <div className={`p-1 rounded-xl sm:rounded-2xl border flex w-full sm:w-auto ${isDark ? 'bg-slate-900/50 border-white/5' : 'bg-slate-100/50 border-slate-200'}`}>
            <button 
              onClick={() => setIsAdvanced(false)}
              className={`flex-1 sm:px-6 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all ${!isAdvanced ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' : 'text-slate-500 hover:text-rose-400'}`}
            >
              Sederhana
            </button>
            <button 
              onClick={() => {
                if (isPro) setIsAdvanced(true);
                else setShowUpgradeModalCharts(true);
              }}
              className={`flex-1 sm:px-6 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${isAdvanced ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' : 'text-slate-500 hover:text-rose-400'}`}
            >
              Lanjutan {!isPro && <Zap size={10} className="sm:w-3.5 sm:h-3.5 text-amber-400 fill-amber-400" />}
            </button>
          </div>
        </div>

        <section className={`p-5 sm:p-8 rounded-[2rem] sm:rounded-[3rem] border transition-all duration-500 shadow-xl relative overflow-hidden group ${isDark ? 'glass-dark border-white/5' : 'glass border-white shadow-2xl shadow-rose-100/30'}`}>
           <div className="flex items-center gap-2 sm:gap-3 mb-6 sm:mb-8 px-1">
             <div className="w-1 h-5 sm:w-1.5 sm:h-6 bg-purple-500 rounded-full animate-pulse" />
             <h2 className={`text-sm sm:text-lg font-black ${isDark ? 'text-white' : 'text-slate-900'} uppercase tracking-tighter`}>Sorotan Analisis AI</h2>
           </div>
           {loading ? (
             <div className="p-20 text-center relative z-10">
                <div className="w-12 h-12 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin mx-auto mb-4" />
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 animate-pulse">Menjalankan Analisis Finansial Neural...</p>
             </div>
           ) : (
             <AIInsights transactions={transactions} isDark={isDark} />
           )}
        </section>

        {/* Visual Analytics Section */}
        <section className={`p-8 rounded-[3rem] border transition-all duration-500 shadow-xl relative overflow-hidden ${isDark ? 'glass-dark border-white/5' : 'glass border-white'}`}>
           <div className="flex justify-between items-center mb-10 px-1">
             <div className="flex items-center gap-3">
               <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
               <h2 className={`text-lg font-black ${isDark ? 'text-white' : 'text-slate-900'} uppercase tracking-tighter`}>Analitik Visual</h2>
             </div>
             
          <div className="flex gap-2">
            <button 
              onClick={() => {
                if (isPro) setIsAdvanced(false);
                else setShowUpgradeModalCharts(true);
              }}
              className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-[8px] sm:text-[10px] font-black uppercase tracking-widest transition-all ${!isAdvanced ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20' : isDark ? 'bg-white/5 text-slate-400' : 'bg-slate-100 text-slate-500'}`}
            >
              Wawasan
            </button>
            <button 
              onClick={() => {
                if (isPro) setIsAdvanced(true);
                else setShowUpgradeModalCharts(true);
              }}
              className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-[8px] sm:text-[10px] font-black uppercase tracking-widest transition-all ${isAdvanced ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20' : isDark ? 'bg-white/5 text-slate-400' : 'bg-slate-100 text-slate-500'}`}
            >
              <BarChart3 size={12} className="inline mr-1 sm:mr-1.5" /> Grafik
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-20 text-center">
             <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4" />
             <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 animate-pulse">Memproses Matriks Transaksi...</p>
          </div>
        ) : isAdvanced ? (
          <AdvancedCharts transactions={transactions} isDark={isDark} />
        ) : (
          <Insights transactions={transactions} isDark={isDark} wallets={wallets} />
        )}
        </section>
      </main>

      <UpgradeModal
        isOpen={showUpgradeModalCharts}
        onClose={() => setShowUpgradeModalCharts(false)}
        isDark={isDark}
        title="Akses Analitik Prediktif"
        message="Dapatkan akses penuh ke visualisasi data tingkat lanjut, laporan mendalam, dan mesin prediksi berbasis AI yang lebih akurat."
        feature="Deep IQ Analytics"
      />

      {/* Mobile Bottom Navigation */}
      <div className="sm:hidden">
        <Navigation isDark={isDark} variant="bottom" />
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      return saved === 'dark';
    }
    return false;
  });

  const handleThemeChange = (newIsDark: boolean) => {
    setIsDark(newIsDark);
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', newIsDark ? 'dark' : 'light');
    }
  };

  return (
    <AuthWrapper isDark={isDark}>
      {(user) => (
        <AnalyticsContent user={user} isDark={isDark} setIsDark={handleThemeChange} />
      )}
    </AuthWrapper>
  );
}
