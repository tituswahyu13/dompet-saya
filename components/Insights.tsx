"use client"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

interface Transaction {
  kategori: string;
  income: number;
  outcome: number;
  saving: number;
  tanggal: string;
}

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#6366f1', '#ec4899', '#8b5cf6'];

export default function Insights({ transactions, isDark }: { transactions: Transaction[], isDark: boolean }) {
  // 1. Process Data for Pie Chart (Outcome by Category)
  const categoryDataRaw = transactions
    .filter(t => t.outcome > 0)
    .reduce((acc: any, curr) => {
      acc[curr.kategori] = (acc[curr.kategori] || 0) + curr.outcome;
      return acc;
    }, {});

  const categoryData = Object.keys(categoryDataRaw).map(key => ({
    name: key,
    value: categoryDataRaw[key]
  })).sort((a, b) => b.value - a.value);

  // 2. Process Data for Bar Chart (Trend by Date)
  const trendDataRaw = transactions.reduce((acc: any, curr) => {
    const date = new Date(curr.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
    if (!acc[date]) acc[date] = { name: date, income: 0, outcome: 0, saving: 0 };
    acc[date].income += curr.income;
    acc[date].outcome += curr.outcome;
    acc[date].saving += curr.saving;
    return acc;
  }, {});

  const trendData = Object.values(trendDataRaw).reverse().slice(-7); // Last 7 days with data

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
      {/* Pie Chart: Spending Breakdown */}
      <div className={`p-6 rounded-2xl shadow-sm border h-[350px] transition-colors duration-300 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
        <h3 className={`text-sm font-bold mb-4 ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>Pengeluaran per Kategori</h3>
        {categoryData.length > 0 ? (
          <ResponsiveContainer width="100%" height="90%">
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: any) => `Rp ${value?.toLocaleString('id-ID')}`}
                contentStyle={{ 
                  borderRadius: '12px', 
                  border: 'none', 
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  backgroundColor: isDark ? '#1e293b' : '#ffffff',
                  color: isDark ? '#f8fafc' : '#1e293b'
                }}
                itemStyle={{ color: isDark ? '#f8fafc' : '#1e293b' }}
              />
              <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '10px', color: isDark ? '#94a3b8' : '#64748b' }} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-slate-400 text-sm">Belum ada data pengeluaran</div>
        )}
      </div>

      {/* Bar Chart: Trend */}
      <div className={`p-6 rounded-2xl shadow-sm border h-[350px] transition-colors duration-300 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
        <h3 className={`text-sm font-bold mb-4 ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>Tren Transaksi (Terakhir)</h3>
        {trendData.length > 0 ? (
          <ResponsiveContainer width="100%" height="90%">
            <BarChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#334155' : '#f1f5f9'} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: isDark ? '#94a3b8' : '#94a3b8' }} />
              <YAxis hide />
              <Tooltip 
                 formatter={(value: any) => `Rp ${value?.toLocaleString('id-ID')}`}
                 contentStyle={{ 
                   borderRadius: '12px', 
                   border: 'none', 
                   boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                   backgroundColor: isDark ? '#1e293b' : '#ffffff',
                   color: isDark ? '#f8fafc' : '#1e293b'
                 }}
                 itemStyle={{ color: isDark ? '#f8fafc' : '#1e293b' }}
              />
              <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} barSize={10} name="Masuk" />
              <Bar dataKey="outcome" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={10} name="Keluar" />
              <Bar dataKey="saving" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={10} name="Tabungan" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-slate-400 text-sm">Belum ada data transaksi</div>
        )}
      </div>
    </div>
  );
}
