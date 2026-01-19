import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, AreaChart, Area } from 'recharts';

import { PieChart as PieChartIcon, TrendingUp, CheckCircle2, AlertTriangle, Activity } from 'lucide-react';

interface Transaction {
  id: string;
  kategori: string;
  income: number;
  outcome: number;
  saving: number;
  tanggal: string;
  is_transfer?: boolean;
  wallet_id: string;
  transfer_from_wallet_id?: string;
  transfer_to_wallet_id?: string;
}

const COLORS = ['#f43f5e', '#fb7185', '#10b981', '#f59e0b', '#ec4899', '#f9a8d4', '#8b5cf6'];

export default function Insights({ transactions, isDark, wallets }: { transactions: Transaction[], isDark: boolean, wallets: any[] }) {
  // 1. Process Data for Pie Chart (Outcome by Category)
  const categoryDataRaw = transactions
    .filter(t => t.outcome > 0 && !t.is_transfer)
    .reduce((acc: any, curr) => {
      acc[curr.kategori] = (acc[curr.kategori] || 0) + Number(curr.outcome || 0);
      return acc;
    }, {});

  const totalOutcome = transactions
    .filter(t => !t.is_transfer)
    .reduce((acc, t) => acc + Number(t.outcome || 0), 0);

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
  const trendDataRaw = transactions
    .filter(t => !t.is_transfer)
    .reduce((acc: any, curr) => {
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

  const investmentWalletIds = new Set(wallets?.filter(w => w.type === 'investment').map(w => w.id) || []);

  const totalEarnedIncome = transactions
    .filter(t => t.kategori !== 'Saldo Awal' && !t.is_transfer)
    .reduce((acc, t) => acc + Number(t.income || 0), 0);

  let calculatedSaving = 0;
  transactions.forEach(t => {
    if (!t.is_transfer) {
      calculatedSaving += Number(t.saving || 0);
      if (investmentWalletIds.has(t.wallet_id) && t.income > 0 && t.kategori !== 'Saldo Awal') {
        calculatedSaving += Number(t.income);
      }
    } else {
      if (investmentWalletIds.has(t.wallet_id) && t.income > 0 && !investmentWalletIds.has(t.transfer_from_wallet_id || '')) {
        calculatedSaving += Number(t.income);
      }
      if (investmentWalletIds.has(t.wallet_id) && t.outcome > 0 && !investmentWalletIds.has(t.transfer_to_wallet_id || '')) {
        calculatedSaving -= Number(t.outcome);
      }
    }
  });

  const totalSaving = calculatedSaving;
  const netFlow = totalEarnedIncome - totalOutcome - totalSaving;
  const isHealthy = netFlow >= 0;
  
  const healthMessage = isHealthy 
    ? `Status Keuangan: Sehat (Surplus Rp ${netFlow.toLocaleString('id-ID')})`
    : `Perhatian: Kas menyusut Rp ${Math.abs(netFlow).toLocaleString('id-ID')} bulan ini!`;

  const subMessage = totalSaving > 0 
    ? `Anda telah menyisihkan Rp ${totalSaving.toLocaleString('id-ID')} ke tabungan.`
    : "Belum ada alokasi tabungan untuk periode ini.";

  return (
    <div className="space-y-10 mb-12">
      {/* Financial Health Indicator */}
      {transactions.length > 0 && (
        <div className={`p-6 rounded-[2.5rem] border flex items-center gap-5 transition-all duration-500 shadow-xl overflow-hidden relative ${
          isHealthy 
            ? (isDark ? 'glass-dark border-green-500/20 shadow-green-900/10' : 'glass border-green-200 shadow-green-200/50')
            : (isDark ? 'glass-dark border-red-500/20 shadow-red-900/10' : 'glass border-red-200 shadow-red-200/50')
        }`}>
          {/* Animated Background Pulse */}
          <div className={`absolute -right-20 -top-20 w-48 h-48 rounded-full blur-[80px] opacity-20 animate-pulse ${isHealthy ? 'bg-green-500' : 'bg-red-500'}`} />

          <div className={`p-4 rounded-3xl flex-shrink-0 flex items-center justify-center shadow-lg ${
            isHealthy 
              ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white' 
              : 'bg-gradient-to-br from-red-500 to-rose-600 text-white'
          }`}>
            {isHealthy ? (
              <CheckCircle2 size={24} strokeWidth={2.5} />
            ) : (
              <AlertTriangle size={24} strokeWidth={2.5} />
            )}
          </div>
          <div className="relative z-10">
            <p className={`text-[10px] font-black uppercase tracking-[0.2em] mb-1 ${isHealthy ? (isDark ? 'text-green-400/70' : 'text-green-600/70') : (isDark ? 'text-red-400/70' : 'text-red-600/70')}`}>
              Wawasan Ekonomi
            </p>
            <p className={`text-md md:text-lg font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-800'}`}>{healthMessage}</p>
            <p className={`text-[10px] font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'} mt-1`}>{subMessage}</p>
          </div>
        </div>
      )}

      {/* Charts Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Left Column: Balance Equity */}
        <div className={`p-10 rounded-[2.5rem] shadow-xl border flex flex-col h-[480px] transition-all duration-500 relative overflow-hidden group ${
          isDark ? 'glass-dark border-white/5 shadow-black/20' : 'glass border-white shadow-slate-200/50'
        }`}>
          <div className="flex justify-between items-center mb-10 shrink-0">
            <div>
              <h3 className={`text-sm font-black uppercase tracking-[0.2em] ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>Total Nilai Ekuitas</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Sisa Saldo Kumulatif</p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
              <TrendingUp size={20} strokeWidth={2.5} />
            </div>
          </div>
          <div className="flex-1 w-full min-h-0">
            {balanceTrendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={balanceTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartTheme.grid} opacity={0.5} />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: chartTheme.text, fontSize: 10, fontWeight: 'bold' }} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: chartTheme.text, fontSize: 10, fontWeight: 'bold' }} 
                    tickFormatter={(val) => `Rp${(val/1000).toFixed(0)}k`}
                  />
                  <Tooltip 
                    contentStyle={chartTheme.tooltip as any} 
                    cursor={{ stroke: '#6366f1', strokeWidth: 1, strokeDasharray: '5 5' }}
                    formatter={(val: any) => [`Rp ${val?.toLocaleString('id-ID')}`, 'Saldo']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="balance" 
                    stroke="#6366f1" 
                    strokeWidth={4} 
                    fillOpacity={1} 
                    fill="url(#colorBalance)" 
                    animationDuration={2000}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center space-y-3">
                <div className="w-12 h-12 rounded-full border-2 border-dashed border-slate-300 animate-spin" />
                 <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 animate-pulse">Menunggu sinkronisasi...</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Outcomes */}
        <div className={`p-10 rounded-[2.5rem] shadow-xl border flex flex-col h-[480px] transition-all duration-500 relative overflow-hidden group ${
          isDark ? 'glass-dark border-white/5 shadow-black/20' : 'glass border-white shadow-slate-200/50'
        }`}>
          <div className="flex justify-between items-center mb-2 shrink-0">
            <div>
              <h3 className={`text-sm font-black uppercase tracking-[0.2em] ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>Proporsi Pengeluaran</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Berdasarkan Kategori</p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500">
              <PieChartIcon size={20} strokeWidth={2.5} />
            </div>
          </div>
          <div className="flex-1 min-h-0">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 20, right: 30, left: 30, bottom: 20 }}>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="45%"
                    innerRadius={65}
                    outerRadius={95}
                    paddingAngle={8}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${percent})`}
                    stroke="none"
                    animationDuration={1500}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={chartTheme.tooltip as any} />
                  <Legend 
                    verticalAlign="bottom" 
                    iconType="circle" 
                    wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }} 
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">N/A Metrics</p>
              </div>
            )}
          </div>
        </div>

        {/* Row 2: Daily Workflow */}
        <div className={`p-10 rounded-[2.5rem] shadow-xl border flex flex-col h-[400px] transition-all duration-500 relative overflow-hidden group lg:col-span-2 ${
          isDark ? 'glass-dark border-white/5 shadow-black/20' : 'glass border-white shadow-slate-200/50'
        }`}>
          <div className="flex justify-between items-center mb-8 shrink-0">
            <div>
              <h3 className={`text-sm font-black uppercase tracking-[0.2em] ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>Alur Kas Finansial Harian</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Arus Kas 7 Hari Terakhir</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">Pemasukan</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">Pengeluaran</span>
              </div>
            </div>
          </div>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendDataArr} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartTheme.grid} opacity={0.5} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: chartTheme.text, fontSize: 10, fontWeight: 'bold' }} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: chartTheme.text, fontSize: 10, fontWeight: 'bold' }} 
                  tickFormatter={(val) => `${(val/1000).toFixed(0)}k`}
                />
                <Tooltip 
                  contentStyle={chartTheme.tooltip as any} 
                  cursor={{ fill: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}
                  formatter={(val: any) => [`Rp ${val?.toLocaleString('id-ID')}`, 'Value']}
                />
                <Bar dataKey="income" fill="url(#colorIncome)" radius={[10, 10, 0, 0]} barSize={12} animationDuration={1500} />
                <Bar dataKey="outcome" fill="url(#colorOutcome)" radius={[10, 10, 0, 0]} barSize={12} animationDuration={2000} />
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={1}/>
                    <stop offset="95%" stopColor="#059669" stopOpacity={0.8}/>
                  </linearGradient>
                  <linearGradient id="colorOutcome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={1}/>
                    <stop offset="95%" stopColor="#dc2626" stopOpacity={0.8}/>
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
