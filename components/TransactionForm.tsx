"use client"
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function TransactionForm() {
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState(0);
  const [category, setCategory] = useState('Lifestyle (Makan/Jajan)');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data, error } = await supabase
      .from('transactions')
      .insert([
        { keterangan: desc, outcome: amount, kategori: category, tanggal: new Date() }
      ]);
    
    if (!error) alert("Data berhasil disimpan!");
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
      <h2 className="text-lg font-semibold mb-4 text-gray-700">Tambah Transaksi Baru</h2>
      <div className="space-y-4">
        <input 
          type="text" 
          placeholder="Keterangan (misal: Beli Kopi)" 
          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          onChange={(e) => setDesc(e.target.value)}
        />
        <input 
          type="number" 
          placeholder="Nominal (Rp)" 
          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          onChange={(e) => setAmount(Number(e.target.value))}
        />
        <select 
          className="w-full p-3 border rounded-lg bg-white"
          onChange={(e) => setCategory(e.target.value)}
        >
          <option>Kebutuhan Pokok</option>
          <option>Lifestyle (Makan/Jajan)</option>
          <option>Transport</option>
          <option>Saving/Invest</option>
        </select>
        <button className="w-full bg-blue-600 text-white p-3 rounded-lg font-bold hover:bg-blue-700 transition">
          Simpan Transaksi
        </button>
      </div>
    </form>
  );
}