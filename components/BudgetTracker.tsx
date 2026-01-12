import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

interface Transaction {
  kategori: string;
  outcome: number;
  saving?: number;
}

interface Budget {
  kategori: string;
  limit: number;
  id?: string;
}

const DEFAULT_BUDGETS = [
  { kategori: 'Kebutuhan Pokok', limit: 3000000 },
  { kategori: 'Lifestyle (Makan/Jajan)', limit: 1500000 },
  { kategori: 'Transport', limit: 500000 },
  { kategori: 'Personal Care', limit: 300000 },
];

export default function BudgetTracker({ transactions, isDark, user }: { transactions: Transaction[], isDark: boolean, user: User }) {
  const [budgets, setBudgets] = useState<Budget[]>(DEFAULT_BUDGETS);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load from Supabase
  useEffect(() => {
    fetchBudgets();
  }, [user.id]);

  const fetchBudgets = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      if (data && data.length > 0) {
        // Map DB fields to component state
        const mapped = data.map(b => ({
          id: b.id,
          kategori: b.category,
          limit: Number(b.limit_amount)
        }));
        
        // Ensure we keep all default categories if some are missing in DB
        const merged = DEFAULT_BUDGETS.map(def => {
          const found = mapped.find(m => m.kategori === def.kategori);
          return found || def;
        });

        setBudgets(merged);
      }
    } catch (error) {
      console.error("Failed to load budgets from cloud", error);
    } finally {
      setLoading(false);
    }
  };

  const saveBudgets = async () => {
    setLoading(true);
    try {
      // Upsert all budgets for this user
      const toUpsert = budgets.map(b => ({
        user_id: user.id,
        category: b.kategori,
        limit_amount: b.limit
      }));

      const { error } = await supabase
        .from('budgets')
        .upsert(toUpsert, { onConflict: 'user_id,category' });

      if (error) throw error;
      
      setIsEditing(false);
      await fetchBudgets(); // Refresh to get IDs
    } catch (error: any) {
      alert("Gagal sinkronisasi budget: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateLimit = (index: number, newLimit: string) => {
    const newBudgets = [...budgets];
    newBudgets[index].limit = Number(newLimit);
    setBudgets(newBudgets);
  };

  const spendingByCategory = transactions
    .filter(t => t.outcome > 0)
    .reduce((acc: any, curr) => {
      acc[curr.kategori] = (acc[curr.kategori] || 0) + curr.outcome;
      return acc;
    }, {});

  const totalSaving = transactions.reduce((acc, curr) => acc + (curr.saving || 0), 0);
  const totalBudgetLimit = budgets.reduce((acc, curr) => acc + curr.limit, 0);

  return (
    <div className={`p-8 rounded-[2.5rem] shadow-xl border transition-all duration-500 relative overflow-hidden ${
      isDark ? 'glass-dark border-white/5 shadow-black/20' : 'glass border-white shadow-slate-200/50'
    }`}>
      {/* Decorative Blur */}
      <div className="absolute -left-12 -bottom-12 w-32 h-32 bg-indigo-500/10 rounded-full blur-[80px] opacity-20" />

      <div className="flex justify-between items-center mb-8 relative z-10 shrink-0">
        <div>
          <h3 className={`text-sm font-black uppercase tracking-[0.2em] ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>Target Analytics</h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Management Cloud Anggaran</p>
        </div>
        <button 
          onClick={() => isEditing ? saveBudgets() : setIsEditing(true)}
          disabled={loading}
          className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${
            isEditing 
              ? 'bg-green-500 text-white shadow-lg shadow-green-500/20' 
              : isDark ? 'bg-slate-800 text-slate-400 hover:text-white border border-white/5' : 'bg-slate-100 text-slate-500 hover:bg-slate-200 border border-slate-200'
          } ${loading ? 'opacity-50' : ''}`}
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : isEditing ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
            </svg>
          )}
        </button>
      </div>

      {loading && budgets[0].limit === 3000000 && budgets[3].limit === 300000 ? (
         <div className="absolute inset-0 z-20 bg-slate-900/10 backdrop-blur-[2px] flex items-center justify-center">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500 animate-pulse">Syncing Cloud...</p>
         </div>
      ) : null}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 mb-8 relative z-10">
        <div className={`p-5 rounded-2xl border transition-all hover:scale-[1.02] ${
          isDark ? 'bg-blue-500/5 border-blue-500/20' : 'bg-blue-50/50 border-blue-100'
        }`}>
          <p className="text-[9px] font-black text-blue-500 uppercase tracking-[0.2em] mb-2">Total Saving</p>
          <div className="flex items-baseline gap-1 overflow-hidden">
            <span className="text-[10px] font-bold text-blue-500 flex-shrink-0">Rp</span>
            <p className={`text-base font-black tracking-tighter truncate ${
              isDark ? 'text-blue-400' : 'text-blue-600'
            }`}>{totalSaving.toLocaleString('id-ID')}</p>
          </div>
        </div>

        <div className={`p-5 rounded-2xl border transition-all hover:scale-[1.02] ${
          isDark ? 'bg-indigo-500/5 border-indigo-500/20' : 'bg-indigo-50/50 border-indigo-100'
        }`}>
          <p className="text-[9px] font-black text-indigo-500 uppercase tracking-[0.2em] mb-2">Total Anggaran</p>
          <div className="flex items-baseline gap-1 overflow-hidden">
            <span className="text-[10px] font-bold text-indigo-500 flex-shrink-0">Rp</span>
            <p className={`text-base font-black tracking-tighter truncate ${
              isDark ? 'text-indigo-400' : 'text-indigo-600'
            }`}>{totalBudgetLimit.toLocaleString('id-ID')}</p>
          </div>
        </div>
      </div>

      <div className={`h-px mb-8 relative z-10 ${isDark ? 'bg-white/5' : 'bg-slate-200'}`} />

      <div className="space-y-6 relative z-10">
        {budgets.map((budget, index) => {
          const spent = spendingByCategory[budget.kategori] || 0;
          const percent = Math.min((spent / budget.limit) * 100, 100);
          const isOver = spent > budget.limit;

          return (
            <div key={budget.kategori} className="group">
              <div className="flex justify-between items-start mb-2.5 px-0.5">
                <div className="flex-1">
                  <h4 className={`text-[11px] font-black uppercase tracking-[0.15em] mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{budget.kategori}</h4>
                  <div className="flex items-baseline gap-1.5">
                    {isEditing ? (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-black text-blue-500">Rp</span>
                        <input 
                          type="number"
                          value={budget.limit}
                          onChange={(e) => updateLimit(index, e.target.value)}
                          className={`w-28 px-2 py-1 text-right font-black rounded-lg border outline-none text-sm bg-transparent ${
                            isDark ? 'border-white/10 text-white' : 'border-slate-200 text-slate-900'
                          }`}
                        />
                      </div>
                    ) : (
                      <>
                        <span className="text-[10px] font-bold text-blue-500">Rp</span>
                        <p className={`text-lg font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>{spent.toLocaleString('id-ID')}</p>
                        <span className="text-[10px] font-bold text-slate-400 ml-1">/ {(budget.limit / 1000).toFixed(0)}k</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-black ${isOver ? 'text-red-500' : 'text-blue-500'}`}>
                    {percent.toFixed(0)}%
                  </p>
                </div>
              </div>

              <div className={`h-3 w-full rounded-full overflow-hidden flex ${isDark ? 'bg-slate-950/50' : 'bg-slate-100'}`}>
                <div 
                  className={`h-full rounded-full transition-all duration-1000 relative ${
                    isOver ? 'bg-gradient-to-r from-red-500 to-rose-600 shadow-[0_0_12px_rgba(239,68,68,0.4)]' : 
                    percent > 80 ? 'bg-gradient-to-r from-amber-500 to-orange-600 shadow-[0_0_10px_rgba(245,158,11,0.3)]' :
                    'bg-gradient-to-r from-blue-500 to-indigo-600 shadow-[0_0_12px_rgba(59,130,246,0.4)]'
                  }`}
                  style={{ width: `${percent}%` }}
                >
                  <div className="absolute top-0 right-0 h-full w-5 bg-white/20 blur-[3px] skew-x-[30deg]" />
                </div>
              </div>
              {isOver && !isEditing && (
                <p className="text-[9px] text-red-500 font-black uppercase tracking-widest mt-2 px-0.5 animate-pulse">⚠ Budget Exceeded!</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
