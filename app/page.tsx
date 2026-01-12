"use client"
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import TransactionForm from '@/components/TransactionForm';

export default function Dashboard() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [stats, setStats] = useState({ income: 0, outcome: 0, rate: 0 });

  const fetchData = async () => {
    const { data } = await supabase
      .from('transactions')
      .select('*')
      .order('tanggal', { ascending: false });

    if (data) {
      const totalInc = data.reduce((acc, curr) => acc + (curr.income || 0), 0);
      const totalOut = data.reduce((acc, curr) => acc + (curr.outcome || 0), 0);
      const saving = data.reduce((acc, curr) => acc + (curr.saving || 0), 0);
      
      setTransactions(data);
      setStats({
        income: totalInc,
        outcome: totalOut,
        rate: totalInc > 0 ? ((totalInc - totalOut) / totalInc) * 100 : 0
      });
    }
  };

  useEffect(() => { fetchData(); }, []);

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Dompet Saya</h1>
      
      {/* Kartu Ringkasan Dinamis */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="p-6 bg-white rounded-xl shadow-sm border-l-4 border-green-500">
          <p className="text-sm text-gray-500 font-medium">Total Income</p>
          <p className="text-2xl font-bold text-gray-800">Rp {stats.income.toLocaleString('id-ID')}</p>
        </div>
        <div className="p-6 bg-white rounded-xl shadow-sm border-l-4 border-red-500">
          <p className="text-sm text-gray-500 font-medium">Total Outcome</p>
          <p className="text-2xl font-bold text-gray-800">Rp {stats.outcome.toLocaleString('id-ID')}</p>
        </div>
        <div className="p-6 bg-white rounded-xl shadow-sm border-l-4 border-blue-500">
          <p className="text-sm text-gray-500 font-medium">Saving Rate</p>
          <p className="text-2xl font-bold text-gray-800">{stats.rate.toFixed(1)}%</p>
        </div>
      </div>

      <TransactionForm onRefresh={fetchData} />

      {/* Tabel Riwayat Transaksi */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-600 text-sm">
            <tr>
              <th className="p-4 font-semibold">Tanggal</th>
              <th className="p-4 font-semibold">Keterangan</th>
              <th className="p-4 font-semibold">Kategori</th>
              <th className="p-4 text-right font-semibold">Nominal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {transactions.map((t) => (
              <tr key={t.id} className="hover:bg-gray-50 transition">
                <td className="p-4 text-sm text-gray-600">
                  {new Date(t.tanggal).toLocaleDateString('id-ID')}
                </td>
                <td className="p-4 text-sm font-medium text-gray-800">{t.keterangan}</td>
                <td className="p-4">
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-medium">
                    {t.kategori}
                  </span>
                </td>
                <td className={`p-4 text-right font-bold ${t.income > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  Rp {(t.income || t.outcome).toLocaleString('id-ID')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}