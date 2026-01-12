"use client"
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import TransactionForm from '@/components/TransactionForm';
import Insights from '@/components/Insights';
import BudgetTracker from '@/components/BudgetTracker';
import AuthWrapper from '@/components/AuthWrapper';
import WalletManager from '@/components/WalletManager';
import TransferForm from '@/components/TransferForm';
import { User } from '@supabase/supabase-js';

function DashboardContent({ user, isDark, setIsDark }: { user: User, isDark: boolean, setIsDark: (val: boolean) => void }) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [stats, setStats] = useState({ income: 0, outcome: 0, saving: 0, rate: 0, balance: 0 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterMonth, setFilterMonth] = useState<string>('All');
  const [filterYear, setFilterYear] = useState<string>(new Date().getFullYear().toString());
  // isDark is now a prop
  const [editingTransaction, setEditingTransaction] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [showWalletManager, setShowWalletManager] = useState(false);
  const [isTransferMode, setIsTransferMode] = useState(false);
  const [selectedWalletFilter, setSelectedWalletFilter] = useState('All');
  const [wallets, setWallets] = useState<any[]>([]);
  const ITEMS_PER_PAGE = 10;

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

    setLoading(false);
  };

  const getFilteredTransactions = () => {
    const filtered = transactions.filter(t => {
      const date = new Date(t.tanggal);
      const matchesSearch = t.keterangan.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = filterCategory === 'All' || t.kategori.includes(filterCategory);
      const matchesMonth = filterMonth === 'All' || (date.getMonth() + 1).toString() === filterMonth;
      const matchesYear = filterYear === 'All' || date.getFullYear().toString() === filterYear;
      const matchesWallet = selectedWalletFilter === 'All' || t.wallet_id === selectedWalletFilter;
      return matchesSearch && matchesCategory && matchesMonth && matchesYear && matchesWallet;
    });

    return filtered;
  };

  const filteredTransactions = getFilteredTransactions();
  const paginatedTransactions = filteredTransactions.slice(0, page * ITEMS_PER_PAGE);

  // Re-calculate stats whenever filteredTransactions changes
  useEffect(() => {
    const data = filteredTransactions;
    setPage(1); // Reset page on filter change
    
    // Identify Investment Wallets
    const investmentWalletIds = new Set(wallets.filter(w => w.type === 'investment').map(w => w.id));

    // Standard income/outcome should exclude internal transfers
    const totalInc = data.filter(t => !t.is_transfer).reduce((acc, curr) => acc + (curr.income || 0), 0);
    const totalOut = data.filter(t => !t.is_transfer).reduce((acc, curr) => acc + (curr.outcome || 0), 0);
    
    // Detailed Saving Calculation
    let totalSav = 0;
    data.forEach(t => {
      if (!t.is_transfer) {
        // 1. Transactions clearly marked as 'saving'
        totalSav += (t.saving || 0);
        
        // 2. Income directly into an investment wallet is also saving
        if (investmentWalletIds.has(t.wallet_id) && t.income > 0 && t.kategori !== 'Saldo Awal') {
          totalSav += t.income;
        }
      } else {
        // 3. Transfers IN to an investment wallet (from a non-investment source)
        if (investmentWalletIds.has(t.wallet_id) && t.income > 0 && !investmentWalletIds.has(t.transfer_from_wallet_id)) {
          totalSav += t.income;
        }
        // 4. Transfers OUT of an investment wallet (to a non-investment destination like Cash/Bank)
        // This is considered "liquidating assets" or "unsaving"
        if (investmentWalletIds.has(t.wallet_id) && t.outcome > 0 && !investmentWalletIds.has(t.transfer_to_wallet_id)) {
          totalSav -= t.outcome;
        }
      }
    });
    
    const initialBalance = data.filter(t => t.kategori === 'Saldo Awal' && !t.is_transfer).reduce((acc, curr) => acc + (curr.income || 0), 0);
    const earnedIncome = totalInc - initialBalance;

    // Actual balance should include ALL movements
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
  }, [transactions, wallets, searchTerm, filterCategory, filterMonth, filterYear, selectedWalletFilter]);

  const handleDelete = async (id: any, user: User) => {
    if (!confirm("Hapus transaksi ini?")) return;
    const { error } = await supabase.from('transaction').delete().eq('id', id);
    if (!error) fetchData(user);
    else alert("Gagal menghapus transaksi: " + error.message);
  };

  const handleEdit = (transaction: any) => {
    setEditingTransaction(transaction);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
   
  const exportToCSV = () => {
    const headers = ['Tanggal', 'Keterangan', 'Kategori', 'Pemasukan', 'Pengeluaran', 'Tabungan'];
    const rows = filteredTransactions.map(t => [
      t.tanggal,
      t.keterangan,
      t.kategori,
      t.income || 0,
      t.outcome || 0,
      t.saving || 0
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `dompet-saya-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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

  // Initial fetch
  useEffect(() => {
    fetchData(user);
  }, [user]);

  return (
    <div className={`min-h-screen transition-all duration-700 relative overflow-hidden ${isDark ? 'bg-[#020617] text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      {/* Background Blobs */}
      <div className="absolute top-[-15%] left-[-15%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[160px] animate-float opacity-50" />
      <div className="absolute bottom-[-15%] right-[-15%] w-[50%] h-[50%] bg-indigo-600/10 rounded-full blur-[160px] animate-float opacity-50" style={{ animationDelay: '-3s' }} />
      <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-purple-600/5 rounded-full blur-[120px] animate-pulse-slow" />

      {/* Header */}
      <header className={`sticky top-0 z-50 border-b backdrop-blur-xl transition-all duration-500 ${isDark ? 'bg-slate-950/40 border-white/5 shadow-2xl shadow-black/20' : 'bg-white/60 border-slate-200/50 shadow-xl shadow-slate-200/20'}`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4 group cursor-pointer">
            <div className="w-11 h-11 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform duration-300">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-xl font-black tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      Dompet Saya
                    </h1>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Financial Intelligence</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-right hidden sm:block">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Gateway Identity</p>
                    <p className="text-xs font-bold truncate max-w-[150px]">{user.email}</p>
                  </div>
                  <button 
                    onClick={() => setIsDark(!isDark)}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                      isDark ? 'bg-slate-800 text-amber-400 border border-white/5' : 'bg-slate-100 text-slate-500 border border-slate-200'
                    } hover:scale-105 active:scale-95`}
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

                  {/* Wallet Manager Button */}
                  <button 
                    onClick={() => setShowWalletManager(true)}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                      isDark ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20' : 'bg-indigo-50 text-indigo-600 border border-indigo-100 hover:bg-indigo-100'
                    } hover:scale-105 active:scale-95`}
                    title="Manage Wallets"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </button>

                  {/* Logout Button */}
                  <button 
                    onClick={async () => {
                      const { error } = await supabase.auth.signOut();
                      if (error) alert("Logout failed: " + error.message);
                    }}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                      isDark ? 'bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20' : 'bg-red-50 text-red-600 border border-red-100 hover:bg-red-100'
                    } hover:scale-105 active:scale-95`}
                    title="Logout Access"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  </button>
                </div>
              </div>
            </header>

      <main className="max-w-7xl mx-auto px-6 py-12 relative z-10 space-y-12">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-5">
          <div className={`p-7 rounded-[2.5rem] border transition-all hover:scale-[1.02] col-span-2 md:col-span-2 lg:col-span-1 shadow-sm relative overflow-hidden group ${isDark ? 'glass-dark border-white/5' : 'glass border-slate-200'}`}>
            <div className="absolute -right-8 -bottom-8 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-colors" />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Total Saldo</p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xs font-black text-blue-500">IDR</span>
              <p className={`text-3xl font-black ${isDark ? 'text-white' : 'text-slate-900'} tracking-tighter`}>{stats.balance.toLocaleString('id-ID')}</p>
            </div>
          </div>

          <div className={`p-7 rounded-[2.5rem] border transition-all hover:scale-[1.02] shadow-sm relative overflow-hidden group ${isDark ? 'glass-dark border-white/5' : 'glass border-slate-200'}`}>
            <div className="absolute -right-8 -bottom-8 w-24 h-24 bg-green-500/5 rounded-full blur-2xl group-hover:bg-green-500/10 transition-colors" />
            <p className="text-[10px] font-black text-green-500 uppercase tracking-[0.2em] mb-4">Pemasukan</p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xs font-black text-green-600">IDR</span>
              <p className="text-3xl font-black text-green-600 tracking-tighter">{stats.income.toLocaleString('id-ID')}</p>
            </div>
          </div>

          <div className={`p-7 rounded-[2.5rem] border transition-all hover:scale-[1.02] shadow-sm relative overflow-hidden group ${isDark ? 'glass-dark border-white/5' : 'glass border-slate-200'}`}>
            <div className="absolute -right-8 -bottom-8 w-24 h-24 bg-red-500/5 rounded-full blur-2xl group-hover:bg-red-500/10 transition-colors" />
            <p className="text-[10px] font-black text-red-500 uppercase tracking-[0.2em] mb-4">Pengeluaran</p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xs font-black text-red-600">IDR</span>
              <p className="text-3xl font-black text-red-600 tracking-tighter">{stats.outcome.toLocaleString('id-ID')}</p>
            </div>
          </div>

          <div className={`p-7 rounded-[2.5rem] border transition-all hover:scale-[1.02] shadow-sm relative overflow-hidden group ${isDark ? 'glass-dark border-blue-900/20' : 'bg-blue-50/50 border-blue-100'}`}>
            <div className="absolute -right-8 -bottom-8 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-colors" />
            <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] mb-4">Tabungan</p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xs font-black text-blue-500">IDR</span>
              <p className={`text-3xl font-black tracking-tighter ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>{stats.saving.toLocaleString('id-ID')}</p>
            </div>
          </div>

          <div className={`p-7 rounded-[2.5rem] border transition-all hover:scale-[1.02] md:col-span-1 shadow-sm relative overflow-hidden group ${isDark ? 'glass-dark border-indigo-900/20' : 'bg-indigo-50/50 border-indigo-100'}`}>
            <div className="absolute -right-8 -bottom-8 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-colors" />
            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mb-4">Saving Rate</p>
            <p className="text-3xl font-black text-indigo-600 tracking-tighter">{stats.rate.toFixed(1)}<span className="text-sm ml-0.5">%</span></p>
          </div>
        </div>

        {/* Wallet Management Section */}
        <section className={`p-8 rounded-[2.5rem] border transition-all duration-500 shadow-xl relative overflow-hidden ${
          isDark ? 'glass-dark border-white/5' : 'glass border-white'
        }`}>
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-indigo-500/5 rounded-full blur-[100px]" />
          
          <div className="flex items-center gap-3 mb-8 px-1">
            <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
            <h2 className={`text-lg font-black ${isDark ? 'text-white' : 'text-slate-900'} uppercase tracking-tighter`}>Arsitektur Wallet</h2>
          </div>

          <div className="space-y-8">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedWalletFilter('All')}
                className={`px-7 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                  selectedWalletFilter === 'All'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xl shadow-blue-500/20 scale-105'
                    : isDark ? 'bg-slate-900/50 text-slate-400 border-white/5 hover:border-white/10' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                }`}
              >
                🌐 Semua Dompet
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {Object.keys(groupedWallets).sort().map(type => (
                <div key={type} className="space-y-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] px-1 border-l-2 border-indigo-500/30 pl-3">
                    {typeLabels[type] || type.toUpperCase()}
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {groupedWallets[type].map((w: any) => (
                      <button
                        key={w.id}
                        onClick={() => setSelectedWalletFilter(w.id)}
                        className={`px-5 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border flex items-center gap-3 group relative overflow-hidden flex-1 min-w-[140px] ${
                          selectedWalletFilter === w.id
                            ? 'bg-slate-900 text-white border-transparent shadow-2xl scale-105'
                            : isDark ? 'bg-slate-900/60 text-slate-500 border-white/5 hover:border-white/10 hover:bg-slate-900/80' : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div 
                          className="absolute left-0 top-0 bottom-0 w-1 transition-all"
                          style={{ backgroundColor: w.color }}
                        />
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

        <div className="space-y-16">
          <section>
            <div className="flex items-center gap-3 mb-8 px-2">
              <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
              <h2 className={`text-lg font-black ${isDark ? 'text-white' : 'text-slate-900'} uppercase tracking-tighter`}>Data Intelligence</h2>
            </div>
            <Insights transactions={filteredTransactions} isDark={isDark} wallets={wallets} />
          </section>
                
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                  {/* Sidebar: Form & Target */}
                  <div className="lg:col-span-4 space-y-10">
                    <div className="sticky top-28 space-y-10">
                      <section>
                        <div className="flex items-center justify-between mb-6 px-2">
                          <div className="flex items-center gap-2">
                            <div className={`w-1.5 h-6 ${isTransferMode ? 'bg-indigo-600' : 'bg-blue-600'} rounded-full transition-all`} />
                            <h2 className={`text-lg font-black ${isDark ? 'text-white' : 'text-slate-900'} uppercase tracking-tighter`}>
                              {editingTransaction ? 'Koreksi Data' : isTransferMode ? 'Transfer Dana' : 'Transaksi Baru'}
                            </h2>
                          </div>
                          
                          {!editingTransaction && (
                            <button
                              onClick={() => setIsTransferMode(!isTransferMode)}
                              className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg border transition-all ${
                                isTransferMode 
                                  ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' 
                                  : 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20'
                              }`}
                            >
                              {isTransferMode ? 'Ke Transaksi' : 'Ke Transfer'}
                            </button>
                          )}
                        </div>
                        
                        {isTransferMode && !editingTransaction ? (
                          <TransferForm 
                            user={user} 
                            isDark={isDark} 
                            onRefresh={() => fetchData(user)} 
                            onCancel={() => setIsTransferMode(false)} 
                          />
                        ) : (
                          <TransactionForm 
                            onRefresh={() => fetchData(user)} 
                            isDark={isDark} 
                            editData={editingTransaction}
                            onCancel={() => {
                              setEditingTransaction(null);
                              setIsTransferMode(false);
                            }}
                            user={user}
                          />
                        )}
                      </section>

                      <section>
                        <div className="flex items-center gap-2 mb-6 px-2">
                          <div className="w-1.5 h-6 bg-indigo-600 rounded-full" />
                          <h2 className={`text-lg font-black ${isDark ? 'text-white' : 'text-slate-900'} uppercase tracking-tighter`}>
                            Target Anggaran
                          </h2>
                        </div>
                        <BudgetTracker transactions={filteredTransactions} isDark={isDark} user={user} />
                      </section>
                    </div>
                  </div>

                  {/* Content: History */}
                  <div className="lg:col-span-8 space-y-8">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 px-1">
                      <div className="flex items-center gap-3">
                        <div className="w-1.5 h-6 bg-slate-400 rounded-full" />
                        <h2 className={`text-lg font-black ${isDark ? 'text-white' : 'text-slate-900'} uppercase tracking-tighter`}>Arus Kas & Ledger</h2>
                      </div>
                      
                      <div className="flex flex-wrap w-full md:w-auto items-center gap-3">
                        <div className="flex items-center gap-2 bg-slate-200/20 dark:bg-white/5 p-1.5 rounded-2xl border border-white/5 backdrop-blur-sm">
                          <select 
                            value={filterMonth}
                            onChange={(e) => setFilterMonth(e.target.value)}
                            className={`p-2 px-3 text-[10px] font-black uppercase tracking-widest bg-transparent outline-none transition-all cursor-pointer ${
                              isDark ? 'text-slate-300' : 'text-slate-600'
                            }`}
                          >
                            <option value="All">Bulan</option>
                            {['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'].map((m, i) => (
                              <option key={m} value={(i + 1).toString()}>{m}</option>
                            ))}
                          </select>
                          <div className="w-px h-4 bg-slate-400/20" />
                          <select 
                            value={filterYear}
                            onChange={(e) => setFilterYear(e.target.value)}
                            className={`p-2 px-3 text-[10px] font-black uppercase tracking-widest bg-transparent outline-none transition-all cursor-pointer ${
                              isDark ? 'text-slate-300' : 'text-slate-600'
                            }`}
                          >
                            {['2024', '2025', '2026'].map(y => (
                              <option key={y} value={y}>{y}</option>
                            ))}
                          </select>
                        </div>

                        <div className="flex flex-1 md:flex-none items-center gap-2 bg-slate-200/20 dark:bg-white/5 p-1.5 rounded-2xl border border-white/5 backdrop-blur-sm">
                          <input 
                            type="text"
                            placeholder="Cari Ledger..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={`flex-1 md:w-40 p-2 px-3 text-[10px] font-black uppercase tracking-widest bg-transparent outline-none placeholder:text-slate-500 ${
                              isDark ? 'text-white' : 'text-slate-900'
                            }`}
                          />
                          <button 
                            onClick={exportToCSV}
                            className="p-2 px-4 text-[10px] font-black bg-blue-600/10 text-blue-500 uppercase tracking-widest rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                          >
                            Export
                          </button>
                        </div>
                      </div>
                    </div>

                  <div className={`rounded-[2rem] border overflow-hidden backdrop-blur-sm transition-all duration-500 ${isDark ? 'glass-dark border-white/5 shadow-2xl shadow-black/40' : 'glass border-white/50 shadow-xl shadow-slate-200/50'}`}>
                    {loading ? (
                      <div className="p-20 text-center">
                        <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 animate-pulse">Scanning Ledger...</p>
                      </div>
                    ) : filteredTransactions.length === 0 ? (
                      <div className="p-20 text-center">
                        <div className="w-16 h-16 bg-slate-100/50 dark:bg-slate-900/50 rounded-3xl flex items-center justify-center mx-auto mb-4 opacity-50">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                          </svg>
                        </div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No signals found for this period.</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <thead>
                            <tr className={`${isDark ? 'bg-white/5 border-white/5' : 'bg-slate-50/50 border-slate-100'} border-b`}>
                              <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Timeline</th>
                              <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Transaction Registry</th>
                              <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Value</th>
                              <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Balance</th>
                              <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center w-32">Control</th>
                            </tr>
                          </thead>
                          <tbody className={`divide-y ${isDark ? 'divide-white/5' : 'divide-slate-100'}`}>
                              {(() => {
                                // Calculate running balance correctly based on filter
                                const relevantTransactions = selectedWalletFilter === 'All' 
                                  ? transactions 
                                  : transactions.filter(t => t.wallet_id === selectedWalletFilter);
                                
                                const allSorted = [...relevantTransactions].sort((a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime());
                                
                                // Initial balance for running calculation
                                let running = 0;
                                if (selectedWalletFilter !== 'All') {
                                  const wallet = wallets.find(w => w.id === selectedWalletFilter);
                                  running = wallet?.initial_balance || 0;
                                } else {
                                  running = wallets.reduce((acc, curr) => acc + (curr.initial_balance || 0), 0);
                                }

                                const balancesMap: Record<string, number> = {};
                                allSorted.forEach(t => {
                                  running += (Number(t.income || 0) - Number(t.outcome || 0) - Number(t.saving || 0));
                                  balancesMap[t.id] = running;
                                });

                                return paginatedTransactions.map((t) => (
                                <tr key={t.id} className={`transition-all duration-300 group ${isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-blue-50/30'}`}>
                                  <td className="p-6">
                                    <div className={`text-md font-black tracking-tighter ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                      {new Date(t.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                                    </div>
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                      {new Date(t.tanggal).toLocaleDateString('id-ID', { year: 'numeric' })}
                                    </div>
                                  </td>
                                  <td className="p-6">
                                    <div className="flex items-center gap-2 mb-1">
                                      <div className={`text-sm font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{t.keterangan}</div>
                                      {selectedWalletFilter === 'All' && t.wallet_id && (
                                        <div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tight ${
                                          isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'
                                        }`}>
                                          {wallets.find(w => w.id === t.wallet_id)?.icon} {wallets.find(w => w.id === t.wallet_id)?.name}
                                        </div>
                                      )}
                                    </div>
                                    <div className={`text-[9px] font-black px-3 py-1 rounded-full inline-flex items-center gap-1.5 uppercase tracking-wider ${
                                      t.is_transfer ? (isDark ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-100 text-indigo-700') :
                                      t.income > 0 ? (isDark ? 'bg-green-500/10 text-green-400' : 'bg-green-100 text-green-700') : 
                                      t.saving > 0 ? (isDark ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-100 text-blue-700') : 
                                      (isDark ? 'bg-red-500/10 text-red-400' : 'bg-red-100 text-red-700')
                                    }`}>
                                      <div className={`w-1 h-1 rounded-full ${
                                        t.is_transfer ? 'bg-indigo-500' :
                                        t.income > 0 ? 'bg-green-500' : t.saving > 0 ? 'bg-blue-500' : 'bg-red-500'
                                      } shadow-[0_0_5px_currentColor]`} />
                                      {t.kategori || 'UNCATEGORIZED'}
                                    </div>
                                  </td>
                                  <td className={`p-6 text-right font-black tracking-tighter text-md ${
                                    t.income > 0 ? 'text-green-500' : 
                                    t.saving > 0 ? 'text-blue-500' : 
                                    'text-red-500'
                                  }`}>
                                    {t.income > 0 ? '+' : t.saving > 0 ? '🔒' : '-'} {(t.income || t.outcome || t.saving).toLocaleString('id-ID')}
                                  </td>
                                  <td className={`p-6 text-right text-xs font-black tracking-tight ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                    Rp {(balancesMap[t.id] || 0) .toLocaleString('id-ID')}
                                  </td>
                                  <td className="p-6">
                                    <div className="flex justify-center gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0">
                                      <button 
                                        onClick={() => handleEdit(t)}
                                        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${isDark ? 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}
                                        title="Update Record"
                                      >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                      </button>
                                      <button 
                                        onClick={() => handleDelete(t.id, user)}
                                        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${isDark ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}
                                        title="De-register Record"
                                      >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ));
                            })()}
                          </tbody>
                        </table>
                        
                        {filteredTransactions.length > paginatedTransactions.length && (
                          <div className={`p-8 border-t text-center ${isDark ? 'border-white/5' : 'border-slate-100'}`}>
                            <button 
                              onClick={() => setPage(page + 1)}
                              className={`px-10 py-4 text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl transition-all shadow-xl active:scale-95 ${
                                isDark ? 'bg-slate-800 text-slate-100 hover:bg-slate-700 shadow-black/20' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 shadow-slate-200/50'
                              }`}
                            >
                              Load More Data
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </main>

          {/* Wallet Manager Modal */}
          {showWalletManager && (
            <WalletManager 
              user={user} 
              isDark={isDark} 
              onClose={() => {
                setShowWalletManager(false);
                fetchData(user); // Refresh data after wallet changes
              }} 
            />
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