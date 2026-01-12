"use client"
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

const CATEGORIES = {
  income: ['Saldo Awal', 'Pendapatan', 'Bonus', 'Investasi'],
  outcome: ['Kebutuhan Pokok', 'Lifestyle (Makan/Jajan)', 'Personal Care', 'Transport', 'Cicilan', 'Others'],
  saving: ['Tabungan', 'Dana Darurat', 'Investasi Saham/Emas', 'Others']
};

export default function TransactionForm({ onRefresh }: { onRefresh: () => void }) {
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'income' | 'outcome' | 'saving'>('outcome');
  const [category, setCategory] = useState('Lifestyle (Makan/Jajan)');
  const [loading, setLoading] = useState(false);

  // Sync category when type changes
  useEffect(() => {
    if (type === 'income') {
      setCategory('Pendapatan');
    } else if (type === 'saving') {
      setCategory('Tabungan');
    } else {
      setCategory('Lifestyle (Makan/Jajan)');
    }
  }, [type]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (Number(amount) <= 0) {
      alert("Nominal harus lebih dari 0");
      return;
    }

    setLoading(true);
    const numAmount = Number(amount);
    const income = type === 'income' ? numAmount : 0;
    const outcome = type === 'outcome' ? numAmount : 0;
    const saving = type === 'saving' ? numAmount : 0;

    const payload = {
      keterangan: desc,
      kategori: category,
      tanggal: new Date().toISOString().split('T')[0], // YYYY-MM-DD
      income: income,
      outcome: outcome,
      saving: saving
    };

    const { error } = await supabase.from('transaction').insert([payload]);
    
    setLoading(false);
    if (!error) {
      setDesc('');
      setAmount('');
      onRefresh();
    } else {
      alert("Gagal menyimpan transaksi: " + error.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
      <div>
        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">Tipe Transaksi</label>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setType('income')}
            className={`py-2 px-2 rounded-xl text-[10px] font-bold transition-all border-2 ${
              type === 'income' 
                ? 'bg-green-50 text-green-600 border-green-100' 
                : 'bg-slate-50 text-slate-400 border-transparent hover:bg-slate-100'
            }`}
          >
            Pemasukan
          </button>
          <button
            type="button"
            onClick={() => setType('outcome')}
            className={`py-2 px-2 rounded-xl text-[10px] font-bold transition-all border-2 ${
              type === 'outcome' 
                ? 'bg-red-50 text-red-600 border-red-100' 
                : 'bg-slate-50 text-slate-400 border-transparent hover:bg-slate-100'
            }`}
          >
            Pengeluaran
          </button>
          <button
            type="button"
            onClick={() => setType('saving')}
            className={`py-2 px-2 rounded-xl text-[10px] font-bold transition-all border-2 ${
              type === 'saving' 
                ? 'bg-blue-50 text-blue-600 border-blue-100' 
                : 'bg-slate-50 text-slate-400 border-transparent hover:bg-slate-100'
            }`}
          >
            Tabungan
          </button>
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 px-1">Keterangan</label>
        <input 
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="Misal: Beli Kopi" 
          className="w-full p-3 bg-slate-50 border border-transparent rounded-xl outline-none focus:bg-white focus:border-blue-500 transition-all text-sm"
          required
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 px-1">Nominal (Rp)</label>
        <input 
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0" 
          className="w-full p-3 bg-slate-50 border border-transparent rounded-xl outline-none focus:bg-white focus:border-blue-500 transition-all text-sm font-bold"
          required
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 px-1">Kategori</label>
        <select 
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full p-3 bg-slate-50 border border-transparent rounded-xl outline-none focus:bg-white focus:border-blue-500 transition-all text-sm appearance-none cursor-pointer"
        >
          {CATEGORIES[type].map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      <button 
        disabled={loading}
        className={`w-full mt-2 p-4 rounded-xl font-bold text-white transition-all shadow-lg active:scale-95 ${
          type === 'income' 
            ? 'bg-green-600 hover:bg-green-700 shadow-green-100' 
            : 'bg-blue-600 hover:bg-blue-700 shadow-blue-100'
        } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {loading ? 'Menyimpan...' : 'Simpan Transaksi'}
      </button>
    </form>
  );
}