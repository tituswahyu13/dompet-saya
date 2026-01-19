"use client"
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Insights from '@/components/Insights';
import BudgetTracker from '@/components/BudgetTracker';
import AuthWrapper from '@/components/AuthWrapper';
import WalletManager from '@/components/WalletManager';
import GoalManager from '@/components/GoalManager';
import AdvancedCharts from '@/components/AdvancedCharts';
import NotificationCenter from '@/components/NotificationCenter';
import AIInsights from '@/components/AIInsights';
import Navigation from '@/components/Navigation';
import TrialBanner from '@/components/TrialBanner';
import { useSubscription } from '@/hooks/useSubscription';
import UpgradeModal from '@/components/UpgradeModal';
import AppTour from '@/components/AppTour';
import { User } from '@supabase/supabase-js';
import Link from 'next/link';
import { Wallet, Target, LogOut, Sun, Moon, CreditCard, ArrowUpRight, ArrowDownRight, PiggyBank, Percent, LayoutDashboard, ChevronRight, BarChart3, TrendingUp as TrendIcon, Bot, Building2, Smartphone, Coins, Plus } from 'lucide-react';
import MinimalistIcon from '@/components/MinimalistIcon';

function DashboardContent({ user, isDark, setIsDark }: { user: User, isDark: boolean, setIsDark: (val: boolean) => void }) {
  const { subscription } = useSubscription();
  const isPro = subscription?.is_pro;
  const [transactions, setTransactions] = useState<any[]>([]);
  const [stats, setStats] = useState({ income: 0, outcome: 0, saving: 0, rate: 0, balance: 0 });
  const [loading, setLoading] = useState(true);
  const [showWalletManager, setShowWalletManager] = useState(false);
  const [showGoalManager, setShowGoalManager] = useState(false);
  const [selectedWalletFilter, setSelectedWalletFilter] = useState('All');
  const [wallets, setWallets] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [budgets, setBudgets] = useState<any[]>([]);
  const [recurringTemplates, setRecurringTemplates] = useState<any[]>([]);
  const [showAdvancedCharts, setShowAdvancedCharts] = useState(false);
  const [showUpgradeModalCharts, setShowUpgradeModalCharts] = useState(false);
  const [balanceMode, setBalanceMode] = useState<'liquid' | 'all'>('all');

  const fetchData = async (user: User) => {
    setLoading(true);
    
    // Fetch transactions
    const { data: txData, error: txError } = await supabase
      .from('transaction')
      .select('*')
      .eq('user_id', user.id)
      .order('tanggal', { ascending: false });

    if (txData) {
      setTransactions(txData);
    }

    // Fetch wallets for filter
    const { data: wData } = await supabase
      .from('wallet_balances')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true);
    
    if (wData) {
      setWallets(wData);
    }

    // Fetch Goals
    const { data: gData } = await supabase
      .from('financial_goals')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (gData) {
      setGoals(gData);
    }

    // Fetch Budgets
    const { data: bData } = await supabase
      .from('budgets')
      .select('*')
      .eq('user_id', user.id);
    
    if (bData) {
      setBudgets(bData);
    }

    // Fetch Recurring Templates
    const { data: rData } = await supabase
      .from('recurring_templates')
      .select('*')
      .eq('user_id', user.id);
    
    if (rData) {
      setRecurringTemplates(rData);
    }

    setLoading(false);
  };

  const getFilteredTransactions = () => {
    const filtered = transactions.filter(t => {
      const matchesWallet = selectedWalletFilter === 'All' || t.wallet_id === selectedWalletFilter;
      return matchesWallet;
    });

    return filtered;
  };

  const filteredTransactions = getFilteredTransactions();

  // Re-calculate stats whenever filteredTransactions changes
  useEffect(() => {
    const data = filteredTransactions;
    
    // Identify Investment Wallets
    const investmentWalletIds = new Set(wallets.filter(w => w.type === 'investment').map(w => w.id));

    // Standard income/outcome should exclude internal transfers
    const totalInc = data.filter(t => !t.is_transfer).reduce((acc, curr) => acc + (curr.income || 0), 0);
    const totalOut = data.filter(t => !t.is_transfer).reduce((acc, curr) => acc + (curr.outcome || 0), 0);
    
    // Detailed Saving Calculation
    let totalSav = 0;
    data.forEach(t => {
      if (!t.is_transfer) {
        totalSav += (t.saving || 0);
        if (investmentWalletIds.has(t.wallet_id) && t.income > 0 && t.kategori !== 'Saldo Awal') {
          totalSav += t.income;
        }
      } else {
        if (investmentWalletIds.has(t.wallet_id) && t.income > 0 && !investmentWalletIds.has(t.transfer_from_wallet_id)) {
          totalSav += t.income;
        }
        if (investmentWalletIds.has(t.wallet_id) && t.outcome > 0 && !investmentWalletIds.has(t.transfer_to_wallet_id)) {
          totalSav -= t.outcome;
        }
      }
    });
    
    const initialBalance = data.filter(t => t.kategori === 'Saldo Awal' && !t.is_transfer).reduce((acc, curr) => acc + (curr.income || 0), 0);
    const earnedIncome = totalInc - initialBalance;

    // Calculate Total Balance from wallets (respecting filters)
    let displayBalance = 0;
    if (selectedWalletFilter !== 'All') {
      const activeWallet = wallets.find(w => w.id === selectedWalletFilter);
      displayBalance = activeWallet?.current_balance || 0;
    } else {
      displayBalance = wallets
        .filter(w => balanceMode === 'all' || ['cash', 'bank', 'ewallet'].includes(w.type))
        .reduce((acc, w) => acc + (w.current_balance || 0), 0);
    }

    setStats({
      income: earnedIncome,
      outcome: totalOut,
      saving: totalSav,
      balance: displayBalance,
      rate: earnedIncome > 0 ? (totalSav / earnedIncome) * 100 : 0
    });
  }, [transactions, wallets, selectedWalletFilter, balanceMode]);

  const groupedWallets = wallets.reduce((acc: any, w) => {
    const type = w.type || 'other';
    if (!acc[type]) acc[type] = [];
    acc[type].push(w);
    return acc;
  }, {});

  const typeLabels: any = {
    cash: 'Tunai',
    bank: 'Bank',
    ewallet: 'E-Wallet',
    investment: 'Investasi',
    other: 'Lainnya'
  };

  useEffect(() => {
    fetchData(user);
  }, [user]);

  return (
    <div className={`min-h-screen transition-all duration-700 relative overflow-hidden ${isDark ? 'bg-[#020617] text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <div className="absolute top-[-15%] left-[-15%] w-[50%] h-[50%] bg-rose-600/10 rounded-full blur-[160px] animate-float opacity-50" />
      <div className="absolute bottom-[-15%] right-[-15%] w-[50%] h-[50%] bg-pink-600/10 rounded-full blur-[160px] animate-float opacity-50" style={{ animationDelay: '-3s' }} />

      {/* Mobile Bottom Navigation */}
      <div className="sm:hidden">
        <Navigation isDark={isDark} variant="bottom" />
      </div>

      <header className={`sticky top-0 z-50 border-b backdrop-blur-xl transition-all duration-500 ${isDark ? 'bg-slate-950/40 border-white/5 shadow-2xl shadow-black/20' : 'bg-white/60 border-slate-200/50 shadow-xl shadow-slate-200/20'}`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2 group cursor-pointer flex-shrink-0">
            <div className="w-9 h-9 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 overflow-hidden border border-white/20">
              <img src="/DompetSaya.svg" alt="Dompet Saya Mascot" className="w-full h-full object-contain p-1" />
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] leading-tight hidden sm:block">Kecerdasan Finansial</p>
              <h1 className={`text-xs sm:text-sm font-black uppercase tracking-widest ${isDark ? 'text-white' : 'text-slate-900'}`}>{isDark ? 'Pro' : 'Dompet'} <span className="hidden xs:inline">Saya</span></h1>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-6 justify-end flex-1 min-w-0">
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
          </div>
            <NotificationCenter 
              transactions={filteredTransactions}
              budgets={budgets}
              goals={goals}
              recurringTemplates={recurringTemplates}
              wallets={wallets}
              isDark={isDark}
            />
            <button 
              onClick={async () => {
                const { error } = await supabase.auth.signOut();
                if (error) alert("Logout failed: " + error.message);
              }}
              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center transition-all ${isDark ? 'bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20' : 'bg-red-50 text-red-600 border border-red-100 hover:bg-red-100'} hover:scale-105 active:scale-95`}
              title="Keluar"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8 sm:space-y-12 pb-32">
        <TrialBanner isDark={isDark} />

        {/* Financial Highlights */}
        <section className="space-y-6">
          <div className="flex justify-between items-end px-1">
             <div>
               <h2 className="text-2xl font-black tracking-tighter uppercase">Dasbor Beranda</h2>
               <p className="text-[10px] font-bold opacity-40 uppercase tracking-[0.2em]">Ringkasan Status Keuangan</p>
             </div>
          </div>
          <div id="tour-balance" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-5">
            <div className={`p-5 sm:p-7 rounded-[2rem] border transition-all hover:scale-[1.02] sm:col-span-2 lg:col-span-1 shadow-sm relative overflow-hidden group ${isDark ? 'glass-dark border-white/5' : 'glass border-slate-200'}`}>
              <div className="flex justify-between items-center mb-3 sm:mb-4">
                <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Total Saldo</p>
                <button onClick={() => setBalanceMode(balanceMode === 'all' ? 'liquid' : 'all')} className="text-[8px] font-black uppercase text-rose-500 border border-rose-500/20 px-2 py-0.5 rounded-lg active:scale-90 transition-transform">
                  {balanceMode === 'all' ? 'Semua' : 'Likuid'}
                </button>
              </div>
              <div className="flex items-baseline gap-1 sm:gap-1.5 overflow-hidden">
                <span className="text-[10px] sm:text-xs font-black text-rose-500">IDR</span>
                <p className={`text-2xl sm:text-3xl font-black ${isDark ? 'text-white' : 'text-slate-900'} tracking-tighter truncate`}>{stats.balance.toLocaleString('id-ID')}</p>
              </div>
            </div>
            <div className={`p-5 sm:p-7 rounded-[2rem] border transition-all hover:scale-[1.02] shadow-sm relative overflow-hidden group ${isDark ? 'glass-dark border-white/5' : 'glass border-slate-200'}`}>
              <p className="text-[9px] font-black text-green-500 uppercase tracking-[0.2em] mb-3">Pemasukan</p>
              <div className="flex items-baseline gap-1 overflow-hidden">
                <span className="text-[10px] sm:text-xs font-black text-green-600">IDR</span>
                <p className="text-2xl sm:text-3xl font-black text-green-600 tracking-tighter truncate">{stats.income.toLocaleString('id-ID')}</p>
              </div>
            </div>
            <div className={`p-5 sm:p-7 rounded-[2rem] border transition-all hover:scale-[1.02] shadow-sm relative overflow-hidden group ${isDark ? 'glass-dark border-white/5' : 'glass border-slate-200'}`}>
              <p className="text-[9px] font-black text-red-500 uppercase tracking-[0.2em] mb-3">Pengeluaran</p>
              <div className="flex items-baseline gap-1 overflow-hidden">
                <span className="text-[10px] sm:text-xs font-black text-red-600">IDR</span>
                <p className="text-2xl sm:text-3xl font-black text-red-600 tracking-tighter truncate">{stats.outcome.toLocaleString('id-ID')}</p>
              </div>
            </div>
            <div className={`p-5 sm:p-7 rounded-[2rem] border transition-all hover:scale-[1.02] shadow-sm relative overflow-hidden group ${isDark ? 'glass-dark border-blue-900/20' : 'bg-blue-50/50 border-blue-100'}`}>
              <p className="text-[9px] font-black text-blue-500 uppercase tracking-[0.2em] mb-3">Tabungan</p>
              <div className="flex items-baseline gap-1 overflow-hidden">
                <span className="text-[10px] sm:text-xs font-black text-blue-500">IDR</span>
                <p className={`text-2xl sm:text-3xl font-black tracking-tighter truncate ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>{stats.saving.toLocaleString('id-ID')}</p>
              </div>
            </div>
            <div className={`p-5 sm:p-7 rounded-[2rem] border transition-all hover:scale-[1.02] shadow-sm relative overflow-hidden group ${isDark ? 'glass-dark border-cyan-900/20' : 'bg-cyan-50/50 border-cyan-100'}`}>
              <p className="text-[9px] font-black text-cyan-500 uppercase tracking-[0.2em] mb-3">Tingkat Tabungan</p>
              <p className="text-2xl sm:text-3xl font-black text-cyan-600 tracking-tighter">{stats.rate.toFixed(1)}<span className="text-sm ml-0.5">%</span></p>
            </div>
          </div>
        </section>

        {/* Quick Access Grid */}
        <section className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
           <Link href="/wallets" className={`p-4 sm:p-6 rounded-[2rem] sm:rounded-[2.5rem] border transition-all hover:scale-[1.02] group ${isDark ? 'glass-dark border-white/5 hover:bg-white/5' : 'bg-white border-slate-100 shadow-sm hover:shadow-md'}`}>
              <div className="flex justify-between items-center mb-4 sm:mb-6">
                 <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                    <Wallet size={16} className="sm:w-5 sm:h-5" />
                 </div>
                 <ChevronRight size={14} className="opacity-30 group-hover:translate-x-1 transition-transform" />
              </div>
               <h3 className="text-[10px] sm:text-xs font-black uppercase tracking-widest mb-0.5 sm:mb-1">Dompet</h3>
               <p className="text-[8px] sm:text-[10px] font-bold opacity-50 uppercase tracking-widest truncate">{wallets.length} Akun</p>
           </Link>

           <Link href="/analytics" className={`p-4 sm:p-6 rounded-[2rem] sm:rounded-[2.5rem] border transition-all hover:scale-[1.02] group ${isDark ? 'glass-dark border-white/5 hover:bg-white/5' : 'bg-white border-slate-100 shadow-sm hover:shadow-md'}`}>
              <div className="flex justify-between items-center mb-4 sm:mb-6">
                 <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500">
                    <Bot size={16} className="sm:w-5 sm:h-5" />
                 </div>
                 <ChevronRight size={14} className="opacity-30 group-hover:translate-x-1 transition-transform" />
              </div>
               <h3 className="text-[10px] sm:text-xs font-black uppercase tracking-widest mb-0.5 sm:mb-1">Kecerdasan AI</h3>
               <p className="text-[8px] sm:text-[10px] font-bold opacity-50 uppercase tracking-widest truncate">Analisis Prediktif</p>
           </Link>

           <Link href="/budgets" className={`p-4 sm:p-6 rounded-[2rem] sm:rounded-[2.5rem] border transition-all hover:scale-[1.02] group ${isDark ? 'glass-dark border-white/5 hover:bg-white/5' : 'bg-white border-slate-100 shadow-sm hover:shadow-md'}`}>
              <div className="flex justify-between items-center mb-4 sm:mb-6">
                 <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500">
                    <Percent size={16} className="sm:w-5 sm:h-5" />
                 </div>
                 <ChevronRight size={14} className="opacity-30 group-hover:translate-x-1 transition-transform" />
              </div>
               <h3 className="text-[10px] sm:text-xs font-black uppercase tracking-widest mb-0.5 sm:mb-1">Anggaran</h3>
               <p className="text-[8px] sm:text-[10px] font-bold opacity-50 uppercase tracking-widest truncate">{budgets.length} Target</p>
           </Link>

           <Link href="/goals" className={`p-4 sm:p-6 rounded-[2rem] sm:rounded-[2.5rem] border transition-all hover:scale-[1.02] group ${isDark ? 'glass-dark border-white/5 hover:bg-white/5' : 'bg-white border-slate-100 shadow-sm hover:shadow-md'}`}>
              <div className="flex justify-between items-center mb-4 sm:mb-6">
                 <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                    <Target size={16} className="sm:w-5 sm:h-5" />
                 </div>
                 <ChevronRight size={14} className="opacity-30 group-hover:translate-x-1 transition-transform" />
              </div>
               <h3 className="text-[10px] sm:text-xs font-black uppercase tracking-widest mb-0.5 sm:mb-1">Target</h3>
               <p className="text-[8px] sm:text-[10px] font-bold opacity-50 uppercase tracking-widest truncate">{goals.length} Pencapaian</p>
           </Link>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div id="tour-ledger" className="lg:col-span-12 space-y-6">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-6 bg-rose-500 rounded-full" />
                <h2 className={`text-lg font-black ${isDark ? 'text-white' : 'text-slate-900'} uppercase tracking-tighter`}>Transaksi Terakhir</h2>
              </div>
              <Link id="tour-goto-transactions" href="/transactions" className="text-[10px] font-black text-rose-500 uppercase tracking-widest hover:text-rose-400 transition-all flex items-center gap-1.5 group">
                Lihat Semua <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            <div className={`rounded-[2.5rem] border overflow-hidden backdrop-blur-sm transition-all duration-500 ${isDark ? 'glass-dark border-white/5 shadow-2xl shadow-black/40' : 'glass border-white shadow-xl shadow-slate-200/50'}`}>
              {loading ? (
                <div className="p-20 text-center">
                  <div className="w-12 h-12 border-4 border-rose-500/20 border-t-rose-500 rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 animate-pulse">Sinkronisasi Data...</p>
                </div>
              ) : transactions.length === 0 ? (
                <div className="p-12 text-center opacity-50 italic text-sm">Belum ada transaksi tercatat.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className={`${isDark ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'} border-b`}>
                        <th className="p-4 sm:p-6 text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Garis Waktu</th>
                        <th className="p-4 sm:p-6 text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Aktivitas</th>
                        <th className="p-4 sm:p-6 text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Nilai</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${isDark ? 'divide-white/5' : 'divide-slate-100'}`}>
                      {transactions.slice(0, 5).map((t) => (
                        <tr key={t.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="p-4 sm:p-6">
                            <div className="text-sm font-black tracking-tighter">{new Date(t.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}</div>
                          </td>
                          <td className="p-4 sm:p-6">
                            <div className="text-xs sm:text-sm font-bold opacity-80 line-clamp-1">{t.keterangan}</div>
                            <div className="text-[8px] sm:text-[9px] font-black opacity-50 uppercase tracking-widest">{t.kategori}</div>
                          </td>
                          <td className={`p-4 sm:p-6 text-right font-black tracking-tighter text-xs sm:text-base ${t.income > 0 ? 'text-green-500' : t.saving > 0 ? 'text-blue-500' : 'text-red-500'}`}>
                            {t.income > 0 && '+'}
                            {(t.income || t.outcome || t.saving).toLocaleString('id-ID')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {showWalletManager && (
        <WalletManager 
          user={user} 
          isDark={isDark} 
          onClose={() => { setShowWalletManager(false); fetchData(user); }} 
        />
      )}
      {showGoalManager && (
        <GoalManager 
          user={user} 
          isDark={isDark} 
          onClose={() => { setShowGoalManager(false); fetchData(user); }} 
        />
      )}
      <UpgradeModal
        isOpen={showUpgradeModalCharts}
        onClose={() => setShowUpgradeModalCharts(false)}
        isDark={isDark}
        title="Advanced Financial Charts"
        message="Akses visualisasi data yang mendalam dengan grafik tren 6 bulan dan analisis kategori yang lebih detail. Upgrade ke Pro untuk fitur ini!"
        feature="Advanced Analytics"
      />
      <AppTour isDark={isDark} />
    </div>
  );
}

export default function Dashboard() {
  const [isDark, setIsDark] = useState(() => {
    // Initialize from localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      return saved === 'dark';
    }
    return false;
  });

  const handleThemeChange = (newIsDark: boolean) => {
    setIsDark(newIsDark);
    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', newIsDark ? 'dark' : 'light');
    }
  };

  return (
    <AuthWrapper isDark={isDark}>
      {(user) => (
        <DashboardContent user={user} isDark={isDark} setIsDark={handleThemeChange} />
      )}
    </AuthWrapper>
  );
}