"use client"
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import TransactionForm from '@/components/TransactionForm';
import TransferForm from '@/components/TransferForm';
import AuthWrapper from '@/components/AuthWrapper';
import WalletManager from '@/components/WalletManager';
import Navigation from '@/components/Navigation';
import RecurringManager from '@/components/RecurringManager';
import ConfirmationModal from '@/components/ConfirmationModal';
import { User } from '@supabase/supabase-js';

function TransactionsContent({ user, isDark, setIsDark }: { user: User, isDark: boolean, setIsDark: (val: boolean) => void }) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMonth, setFilterMonth] = useState<string>('All');
  const [filterYear, setFilterYear] = useState<string>(new Date().getFullYear().toString());
  const [editingTransaction, setEditingTransaction] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [showWalletManager, setShowWalletManager] = useState(false);
  const [isTransferMode, setIsTransferMode] = useState(false);
  const [selectedWalletFilter, setSelectedWalletFilter] = useState('All');
  const [showRecurringManager, setShowRecurringManager] = useState(false);
  const [wallets, setWallets] = useState<any[]>([]);
  const [transactionToDelete, setTransactionToDelete] = useState<any>(null);
  const ITEMS_PER_PAGE = 15;

  const fetchData = async (user: User) => {
    setLoading(true);
    const { data: txData } = await supabase.from('transaction').select('*').eq('user_id', user.id).order('tanggal', { ascending: false });
    if (txData) setTransactions(txData);
    const { data: wData } = await supabase.from('wallet_balances').select('*').eq('user_id', user.id).eq('is_active', true);
    if (wData) setWallets(wData);
    setLoading(false);
  };

  const getFilteredTransactions = () => {
    return transactions.filter(t => {
      const date = new Date(t.tanggal);
      const matchesSearch = t.keterangan.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesMonth = filterMonth === 'All' || (date.getMonth() + 1).toString() === filterMonth;
      const matchesYear = filterYear === 'All' || date.getFullYear().toString() === filterYear;
      const matchesWallet = selectedWalletFilter === 'All' || t.wallet_id === selectedWalletFilter;
      return matchesSearch && matchesMonth && matchesYear && matchesWallet;
    });
  };

  const filteredTransactions = getFilteredTransactions();
  const paginatedTransactions = filteredTransactions.slice(0, page * ITEMS_PER_PAGE);

  useEffect(() => { fetchData(user); }, [user]);

  const confirmDelete = async () => {
    if (!transactionToDelete) return;
    const { error } = await supabase.from('transaction').delete().eq('id', transactionToDelete.id);
    if (!error) fetchData(user);
    else alert("Gagal menghapus: " + error.message);
    setTransactionToDelete(null);
  };

  const handleEdit = (transaction: any) => {
    setEditingTransaction(transaction);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const exportToCSV = () => {
    const headers = ['Tanggal', 'Keterangan', 'Kategori', 'Pemasukan', 'Pengeluaran', 'Tabungan'];
    const rows = filteredTransactions.map(t => [t.tanggal, t.keterangan, t.kategori, t.income || 0, t.outcome || 0, t.saving || 0]);
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `dompet-ledger-${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
  };

  return (
    <div className={`min-h-screen transition-all duration-700 relative overflow-hidden ${isDark ? 'bg-[#020617] text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <div className="absolute top-[-15%] left-[-15%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[160px] animate-float opacity-50" />
      <div className="absolute bottom-[-15%] right-[-15%] w-[50%] h-[50%] bg-indigo-600/10 rounded-full blur-[160px] animate-float opacity-50" style={{ animationDelay: '-3s' }} />

      <header className={`sticky top-0 z-50 border-b backdrop-blur-xl ${isDark ? 'bg-slate-950/40 border-white/5 shadow-2xl shadow-black/20' : 'bg-white/60 border-slate-200/50 shadow-xl shadow-slate-200/20'}`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
           <div className="flex items-center gap-4 group cursor-pointer">
            <div className="w-11 h-11 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-tight">Data Management</p>
              <h1 className={`text-sm font-black uppercase tracking-widest ${isDark ? 'text-white' : 'text-slate-900'}`}>Transaction Ledger</h1>
            </div>
          </div>
          <Navigation isDark={isDark} />
          <div className="flex items-center gap-4">
             <button onClick={() => setIsDark(!isDark)} className={`w-10 h-10 rounded-xl flex items-center justify-center border ${isDark ? 'bg-slate-800 text-amber-400 border-white/5' : 'bg-slate-100 text-slate-500 border-slate-200'} hover:scale-105 transition-all`}>
              {isDark ? <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" /></svg> : <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" /></svg>}
            </button>
            <button onClick={() => setShowRecurringManager(true)} className={`w-10 h-10 rounded-xl flex items-center justify-center border ${isDark ? 'bg-indigo-600/10 text-indigo-400 border-indigo-500/20 hover:bg-indigo-600/20' : 'bg-indigo-50 text-indigo-600 border-indigo-100 hover:bg-indigo-100'} hover:scale-105 transition-all`} title="Recurring Engine">
              <span className="text-sm">🪄</span>
            </button>
            <button onClick={() => setShowWalletManager(true)} className={`w-10 h-10 rounded-xl flex items-center justify-center border ${isDark ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-indigo-50 text-indigo-600 border-indigo-100'} hover:scale-105 transition-all`} title="Manage Wallets">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12 relative z-10 space-y-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-4 lg:sticky lg:top-28 h-fit space-y-8">
            <section>
              <div className="flex items-center justify-between mb-6 px-1">
                <div className="flex items-center gap-2">
                  <div className={`w-1.5 h-6 ${isTransferMode ? 'bg-indigo-600' : 'bg-blue-600'} rounded-full`} />
                  <h2 className={`text-lg font-black uppercase tracking-tighter ${isDark ? 'text-white' : 'text-slate-900'}`}>{editingTransaction ? 'Koreksi Data' : isTransferMode ? 'Transfer Dana' : 'Transaksi Baru'}</h2>
                </div>
                {!editingTransaction && (
                  <button onClick={() => setIsTransferMode(!isTransferMode)} className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg border bg-blue-500/10 text-blue-500 border-blue-500/20">{isTransferMode ? 'Ke Transaksi' : 'Ke Transfer'}</button>
                )}
              </div>
              {isTransferMode && !editingTransaction ? (
                <TransferForm user={user} isDark={isDark} onRefresh={() => fetchData(user)} onCancel={() => setIsTransferMode(false)} />
              ) : (
                <TransactionForm user={user} isDark={isDark} editData={editingTransaction} onRefresh={() => fetchData(user)} onCancel={() => { setEditingTransaction(null); setIsTransferMode(false); }} />
              )}
            </section>
          </div>

          <div className="lg:col-span-8 space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 px-1">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-6 bg-slate-400 rounded-full" />
                <h2 className={`text-lg font-black uppercase tracking-tighter ${isDark ? 'text-white' : 'text-slate-900'}`}>Full Cloud Ledger</h2>
              </div>
              
              <div className="flex flex-wrap w-full md:w-auto items-center gap-3">
                <div className="flex items-center gap-2 bg-slate-200/20 dark:bg-white/5 p-1.5 rounded-2xl border border-white/5">
                  <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className="p-2 px-3 text-[10px] font-black uppercase tracking-widest bg-transparent outline-none">
                    <option value="All">Semua Bulan</option>
                    {['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'].map((m, i) => <option key={m} value={(i + 1).toString()}>{m}</option>)}
                  </select>
                  <div className="w-px h-4 bg-slate-400/20" />
                  <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)} className="p-2 px-3 text-[10px] font-black uppercase tracking-widest bg-transparent outline-none">
                    {['2024', '2025', '2026'].map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div className="flex flex-1 md:flex-none items-center gap-2 bg-slate-200/20 dark:bg-white/5 p-1.5 rounded-2xl border border-white/5">
                  <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="flex-1 md:w-32 p-2 px-3 text-[10px] font-black uppercase tracking-widest bg-transparent outline-none" />
                  <button onClick={exportToCSV} className="p-2 px-4 text-[10px] font-black bg-blue-600/10 text-blue-500 uppercase tracking-widest rounded-xl hover:bg-blue-600 hover:text-white transition-all">CSV</button>
                </div>
              </div>
            </div>

            <div className={`rounded-[2.5rem] border overflow-hidden backdrop-blur-sm transition-all duration-500 ${isDark ? 'glass-dark border-white/5 shadow-2xl shadow-black/40' : 'glass border-white shadow-xl shadow-slate-200/50'}`}>
              {loading ? (
                <div className="p-20 text-center animate-pulse text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Syncing Cloud Ledger...</div>
              ) : filteredTransactions.length === 0 ? (
                <div className="p-20 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">No transaction signals discovered.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className={`${isDark ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'} border-b`}>
                        <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Timeline</th>
                        <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Activity</th>
                        <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Value</th>
                        <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center w-32">Control</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${isDark ? 'divide-white/5' : 'divide-slate-100'}`}>
                      {paginatedTransactions.map((t) => (
                        <tr key={t.id} className="hover:bg-white/[0.02] group transition-all duration-300">
                          <td className="p-6">
                            <div className="text-md font-black tracking-tighter">{new Date(t.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}</div>
                            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{new Date(t.tanggal).getFullYear()}</div>
                          </td>
                          <td className="p-6">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-bold">{t.keterangan}</span>
                              <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tight ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>{wallets.find(w => w.id === t.wallet_id)?.name}</span>
                            </div>
                            <span className={`text-[8px] font-black px-2 py-1 rounded-full uppercase tracking-wider ${t.income > 0 ? 'bg-green-500/10 text-green-500' : t.saving > 0 ? 'bg-blue-500/10 text-blue-500' : 'bg-red-500/10 text-red-500'}`}>{t.kategori}</span>
                          </td>
                          <td className={`p-6 text-right font-black tracking-tighter ${t.income > 0 ? 'text-green-500' : t.saving > 0 ? 'text-blue-500' : 'text-red-500'}`}>{(t.income || t.outcome || t.saving).toLocaleString('id-ID')}</td>
                          <td className="p-6">
                            <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                              <button onClick={() => handleEdit(t)} className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-500/10 text-blue-500 hover:bg-blue-500 text-white transition-all"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
                              <button onClick={() => setTransactionToDelete(t)} className="w-8 h-8 rounded-lg flex items-center justify-center bg-red-500/10 text-red-500 hover:bg-red-500 text-white transition-all"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredTransactions.length > paginatedTransactions.length && (
                    <div className="p-8 text-center border-t border-white/5"><button onClick={() => setPage(page + 1)} className="px-10 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl bg-slate-800 text-white hover:bg-slate-700 transition-all">Load More Signals</button></div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {showWalletManager && <WalletManager user={user} isDark={isDark} onClose={() => { setShowWalletManager(false); fetchData(user); }} />}
      {showRecurringManager && <RecurringManager user={user} isDark={isDark} onClose={() => { setShowRecurringManager(false); fetchData(user); }} />}

      <ConfirmationModal 
        isOpen={!!transactionToDelete}
        title="Hapus Transaksi"
        message={`Apakah Anda yakin ingin menghapus "${transactionToDelete?.keterangan}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Hapus Permanen"
        onConfirm={confirmDelete}
        onCancel={() => setTransactionToDelete(null)}
        isDark={isDark}
      />
    </div>
  );
}

export default function TransactionsPage() {
  const [isDark, setIsDark] = useState(false);
  return (
    <AuthWrapper isDark={isDark}>
      {(user) => <TransactionsContent user={user} isDark={isDark} setIsDark={setIsDark} />}
    </AuthWrapper>
  );
}
