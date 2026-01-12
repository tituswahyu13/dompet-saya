"use client"
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import TransactionForm from '@/components/TransactionForm';
import Insights from '@/components/Insights';
import BudgetTracker from '@/components/BudgetTracker';

export default function Dashboard() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [stats, setStats] = useState({ income: 0, outcome: 0, saving: 0, rate: 0, balance: 0 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [isDark, setIsDark] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<any>(null);

  const fetchData = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('transaction')
      .select('*')
      .order('tanggal', { ascending: false });

    if (data) {
      const totalInc = data.reduce((acc, curr) => acc + (curr.income || 0), 0);
      const totalOut = data.reduce((acc, curr) => acc + (curr.outcome || 0), 0);
      const totalSav = data.reduce((acc, curr) => acc + (curr.saving || 0), 0);
      
      const initialBalance = data.filter(t => t.kategori === 'Saldo Awal').reduce((acc, curr) => acc + (curr.income || 0), 0);
      const earnedIncome = totalInc - initialBalance;

      setTransactions(data);
      setStats({
        income: earnedIncome,
        outcome: totalOut,
        saving: totalSav,
        balance: totalInc - totalOut - totalSav,
        rate: earnedIncome > 0 ? (totalSav / earnedIncome) * 100 : 0
      });
    }
    setLoading(false);
  };

  const handleDelete = async (id: any) => {
    if (!confirm("Hapus transaksi ini?")) return;
    const { error } = await supabase.from('transaction').delete().eq('id', id);
    if (!error) fetchData();
    else alert("Gagal menghapus transaksi: " + error.message);
  };

  const handleEdit = (transaction: any) => {
    setEditingTransaction(transaction);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
   
  const exportToCSV = () => {
    const headers = ['Tanggal', 'Keterangan', 'Kategori', 'Pemasukan', 'Pengeluaran', 'Tabungan'];
    const rows = transactions.map(t => [
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

  useEffect(() => { fetchData(); }, []);

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-slate-900 text-slate-100' : 'bg-gray-50 text-slate-800'}`}>
      {/* Header */}
      <header className={`border-b sticky top-0 z-10 transition-colors duration-300 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
        <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Dompet Saya
          </h1>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsDark(!isDark)}
              className={`p-2 rounded-xl transition-all ${isDark ? 'bg-slate-700 text-amber-400' : 'bg-slate-100 text-slate-500'}`}
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
            <div className="text-sm font-medium text-slate-500 hidden sm:block">
              {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-10">
          <div className={`p-4 rounded-2xl shadow-sm border transition-all hover:shadow-md col-span-2 md:col-span-1 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Sisa Saldo</p>
            <p className={`text-lg font-bold leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>Rp {stats.balance.toLocaleString('id-ID')}</p>
          </div>
          <div className={`p-4 rounded-2xl shadow-sm border transition-all hover:shadow-md ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
            <p className="text-[10px] font-semibold text-green-500 uppercase tracking-wider mb-2">Masuk</p>
            <p className="text-lg font-bold text-green-600 leading-tight">Rp {stats.income.toLocaleString('id-ID')}</p>
          </div>
          <div className={`p-4 rounded-2xl shadow-sm border transition-all hover:shadow-md ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
            <p className="text-[10px] font-semibold text-red-500 uppercase tracking-wider mb-2">Keluar</p>
            <p className="text-lg font-bold text-red-600 leading-tight">Rp {stats.outcome.toLocaleString('id-ID')}</p>
          </div>
          <div className={`p-4 rounded-2xl shadow-sm border transition-all hover:shadow-md ${isDark ? 'bg-slate-800 border-blue-900/30' : 'bg-white border-blue-50 text-blue-600'}`}>
            <p className="text-[10px] font-semibold text-blue-500 uppercase tracking-wider mb-2">Tabungan</p>
            <p className={`text-lg font-bold leading-tight ${isDark ? 'text-blue-400' : ''}`}>Rp {stats.saving.toLocaleString('id-ID')}</p>
          </div>
          <div className={`p-4 rounded-2xl shadow-sm border transition-all hover:shadow-md ${isDark ? 'bg-indigo-900/20 border-indigo-900/30' : 'bg-indigo-50 border-indigo-100'}`}>
            <p className="text-[10px] font-semibold text-indigo-500 uppercase tracking-wider mb-2">Saving Rate</p>
            <p className="text-lg font-bold text-indigo-600 leading-tight">{stats.rate.toFixed(1)}%</p>
          </div>
        </div>

        <Insights transactions={transactions} isDark={isDark} />
        <BudgetTracker transactions={transactions} isDark={isDark} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Section */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <h2 className={`text-lg font-bold mb-4 px-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {editingTransaction ? 'Koreksi Transaksi' : 'Tambah Transaksi'}
              </h2>
              <TransactionForm 
                onRefresh={fetchData} 
                isDark={isDark} 
                editData={editingTransaction}
                onCancel={() => setEditingTransaction(null)}
              />
            </div>
          </div>

          {/* List Section */}
          <div className="lg:col-span-2">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 px-2">
              <h2 className={`text-xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>Riwayat Transaksi</h2>
              <div className="flex w-full md:w-auto gap-2">
                <input 
                  type="text"
                  placeholder="Cari transaksi..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`flex-1 md:w-48 p-2 text-xs border rounded-xl outline-none transition-all shadow-sm ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-white border-slate-200 text-slate-900'
                  }`}
                />
                <select 
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className={`p-2 text-xs border rounded-xl outline-none transition-all shadow-sm cursor-pointer ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
                  }`}
                >
                  <option value="All">Semua Kategori</option>
                  <option value="Pendapatan">Pendapatan</option>
                  <option value="Kebutuhan Pokok">Kebutuhan</option>
                  <option value="Lifestyle (Makan/Jajan)">Lifestyle</option>
                  <option value="Tabungan">Tabungan</option>
                </select>
                <button 
                  onClick={exportToCSV}
                  className="p-2 text-xs bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100 flex items-center gap-1"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  CSV
                </button>
              </div>
            </div>

            <div className={`rounded-2xl shadow-sm border overflow-hidden ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
              {loading ? (
                <div className="p-12 text-center text-slate-400">Loading data...</div>
              ) : transactions.length === 0 ? (
                <div className="p-12 text-center text-slate-400">Belum ada transaksi.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-medium">
                    <thead>
                      <tr className={`${isDark ? 'bg-slate-900/30 border-slate-700' : 'bg-slate-50/50 border-slate-100'} border-b`}>
                        <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tanggal</th>
                        <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Keterangan</th>
                        <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Nominal</th>
                        <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center w-24">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${isDark ? 'divide-slate-700' : 'divide-slate-100'}`}>
                      {transactions
                        .filter(t => {
                          const matchesSearch = t.keterangan.toLowerCase().includes(searchTerm.toLowerCase());
                          const matchesCategory = filterCategory === 'All' || t.kategori.includes(filterCategory);
                          return matchesSearch && matchesCategory;
                        })
                        .map((t) => (
                        <tr key={t.id} className={`transition-colors group ${isDark ? 'hover:bg-slate-900/30' : 'hover:bg-slate-50/50'}`}>
                          <td className="p-4">
                            <div className={`text-sm font-bold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                              {new Date(t.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {new Date(t.tanggal).toLocaleDateString('id-ID', { year: 'numeric' })}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className={`text-sm font-bold ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>{t.keterangan}</div>
                            <div className={`text-[10px] font-black px-2 py-0.5 rounded-lg inline-block mt-1 uppercase tracking-tighter ${
                              t.income > 0 ? (isDark ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-700') : 
                              t.saving > 0 ? (isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-700') : 
                              (isDark ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-700')
                            }`}>
                              {t.kategori || 'Others'}
                            </div>
                          </td>
                          <td className={`p-4 text-right font-bold text-sm ${
                            t.income > 0 ? 'text-green-600' : 
                            t.saving > 0 ? 'text-blue-600' : 
                            'text-red-600'
                          }`}>
                            {t.income > 0 ? '+' : t.saving > 0 ? '🔒' : '-'} Rp {(t.income || t.outcome || t.saving).toLocaleString('id-ID')}
                          </td>
                          <td className="p-4">
                            <div className="flex justify-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => handleEdit(t)}
                                className={`p-2 rounded-lg transition-colors ${isDark ? 'text-blue-400 hover:bg-blue-900/30' : 'text-blue-500 hover:bg-blue-50'}`}
                                title="Edit"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button 
                                onClick={() => handleDelete(t.id)}
                                className={`p-2 rounded-lg transition-colors ${isDark ? 'text-red-400 hover:bg-red-900/30' : 'text-red-500 hover:bg-red-50'}`}
                                title="Hapus"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
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
    </div>
  );
}