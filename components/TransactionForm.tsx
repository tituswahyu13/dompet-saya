"use client"
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function TransactionForm({ onRefresh }: { onRefresh: () => void }) {
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Lifestyle (Makan/Jajan)');
  const [type, setType] = useState('outcome');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      keterangan: desc,
      kategori: category,
      tanggal: new Date().toISOString(),
      [type]: Number(amount)
    };

    const { error } = await supabase.from('transactions').insert([payload]);
    
    if (!error) {
      setDesc('');
      setAmount('');
      onRefresh();
      alert("Data berhasil disimpan!");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-md mb-8 border border-gray-100">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input 
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="Keterangan (misal: Beli Kopi)" 
          className="p-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
        <input 
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Nominal (Rp)" 
          className="p-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
        <select 
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="p-3 border rounded-lg bg-white"
        >
          <option>Pendapatan</option>
          <option>Kebutuhan Pokok</option>
          <option>Lifestyle (Makan/Jajan)</option>
          <option>Transport</option>
          <option>Saving/Invest</option>
          <option>Others</option>
        </select>
        <select 
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="p-3 border rounded-lg bg-white"
        >
          <option value="outcome">Pengeluaran</option>
          <option value="income">Pendapatan</option>
        </select>
      </div>
      <button className="w-full mt-4 bg-blue-600 text-white p-3 rounded-lg font-bold hover:bg-blue-700 transition">
        Simpan Transaksi
      </button>
    </form>
  );
}