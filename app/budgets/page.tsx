"use client"
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import AuthWrapper from '@/components/AuthWrapper';
import BudgetTracker from '@/components/BudgetTracker';
import Navigation from '@/components/Navigation';
import Link from 'next/link';
import { User } from '@supabase/supabase-js';
import { Sun, Moon, LogOut, Percent, ArrowDownRight, ArrowUpRight, Plus } from 'lucide-react';

function BudgetsContent({ user, isDark, setIsDark }: { user: User, isDark: boolean, setIsDark: (val: boolean) => void }) {
  const [budgets, setBudgets] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async (user: User) => {
    setLoading(true);
    const { data: bData } = await supabase
      .from('budgets')
      .select('*')
      .eq('user_id', user.id);
    
    if (bData) setBudgets(bData);

    const { data: txData } = await supabase
      .from('transaction')
      .select('*')
      .eq('user_id', user.id);
    
    if (txData) setTransactions(txData);
    
    setLoading(false);
  };

  useEffect(() => {
    fetchData(user);
  }, [user]);

  const totalIncome = transactions.reduce((acc, t) => acc + (t.income || 0), 0);
  const totalOutcome = transactions.reduce((acc, t) => acc + (t.outcome || 0), 0);
  const savings = transactions.reduce((acc, t) => acc + (t.saving || 0), 0);

  return (
    <div className={`min-h-screen transition-all duration-700 relative overflow-hidden ${isDark ? 'bg-[#020617] text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <div className="absolute top-[-15%] left-[-15%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[160px] animate-float opacity-50" />
      <div className="absolute bottom-[-15%] right-[-15%] w-[50%] h-[50%] bg-cyan-600/10 rounded-full blur-[160px] animate-float opacity-50" style={{ animationDelay: '-3s' }} />

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
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-xl sm:text-3xl font-black mb-1 sm:mb-2 tracking-tighter uppercase flex items-center gap-2 sm:gap-3">
              Pelacakan Anggaran <Percent className="text-blue-500" size={20} />
            </h2>
            <p className="text-[8px] sm:text-sm font-bold opacity-50 uppercase tracking-widest">Kontrol Pengeluaran & Tabungan</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
           <div className={`p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] border transition-all ${isDark ? 'glass-dark border-green-900/20' : 'bg-green-50/50 border-green-100'}`}>
              <div className="flex justify-between items-start mb-2 sm:mb-4">
                <p className="text-[8px] sm:text-[10px] font-black text-green-500 uppercase tracking-[0.2em]">Pemasukan</p>
                <ArrowUpRight className="text-green-500 opacity-30" size={16} />
              </div>
              <p className="text-lg sm:text-2xl font-black text-green-600 tracking-tighter truncate">Rp {totalIncome.toLocaleString('id-ID')}</p>
           </div>
           <div className={`p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] border transition-all ${isDark ? 'glass-dark border-red-900/20' : 'bg-red-50/50 border-red-100'}`}>
              <div className="flex justify-between items-start mb-2 sm:mb-4">
                <p className="text-[8px] sm:text-[10px] font-black text-red-500 uppercase tracking-[0.2em]">Pengeluaran</p>
                <ArrowDownRight className="text-red-500 opacity-30" size={16} />
              </div>
              <p className="text-lg sm:text-2xl font-black text-red-600 tracking-tighter truncate">Rp {totalOutcome.toLocaleString('id-ID')}</p>
           </div>
           <div className={`p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] border transition-all col-span-2 sm:col-span-1 ${isDark ? 'glass-dark border-blue-900/20' : 'bg-blue-50/50 border-blue-100'}`}>
              <div className="flex justify-between items-start mb-2 sm:mb-4">
                <p className="text-[8px] sm:text-[10px] font-black text-blue-500 uppercase tracking-[0.2em]">Akumulasi Tabungan</p>
                <Percent className="text-blue-500 opacity-30" size={16} />
              </div>
              <p className="text-lg sm:text-2xl font-black text-blue-600 tracking-tighter truncate">Rp {savings.toLocaleString('id-ID')}</p>
           </div>
        </div>

        <section className={`p-5 sm:p-8 rounded-[2rem] sm:rounded-[3rem] border transition-all duration-500 shadow-xl relative overflow-hidden ${isDark ? 'glass-dark border-white/5' : 'glass border-white'}`}>
           <div className="flex items-center gap-2 sm:gap-3 mb-6 sm:mb-8 px-1">
             <div className="w-1 h-5 sm:w-1.5 h-6 bg-blue-600 rounded-full" />
             <h2 className={`text-sm sm:text-lg font-black ${isDark ? 'text-white' : 'text-slate-900'} uppercase tracking-tighter`}>Target Anggaran</h2>
           </div>
           {loading ? (
             <div className="p-20 text-center">
                <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 animate-pulse">Sinkronisasi Data Anggaran...</p>
             </div>
           ) : (
             <BudgetTracker transactions={transactions} isDark={isDark} user={user} />
           )}
        </section>
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="sm:hidden">
        <Navigation isDark={isDark} variant="bottom" />
      </div>
    </div>
  );
}

export default function BudgetsPage() {
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
        <BudgetsContent user={user} isDark={isDark} setIsDark={handleThemeChange} />
      )}
    </AuthWrapper>
  );
}
