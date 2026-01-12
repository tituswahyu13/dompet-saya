"use client"
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

const CATEGORIES = {
  income: ['Saldo Awal', 'Pendapatan', 'Bonus', 'Investasi'],
  outcome: ['Kebutuhan Pokok', 'Lifestyle (Makan/Jajan)', 'Personal Care', 'Transport', 'Cicilan', 'Others'],
  saving: ['Tabungan', 'Dana Darurat', 'Investasi Saham/Emas', 'Others']
};

import { User } from '@supabase/supabase-js';

export default function TransactionForm({ onRefresh, isDark, editData, onCancel, user }: { 
  onRefresh: () => void, 
  isDark: boolean,
  editData?: any,
  onCancel?: () => void,
  user: User
}) {
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [type, setType] = useState<'income' | 'outcome' | 'saving'>('outcome');
  const [category, setCategory] = useState('Lifestyle (Makan/Jajan)');
  const [loading, setLoading] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  // Sync state when editData changes
  useEffect(() => {
    if (editData) {
      setDesc(editData.keterangan);
      setAmount((editData.income || editData.outcome || editData.saving).toString());
      setCategory(editData.kategori || 'Others');
      setDate(editData.tanggal);
      if (editData.income > 0) setType('income');
      else if (editData.saving > 0) setType('saving');
      else setType('outcome');
      setErrorStatus(null);
    } else {
      setDesc('');
      setAmount('');
      setDate(new Date().toISOString().split('T')[0]);
      setType('outcome');
      setCategory('Lifestyle (Makan/Jajan)');
      setErrorStatus(null);
    }
  }, [editData]);

  // Sync category when type changes (only if not editing)
  useEffect(() => {
    if (!editData) {
      if (type === 'income') {
        setCategory('Pendapatan');
      } else if (type === 'saving') {
        setCategory('Tabungan');
      } else {
        setCategory('Lifestyle (Makan/Jajan)');
      }
    }
  }, [type, editData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (Number(amount) <= 0) {
      setErrorStatus("Nominal harus lebih dari 0");
      return;
    }

    setLoading(true);
    setErrorStatus(null);
    const numAmount = Number(amount);
    const income = type === 'income' ? numAmount : 0;
    const outcome = type === 'outcome' ? numAmount : 0;
    const saving = type === 'saving' ? numAmount : 0;

    const payload = {
      keterangan: desc,
      kategori: category,
      tanggal: date,
      income,
      outcome,
      saving,
      user_id: user.id
    };

    let error;
    if (editData?.id) {
      const { error: err } = await supabase.from('transaction').update(payload).eq('id', editData.id);
      error = err;
    } else {
      const { error: err } = await supabase.from('transaction').insert([payload]);
      error = err;
    }
    
    setLoading(false);
    if (!error) {
      setDesc('');
      setAmount('');
      if (onCancel) onCancel();
      onRefresh();
    } else {
      setErrorStatus("Gagal menyimpan: " + error.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`p-8 rounded-[2.5rem] shadow-xl border transition-all duration-500 relative overflow-hidden ${
      isDark ? 'glass-dark border-white/5' : 'glass border-white/50'
    }`}>
      {/* Decorative Glow */}
      <div className={`absolute -top-24 -right-24 w-48 h-48 rounded-full blur-[60px] opacity-20 ${
        type === 'income' ? 'bg-green-500' : type === 'saving' ? 'bg-blue-500' : 'bg-red-500'
      }`} />

      <div className="flex justify-between items-center mb-8 relative z-10">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full animate-pulse ${
            type === 'income' ? 'bg-green-500' : type === 'saving' ? 'bg-blue-500' : 'bg-red-500'
          }`} />
          <label className={`text-xs font-black uppercase tracking-[0.2em] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {editData ? 'Mode Koreksi' : 'Kategori Input'}
          </label>
        </div>
        {editData && (
          <button 
            type="button"
            onClick={onCancel}
            className="text-[10px] font-black text-red-500 hover:text-red-400 transition-colors uppercase tracking-widest"
          >
            Batal
          </button>
        )}
      </div>

      <div className="space-y-6 relative z-10">
        <div className="grid grid-cols-3 gap-3">
          {[
            { id: 'income', label: 'Masuk', color: 'green' },
            { id: 'outcome', label: 'Keluar', color: 'red' },
            { id: 'saving', label: 'Simpan', color: 'blue' }
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => { setType(t.id as any); setErrorStatus(null); }}
              className={`py-3 px-2 rounded-2xl text-[10px] font-black transition-all border-2 flex flex-col items-center gap-1 ${
                type === t.id 
                  ? (t.color === 'green' ? 'bg-green-500/10 text-green-500 border-green-500/50' : 
                     t.color === 'red' ? 'bg-red-500/10 text-red-500 border-red-500/50' : 
                     'bg-blue-500/10 text-blue-500 border-blue-500/50')
                  : (isDark ? 'bg-slate-900/50 text-slate-500 border-transparent hover:bg-slate-800' : 'bg-slate-100/50 text-slate-400 border-transparent hover:bg-slate-200')
              }`}
            >
              <div className={`w-1.5 h-1.5 rounded-full ${type === t.id ? (t.color === 'green' ? 'bg-green-500' : t.color === 'red' ? 'bg-red-500' : 'bg-blue-500') : 'bg-slate-400'}`} />
              {t.label}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Keterangan</label>
            <input 
              value={desc}
              onChange={(e) => { setDesc(e.target.value); setErrorStatus(null); }}
              placeholder="Misal: Investasi Emas" 
              className={`w-full p-4 border rounded-2xl outline-none transition-all text-sm font-medium ${
                isDark ? 'bg-slate-950/50 border-white/5 text-white focus:border-blue-500/50' : 'bg-white/50 border-slate-200 text-slate-900 focus:border-blue-500'
              }`}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Tanggal</label>
              <input 
                type="date"
                value={date}
                onChange={(e) => { setDate(e.target.value); setErrorStatus(null); }}
                className={`w-full p-4 border rounded-2xl outline-none transition-all text-sm font-medium ${
                  isDark ? 'bg-slate-950/50 border-white/5 text-white focus:border-blue-500/50' : 'bg-white/50 border-slate-200 text-slate-900 focus:border-blue-500'
                }`}
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Kategori</label>
              <div className="relative">
                <select 
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className={`w-full p-4 border rounded-2xl outline-none transition-all text-sm font-medium appearance-none cursor-pointer ${
                    isDark ? 'bg-slate-950/50 border-white/5 text-white focus:border-blue-500/50' : 'bg-white/50 border-slate-200 text-slate-900 focus:border-blue-500'
                  }`}
                >
                  {CATEGORIES[type].map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Nominal (Rp)</label>
            <div className="relative">
              <input 
                type="number"
                value={amount}
                onChange={(e) => { setAmount(e.target.value); setErrorStatus(null); }}
                placeholder="0" 
                className={`w-full p-4 pl-12 border rounded-2xl outline-none transition-all text-lg font-black tracking-tighter ${
                  errorStatus && amount && Number(amount) <= 0 ? (isDark ? 'border-red-500/50 bg-red-500/5' : 'border-red-500 bg-red-50') :
                  isDark ? 'bg-slate-950/50 border-white/5 text-white focus:border-blue-500/50' : 'bg-white/50 border-slate-200 text-slate-900 focus:border-blue-500'
                }`}
                required
              />
              <span className="absolute left-5 top-1/2 -translate-y-1/2 text-xs font-black text-blue-500/50">IDR</span>
            </div>
            {errorStatus && <p className="text-[10px] text-red-500 mt-2 px-2 font-black uppercase tracking-widest">{errorStatus}</p>}
          </div>
        </div>

        <button 
          disabled={loading}
          className={`w-full mt-4 p-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] text-white transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2 ${
            editData ? 'bg-slate-900 hover:bg-black' :
            type === 'income' ? 'bg-gradient-to-r from-green-600 to-emerald-600 shadow-green-500/20 hover:shadow-green-500/40' :
            type === 'saving' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 shadow-blue-500/20 hover:shadow-blue-500/40' :
            'bg-gradient-to-r from-red-600 to-rose-600 shadow-red-500/20 hover:shadow-red-500/40'
          } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              {editData ? 'Update Transaksi' : 'Simpan Data'}
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 opacity-70" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
