import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, AreaChart, Area } from 'recharts';

interface Transaction {
  id: string;
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
      acc[curr.kategori] = (acc[curr.kategori] || 0) + Number(curr.outcome || 0);
      return acc;
    }, {});

  const totalOutcome = transactions.reduce((acc, t) => acc + Number(t.outcome || 0), 0);

  const categoryData = Object.keys(categoryDataRaw).map(key => {
    const val = Number(categoryDataRaw[key] || 0);
    const pct = totalOutcome > 0 ? (val / totalOutcome) : 0;
    return {
      name: key,
      value: val,
      percent: (pct * 100).toFixed(1) + '%'
    };
  }).sort((a, b) => b.value - a.value);

  // 2. Process Data for Balance Trend (Cumulative)
  const dailyBalancesRaw = transactions.reduce((acc: any, curr) => {
    const date = curr.tanggal; 
    if (!acc[date]) acc[date] = 0;
    acc[date] += (Number(curr.income || 0) - Number(curr.outcome || 0) - Number(curr.saving || 0));
    return acc;
  }, {});

  const sortedDates = Object.keys(dailyBalancesRaw).sort();
  let runningBalance = 0;
  const balanceTrendData = sortedDates.map(date => {
    runningBalance += dailyBalancesRaw[date];
    return {
      name: new Date(date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }),
      balance: runningBalance,
      fullDate: date
    };
  }).slice(-15); // Show last 15 active days

  // 3. Process Data for Daily Flow (Income vs Outcome)
  const trendDataRaw = transactions.reduce((acc: any, curr) => {
    const date = new Date(curr.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
    if (!acc[date]) acc[date] = { name: date, income: 0, outcome: 0 };
    acc[date].income += curr.income;
    acc[date].outcome += curr.outcome;
    return acc;
  }, {});

  const trendDataArr = Object.values(trendDataRaw).reverse().slice(-7);

  const chartTheme = {
    tooltip: { 
      borderRadius: '16px', 
      border: 'none', 
      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
      backgroundColor: isDark ? '#1e293b' : '#ffffff',
      color: isDark ? '#f8fafc' : '#1e293b'
    },
    grid: isDark ? '#334155' : '#f1f5f9',
    text: isDark ? '#94a3b8' : '#64748b'
  };

  return (
    <div className="space-y-6 mb-10">
      {/* Top Row: Balance Trend (Large Chart) */}
      <div className={`p-6 rounded-2xl shadow-sm border h-[380px] transition-colors duration-300 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
        <div className="flex justify-between items-center mb-6">
          <h3 className={`text-md font-black ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>Tren Saldo Kumulatif</h3>
          <span className="text-[10px] font-bold text-blue-500 bg-blue-50 px-2 py-1 rounded-lg uppercase tracking-wider">Growth View</span>
        </div>
        {balanceTrendData.length > 0 ? (
          <ResponsiveContainer width="100%" height="80%">
            <AreaChart data={balanceTrendData}>
              <defs>
                <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartTheme.grid} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: chartTheme.text }} />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: chartTheme.text }}
                tickFormatter={(value) => `Rp${(value/1000)}k`}
              />
              <Tooltip 
                formatter={(value: any) => [`Rp ${value?.toLocaleString('id-ID')}`, 'Sisa Saldo']}
                contentStyle={chartTheme.tooltip}
                itemStyle={{ color: '#3b82f6', fontWeight: 'bold' }}
              />
              <Area type="monotone" dataKey="balance" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorBalance)" />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-slate-400 text-sm italic">Menunggu data transaksi...</div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pie Chart: Proportion */}
        <div className={`p-6 rounded-2xl shadow-sm border h-[400px] transition-colors duration-300 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
          <h3 className={`text-sm font-bold mb-4 ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>Proposi Pengeluaran (%)</h3>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height="90%">
              <PieChart margin={{ top: 20, right: 40, left: 40, bottom: 20 }}>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent, index }) => {
                    const pct = categoryData[index]?.percent || '0%';
                    return `${name} (${pct})`;
                  }}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: any, name: any, props: any) => [
                    `Rp ${value?.toLocaleString('id-ID')} (${props.payload?.percent || '0%'})`, 
                    name
                  ]}
                  contentStyle={chartTheme.tooltip}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36} 
                  wrapperStyle={{ fontSize: '10px', color: chartTheme.text, paddingTop: '10px' }} 
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400 text-sm italic">Belum ada pengeluaran</div>
          )}
        </div>

        {/* Bar Chart: Daily Flow */}
        <div className={`p-6 rounded-2xl shadow-sm border h-[350px] transition-colors duration-300 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
          <h3 className={`text-sm font-bold mb-4 ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>Arus Kas 7 Hari Terakhir</h3>
          {trendDataArr.length > 0 ? (
            <ResponsiveContainer width="100%" height="90%">
              <BarChart data={trendDataArr}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartTheme.grid} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: chartTheme.text }} />
                <YAxis hide />
                <Tooltip 
                   formatter={(value: any) => `Rp ${value?.toLocaleString('id-ID')}`}
                   contentStyle={chartTheme.tooltip}
                />
                <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '10px' }} />
                <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} barSize={12} name="Masuk" />
                <Bar dataKey="outcome" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={12} name="Keluar" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400 text-sm italic">Belum ada aktivitas transaksi</div>
          )}
        </div>
      </div>
    </div>
  );
}
