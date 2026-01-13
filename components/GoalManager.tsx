"use client"
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import ConfirmationModal from './ConfirmationModal';
import MinimalistIcon from './MinimalistIcon';
import { Pencil, Trash2, Calendar } from 'lucide-react';

interface Goal {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  wallet_id: string | null;
  deadline: string | null;
  icon: string;
  color: string;
  is_completed: boolean;
}

const ICON_OPTIONS = ['🎯', '🏠', '🚗', '🏖️', '💍', '🎓', '💻', '🚲', '👶', '🏥', '💰', '💎'];
const COLOR_OPTIONS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export default function GoalManager({ user, isDark, onClose }: { user: User, isDark: boolean, onClose: () => void }) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [wallets, setWallets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState<Goal | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    target_amount: 0,
    current_amount: 0,
    wallet_id: '' as string | null,
    deadline: '',
    icon: '🎯',
    color: '#3b82f6'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    
    // Fetch Goals
    const { data: gData } = await supabase
      .from('financial_goals')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    // Fetch Wallets (for linking)
    const { data: wData } = await supabase
      .from('wallet_balances')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (gData) setGoals(gData);
    if (wData) setWallets(wData);
    
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      ...formData,
      user_id: user.id,
      deadline: formData.deadline || null,
      wallet_id: formData.wallet_id || null
    };

    if (editingId) {
      const { error } = await supabase.from('financial_goals').update(payload).eq('id', editingId);
      if (error) alert(error.message);
    } else {
      const { error } = await supabase.from('financial_goals').insert(payload);
      if (error) alert(error.message);
    }

    fetchData();
    resetForm();
    setLoading(false);
  };

  const handleDelete = (goal: Goal) => {
    setConfirmingDelete(goal);
  };

  const executeDelete = async (goal: Goal) => {
    setConfirmingDelete(null);
    const { error } = await supabase.from('financial_goals').delete().eq('id', goal.id);
    if (!error) fetchData();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      target_amount: 0,
      current_amount: 0,
      wallet_id: '',
      deadline: '',
      icon: '🎯',
      color: '#3b82f6'
    });
    setEditingId(null);
    setIsAdding(false);
  };

  const calculateProgress = (goal: Goal) => {
    let current = goal.current_amount;
    
    // If linked to a wallet, use the wallet's balance
    if (goal.wallet_id) {
      const wallet = wallets.find(w => w.id === goal.wallet_id);
      if (wallet) {
        current = wallet.current_balance || 0;
      }
    }

    const percentage = (current / goal.target_amount) * 100;
    return Math.min(percentage, 100);
  };

  const getCurrentDisplayAmount = (goal: Goal) => {
    if (goal.wallet_id) {
      const wallet = wallets.find(w => w.id === goal.wallet_id);
      return wallet?.current_balance || 0;
    }
    return goal.current_amount;
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className={`w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-[2.5rem] border shadow-2xl animate-in zoom-in-95 duration-300 ${
        isDark ? 'bg-slate-900/95 border-white/5 shadow-black/50' : 'bg-white/95 border-slate-200 shadow-slate-200/50'
      }`}>
        {/* Header */}
        <div className={`sticky top-0 p-8 border-b backdrop-blur-md z-10 ${
          isDark ? 'bg-slate-900/80 border-white/5' : 'bg-white/80 border-slate-200'
        }`}>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                <span className="text-2xl">🎯</span>
              </div>
              <div>
                <h2 className={`text-xl font-black uppercase tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Financial Goals
                </h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Set Your Saving Targets</p>
              </div>
            </div>
            <button onClick={onClose} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isDark ? 'bg-white/5 text-slate-400 hover:text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
            </button>
          </div>
        </div>

        <div className="p-8">
          {!isAdding ? (
            <div className="space-y-8">
              <div className="flex justify-between items-center">
                 <div className="flex items-center gap-3">
                  <div className="w-1.5 h-6 bg-blue-500 rounded-full" />
                  <h3 className={`text-sm font-black uppercase tracking-widest ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Active Goals ({goals.length})
                  </h3>
                </div>
                <button onClick={() => setIsAdding(true)} className="px-6 py-3 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/30 active:scale-95">
                  + New Goal
                </button>
              </div>

              {loading && goals.length === 0 ? (
                <div className="text-center py-20 animate-pulse text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Loading your dreams...</div>
              ) : goals.length === 0 ? (
                <div className={`p-16 text-center rounded-[2.5rem] border border-dashed ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
                  <p className="text-sm font-bold opacity-40 uppercase tracking-widest">You haven't set any goals yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {goals.map((g) => {
                    const progress = calculateProgress(g);
                    const current = getCurrentDisplayAmount(g);
                    return (
                      <div key={g.id} className={`p-6 rounded-[2rem] border transition-all hover:scale-[1.02] group relative overflow-hidden ${isDark ? 'bg-slate-800/40 border-white/5' : 'bg-slate-50 border-slate-200'}`}>
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-2xl border ${isDark ? 'bg-white/5 border-white/5' : 'bg-white border-slate-200'}`}>
                              <MinimalistIcon icon={g.icon} size={32} style={{ color: g.color }} />
                            </div>
                            <div>
                              <h4 className={`text-base font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>{g.name}</h4>
                              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                                {g.wallet_id ? `Linked to: ${wallets.find(w => w.id === g.wallet_id)?.name}` : 'Manual Progress'}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => { 
                              setEditingId(g.id); 
                              setFormData({
                                name: g.name,
                                target_amount: g.target_amount,
                                current_amount: g.current_amount,
                                wallet_id: g.wallet_id || '',
                                deadline: g.deadline || '',
                                icon: g.icon,
                                color: g.color
                              });
                              setIsAdding(true); 
                            }} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${isDark ? 'bg-white/5 text-slate-400 hover:text-white' : 'bg-white text-slate-500 hover:bg-slate-100 border border-slate-200'}`}>
                              <Pencil size={14} />
                            </button>
                            <button onClick={() => handleDelete(g)} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${isDark ? 'bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}>
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="flex justify-between items-baseline">
                            <div className="space-y-0.5">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Progress</p>
                              <p className={`text-lg font-black tracking-tighter ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                Rp {current.toLocaleString('id-ID')} <span className="text-xs opacity-40 font-bold">/ {g.target_amount.toLocaleString('id-ID')}</span>
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Status</p>
                              <p className="text-sm font-black text-blue-500">{progress.toFixed(1)}%</p>
                            </div>
                          </div>
                          
                          <div className={`h-2.5 w-full rounded-full overflow-hidden ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`}>
                            <div 
                              className="h-full transition-all duration-1000 shadow-lg" 
                              style={{ width: `${progress}%`, backgroundColor: g.color }}
                            />
                          </div>
                        </div>

                        {g.deadline && (
                          <div className={`mt-4 pt-4 border-t flex items-center justify-between ${isDark ? 'border-white/5' : 'border-slate-200'}`}>
                            <p className="text-[8px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                              <Calendar size={10} /> Deadline: {new Date(g.deadline).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8 animate-in slide-in-from-right-4 duration-500">
               <div className="flex justify-between items-center mb-4">
                <h3 className={`text-sm font-black uppercase tracking-widest ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  {editingId ? 'Edit Dream Target' : 'Configure New Target'}
                </h3>
                <button type="button" onClick={resetForm} className={`text-xs font-black uppercase tracking-widest ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}>Cancel</button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest mb-3 opacity-60">Goal Name</label>
                    <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required className={`w-full px-5 py-4 rounded-2xl border outline-none transition-all ${isDark ? 'bg-slate-800 border-white/5 text-white' : 'bg-slate-50 border-slate-200'}`} placeholder="e.g., Dream House, New Car" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest mb-3 opacity-60">Target Amount (IDR)</label>
                      <input type="number" value={formData.target_amount} onChange={(e) => setFormData({ ...formData, target_amount: Number(e.target.value) })} required className={`w-full px-5 py-4 rounded-2xl border outline-none transition-all ${isDark ? 'bg-slate-800 border-white/5 text-white' : 'bg-slate-50 border-slate-200'}`} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest mb-3 opacity-60">Manual Deposit (IDR)</label>
                      <input type="number" value={formData.current_amount} onChange={(e) => setFormData({ ...formData, current_amount: Number(e.target.value) })} className={`w-full px-5 py-4 rounded-2xl border outline-none transition-all ${isDark ? 'bg-slate-800 border-white/5 text-white' : 'bg-slate-50 border-slate-200'}`} />
                      <p className="text-[8px] mt-1 opacity-50">Only used if no wallet is linked.</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest mb-3 opacity-60">Link to Wallet (Auto-track)</label>
                    <select value={formData.wallet_id || ''} onChange={(e) => setFormData({ ...formData, wallet_id: e.target.value })} className={`w-full px-5 py-4 rounded-2xl border outline-none transition-all ${isDark ? 'bg-slate-800 border-white/5 text-white' : 'bg-slate-50 border-slate-200'}`}>
                      <option value="">Manual Progress (No Link)</option>
                      {wallets.map(w => <option key={w.id} value={w.id}>{w.name} (Rp {w.current_balance?.toLocaleString('id-ID')})</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest mb-3 opacity-60">Target Deadline</label>
                    <input type="date" value={formData.deadline} onChange={(e) => setFormData({ ...formData, deadline: e.target.value })} className={`w-full px-5 py-4 rounded-2xl border outline-none transition-all ${isDark ? 'bg-slate-800 border-white/5 text-white' : 'bg-slate-50 border-slate-200'}`} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest mb-3 opacity-60">Select Icon</label>
                    <div className="grid grid-cols-6 gap-2">
                      {ICON_OPTIONS.map((item) => (
                        <button key={item} type="button" onClick={() => setFormData({ ...formData, icon: item })} className={`p-3 rounded-xl border transition-all flex items-center justify-center ${formData.icon === item ? 'bg-blue-600 border-blue-600 scale-110 text-white' : isDark ? 'bg-slate-800 border-white/5 text-slate-400' : 'bg-white border-slate-200 text-slate-500'}`}>
                          <MinimalistIcon icon={item} size={24} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest mb-3 opacity-60">Theme Color</label>
                    <div className="grid grid-cols-8 gap-2">
                      {COLOR_OPTIONS.map((color) => (
                        <button key={color} type="button" onClick={() => setFormData({ ...formData, color })} className={`w-full h-8 rounded-lg border-2 transition-all ${formData.color === color ? 'border-white scale-110' : 'border-transparent'}`} style={{ backgroundColor: color }} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-8">
                <button type="submit" disabled={loading} className="w-full py-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-black uppercase tracking-[0.2em] rounded-2xl hover:scale-[1.02] shadow-xl shadow-blue-500/20 active:scale-95 transition-all">
                  {loading ? 'Processing Target...' : editingId ? 'Update Target' : 'Launch New Dream Target'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      <ConfirmationModal 
        isOpen={!!confirmingDelete}
        title="Hapus Target Keuangan"
        message={`Apakah Anda yakin ingin menghapus target "${confirmingDelete?.name}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Hapus Permanen"
        onConfirm={() => {
          if (confirmingDelete) executeDelete(confirmingDelete);
        }}
        onCancel={() => setConfirmingDelete(null)}
        isDark={isDark}
        type="danger"
      />
    </div>
  );
}
