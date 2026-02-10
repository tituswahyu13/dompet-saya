"use client";
import { useEffect, useState } from "react";
import {
  isSameDay,
  isSameWeek,
  isSameMonth,
  isSameYear,
  parseISO,
  startOfDay,
  startOfWeek,
  startOfMonth,
  startOfYear,
} from "date-fns";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
} from "recharts";
import { supabase } from "@/lib/supabase";
import Insights from "@/components/Insights";
import BudgetTracker from "@/components/BudgetTracker";
import AuthWrapper from "@/components/AuthWrapper";
import WalletManager from "@/components/WalletManager";
import GoalManager from "@/components/GoalManager";
import AdvancedCharts from "@/components/AdvancedCharts";
import NotificationCenter from "@/components/NotificationCenter";
import AIInsights from "@/components/AIInsights";
import Navigation from "@/components/Navigation";
import { useSubscription } from "@/hooks/useSubscription";
import UpgradeModal from "@/components/UpgradeModal";
import TransactionForm from "@/components/TransactionForm";
import TransferForm from "@/components/TransferForm";
import AppTour from "@/components/AppTour";
import { User } from "@supabase/supabase-js";
import { processRecurringTransactions } from "@/lib/recurringProcessor";
import Link from "next/link";
import {
  Wallet,
  Target,
  LogOut,
  Sun,
  Moon,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  PiggyBank,
  Percent,
  LayoutDashboard,
  ChevronRight,
  BarChart3,
  TrendingUp as TrendIcon,
  Bot,
  Building2,
  Smartphone,
  Coins,
  Plus,
  Sparkles,
  HelpCircle,
  Eye,
  EyeOff,
  Repeat,
  Receipt,
  Handshake,
  AlertTriangle,
  Check,
  Settings,
} from "lucide-react";
import MinimalistIcon from "@/components/MinimalistIcon";

function DashboardContent({
  user,
  isDark,
  setIsDark,
}: {
  user: User;
  isDark: boolean;
  setIsDark: (val: boolean) => void;
}) {
  const { subscription } = useSubscription();
  const isPro = subscription?.is_pro;
  const [transactions, setTransactions] = useState<any[]>([]);
  const [stats, setStats] = useState({
    income: 0,
    outcome: 0,
    saving: 0,
    rate: 0,
    balance: 0,
  });
  const [loading, setLoading] = useState(true);
  const [showWalletManager, setShowWalletManager] = useState(false);
  const [showGoalManager, setShowGoalManager] = useState(false);
  const [selectedWalletFilter, setSelectedWalletFilter] = useState("All");
  const [wallets, setWallets] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [budgets, setBudgets] = useState<any[]>([]);
  const [recurringTemplates, setRecurringTemplates] = useState<any[]>([]);
  const [showAdvancedCharts, setShowAdvancedCharts] = useState(false);
  const [showUpgradeModalCharts, setShowUpgradeModalCharts] = useState(false);
  const [balanceMode, setBalanceMode] = useState<"liquid" | "all">("all");
  const [isBalanceMasked, setIsBalanceMasked] = useState(true);
  const [isEditingBudgets, setIsEditingBudgets] = useState(false);
  const [activePeriod, setActivePeriod] = useState<
    "Hari" | "Minggu" | "Bulan" | "Tahun" | "Semua"
  >("Bulan");
  const [activeQuickAction, setActiveQuickAction] = useState<
    "income" | "outcome" | "transfer" | null
  >(null);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const showToast = (
    message: string,
    type: "success" | "error" = "success",
  ) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = async (user: User) => {
    setLoading(true);

    // Fetch transactions
    const { data: txData, error: txError } = await supabase
      .from("transaction")
      .select("*")
      .eq("user_id", user.id)
      .order("tanggal", { ascending: false });

    if (txData) {
      setTransactions(txData);
    }

    // Fetch wallets for filter
    const { data: wData } = await supabase
      .from("wallet_balances")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true);

    if (wData) {
      setWallets(wData);
    }

    // Fetch Goals
    const { data: gData } = await supabase
      .from("financial_goals")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (gData) {
      setGoals(gData);
    }

    // Fetch Budgets
    const { data: bData } = await supabase
      .from("budgets")
      .select("*")
      .eq("user_id", user.id);

    if (bData) {
      setBudgets(bData);
    }

    // Fetch Recurring Templates
    const { data: rData } = await supabase
      .from("recurring_templates")
      .select("*")
      .eq("user_id", user.id);

    if (rData) {
      setRecurringTemplates(rData);
    }

    // Auto-process recurring transactions
    try {
      const result = await processRecurringTransactions(user.id);
      if (result.processed > 0) {
        showToast(`🪄 ${result.processed} transaksi otomatis dieksekusi!`);
        // Refresh data to show new transactions
        const { data: freshTxData } = await supabase
          .from("transaction")
          .select("*")
          .eq("user_id", user.id)
          .order("tanggal", { ascending: false });
        if (freshTxData) setTransactions(freshTxData);
      }
    } catch (error) {
      console.error("Auto-processing error:", error);
    }

    setLoading(false);
  };

  const getFilteredTransactions = () => {
    const now = new Date();

    const filtered = transactions.filter((t) => {
      const matchesWallet =
        selectedWalletFilter === "All" || t.wallet_id === selectedWalletFilter;

      const tDate = parseISO(t.tanggal);
      let matchesPeriod = true;

      if (activePeriod === "Hari") {
        matchesPeriod = isSameDay(tDate, now);
      } else if (activePeriod === "Minggu") {
        matchesPeriod = isSameWeek(tDate, now, { weekStartsOn: 1 }); // Start week on Monday
      } else if (activePeriod === "Bulan") {
        matchesPeriod = isSameMonth(tDate, now);
      } else if (activePeriod === "Tahun") {
        matchesPeriod = isSameYear(tDate, now);
      }

      return matchesWallet && matchesPeriod;
    });

    return filtered;
  };

  const filteredTransactions = getFilteredTransactions();

  // Re-calculate stats whenever filteredTransactions or activePeriod changes
  useEffect(() => {
    const data = filteredTransactions;

    // Identify Investment Wallets
    const investmentWalletIds = new Set(
      wallets.filter((w) => w.type === "investment").map((w) => w.id),
    );

    // Standard income/outcome should exclude internal transfers
    const totalInc = data
      .filter((t) => !t.is_transfer)
      .reduce((acc, curr) => acc + (curr.income || 0), 0);
    const totalOut = data
      .filter((t) => !t.is_transfer)
      .reduce((acc, curr) => acc + (curr.outcome || 0), 0);

    // Detailed Saving Calculation
    let totalSav = 0;
    data.forEach((t) => {
      if (!t.is_transfer) {
        totalSav += t.saving || 0;
        if (
          investmentWalletIds.has(t.wallet_id) &&
          t.income > 0 &&
          t.kategori !== "Saldo Awal"
        ) {
          totalSav += t.income;
        }
      } else {
        if (
          investmentWalletIds.has(t.wallet_id) &&
          t.income > 0 &&
          !investmentWalletIds.has(t.transfer_from_wallet_id)
        ) {
          totalSav += t.income;
        }
        if (
          investmentWalletIds.has(t.wallet_id) &&
          t.outcome > 0 &&
          !investmentWalletIds.has(t.transfer_to_wallet_id)
        ) {
          totalSav -= t.outcome;
        }
      }
    });

    const initialBalance = data
      .filter((t) => t.kategori === "Saldo Awal" && !t.is_transfer)
      .reduce((acc, curr) => acc + (curr.income || 0), 0);
    const earnedIncome = totalInc - initialBalance;

    // Calculate Total Balance from wallets (respecting filters)
    let displayBalance = 0;
    if (selectedWalletFilter !== "All") {
      const activeWallet = wallets.find((w) => w.id === selectedWalletFilter);
      displayBalance = activeWallet?.current_balance || 0;
    } else {
      displayBalance = wallets
        .filter(
          (w) =>
            balanceMode === "all" ||
            ["cash", "bank", "ewallet"].includes(w.type),
        )
        .reduce((acc, w) => acc + (w.current_balance || 0), 0);
    }

    setStats({
      income: earnedIncome,
      outcome: totalOut,
      saving: totalSav,
      balance: displayBalance,
      rate: earnedIncome > 0 ? (totalSav / earnedIncome) * 100 : 0,
    });
  }, [transactions, wallets, selectedWalletFilter, balanceMode, activePeriod]);

  const groupedWallets = wallets.reduce((acc: any, w) => {
    const type = w.type || "other";
    if (!acc[type]) acc[type] = [];
    acc[type].push(w);
    return acc;
  }, {});

  const typeLabels: any = {
    cash: "Tunai",
    bank: "Bank",
    ewallet: "E-Wallet",
    investment: "Investasi",
    other: "Lainnya",
  };

  useEffect(() => {
    fetchData(user);
  }, [user]);

  // Budget Analytics Calculation
  const monthlyTransactions = transactions.filter((t) =>
    isSameMonth(parseISO(t.tanggal), new Date()),
  );

  const monthlySpendingByCategory = monthlyTransactions
    .filter((t) => t.outcome > 0)
    .reduce((acc: any, curr) => {
      acc[curr.kategori] = (acc[curr.kategori] || 0) + curr.outcome;
      return acc;
    }, {});

  const totalMonthlySpent = Object.values(monthlySpendingByCategory).reduce(
    (acc: number, curr: any) => acc + curr,
    0,
  ) as number;

  const totalBudgetLimit = budgets.reduce(
    (acc, curr) => acc + (Number(curr.limit_amount) || 0),
    0,
  );

  const overallBudgetPercent =
    totalBudgetLimit > 0
      ? Math.min((totalMonthlySpent / totalBudgetLimit) * 100, 100)
      : 0;

  const updateBudgetLimit = (idOrCategory: string, newLimit: string) => {
    setBudgets((prev) =>
      prev.map((b) =>
        b.id === idOrCategory || b.category === idOrCategory
          ? { ...b, limit_amount: Number(newLimit) }
          : b,
      ),
    );
  };

  const handleSaveBudgets = async () => {
    setLoading(true);
    try {
      const toUpsert = budgets.map((b) => ({
        user_id: user.id,
        category: b.category,
        limit_amount: b.limit_amount,
      }));

      const { error } = await supabase
        .from("budgets")
        .upsert(toUpsert, { onConflict: "user_id,category" });

      if (error) throw error;
      setIsEditingBudgets(false);
    } catch (error: any) {
      alert("Gagal menyimpan anggaran: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`min-h-screen transition-all duration-700 relative overflow-hidden ${isDark ? "bg-[#020617] text-slate-100" : "bg-slate-50 text-slate-900"}`}
    >
      <div className="absolute top-[-15%] left-[-15%] w-[50%] h-[50%] bg-indigo-600/10 rounded-full blur-[160px] animate-float opacity-50 pointer-events-none" />
      <div
        className="absolute bottom-[-15%] right-[-15%] w-[50%] h-[50%] bg-violet-600/10 rounded-full blur-[160px] animate-float opacity-50 pointer-events-none"
        style={{ animationDelay: "-3s" }}
      />

      {/* Mobile Bottom Navigation */}
      <div className="sm:hidden">
        <Navigation
          isDark={isDark}
          variant="bottom"
          onQuickAction={(action) => setActiveQuickAction(action)}
        />
      </div>

      <header className="px-6 pt-8 pb-4 relative z-20">
        <div className="max-w-[1600px] mx-auto flex justify-between items-center">
          <div className="flex flex-col min-w-0 pr-2">
            <h1
              className={`text-lg sm:text-xl font-bold tracking-tight truncate ${isDark ? "text-white" : "text-slate-900"}`}
            >
              Hai, {user.email?.split("@")[0]}
            </h1>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-4 shrink-0">
            {/* Notification Center */}
            <div id="tour-notifications">
              <NotificationCenter
                transactions={transactions}
                budgets={budgets}
                goals={goals}
                recurringTemplates={recurringTemplates}
                wallets={wallets}
                isDark={isDark}
              />
            </div>

            {/* Goals Shortcut */}
            <Link
              id="tour-goals-shortcut"
              href="/goals"
              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all ${
                isDark
                  ? "bg-slate-800 text-indigo-400 border border-white/5"
                  : "bg-white text-indigo-500 border border-slate-200 shadow-sm"
              } hover:scale-105 active:scale-95`}
              title="Target Keuangan"
            >
              <Target size={18} className="sm:w-5 sm:h-5" />
            </Link>

            <button
              id="tour-theme"
              onClick={() => setIsDark(!isDark)}
              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all ${isDark ? "bg-slate-800 text-amber-400 border border-white/5" : "bg-white text-slate-500 border border-slate-200 shadow-sm"} hover:scale-105 active:scale-95`}
              title="Ganti Tema"
            >
              {isDark ? (
                <Sun size={18} className="sm:w-5 sm:h-5" />
              ) : (
                <Moon size={18} className="sm:w-5 sm:h-5" />
              )}
            </button>

            <Link
              href="/pricing"
              className={`px-2 py-1.5 sm:px-3 sm:py-1 rounded-xl sm:rounded-full flex items-center gap-1.5 border transition-all hover:scale-105 active:scale-95 ${
                isDark
                  ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-400"
                  : "bg-indigo-50 border-indigo-100 text-indigo-600"
              }`}
            >
              <Sparkles size={14} className="animate-pulse sm:w-3 sm:h-3" />
              <div className="hidden sm:flex flex-col">
                <span className="text-sm font-black uppercase tracking-widest">
                  PRO
                </span>
                {subscription?.status === "trialing" && (
                  <span className="text-[7px] font-bold opacity-60 -mt-0.5 whitespace-nowrap">
                    {subscription.days_left} HARI
                  </span>
                )}
              </div>
            </Link>

            <button
              onClick={async () => {
                const { error } = await supabase.auth.signOut();
                if (error) alert("Logout failed: " + error.message);
              }}
              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all ${isDark ? "bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20" : "bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 shadow-sm"} hover:scale-105 active:scale-95`}
              title="Keluar"
            >
              <LogOut size={18} className="sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Period Selection */}
      <div className="px-4 sm:px-6 relative z-20">
        <div className="grid grid-cols-5 gap-1.5 sm:gap-2 max-w-[1600px] mx-auto p-1.5">
          {["Hari", "Minggu", "Bulan", "Tahun", "Semua"].map((period: any) => (
            <button
              key={period}
              onClick={() => setActivePeriod(period)}
              className={`w-full py-2.5 rounded-xl text-[10px] sm:text-xs font-bold transition-all ${
                activePeriod === period
                  ? "bg-white text-slate-900 shadow-md scale-100"
                  : isDark
                    ? "text-slate-400 hover:text-white hover:bg-white/5"
                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-200/50"
              }`}
            >
              {period}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-[1600px] mx-auto px-4 sm:px-10 py-8 sm:py-12 space-y-8 sm:space-y-12 pb-32">
        {/* Hero Balance Card */}
        <section className="px-0 sm:px-1">
          <div className="bg-gradient-to-br from-indigo-600 via-violet-600 to-indigo-800 rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 text-white relative overflow-hidden shadow-2xl shadow-indigo-600/20">
            {/* Background pattern */}
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />

            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="flex items-center gap-2 mb-4">
                <p className="text-sm font-black uppercase tracking-[0.2em] opacity-80">
                  Total Saldo (IDR)
                </p>
                <HelpCircle size={14} className="opacity-60" />
              </div>

              <div className="flex items-center gap-4 mb-4">
                <h2 className="text-4xl sm:text-7xl font-black tracking-tight">
                  <span className="opacity-50 text-xl sm:text-4xl mt-2 font-black mr-2">
                    Rp
                  </span>
                  {isBalanceMasked
                    ? " •••.•••,••"
                    : stats.balance.toLocaleString("id-ID")}
                </h2>
                <button
                  onClick={() => setIsBalanceMasked(!isBalanceMasked)}
                  className="p-3 hover:bg-white/10 rounded-full transition-all"
                >
                  {isBalanceMasked ? <EyeOff size={28} /> : <Eye size={28} />}
                </button>
              </div>

              {/* Sub Cards */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4 w-full">
                <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl sm:rounded-3xl p-3 sm:p-4 flex flex-col items-start text-left">
                  <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-indigo-500/30 flex items-center justify-center">
                      <ArrowDownRight
                        size={14}
                        className="text-white sm:w-4 sm:h-4"
                      />
                    </div>
                    <span className="text-[10px] sm:text-sm font-black uppercase tracking-wide opacity-80">
                      Pemasukan
                    </span>
                  </div>
                  <p className="text-lg sm:text-2xl font-black">
                    Rp
                    {isBalanceMasked
                      ? "••.•••"
                      : stats.income.toLocaleString("id-ID")}
                  </p>
                </div>
                <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl sm:rounded-3xl p-3 sm:p-4 flex flex-col items-start text-left">
                  <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-violet-500/30 flex items-center justify-center">
                      <ArrowUpRight
                        size={14}
                        className="text-white sm:w-4 sm:h-4"
                      />
                    </div>
                    <span className="text-[10px] sm:text-sm font-black uppercase tracking-wide opacity-80">
                      Pengeluaran
                    </span>
                  </div>
                  <p className="text-xl sm:text-2xl font-black">
                    Rp
                    {isBalanceMasked
                      ? "••.•••,••"
                      : stats.outcome.toLocaleString("id-ID")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Action Row */}
        <section className="px-1">
          <div className="grid grid-cols-3 gap-3">
            {[
              {
                id: "income",
                label: "Masuk",
                icon: ArrowDownRight,
                color: "bg-emerald-500",
                text: "text-emerald-500",
              },
              {
                id: "outcome",
                label: "Keluar",
                icon: ArrowUpRight,
                color: "bg-rose-500",
                text: "text-rose-500",
              },
              {
                id: "transfer",
                label: "Transfer",
                icon: Repeat,
                color: "bg-indigo-500",
                text: "text-indigo-500",
              },
            ].map((action) => (
              <button
                key={action.id}
                onClick={() => setActiveQuickAction(action.id as any)}
                className={`flex flex-col items-center gap-3 p-6 rounded-[2rem] border transition-all hover:scale-105 active:scale-95 ${
                  isDark
                    ? "bg-slate-900 border-white/5 shadow-2xl shadow-black/40 hover:bg-slate-800"
                    : "bg-white border-slate-100 shadow-xl shadow-slate-200/50 hover:border-slate-300"
                }`}
              >
                <div
                  className={`w-14 h-14 rounded-2xl ${action.color}/10 flex items-center justify-center`}
                >
                  <action.icon size={28} className={action.text} />
                </div>
                <span
                  className={`text-sm font-black uppercase tracking-widest ${isDark ? "text-slate-300" : "text-slate-600"}`}
                >
                  {action.label}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* Divider */}
        <div className="w-full h-px bg-slate-100 dark:bg-white/5" />

        {/* Budget Overview Widget */}
        <section className="px-0 sm:px-1">
          <div className="p-2 sm:p-4 transition-all">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3
                  className={`text-xl sm:text-2xl font-black uppercase tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}
                >
                  Anggaran Bulan Ini
                </h3>
                <p className="text-sm font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mt-1">
                  Kontrol Pengeluaran Anda
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <span
                    className={`text-3xl font-black ${overallBudgetPercent > 80 ? "text-red-500" : "text-indigo-600"}`}
                  >
                    {overallBudgetPercent.toFixed(0)}%
                  </span>
                  <p className="text-sm font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    Terpakai
                  </p>
                </div>
                <button
                  onClick={() =>
                    isEditingBudgets
                      ? handleSaveBudgets()
                      : setIsEditingBudgets(true)
                  }
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
                    isEditingBudgets
                      ? "bg-green-500 text-white shadow-lg shadow-green-500/20"
                      : isDark
                        ? "bg-slate-800 text-slate-400 hover:text-white border border-white/5"
                        : "bg-slate-100 text-slate-500 hover:bg-slate-200 border border-slate-200"
                  }`}
                >
                  {isEditingBudgets ? (
                    <Check size={24} strokeWidth={3} />
                  ) : (
                    <Settings size={24} strokeWidth={2.5} />
                  )}
                </button>
              </div>
            </div>

            <div
              className={`h-4 w-full rounded-full overflow-hidden mb-8 ${isDark ? "bg-slate-950/50" : "bg-slate-100"}`}
            >
              <div
                className={`h-full rounded-full transition-all duration-1000 ${
                  overallBudgetPercent > 90
                    ? "bg-gradient-to-r from-red-500 to-rose-600"
                    : overallBudgetPercent > 70
                      ? "bg-gradient-to-r from-amber-500 to-orange-600"
                      : "bg-gradient-to-r from-indigo-500 to-violet-600"
                }`}
                style={{ width: `${overallBudgetPercent}%` }}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-8">
              {budgets.length === 0 ? (
                <p className="text-xs font-bold text-slate-400 col-span-2 text-center py-4">
                  Belum ada anggaran yang diatur.
                </p>
              ) : (
                budgets.slice(0, 4).map((b) => {
                  const categoryName = b.category || (b as any).kategori;
                  const spent = monthlySpendingByCategory[categoryName] || 0;
                  const limit = Number(b.limit_amount);
                  const percent = limit > 0 ? (spent / limit) * 100 : 0;
                  return (
                    <div
                      key={b.id || categoryName}
                      className="flex flex-col gap-3"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                          {categoryName}
                        </span>
                        {isEditingBudgets ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-black text-indigo-500">
                              Rp
                            </span>
                            <input
                              type="number"
                              value={limit}
                              onChange={(e) =>
                                updateBudgetLimit(
                                  b.id || categoryName,
                                  e.target.value,
                                )
                              }
                              className={`w-28 px-2 py-1 text-right font-black rounded-lg border outline-none text-xs bg-transparent ${
                                isDark
                                  ? "border-white/10 text-white"
                                  : "border-slate-200 text-slate-900"
                              }`}
                            />
                          </div>
                        ) : (
                          <span
                            className={`text-sm font-black ${percent > 100 ? "text-red-500" : isDark ? "text-white" : "text-slate-900"}`}
                          >
                            Rp {spent.toLocaleString("id-ID")}
                            <span className="text-sm text-slate-500 dark:text-slate-400 ml-1 font-bold">
                              / {(limit / 1000).toFixed(0)}k
                            </span>
                          </span>
                        )}
                      </div>
                      <div
                        className={`h-2 w-full rounded-full ${isDark ? "bg-white/5" : "bg-slate-100"}`}
                      >
                        <div
                          className={`h-full rounded-full transition-all duration-1000 ${percent > 100 ? "bg-red-500" : percent > 80 ? "bg-amber-500" : "bg-indigo-500"}`}
                          style={{ width: `${Math.min(percent, 100)}%` }}
                        />
                      </div>
                      {percent > 80 && !isEditingBudgets && (
                        <p className="text-sm font-black text-amber-500 uppercase tracking-widest flex items-center gap-1">
                          <AlertTriangle size={8} /> Budget Menipis!
                        </p>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {budgets.length > 4 && (
              <div className="mt-8 pt-8 border-t border-white/5 text-center">
                <Link
                  href="/budgets"
                  className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-500 transition-colors"
                >
                  Lihat {budgets.length - 4} Anggaran Lainnya
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* Divider */}
        <div className="w-full h-px bg-slate-100 dark:bg-white/5" />

        <div className="space-y-6">
          <div className="flex items-center justify-between px-1">
            <h3
              className={`text-xl sm:text-2xl font-black uppercase tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}
            >
              Transaksi Terakhir
            </h3>
            <Link
              href="/transactions"
              className="text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-500 transition-colors"
            >
              Lihat Semua
            </Link>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="w-10 h-10 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-sm font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                Sinkronisasi...
              </p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="p-16 text-center border-2 border-dashed border-slate-200 rounded-[2.5rem] bg-slate-50/50">
              <p className="text-xs font-bold text-slate-400">
                Belum ada rekaman transaksi.
              </p>
            </div>
          ) : (
            <div className="space-y-10">
              {Object.entries(
                filteredTransactions.slice(0, 5).reduce((groups: any, tx) => {
                  const date = new Date(tx.tanggal).toLocaleDateString(
                    "id-ID",
                    {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    },
                  );
                  if (!groups[date]) groups[date] = { items: [], total: 0 };
                  groups[date].items.push(tx);
                  groups[date].total += (tx.income || 0) - (tx.outcome || 0);
                  return groups;
                }, {}),
              ).map(([date, group]: [string, any]) => (
                <div key={date} className="space-y-5">
                  <div className="flex justify-between items-center px-1">
                    <span className="text-sm font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">
                      {date}
                    </span>
                    <span
                      className={`text-[11px] font-black font-mono ${group.total >= 0 ? "text-emerald-500" : "text-red-500"}`}
                    >
                      {group.total >= 0 ? "+" : "-"} Rp
                      {isBalanceMasked
                        ? "••.•••"
                        : Math.abs(group.total).toLocaleString("id-ID")}
                    </span>
                  </div>
                  <div className="space-y-4">
                    {group.items.map((tx: any) => {
                      return (
                        <div
                          key={tx.id}
                          className={`py-4 px-2 sm:px-4 flex items-center gap-4 border-b border-dashed ${isDark ? "border-white/5 hover:bg-white/5" : "border-slate-200 hover:bg-slate-50"} transition-all cursor-pointer group`}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center gap-2">
                              <div className="min-w-0">
                                <h4
                                  className={`text-lg font-black tracking-tight truncate mb-1 ${isDark ? "text-white" : "text-slate-900"}`}
                                >
                                  {tx.keterangan}
                                </h4>
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                                    {wallets.find((w) => w.id === tx.wallet_id)
                                      ?.name || "Wallet"}
                                  </span>
                                  <span className="text-[10px] font-medium text-slate-400">
                                    {new Date(tx.tanggal).toLocaleTimeString(
                                      [],
                                      {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      },
                                    )}
                                  </span>
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <span
                                  className={`text-xl font-black font-mono ${tx.income > 0 ? "text-emerald-500" : "text-red-500"}`}
                                >
                                  {tx.income > 0 ? "+" : "-"}
                                  {isBalanceMasked
                                    ? "••.•••"
                                    : (tx.income || tx.outcome).toLocaleString(
                                        "id-ID",
                                      )}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {showWalletManager && (
        <WalletManager
          user={user}
          isDark={isDark}
          onClose={() => {
            setShowWalletManager(false);
            fetchData(user);
          }}
        />
      )}
      {showGoalManager && (
        <GoalManager
          user={user}
          isDark={isDark}
          onClose={() => {
            setShowGoalManager(false);
            fetchData(user);
          }}
        />
      )}
      <UpgradeModal
        isOpen={showUpgradeModalCharts}
        onClose={() => setShowUpgradeModalCharts(false)}
        isDark={isDark}
        title="Advanced Financial Charts"
        message="Akses visualisasi data yang mendalam dengan grafik tren 6 bulan dan analisis kategori yang lebih detail. Upgrade ke Pro untuk fitur ini!"
        feature="Advanced Analytics"
      />
      <AppTour isDark={isDark} />

      {/* Quick Action Modal */}
      {activeQuickAction && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
            onClick={() => setActiveQuickAction(null)}
          />
          <div
            className={`relative w-full max-w-2xl rounded-[3rem] border shadow-2xl overflow-hidden transition-all duration-500 animate-in zoom-in-95 ${
              isDark
                ? "bg-slate-900 border-white/10"
                : "bg-white border-slate-200"
            }`}
          >
            <div className="p-8">
              <div className="flex justify-between items-center mb-8">
                <h2
                  className={`text-2xl font-black uppercase tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}
                >
                  {activeQuickAction === "transfer"
                    ? "Transfer Saldo"
                    : "Transaksi Baru"}
                </h2>
                <button
                  onClick={() => setActiveQuickAction(null)}
                  className={`p-2 rounded-xl transition-all ${isDark ? "hover:bg-white/5 text-slate-400" : "hover:bg-slate-100 text-slate-500"}`}
                >
                  <Plus size={24} className="rotate-45" />
                </button>
              </div>

              {activeQuickAction === "transfer" ? (
                <TransferForm
                  user={user}
                  isDark={isDark}
                  onCancel={() => setActiveQuickAction(null)}
                  onRefresh={() => {
                    fetchData(user);
                    setActiveQuickAction(null);
                    showToast("Transfer Berhasil!");
                  }}
                />
              ) : (
                <TransactionForm
                  user={user}
                  isDark={isDark}
                  editData={{ type: activeQuickAction }}
                  onCancel={() => setActiveQuickAction(null)}
                  onRefresh={() => {
                    fetchData(user);
                    setActiveQuickAction(null);
                    showToast("Transaksi Berhasil!");
                  }}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-bottom-5">
          <div
            className={`px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border ${
              toast.type === "success"
                ? "bg-emerald-500 text-white border-emerald-400"
                : "bg-rose-500 text-white border-rose-400"
            }`}
          >
            <Check size={20} strokeWidth={3} />
            <span className="font-black uppercase tracking-widest text-sm">
              {toast.message}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const [isDark, setIsDark] = useState(() => {
    // Initialize from localStorage
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("theme");
      return saved === "dark";
    }
    return false;
  });

  const handleThemeChange = (newIsDark: boolean) => {
    setIsDark(newIsDark);
    // Save to localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem("theme", newIsDark ? "dark" : "light");
    }
  };

  return (
    <AuthWrapper isDark={isDark}>
      {(user) => (
        <DashboardContent
          user={user}
          isDark={isDark}
          setIsDark={handleThemeChange}
        />
      )}
    </AuthWrapper>
  );
}
