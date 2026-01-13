"use client"
import { useMemo } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from 'date-fns';

interface Transaction {
  id: string;
  tanggal: string;
  keterangan: string;
  income: number;
  outcome: number;
  saving: number;
  kategori: string;
  is_transfer: boolean;
}

interface AdvancedChartsProps {
  transactions: Transaction[];
  isDark: boolean;
}

export default function AdvancedCharts({ transactions, isDark }: AdvancedChartsProps) {
  // Monthly Trend Data
  const monthlyTrendData = useMemo(() => {
    const last6Months = eachMonthOfInterval({
      start: subMonths(new Date(), 5),
      end: new Date()
    });

    return last6Months.map(month => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      
      const monthTransactions = transactions.filter(t => {
        const txDate = new Date(t.tanggal);
        return txDate >= monthStart && txDate <= monthEnd;
      });

      const income = monthTransactions
        .filter(t => !t.is_transfer)
        .reduce((sum, t) => sum + (t.income || 0), 0);
      
      const outcome = monthTransactions
        .filter(t => !t.is_transfer)
        .reduce((sum, t) => sum + (t.outcome || 0), 0);
      
      const saving = monthTransactions
        .filter(t => !t.is_transfer)
        .reduce((sum, t) => sum + (t.saving || 0), 0);

      return {
        month: format(month, 'MMM yyyy'),
        income: Math.round(income / 1000000), // Convert to millions
        outcome: Math.round(outcome / 1000000),
        saving: Math.round(saving / 1000000)
      };
    });
  }, [transactions]);

  // Category Breakdown Data
  const categoryData = useMemo(() => {
    const categoryMap = new Map<string, number>();
    
    transactions
      .filter(t => !t.is_transfer && t.outcome > 0)
      .forEach(t => {
        const current = categoryMap.get(t.kategori) || 0;
        categoryMap.set(t.kategori, current + t.outcome);
      });

    return Array.from(categoryMap.entries())
      .map(([kategori, total]) => ({
        kategori,
        total: Math.round(total / 1000000) // Convert to millions
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8); // Top 8 categories
  }, [transactions]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className={`p-4 rounded-xl border shadow-lg ${isDark ? 'bg-slate-800 border-white/10' : 'bg-white border-slate-200'}`}>
          <p className={`text-xs font-black uppercase tracking-wider mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm font-bold" style={{ color: entry.color }}>
              {entry.name}: Rp {entry.value}M
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8">
      {/* Monthly Trend Chart */}
      <div className={`p-8 rounded-[2.5rem] border transition-all ${isDark ? 'glass-dark border-white/5' : 'glass border-white'}`}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-1.5 h-6 bg-blue-500 rounded-full" />
          <h3 className={`text-lg font-black uppercase tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            6-Month Financial Trend
          </h3>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={monthlyTrendData}>
            <defs>
              <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorOutcome" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorSaving" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} />
            <XAxis 
              dataKey="month" 
              stroke={isDark ? '#94a3b8' : '#64748b'}
              style={{ fontSize: '11px', fontWeight: 'bold' }}
            />
            <YAxis 
              stroke={isDark ? '#94a3b8' : '#64748b'}
              style={{ fontSize: '11px', fontWeight: 'bold' }}
              label={{ value: 'Juta (IDR)', angle: -90, position: 'insideLeft', style: { fontSize: '10px', fontWeight: 'bold' } }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ fontSize: '12px', fontWeight: 'bold' }}
              iconType="circle"
            />
            <Area 
              type="monotone" 
              dataKey="income" 
              stroke="#10b981" 
              fillOpacity={1}
              fill="url(#colorIncome)"
              strokeWidth={3}
              name="Pemasukan"
            />
            <Area 
              type="monotone" 
              dataKey="outcome" 
              stroke="#ef4444" 
              fillOpacity={1}
              fill="url(#colorOutcome)"
              strokeWidth={3}
              name="Pengeluaran"
            />
            <Area 
              type="monotone" 
              dataKey="saving" 
              stroke="#3b82f6" 
              fillOpacity={1}
              fill="url(#colorSaving)"
              strokeWidth={3}
              name="Tabungan"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Category Breakdown Chart */}
      <div className={`p-8 rounded-[2.5rem] border transition-all ${isDark ? 'glass-dark border-white/5' : 'glass border-white'}`}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-1.5 h-6 bg-purple-500 rounded-full" />
          <h3 className={`text-lg font-black uppercase tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Top Spending Categories
          </h3>
        </div>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={categoryData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} />
            <XAxis 
              type="number" 
              stroke={isDark ? '#94a3b8' : '#64748b'}
              style={{ fontSize: '11px', fontWeight: 'bold' }}
              label={{ value: 'Juta (IDR)', position: 'insideBottom', offset: -5, style: { fontSize: '10px', fontWeight: 'bold' } }}
            />
            <YAxis 
              type="category" 
              dataKey="kategori" 
              stroke={isDark ? '#94a3b8' : '#64748b'}
              style={{ fontSize: '11px', fontWeight: 'bold' }}
              width={150}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="total" 
              fill="#8b5cf6" 
              radius={[0, 8, 8, 0]}
              name="Total Pengeluaran"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
