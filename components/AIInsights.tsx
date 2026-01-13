"use client"
import { useMemo } from 'react';
import { format, startOfMonth, endOfMonth, subMonths, differenceInDays } from 'date-fns';

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
      confidence: Math.abs(trend) < 0.2 ? 'High' : Math.abs(trend) < 0.5 ? 'Medium' : 'Low',
      trend: trend > 0.1 ? 'increasing' : trend < -0.1 ? 'decreasing' : 'stable'
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
          `Reduce "${kategori}" spending by 15% to save Rp ${Math.round(potential / 1000)}k/month`
        );
      }
    });
    
    // Check for frequent small transactions
    const smallTransactions = last30Days.filter(t => t.outcome < 50000 && t.outcome > 0);
    if (smallTransactions.length > 20) {
      const totalSmall = smallTransactions.reduce((sum, t) => sum + t.outcome, 0);
      recommendations.push(
        `You made ${smallTransactions.length} small purchases (Rp ${Math.round(totalSmall / 1000)}k total). Consider consolidating to save on fees.`
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
        `Aim for 20% saving rate. You need to save an additional Rp ${Math.round(gap / 1000)}k/month.`
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
      day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][i],
      avg: dayOfWeekCount[i] > 0 ? total / dayOfWeekCount[i] : 0
    }));
    
    const highestSpendingDay = avgByDay.reduce((max, day) => day.avg > max.avg ? day : max);
    
    return {
      highestDay: highestSpendingDay.day,
      avgAmount: Math.round(highestSpendingDay.avg)
    };
  }, [transactions]);

  return (
    <div className="space-y-6">
      {/* Spending Prediction */}
      <div className={`p-6 rounded-2xl border ${isDark ? 'bg-gradient-to-br from-blue-900/20 to-indigo-900/20 border-blue-500/20' : 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200'}`}>
        <div className="flex items-start gap-4">
          <div className="text-3xl">🔮</div>
          <div className="flex-1">
            <h3 className={`text-sm font-black uppercase tracking-wider mb-2 ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
              Next Month Prediction
            </h3>
            <p className={`text-2xl font-black mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Rp {(spendingPrediction.amount / 1000000).toFixed(1)}M
            </p>
            <div className="flex items-center gap-2 text-xs">
              <span className={`px-2 py-1 rounded-full font-bold ${
                spendingPrediction.confidence === 'High' 
                  ? 'bg-green-500/20 text-green-400' 
                  : spendingPrediction.confidence === 'Medium'
                  ? 'bg-yellow-500/20 text-yellow-400'
                  : 'bg-red-500/20 text-red-400'
              }`}>
                {spendingPrediction.confidence} Confidence
              </span>
              <span className={`${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Trend: {spendingPrediction.trend}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Saving Recommendations */}
      <div className={`p-6 rounded-2xl border ${isDark ? 'bg-slate-800/40 border-white/5' : 'bg-white border-slate-200'}`}>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">💡</span>
          <h3 className={`text-sm font-black uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Smart Recommendations
          </h3>
        </div>
        {savingRecommendations.length === 0 ? (
          <p className={`text-sm italic ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Great job! Your spending looks optimized.
          </p>
        ) : (
          <ul className="space-y-3">
            {savingRecommendations.map((rec, i) => (
              <li key={i} className="flex gap-3">
                <span className="text-green-500 font-bold flex-shrink-0">✓</span>
                <span className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{rec}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Anomalies */}
      {anomalies.length > 0 && (
        <div className={`p-6 rounded-2xl border ${isDark ? 'bg-orange-900/20 border-orange-500/20' : 'bg-orange-50 border-orange-200'}`}>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">⚠️</span>
            <h3 className={`text-sm font-black uppercase tracking-wider ${isDark ? 'text-orange-300' : 'text-orange-700'}`}>
              Unusual Transactions
            </h3>
          </div>
          <div className="space-y-2">
            {anomalies.map((anomaly, i) => (
              <div key={i} className={`flex justify-between items-center text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                <span className="flex-1 truncate">{anomaly.date}: {anomaly.description}</span>
                <span className="font-bold text-orange-500 ml-2">
                  Rp {(anomaly.amount / 1000).toFixed(0)}k (+{anomaly.deviation}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Spending Pattern */}
      <div className={`p-6 rounded-2xl border ${isDark ? 'bg-purple-900/20 border-purple-500/20' : 'bg-purple-50 border-purple-200'}`}>
        <div className="flex items-start gap-4">
          <div className="text-3xl">📊</div>
          <div>
            <h3 className={`text-sm font-black uppercase tracking-wider mb-2 ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>
              Spending Pattern
            </h3>
            <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              You tend to spend most on <span className="font-bold">{spendingPatterns.highestDay}s</span>
              {' '}(avg: Rp {(spendingPatterns.avgAmount / 1000).toFixed(0)}k)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
