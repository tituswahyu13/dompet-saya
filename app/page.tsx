"use client"
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import TransactionForm from '@/components/TransactionForm';

export default function Dashboard() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [stats, setStats] = useState({ income: 0, outcome: 0, saving: 0, rate: 0, balance: 0 });
  const [loading, setLoading] = useState(true);

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

  const handleDelete = async (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus transaksi ini?")) {
      const { error } = await supabase.from('transaction').delete().eq('id', id);
      if (!error) {
        fetchData();
      } else {
        alert("Gagal menghapus transaksi.");
      }
    }
  };

  useEffect(() => { fetchData(); }, []);

  return (
    <div className="min-h-screen bg-gray-50 text-slate-800 font-sans">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Dompet Saya
          </h1>
          <div className="text-sm font-medium text-slate-500">
            {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-10">
          <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-100 transition-all hover:shadow-md col-span-2 md:col-span-1">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Sisa Saldo</p>
            <p className="text-lg font-bold text-slate-900 leading-tight">Rp {stats.balance.toLocaleString('id-ID')}</p>
          </div>
          <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-100 transition-all hover:shadow-md">
            <p className="text-[10px] font-semibold text-green-500 uppercase tracking-wider mb-2">Masuk</p>
            <p className="text-lg font-bold text-green-600 leading-tight">Rp {stats.income.toLocaleString('id-ID')}</p>
          </div>
          <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-100 transition-all hover:shadow-md">
            <p className="text-[10px] font-semibold text-red-500 uppercase tracking-wider mb-2">Keluar</p>
            <p className="text-lg font-bold text-red-600 leading-tight">Rp {stats.outcome.toLocaleString('id-ID')}</p>
          </div>
          <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-100 transition-all hover:shadow-md text-blue-600 border-blue-50">
            <p className="text-[10px] font-semibold text-blue-500 uppercase tracking-wider mb-2">Tabungan</p>
            <p className="text-lg font-bold leading-tight">Rp {stats.saving.toLocaleString('id-ID')}</p>
          </div>
          <div className="p-4 bg-indigo-50 rounded-2xl shadow-sm border border-indigo-100 transition-all hover:shadow-md">
            <p className="text-[10px] font-semibold text-indigo-500 uppercase tracking-wider mb-2">Saving Rate</p>
            <p className="text-lg font-bold text-indigo-600 leading-tight">{stats.rate.toFixed(1)}%</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Section */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <h2 className="text-lg font-bold mb-4 px-2">Tambah Transaksi</h2>
              <TransactionForm onRefresh={fetchData} />
            </div>
          </div>

          {/* List Section */}
          <div className="lg:col-span-2">
            <h2 className="text-lg font-bold mb-4 px-2">Riwayat Transaksi</h2>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              {loading ? (
                <div className="p-12 text-center text-slate-400">Loading data...</div>
              ) : transactions.length === 0 ? (
                <div className="p-12 text-center text-slate-400">Belum ada transaksi.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50/50 border-b border-slate-100">
                        <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Tanggal</th>
                        <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Keterangan</th>
                        <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Nominal</th>
                        <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center w-16">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {transactions.map((t) => (
                        <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-4">
                            <div className="text-sm font-medium text-slate-900">
                              {new Date(t.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {new Date(t.tanggal).toLocaleDateString('id-ID', { year: 'numeric' })}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="text-sm font-semibold text-slate-800">{t.keterangan}</div>
                            <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-1 ${
                              t.income > 0 ? 'bg-green-50 text-green-600' : 
                              t.saving > 0 ? 'bg-blue-50 text-blue-600' : 
                              'bg-red-50 text-red-600'
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
                          <td className="p-4 text-center">
                            <button 
                              onClick={() => handleDelete(t.id)}
                              className="text-slate-300 hover:text-red-500 transition-colors p-1"
                              title="Hapus"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
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