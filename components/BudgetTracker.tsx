"use client"
import { useState, useEffect } from 'react';

interface Transaction {
  kategori: string;
  outcome: number;
}

const DEFAULT_BUDGETS = [
  { kategori: 'Kebutuhan Pokok', limit: 3000000 },
  { kategori: 'Lifestyle (Makan/Jajan)', limit: 1500000 },
  { kategori: 'Transport', limit: 500000 },
  { kategori: 'Personal Care', limit: 300000 },
];

export default function BudgetTracker({ transactions, isDark }: { transactions: Transaction[], isDark: boolean }) {
  const [budgets, setBudgets] = useState(DEFAULT_BUDGETS);
  const [isEditing, setIsEditing] = useState(false);

  // Load from LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem('dompet_budgets');
    if (saved) {
      try {
        setBudgets(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load budgets", e);
      }
    }
  }, []);

  const saveBudgets = () => {
    localStorage.setItem('dompet_budgets', JSON.stringify(budgets));
    setIsEditing(false);
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

  return (
    <div className={`p-6 rounded-2xl shadow-sm border mb-10 transition-colors duration-300 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
      <div className="flex justify-between items-center mb-6">
        <h3 className={`text-sm font-bold flex items-center gap-2 ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
          Limit Anggaran Bulanan
          <button 
            onClick={() => isEditing ? saveBudgets() : setIsEditing(true)}
            className={`p-1.5 rounded-lg transition-all ${
              isEditing ? 'bg-green-600 text-white hover:bg-green-700' : isDark ? 'bg-slate-700 text-slate-400 hover:text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}
          >
            {isEditing ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        </h3>
        <span className="text-[10px] font-normal text-slate-400">Target Est.</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {budgets.map((budget, index) => {
          const spent = spendingByCategory[budget.kategori] || 0;
          const percent = Math.min((spent / budget.limit) * 100, 100);
          const isOver = spent > budget.limit;

          return (
            <div key={budget.kategori} className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className={`font-semibold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{budget.kategori}</span>
                {isEditing ? (
                  <div className="flex items-center gap-1">
                    <span className="text-slate-400">Rp</span>
                    <input 
                      type="number"
                      value={budget.limit}
                      onChange={(e) => updateLimit(index, e.target.value)}
                      className={`w-24 p-1 text-right font-bold rounded-lg border outline-none ${
                        isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    />
                  </div>
                ) : (
                  <span className={`font-bold ${isOver ? 'text-red-500' : isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                    Rp {spent.toLocaleString('id-ID')} / {budget.limit.toLocaleString('id-ID')}
                  </span>
                )}
              </div>
              <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-slate-700' : 'bg-slate-100'}`}>
                <div 
                  className={`h-full transition-all duration-1000 ${
                    isOver ? 'bg-red-500' : percent > 80 ? 'bg-amber-500' : 'bg-blue-500'
                  }`}
                  style={{ width: `${percent}%` }}
                />
              </div>
              {isOver && !isEditing && (
                <p className="text-[10px] text-red-500 font-medium">⚠️ Melewati batas anggaran!</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
