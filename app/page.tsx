"use client"
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Insights from '@/components/Insights';
import BudgetTracker from '@/components/BudgetTracker';
import AuthWrapper from '@/components/AuthWrapper';
import WalletManager from '@/components/WalletManager';
import GoalManager from '@/components/GoalManager';
import Navigation from '@/components/Navigation';
import { User } from '@supabase/supabase-js';
import Link from 'next/link';

function DashboardContent({ user, isDark, setIsDark }: { user: User, isDark: boolean, setIsDark: (val: boolean) => void }) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [stats, setStats] = useState({ income: 0, outcome: 0, saving: 0, rate: 0, balance: 0 });
  const [loading, setLoading] = useState(true);
  const [showWalletManager, setShowWalletManager] = useState(false);
  const [showGoalManager, setShowGoalManager] = useState(false);
  const [selectedWalletFilter, setSelectedWalletFilter] = useState('All');
  const [wallets, setWallets] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);

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

    const actualInc = data.reduce((acc, curr) => acc + (curr.income || 0), 0);
    const actualOut = data.reduce((acc, curr) => acc + (curr.outcome || 0), 0);
    const actualSav = data.reduce((acc, curr) => acc + (curr.saving || 0), 0);

    setStats({
      income: earnedIncome,
      outcome: totalOut,
      saving: totalSav,
      balance: actualInc - actualOut - actualSav,
      rate: earnedIncome > 0 ? (totalSav / earnedIncome) * 100 : 0
    });
  }, [transactions, wallets, selectedWalletFilter]);

  const groupedWallets = wallets.reduce((acc: any, w) => {
    const type = w.type || 'other';
    if (!acc[type]) acc[type] = [];
    acc[type].push(w);
    return acc;
  }, {});

  const typeLabels: any = {
    cash: '💵 Cash',
    bank: '🏦 Bank',
    ewallet: '📱 E-Wallet',
    investment: '📈 Investment',
    other: '💰 Other'
  };

  useEffect(() => {
    fetchData(user);
  }, [user]);

  return (
    <div className={`min-h-screen transition-all duration-700 relative overflow-hidden ${isDark ? 'bg-[#020617] text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <div className="absolute top-[-15%] left-[-15%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[160px] animate-float opacity-50" />
      <div className="absolute bottom-[-15%] right-[-15%] w-[50%] h-[50%] bg-indigo-600/10 rounded-full blur-[160px] animate-float opacity-50" style={{ animationDelay: '-3s' }} />
      <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-purple-600/5 rounded-full blur-[120px] animate-pulse-slow" />

      <header className={`sticky top-0 z-50 border-b backdrop-blur-xl transition-all duration-500 ${isDark ? 'bg-slate-950/40 border-white/5 shadow-2xl shadow-black/20' : 'bg-white/60 border-slate-200/50 shadow-xl shadow-slate-200/20'}`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4 group cursor-pointer">
            <div className="w-11 h-11 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform duration-300">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-tight">Financial Intelligence</p>
              <h1 className={`text-sm font-black uppercase tracking-widest ${isDark ? 'text-white' : 'text-slate-900'}`}>Dompet Saya</h1>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <Navigation isDark={isDark} />
            <div className="h-8 w-px bg-slate-400/20 hidden md:block" />
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsDark(!isDark)}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isDark ? 'bg-slate-800 text-amber-400 border border-white/5' : 'bg-slate-100 text-slate-500 border border-slate-200'} hover:scale-105 active:scale-95`}
              >
                {isDark ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                  </svg>
                )}
              </button>
              <button 
                onClick={() => setShowGoalManager(true)}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isDark ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20' : 'bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-100'} hover:scale-105 active:scale-95`}
                title="Financial Goals"
              >
                <span className="text-xl">🎯</span>
              </button>
              <button 
                onClick={() => setShowWalletManager(true)}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isDark ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20' : 'bg-indigo-50 text-indigo-600 border border-indigo-100 hover:bg-indigo-100'} hover:scale-105 active:scale-95`}
                title="Manage Wallets"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </button>
              <button 
                onClick={async () => {
                  const { error } = await supabase.auth.signOut();
                  if (error) alert("Logout failed: " + error.message);
                }}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isDark ? 'bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20' : 'bg-red-50 text-red-600 border border-red-100 hover:bg-red-100'} hover:scale-105 active:scale-95`}
                title="Logout Access"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12 relative z-10 space-y-12">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-5">
          <div className={`p-7 rounded-[2.5rem] border transition-all hover:scale-[1.02] col-span-2 md:col-span-2 lg:col-span-1 shadow-sm relative overflow-hidden group ${isDark ? 'glass-dark border-white/5' : 'glass border-slate-200'}`}>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Total Saldo</p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xs font-black text-blue-500">IDR</span>
              <p className={`text-3xl font-black ${isDark ? 'text-white' : 'text-slate-900'} tracking-tighter`}>{stats.balance.toLocaleString('id-ID')}</p>
            </div>
          </div>
          <div className={`p-7 rounded-[2.5rem] border transition-all hover:scale-[1.02] shadow-sm relative overflow-hidden group ${isDark ? 'glass-dark border-white/5' : 'glass border-slate-200'}`}>
            <p className="text-[10px] font-black text-green-500 uppercase tracking-[0.2em] mb-4">Pemasukan</p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xs font-black text-green-600">IDR</span>
              <p className="text-3xl font-black text-green-600 tracking-tighter">{stats.income.toLocaleString('id-ID')}</p>
            </div>
          </div>
          <div className={`p-7 rounded-[2.5rem] border transition-all hover:scale-[1.02] shadow-sm relative overflow-hidden group ${isDark ? 'glass-dark border-white/5' : 'glass border-slate-200'}`}>
            <p className="text-[10px] font-black text-red-500 uppercase tracking-[0.2em] mb-4">Pengeluaran</p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xs font-black text-red-600">IDR</span>
              <p className="text-3xl font-black text-red-600 tracking-tighter">{stats.outcome.toLocaleString('id-ID')}</p>
            </div>
          </div>
          <div className={`p-7 rounded-[2.5rem] border transition-all hover:scale-[1.02] shadow-sm relative overflow-hidden group ${isDark ? 'glass-dark border-blue-900/20' : 'bg-blue-50/50 border-blue-100'}`}>
            <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] mb-4">Tabungan</p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xs font-black text-blue-500">IDR</span>
              <p className={`text-3xl font-black tracking-tighter ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>{stats.saving.toLocaleString('id-ID')}</p>
            </div>
          </div>
          <div className={`p-7 rounded-[2.5rem] border transition-all hover:scale-[1.02] md:col-span-1 shadow-sm relative overflow-hidden group ${isDark ? 'glass-dark border-indigo-900/20' : 'bg-indigo-50/50 border-indigo-100'}`}>
            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mb-4">Saving Rate</p>
            <p className="text-3xl font-black text-indigo-600 tracking-tighter">{stats.rate.toFixed(1)}<span className="text-sm ml-0.5">%</span></p>
          </div>
        </div>

        <section className={`p-8 rounded-[2.5rem] border transition-all duration-500 shadow-xl relative overflow-hidden ${isDark ? 'glass-dark border-white/5' : 'glass border-white'}`}>
          <div className="flex items-center gap-3 mb-8 px-1">
            <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
            <h2 className={`text-lg font-black ${isDark ? 'text-white' : 'text-slate-900'} uppercase tracking-tighter`}>Arsitektur Wallet</h2>
          </div>
          <div className="space-y-8">
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setSelectedWalletFilter('All')} className={`px-7 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${selectedWalletFilter === 'All' ? 'bg-blue-600 text-white border-blue-600 shadow-xl shadow-blue-500/20 scale-105' : isDark ? 'bg-slate-900/50 text-slate-400 border-white/5 hover:border-white/10' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}>🌐 Semua Dompet</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {Object.keys(groupedWallets).sort().map(type => (
                <div key={type} className="space-y-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] px-1 border-l-2 border-indigo-500/30 pl-3">{typeLabels[type] || type.toUpperCase()}</p>
                  <div className="flex flex-wrap gap-3">
                    {groupedWallets[type].map((w: any) => (
                      <button key={w.id} onClick={() => setSelectedWalletFilter(w.id)} className={`px-5 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border flex items-center gap-3 group relative overflow-hidden flex-1 min-w-[140px] ${selectedWalletFilter === w.id ? 'bg-slate-900 text-white border-transparent shadow-2xl scale-105' : isDark ? 'bg-slate-900/60 text-slate-500 border-white/5 hover:border-white/10 hover:bg-slate-900/80' : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300 hover:bg-slate-50' }`}>
                        <div className="absolute left-0 top-0 bottom-0 w-1 transition-all" style={{ backgroundColor: w.color }} />
                        <span className="text-xl group-hover:scale-110 transition-transform">{w.icon}</span>
                        <div className="text-left">
                          <p className={`truncate max-w-[100px] ${selectedWalletFilter === w.id ? 'text-white' : isDark ? 'text-slate-200' : 'text-slate-800'}`}>{w.name}</p>
                          <p className="text-[9px] opacity-60 font-black tracking-tight">Rp {w.current_balance?.toLocaleString('id-ID')}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Goals Section */}
        <section className={`p-8 rounded-[2.5rem] border transition-all duration-500 shadow-xl relative overflow-hidden ${isDark ? 'glass-dark border-white/5' : 'glass border-white'}`}>
          <div className="flex justify-between items-center mb-8 px-1">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-6 bg-blue-500 rounded-full" />
              <h2 className={`text-lg font-black ${isDark ? 'text-white' : 'text-slate-900'} uppercase tracking-tighter`}>Financial Goals</h2>
            </div>
            <button onClick={() => setShowGoalManager(true)} className="text-xs font-black text-blue-500 uppercase tracking-widest hover:text-blue-400 transition-colors">Kelola Target →</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {goals.length === 0 ? (
              <div className="col-span-full py-12 text-center opacity-40 italic text-sm">Belum ada target keuangan yang diatur.</div>
            ) : (
              goals.slice(0, 4).map((g) => {
                const wallet = wallets.find(w => w.id === g.wallet_id);
                const current = g.wallet_id ? (wallet?.current_balance || 0) : g.current_amount;
                const progress = Math.min((current / g.target_amount) * 100, 100);
                
                return (
                  <div key={g.id} className={`p-6 rounded-3xl border transition-all hover:scale-[1.02] ${isDark ? 'bg-slate-900/40 border-white/5' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="flex justify-between items-start mb-4">
                      <div className="text-2xl">{g.icon}</div>
                      <div className="text-right">
                        <p className="text-[10px] font-black text-blue-500">{progress.toFixed(0)}%</p>
                      </div>
                    </div>
                    <h3 className={`text-sm font-black mb-1 truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{g.name}</h3>
                    <div className="flex justify-between items-baseline mb-3">
                      <p className="text-[10px] font-bold text-slate-500">Rp {current.toLocaleString('id-ID')}</p>
                      <p className="text-[10px] font-bold text-slate-400">/ {g.target_amount.toLocaleString('id-ID')}</p>
                    </div>
                    <div className={`h-1.5 w-full rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
                      <div className="h-full transition-all duration-1000" style={{ width: `${progress}%`, backgroundColor: g.color }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        <div className="space-y-16">
          <section>
            <div className="flex items-center gap-3 mb-8 px-1">
              <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
              <h2 className={`text-lg font-black ${isDark ? 'text-white' : 'text-slate-900'} uppercase tracking-tighter`}>Data Intelligence</h2>
            </div>
            {loading ? (
              <div className="p-20 text-center">
                <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4" />
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 animate-pulse">Analyzing Financial Patterns...</p>
              </div>
            ) : (
              <Insights transactions={filteredTransactions} isDark={isDark} wallets={wallets} />
            )}
          </section>
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-4">
              <section>
                <div className="flex items-center gap-2 mb-6 px-1">
                  <div className="w-1.5 h-6 bg-indigo-600 rounded-full" />
                  <h2 className={`text-lg font-black ${isDark ? 'text-white' : 'text-slate-900'} uppercase tracking-tighter`}>Target Anggaran</h2>
                </div>
                <BudgetTracker transactions={filteredTransactions} isDark={isDark} user={user} />
              </section>
            </div>
            <div className="lg:col-span-8 space-y-8">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-6 bg-slate-400 rounded-full" />
                  <h2 className={`text-lg font-black ${isDark ? 'text-white' : 'text-slate-900'} uppercase tracking-tighter`}>Ledger Ringkasan</h2>
                </div>
                <Link href="/transactions" className="text-xs font-black text-blue-500 uppercase tracking-widest hover:text-blue-400 transition-colors">Lihat Semua →</Link>
              </div>
              <div className={`rounded-[2.5rem] border overflow-hidden backdrop-blur-sm transition-all duration-500 ${isDark ? 'glass-dark border-white/5 shadow-2xl shadow-black/40' : 'glass border-white shadow-xl shadow-slate-200/50'}`}>
                {loading ? (
                  <div className="p-20 text-center">
                    <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 animate-pulse">Syncing Cloud Ledger...</p>
                  </div>
                ) : transactions.length === 0 ? (
                  <div className="p-12 text-center opacity-50 italic text-sm">Belum ada transaksi tercatat.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className={`${isDark ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'} border-b`}>
                          <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Timeline</th>
                          <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Activity</th>
                          <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Value</th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${isDark ? 'divide-white/5' : 'divide-slate-100'}`}>
                        {transactions.slice(0, 5).map((t) => (
                          <tr key={t.id} className="hover:bg-white/[0.02] transition-colors">
                            <td className="p-6">
                              <div className="text-md font-black tracking-tighter">{new Date(t.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}</div>
                            </td>
                            <td className="p-6">
                              <div className="text-sm font-bold opacity-80">{t.keterangan}</div>
                              <div className="text-[9px] font-black opacity-50 uppercase tracking-widest">{t.kategori}</div>
                            </td>
                            <td className={`p-6 text-right font-black tracking-tighter ${t.income > 0 ? 'text-green-500' : t.saving > 0 ? 'text-blue-500' : 'text-red-500'}`}>{(t.income || t.outcome || t.saving).toLocaleString('id-ID')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {showWalletManager && (
        <WalletManager user={user} isDark={isDark} onClose={() => { setShowWalletManager(false); fetchData(user); }} />
      )}
      {showGoalManager && (
        <GoalManager user={user} isDark={isDark} onClose={() => { setShowGoalManager(false); fetchData(user); }} />
      )}
    </div>
  );
}

export default function Dashboard() {
  const [isDark, setIsDark] = useState(false);
  return (
    <AuthWrapper isDark={isDark}>
      {(user) => (
        <DashboardContent user={user} isDark={isDark} setIsDark={setIsDark} />
      )}
    </AuthWrapper>
  );
}