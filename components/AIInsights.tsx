"use client"
import { useMemo } from 'react';
import { format, startOfMonth, endOfMonth, subMonths, differenceInDays } from 'date-fns';
import { Sparkles, Lightbulb, AlertCircle, TrendingUp, CheckCircle2 } from 'lucide-react';

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

interface AIInsightsProps {
  transactions: Transaction[];
  isDark: boolean;
}

export default function AIInsights({ transactions, isDark }: AIInsightsProps) {
  // Spending Prediction (Next Month)
  const spendingPrediction = useMemo(() => {
    const last3Months = [0, 1, 2].map(i => {
      const month = subMonths(new Date(), i);
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      
      return transactions
        .filter(t => {
          const txDate = new Date(t.tanggal);
          return txDate >= monthStart && txDate <= monthEnd && !t.is_transfer;
        })
        .reduce((sum, t) => sum + (t.outcome || 0), 0);
    });

    // Simple moving average
    const avgSpending = last3Months.reduce((sum, val) => sum + val, 0) / last3Months.length;
    
    // Trend analysis (is spending increasing or decreasing?)
    const trend = (last3Months[0] - last3Months[2]) / last3Months[2];
    const predictedSpending = avgSpending * (1 + trend);
    
    return {
      amount: Math.round(predictedSpending),
      confidence: Math.abs(trend) < 0.2 ? 'Tinggi' : Math.abs(trend) < 0.5 ? 'Sedang' : 'Rendah',
      trend: trend > 0.1 ? 'meningkat' : trend < -0.1 ? 'menurun' : 'stabil'
    };
  }, [transactions]);

  // Saving Recommendations
  const savingRecommendations = useMemo(() => {
    const recommendations: string[] = [];
    
    // Analyze spending by category
    const categorySpending = new Map<string, number>();
    const last30Days = transactions.filter(t => {
      const txDate = new Date(t.tanggal);
      return differenceInDays(new Date(), txDate) <= 30 && !t.is_transfer && t.outcome > 0;
    });
    
    last30Days.forEach(t => {
      const current = categorySpending.get(t.kategori) || 0;
      categorySpending.set(t.kategori, current + t.outcome);
    });
    
    // Find top spending categories
    const sortedCategories = Array.from(categorySpending.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
    
    sortedCategories.forEach(([kategori, amount]) => {
      const potential = amount * 0.15; // Suggest 15% reduction
      if (potential > 50000) {
        recommendations.push(
          `Kurangi pengeluaran "${kategori}" sebesar 15% untuk hemat Rp ${Math.round(potential / 1000)}rb/bulan`
        );
      }
    });
    
    // Check for frequent small transactions
    const smallTransactions = last30Days.filter(t => t.outcome < 50000 && t.outcome > 0);
    if (smallTransactions.length > 20) {
      const totalSmall = smallTransactions.reduce((sum, t) => sum + t.outcome, 0);
      recommendations.push(
        `Anda melakukan ${smallTransactions.length} transaksi kecil (total Rp ${Math.round(totalSmall / 1000)}rb). Pertimbangkan untuk menggabungkannya agar lebih hemat.`
      );
    }
    
    // Saving rate analysis
    const totalIncome = last30Days.reduce((sum, t) => sum + (t.income || 0), 0);
    const totalOutcome = last30Days.reduce((sum, t) => sum + t.outcome, 0);
    const savingRate = totalIncome > 0 ? ((totalIncome - totalOutcome) / totalIncome) * 100 : 0;
    
    if (savingRate < 20 && totalIncome > 0) {
      const targetSaving = totalIncome * 0.2;
      const currentSaving = totalIncome - totalOutcome;
      const gap = targetSaving - currentSaving;
      recommendations.push(
        `Targetkan rasio tabungan 20%. Anda perlu menabung tambahan Rp ${Math.round(gap / 1000)}rb/bulan.`
      );
    }
    
    return recommendations.slice(0, 4); // Top 4 recommendations
  }, [transactions]);

  // Anomaly Detection
  const anomalies = useMemo(() => {
    const detected: any[] = [];
    const last30Days = transactions.filter(t => {
      const txDate = new Date(t.tanggal);
      return differenceInDays(new Date(), txDate) <= 30 && !t.is_transfer && t.outcome > 0;
    });
    
    // Calculate average and standard deviation
    const amounts = last30Days.map(t => t.outcome);
    const avg = amounts.reduce((sum, val) => sum + val, 0) / amounts.length;
    const variance = amounts.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / amounts.length;
    const stdDev = Math.sqrt(variance);
    
    // Find outliers (more than 2 standard deviations from mean)
    last30Days.forEach(t => {
      if (t.outcome > avg + (2 * stdDev)) {
        detected.push({
          date: format(new Date(t.tanggal), 'dd MMM'),
          description: t.keterangan || t.kategori,
          amount: t.outcome,
          deviation: ((t.outcome - avg) / avg * 100).toFixed(0)
        });
      }
    });
    
    return detected.slice(0, 5); // Top 5 anomalies
  }, [transactions]);

  // Spending Patterns
  const spendingPatterns = useMemo(() => {
    const dayOfWeekSpending = new Array(7).fill(0);
    const dayOfWeekCount = new Array(7).fill(0);
    
    transactions
      .filter(t => !t.is_transfer && t.outcome > 0)
      .forEach(t => {
        const day = new Date(t.tanggal).getDay();
        dayOfWeekSpending[day] += t.outcome;
        dayOfWeekCount[day]++;
      });
    
    const avgByDay = dayOfWeekSpending.map((total, i) => ({
      day: ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'][i],
      avg: dayOfWeekCount[i] > 0 ? total / dayOfWeekCount[i] : 0
    }));
    
    const highestSpendingDay = avgByDay.reduce((max, day) => day.avg > max.avg ? day : max);
    
    return {
      highestDay: highestSpendingDay.day,
      avgAmount: Math.round(highestSpendingDay.avg)
    };
  }, [transactions]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
      {/* Spending Prediction */}
      <div className={`p-5 sm:p-6 rounded-2xl sm:rounded-[2.5rem] border ${isDark ? 'bg-gradient-to-br from-rose-900/20 to-pink-900/20 border-rose-500/20' : 'bg-gradient-to-br from-rose-50 to-pink-50 border-rose-200'}`}>
        <div className="flex items-start gap-4">
          <div className={`${isDark ? 'text-rose-400' : 'text-rose-600'}`}>
            <Sparkles size={32} strokeWidth={2.5} className="sm:w-10 sm:h-10" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className={`text-[10px] sm:text-sm font-black uppercase tracking-wider mb-2 ${isDark ? 'text-rose-300' : 'text-rose-700'}`}>
              Prediksi Bulan Depan
            </h3>
            <p className={`text-xl sm:text-2xl font-black mb-2 ${isDark ? 'text-white' : 'text-slate-900'} truncate`}>
              Rp {(spendingPrediction.amount / 1000000).toFixed(1)}M
            </p>
            <div className="flex flex-wrap items-center gap-2 text-[9px] sm:text-xs">
              <span className={`px-2 py-0.5 rounded-full font-bold ${
                spendingPrediction.confidence === 'High' 
                  ? 'bg-green-500/20 text-green-400' 
                  : spendingPrediction.confidence === 'Medium'
                  ? 'bg-yellow-500/20 text-yellow-400'
                  : 'bg-red-500/20 text-red-400'
              }`}>
                {spendingPrediction.confidence}
              </span>
              <span className={`${isDark ? 'text-slate-400' : 'text-slate-600'} font-bold uppercase tracking-tight`}>
                Tren: {spendingPrediction.trend}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Saving Recommendations */}
      <div className={`p-5 sm:p-6 rounded-2xl sm:rounded-[2.5rem] border ${isDark ? 'bg-slate-800/40 border-white/5' : 'bg-white border-slate-200'}`}>
        <div className="flex items-center gap-3 mb-4">
          <div className="text-rose-500">
            <Lightbulb size={24} strokeWidth={2.5} className="sm:w-7 sm:h-7" />
          </div>
          <h3 className={`text-[10px] sm:text-sm font-black uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Rekomendasi Pintar
          </h3>
        </div>
        {savingRecommendations.length === 0 ? (
          <p className={`text-[11px] sm:text-sm italic ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Bagus sekali! Pengeluaran Anda terlihat optimal.
          </p>
        ) : (
          <ul className="space-y-2 sm:space-y-3">
            {savingRecommendations.map((rec, i) => (
              <li key={i} className="flex gap-2 sm:gap-3">
                <CheckCircle2 size={14} className="text-green-500 mt-0.5 flex-shrink-0" strokeWidth={3} />
                <span className={`text-[11px] sm:text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{rec}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Anomalies */}
      {anomalies.length > 0 && (
        <div className={`p-5 sm:p-6 rounded-2xl sm:rounded-[2.5rem] border ${isDark ? 'bg-orange-900/20 border-orange-500/20' : 'bg-orange-50 border-orange-200'}`}>
          <div className="flex items-center gap-3 mb-4">
            <div className="text-orange-500">
              <AlertCircle size={24} strokeWidth={2.5} className="sm:w-7 sm:h-7" />
            </div>
            <h3 className={`text-[10px] sm:text-sm font-black uppercase tracking-wider ${isDark ? 'text-orange-300' : 'text-orange-700'}`}>
              Aktivitas Tidak Biasa
            </h3>
          </div>
          <div className="space-y-2">
            {anomalies.map((anomaly, i) => (
              <div key={i} className={`flex justify-between items-center text-[11px] sm:text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                <span className="flex-1 truncate pr-2">{anomaly.date}: {anomaly.description}</span>
                <span className="font-bold text-orange-500 whitespace-nowrap">
                   +{anomaly.deviation}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Spending Pattern */}
      <div className={`p-5 sm:p-6 rounded-2xl sm:rounded-[2.5rem] border ${isDark ? 'bg-purple-900/20 border-purple-500/20' : 'bg-purple-50 border-purple-200'}`}>
        <div className="flex items-start gap-4">
          <div className="text-purple-500">
            <TrendingUp size={28} strokeWidth={2.5} className="sm:w-8 sm:h-8" />
          </div>
          <div>
            <h3 className={`text-[10px] sm:text-sm font-black uppercase tracking-wider mb-2 ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>
              Pola Pengeluaran
            </h3>
            <p className={`text-[11px] sm:text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              Fokus pada <span className="font-bold">{spendingPatterns.highestDay}</span>
              {' '}(rata-rata: Rp {(spendingPatterns.avgAmount / 1000).toFixed(0)}rb)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
