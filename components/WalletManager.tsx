"use client"
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import MinimalistIcon from './MinimalistIcon';
import { X, Pencil, Trash2, Plus, CreditCard as CardIcon } from 'lucide-react';

interface Wallet {
  id: string;
  name: string;
  type: string;
  icon: string;
  color: string;
  initial_balance: number;
  is_active: boolean;
  current_balance?: number;
}

const WALLET_TYPES = [
  { value: 'cash', label: 'Cash', defaultIcon: '💵' },
  { value: 'bank', label: 'Bank', defaultIcon: '🏦' },
  { value: 'ewallet', label: 'E-Wallet', defaultIcon: '📱' },
  { value: 'investment', label: 'Investment', defaultIcon: '📈' },
  { value: 'other', label: 'Other', defaultIcon: '💰' },
];

const ICON_OPTIONS = ['💵', '🏦', '📱', '💳', '💰', '📈', '🏪', '🎯', '💎', '🔐'];
const COLOR_OPTIONS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6', '#6366f1'];

export default function WalletManager({ user, isDark, onClose }: { user: User, isDark: boolean, onClose: () => void }) {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    type: 'cash',
    icon: '💵',
    color: '#10b981',
    initial_balance: 0,
  });

  useEffect(() => {
    fetchWallets();
  }, []);

  const fetchWallets = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('wallet_balances')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: true });

    if (data) setWallets(data);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingId) {
      // Update existing wallet
      const { error } = await supabase
        .from('wallets')
        .update({
          name: formData.name,
          type: formData.type,
          icon: formData.icon,
          color: formData.color,
        })
        .eq('id', editingId);

      if (!error) {
        fetchWallets();
        resetForm();
      } else {
        alert('Gagal update wallet: ' + error.message);
      }
    } else {
      // Create new wallet
      const { error } = await supabase
        .from('wallets')
        .insert({
          user_id: user.id,
          name: formData.name,
          type: formData.type,
          icon: formData.icon,
          color: formData.color,
          initial_balance: formData.initial_balance,
          is_active: true,
        });

      if (!error) {
        fetchWallets();
        resetForm();
        setIsAdding(false);
      } else {
        alert('Gagal membuat wallet: ' + error.message);
      }
    }
  };

  const handleEdit = (wallet: Wallet) => {
    setFormData({
      name: wallet.name,
      type: wallet.type,
      icon: wallet.icon,
      color: wallet.color,
      initial_balance: wallet.initial_balance,
    });
    setEditingId(wallet.id);
    setIsAdding(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Hapus wallet "${name}"? Transaksi yang terkait akan tetap ada tapi tidak ter-link ke wallet.`)) return;
    
    const { error } = await supabase
      .from('wallets')
      .update({ is_active: false })
      .eq('id', id);

    if (!error) {
      fetchWallets();
    } else {
      alert('Gagal menghapus wallet: ' + error.message);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'cash',
      icon: '💵',
      color: '#10b981',
      initial_balance: 0,
    });
    setEditingId(null);
    setIsAdding(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className={`w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-[2rem] border shadow-2xl ${
        isDark ? 'bg-slate-950 border-white/10' : 'bg-white border-slate-200'
      }`}>
        {/* Header */}
        <div className={`sticky top-0 p-6 border-b backdrop-blur-md ${
          isDark ? 'bg-slate-950/80 border-white/10' : 'bg-white/80 border-slate-200'
        }`}>
          <div className="flex justify-between items-center">
            <div>
              <h2 className={`text-xl font-black uppercase tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Wallet Management
              </h2>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Kelola Dompet Anda</p>
            </div>
            <button 
              onClick={onClose}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                isDark ? 'bg-slate-800 text-slate-400 hover:text-white border border-white/5' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Wallet List */}
          {!isAdding && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className={`text-sm font-black uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Dompet Anda ({wallets.length})
                </h3>
                <button
                  onClick={() => setIsAdding(true)}
                  className="px-4 py-2 bg-rose-600 text-white text-[10px] sm:text-xs font-black uppercase tracking-wider rounded-xl hover:bg-rose-700 transition-all shadow-lg shadow-rose-500/20 flex items-center gap-2"
                >
                  <Plus size={14} /> Tambah Wallet
                </button>
              </div>

              {loading ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 border-4 border-rose-500/20 border-t-rose-500 rounded-full animate-spin mx-auto" />
                </div>
              ) : wallets.length === 0 ? (
                <div className={`text-center py-12 rounded-2xl border ${isDark ? 'border-white/5 bg-white/5' : 'border-slate-200 bg-slate-50'}`}>
                  <div className="flex justify-center mb-3">
                    <CardIcon size={40} className="opacity-20" />
                  </div>
                  <p className={`text-sm font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Belum ada wallet. Buat wallet pertama Anda!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {wallets.map((wallet) => (
                    <div
                      key={wallet.id}
                      className={`p-5 rounded-2xl border transition-all hover:scale-[1.02] ${
                        isDark ? 'bg-slate-900/50 border-white/10' : 'bg-slate-50 border-slate-200'
                      }`}
                      style={{ borderLeftWidth: '4px', borderLeftColor: wallet.color }}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-white/5 border-white/5' : 'bg-white border-slate-200'}`}>
                            <MinimalistIcon icon={wallet.icon} size={24} style={{ color: wallet.color }} />
                          </div>
                          <div>
                            <h4 className={`text-sm font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                              {wallet.name}
                            </h4>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              {WALLET_TYPES.find(t => t.value === wallet.type)?.label || wallet.type}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(wallet)}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                              isDark ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20' : 'bg-blue-50 text-rose-600 hover:bg-rose-100'
                            }`}
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(wallet.id, wallet.name)}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                              isDark ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' : 'bg-red-50 text-red-600 hover:bg-red-100'
                            }`}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                      <div className={`pt-3 border-t ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Current Balance</p>
                        <div className="flex items-baseline gap-1">
                          <span className="text-xs font-bold" style={{ color: wallet.color }}>Rp</span>
                          <p className={`text-lg font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            {(wallet.current_balance || 0).toLocaleString('id-ID')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Add/Edit Form */}
          {isAdding && (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="flex justify-between items-center">
                <h3 className={`text-sm font-black uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  {editingId ? 'Edit Wallet' : 'Tambah Wallet Baru'}
                </h3>
                <button
                  type="button"
                  onClick={resetForm}
                  className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}
                >
                  Batal
                </button>
              </div>

              <div className={`p-6 rounded-2xl border ${isDark ? 'bg-slate-900/50 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                {/* Name */}
                <div className="mb-4">
                  <label className={`block text-xs font-black uppercase tracking-wider mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Nama Wallet
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Contoh: Bank BCA, GoPay, Dompet Harian"
                    required
                    className={`w-full px-4 py-3 rounded-xl border outline-none transition-all ${
                      isDark ? 'bg-slate-800 border-white/10 text-white placeholder-slate-500' : 'bg-white border-slate-200 text-slate-900'
                    }`}
                  />
                </div>

                {/* Type */}
                <div className="mb-4">
                  <label className={`block text-xs font-black uppercase tracking-wider mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Tipe Wallet
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {WALLET_TYPES.map((type) => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, type: type.value, icon: type.defaultIcon })}
                        className={`p-3 rounded-xl border text-xs font-bold transition-all ${
                          formData.type === type.value
                            ? 'bg-rose-600 text-white border-blue-600'
                            : isDark ? 'bg-slate-800 border-white/10 text-slate-300 hover:border-rose-500' : 'bg-white border-slate-200 text-slate-700 hover:border-rose-500'
                        }`}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Icon */}
                <div className="mb-4">
                  <label className={`block text-xs font-black uppercase tracking-wider mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Icon
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {ICON_OPTIONS.map((icon) => (
                      <button
                        key={icon}
                        type="button"
                        onClick={() => setFormData({ ...formData, icon })}
                        className={`p-3 rounded-xl border transition-all flex items-center justify-center ${
                          formData.icon === icon
                            ? 'bg-rose-600 border-blue-600 scale-110 text-white'
                            : isDark ? 'bg-slate-800 border-white/10 text-slate-400 hover:border-rose-500' : 'bg-white border-slate-200 text-slate-500 hover:border-rose-500'
                        }`}
                      >
                        <MinimalistIcon icon={icon} size={24} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color */}
                <div className="mb-4">
                  <label className={`block text-xs font-black uppercase tracking-wider mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Warna
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {COLOR_OPTIONS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setFormData({ ...formData, color })}
                        className={`h-12 rounded-xl border-4 transition-all ${
                          formData.color === color ? 'border-white scale-110' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                {/* Initial Balance (only for new wallet) */}
                {!editingId && (
                  <div className="mb-4">
                    <label className={`block text-xs font-black uppercase tracking-wider mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      Saldo Awal (Opsional)
                    </label>
                    <input
                      type="number"
                      value={formData.initial_balance}
                      onChange={(e) => setFormData({ ...formData, initial_balance: Number(e.target.value) })}
                      placeholder="0"
                      className={`w-full px-4 py-3 rounded-xl border outline-none transition-all ${
                        isDark ? 'bg-slate-800 border-white/10 text-white placeholder-slate-500' : 'bg-white border-slate-200 text-slate-900'
                      }`}
                    />
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  className="w-full py-3 bg-rose-600 text-white text-sm font-black uppercase tracking-wider rounded-xl hover:bg-rose-700 transition-all shadow-lg shadow-rose-500/20"
                >
                  {editingId ? 'Update Wallet' : 'Buat Wallet'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
