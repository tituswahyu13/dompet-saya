"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import AuthWrapper from "@/components/AuthWrapper";
import AIInsights from "@/components/AIInsights";
import AdvancedCharts from "@/components/AdvancedCharts";
import Insights from "@/components/Insights";
import Navigation from "@/components/Navigation";
import UpgradeModal from "@/components/UpgradeModal";
import TransactionForm from "@/components/TransactionForm";
import TransferForm from "@/components/TransferForm";
import { useSubscription } from "@/hooks/useSubscription";
import { User } from "@supabase/supabase-js";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
} from "recharts";
import { isSameMonth, parseISO } from "date-fns";
import Link from "next/link";
import {
  Sun,
  Moon,
  LogOut,
  BarChart3,
  TrendingUp as TrendIcon,
  Bot,
  Zap,
  Plus,
  Crown,
  Calendar,
  Filter,
} from "lucide-react";
import AppTour from "@/components/AppTour";
import Skeleton from "@/components/Skeleton";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";
import { id } from "date-fns/locale";

function AnalyticsContent({
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
  const [wallets, setWallets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdvanced, setIsAdvanced] = useState(false);
  const [showUpgradeModalCharts, setShowUpgradeModalCharts] = useState(false);
  const [activeQuickAction, setActiveQuickAction] = useState<
    "income" | "outcome" | "transfer" | null
  >(null);

  // Date Range State
  const [startDate, setStartDate] = useState(
    format(startOfMonth(new Date()), "yyyy-MM-dd"),
  );
  const [endDate, setEndDate] = useState(
    format(endOfMonth(new Date()), "yyyy-MM-dd"),
  );
  const [activePreset, setActivePreset] = useState("thisMonth");

  const handlePresetChange = (preset: string) => {
    setActivePreset(preset);
    const today = new Date();
    if (preset === "7days") {
      setStartDate(format(subDays(today, 7), "yyyy-MM-dd"));
      setEndDate(format(today, "yyyy-MM-dd"));
    } else if (preset === "30days") {
      setStartDate(format(subDays(today, 30), "yyyy-MM-dd"));
      setEndDate(format(today, "yyyy-MM-dd"));
    } else if (preset === "thisMonth") {
      setStartDate(format(startOfMonth(today), "yyyy-MM-dd"));
      setEndDate(format(endOfMonth(today), "yyyy-MM-dd"));
    }
  };

  const fetchData = async (user: User) => {
    setLoading(true);

    // Fetch Transactions with Date Filter
    let query = supabase
      .from("transaction")
      .select("*")
      .eq("user_id", user.id)
      .gte("tanggal", startDate)
      .lte("tanggal", endDate)
      .order("tanggal", { ascending: false });

    const { data: txData } = await query;

    if (txData) setTransactions(txData);

    const { data: wData } = await supabase
      .from("wallet_balances")
      .select("*")
      .eq("user_id", user.id);

    if (wData) setWallets(wData);

    setLoading(false);
  };

  useEffect(() => {
    fetchData(user);
  }, [user, startDate, endDate]);

  return (
    <div
      className={`min-h-screen transition-all duration-700 relative overflow-hidden ${isDark ? "bg-[#020617] text-slate-100" : "bg-slate-50 text-slate-900"}`}
    >
      <div className="absolute top-[-15%] left-[-15%] w-[50%] h-[50%] bg-indigo-600/10 rounded-full blur-[160px] animate-float opacity-50" />
      <div
        className="absolute bottom-[-15%] right-[-15%] w-[50%] h-[50%] bg-violet-600/10 rounded-full blur-[160px] animate-float opacity-50"
        style={{ animationDelay: "-3s" }}
      />

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
                  ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                  : "bg-amber-50 border-amber-100 text-amber-600"
              }`}
            >
              <Crown size={14} className="animate-pulse sm:w-3 sm:h-3" />
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
                if (error) alert("Gagal keluar: " + error.message);
              }}
              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all ${isDark ? "bg-red-500/10 text-red-500 border border-red-500/20" : "bg-red-50 text-red-600 border border-red-100 shadow-sm"} hover:scale-105 active:scale-95`}
              title="Keluar"
            >
              <LogOut size={18} className="sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Date Range Filter */}
      <div className="px-6 mb-6 relative z-20">
        <div className="max-w-[1600px] mx-auto">
          <div
            className={`p-4 rounded-3xl border border-white/5 backdrop-blur-md ${isDark ? "bg-slate-900/50" : "bg-white/50"}`}
          >
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-hide">
                {[
                  { id: "7days", label: "7 Hari" },
                  { id: "30days", label: "30 Hari" },
                  { id: "thisMonth", label: "Bulan Ini" },
                ].map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => handlePresetChange(preset.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                      activePreset === preset.id
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                        : isDark
                          ? "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white"
                          : "bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-900 shadow-sm"
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                <div
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border w-full md:w-auto ${isDark ? "bg-slate-950 border-white/10" : "bg-white border-slate-200"}`}
                >
                  <Calendar size={14} className="opacity-50" />
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      setActivePreset("custom");
                    }}
                    className="bg-transparent text-xs font-bold outline-none w-full md:w-auto"
                  />
                </div>
                <span className="opacity-50">-</span>
                <div
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border w-full md:w-auto ${isDark ? "bg-slate-950 border-white/10" : "bg-white border-slate-200"}`}
                >
                  <Calendar size={14} className="opacity-50" />
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      setActivePreset("custom");
                    }}
                    className="bg-transparent text-xs font-bold outline-none w-full md:w-auto"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-[1600px] mx-auto px-6 py-8 sm:py-12 space-y-12 pb-32 transition-all duration-500 relative z-10">
        <div
          id="tour-analytics-header"
          className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6"
        >
          <div>
            <h2 className="text-xl sm:text-3xl font-black mb-1 sm:mb-2 tracking-tighter uppercase flex items-center gap-2 sm:gap-3">
              Pusat Kecerdasan{" "}
              <BarChart3 className="text-indigo-600" size={20} />
            </h2>
            <p className="text-[8px] sm:text-sm font-bold opacity-50 uppercase tracking-widest leading-relaxed">
              Analisis Data & Prediksi AI
            </p>
          </div>
          {/* <div
            id="tour-analytics-toggle"
            className={`p-1 rounded-xl sm:rounded-2xl border flex w-full sm:w-auto ${isDark ? "bg-slate-900/50 border-white/5" : "bg-slate-100/50 border-slate-200"}`}
          >
            <button
              onClick={() => setIsAdvanced(false)}
              className={`flex-1 sm:px-6 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all ${!isAdvanced ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" : "text-slate-500 hover:text-indigo-400"}`}
            >
              Sederhana
            </button>
            <button
              onClick={() => {
                if (isPro) setIsAdvanced(true);
                else setShowUpgradeModalCharts(true);
              }}
              className={`flex-1 sm:px-6 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${isAdvanced ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" : "text-slate-500 hover:text-indigo-400"}`}
            >
              Lanjutan{" "}
              {!isPro && (
                <Zap
                  size={10}
                  className="sm:w-3.5 sm:h-3.5 text-amber-400 fill-amber-400"
                />
              )}
            </button>
          </div> */}
        </div>

        <section id="tour-analytics-ai" className="py-4">
          <div className="flex items-center gap-2 sm:gap-3 mb-6 sm:mb-8 px-1">
            <div className="w-1 h-5 sm:w-1.5 sm:h-6 bg-purple-500 rounded-full animate-pulse" />
            <h2
              className={`text-sm sm:text-lg font-black ${isDark ? "text-white" : "text-slate-900"} uppercase tracking-tighter`}
            >
              Sorotan Analisis AI
            </h2>
          </div>
          {loading ? (
            <div className="p-8 space-y-4">
              <Skeleton className="w-3/4 h-8 rounded-xl" />
              <Skeleton className="w-1/2 h-4 rounded-lg" />
              <div className="space-y-2 mt-4">
                <Skeleton className="w-full h-3 rounded" />
                <Skeleton className="w-full h-3 rounded" />
                <Skeleton className="w-2/3 h-3 rounded" />
              </div>
            </div>
          ) : (
            <AIInsights transactions={transactions} isDark={isDark} />
          )}
        </section>

        {/* Divider */}
        <div className="w-full h-px bg-slate-200 dark:bg-white/10" />

        {/* Visual Analytics Section */}
        <section id="tour-analytics-visual" className="py-4">
          <div className="flex justify-between items-center mb-10 px-1">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
              <h2
                className={`text-lg font-black ${isDark ? "text-white" : "text-slate-900"} uppercase tracking-tighter`}
              >
                Analitik Visual
              </h2>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (isPro) setIsAdvanced(false);
                  else setShowUpgradeModalCharts(true);
                }}
                className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-[8px] sm:text-[10px] font-black uppercase tracking-widest transition-all ${!isAdvanced ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/20" : isDark ? "bg-white/5 text-slate-400" : "bg-slate-100 text-slate-500"}`}
              >
                Wawasan
              </button>
              <button
                onClick={() => {
                  if (isPro) setIsAdvanced(true);
                  else setShowUpgradeModalCharts(true);
                }}
                className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-[8px] sm:text-[10px] font-black uppercase tracking-widest transition-all ${isAdvanced ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/20" : isDark ? "bg-white/5 text-slate-400" : "bg-slate-100 text-slate-500"}`}
              >
                <BarChart3 size={12} className="inline mr-1 sm:mr-1.5" /> Grafik
              </button>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Skeleton className="h-80 rounded-[2.5rem]" />
              <Skeleton className="h-80 rounded-[2.5rem]" />
            </div>
          ) : isAdvanced ? (
            <AdvancedCharts transactions={transactions} isDark={isDark} />
          ) : (
            <Insights
              transactions={transactions}
              isDark={isDark}
              wallets={wallets}
            />
          )}
        </section>
      </main>

      <UpgradeModal
        isOpen={showUpgradeModalCharts}
        onClose={() => setShowUpgradeModalCharts(false)}
        isDark={isDark}
        title="Akses Analitik Prediktif"
        message="Dapatkan akses penuh ke visualisasi data tingkat lanjut, laporan mendalam, dan mesin prediksi berbasis AI yang lebih akurat."
        feature="Deep IQ Analytics"
      />

      {/* Mobile Bottom Navigation */}
      <div className="sm:hidden">
        <Navigation
          isDark={isDark}
          variant="bottom"
          onQuickAction={(action) => setActiveQuickAction(action)}
        />
      </div>

      {/* Quick Action Modal */}
      {activeQuickAction && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
            onClick={() => setActiveQuickAction(null)}
          />
          <div
            className={`relative w-full max-w-2xl rounded-[3rem] border shadow-2xl overflow-hidden transition-all ${
              isDark
                ? "bg-slate-900 border-white/10"
                : "bg-white border-slate-200"
            }`}
          >
            <div className="p-8">
              {activeQuickAction === "transfer" ? (
                <TransferForm
                  user={user}
                  isDark={isDark}
                  onCancel={() => setActiveQuickAction(null)}
                  onRefresh={() => {
                    fetchData(user);
                    setActiveQuickAction(null);
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
                  }}
                />
              )}
            </div>
          </div>
        </div>
      )}
      <AppTour isDark={isDark} />
    </div>
  );
}

export default function AnalyticsPage() {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("theme");
      return saved === "dark";
    }
    return false;
  });

  const handleThemeChange = (newIsDark: boolean) => {
    setIsDark(newIsDark);
    if (typeof window !== "undefined") {
      localStorage.setItem("theme", newIsDark ? "dark" : "light");
    }
  };

  return (
    <AuthWrapper isDark={isDark}>
      {(user) => (
        <AnalyticsContent
          user={user}
          isDark={isDark}
          setIsDark={handleThemeChange}
        />
      )}
    </AuthWrapper>
  );
}
