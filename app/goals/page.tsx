"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import AuthWrapper from "@/components/AuthWrapper";
import GoalManager from "@/components/GoalManager";
import Navigation from "@/components/Navigation";
import MinimalistIcon from "@/components/MinimalistIcon";
import { User } from "@supabase/supabase-js";
import {
  Plus,
  Crown,
  Sun,
  Moon,
  LogOut,
  Target,
  TrendingUp as TrendIcon,
  ChevronRight,
} from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import Link from "next/link";
import AppTour from "@/components/AppTour";

function GoalsContent({
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
  const [goals, setGoals] = useState<any[]>([]);
  const [wallets, setWallets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGoalManager, setShowGoalManager] = useState(false);

  const fetchData = async (user: User) => {
    setLoading(true);

    // Fetch Goals
    const { data: gData } = await supabase
      .from("financial_goals")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (gData) {
      setGoals(gData);
    }

    // Fetch wallets for progress calculation
    const { data: wData } = await supabase
      .from("wallet_balances")
      .select("*")
      .eq("user_id", user.id);

    if (wData) {
      setWallets(wData);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchData(user);
  }, [user]);

  const totalTarget = goals.reduce((acc, g) => acc + (g.target_amount || 0), 0);
  const totalAchieved = goals.reduce((acc, g) => {
    const wallet = wallets.find((w) => w.id === g.wallet_id);
    return (
      acc + (g.wallet_id ? wallet?.current_balance || 0 : g.current_amount)
    );
  }, 0);

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

      <main className="max-w-[1600px] mx-auto px-6 py-8 sm:py-12 space-y-12 pb-32 transition-all duration-500 relative z-10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <h2 className="text-xl sm:text-3xl font-black mb-1 sm:mb-2 tracking-tighter uppercase flex items-center gap-2 sm:gap-3">
              Target Finansial <Target className="text-indigo-600" size={20} />
            </h2>
            <p className="text-[8px] sm:text-sm font-bold opacity-50 uppercase tracking-widest">
              Membangun Kekayaan di Masa Depan
            </p>
          </div>
          <button
            id="tour-goals-add"
            onClick={() => setShowGoalManager(true)}
            className={`w-full sm:w-auto px-4 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all ${isDark ? "bg-indigo-600 text-white shadow-xl shadow-indigo-600/20" : "bg-indigo-700 text-white shadow-xl shadow-indigo-600/20"} hover:scale-105 active:scale-95 flex items-center justify-center gap-2`}
          >
            Tambah Goal Baru <Target size={14} className="sm:w-4 sm:h-4" />
          </button>
        </div>

        {/* Divider */}
        <div className="w-full h-px bg-slate-200 dark:bg-white/10" />

        <section id="tour-goals-summary" className="py-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center relative z-10">
            <div className="lg:col-span-5 space-y-6 sm:space-y-8">
              <div className="space-y-2 sm:space-y-3">
                <h2
                  className={`text-xl sm:text-3xl font-black leading-tight ${isDark ? "text-white" : "text-slate-900"} uppercase tracking-tighter`}
                >
                  Ringkasan Progres{" "}
                  <span className="text-indigo-600">Wealth Building</span> Anda
                </h2>
                <p className="text-[10px] sm:text-sm font-bold opacity-50 uppercase tracking-widest">
                  Lacak setiap langkah menuju kebebasan finansial
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div
                  className={`p-4 sm:p-6 rounded-[1.5rem] sm:rounded-3xl border ${isDark ? "bg-white/5 border-white/5" : "bg-indigo-50/30 border-indigo-100"}`}
                >
                  <p className="text-[8px] sm:text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1 sm:mb-2">
                    Rata-rata Progres
                  </p>
                  <div className="flex items-end gap-2">
                    <span className="text-2xl sm:text-4xl font-black tracking-tighter text-indigo-600">
                      {totalTarget > 0
                        ? ((totalAchieved / totalTarget) * 100).toFixed(1)
                        : 0}
                      %
                    </span>
                    <div className="w-full h-1.5 sm:h-2 bg-indigo-200/30 rounded-full mb-1 sm:mb-2 overflow-hidden">
                      <div
                        className="h-full bg-indigo-600 transition-all duration-1000"
                        style={{
                          width: `${totalTarget > 0 ? (totalAchieved / totalTarget) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div
                    className={`p-4 sm:p-6 rounded-[1.5rem] sm:rounded-3xl border ${isDark ? "bg-white/5 border-white/5" : "bg-slate-50/50 border-slate-100"}`}
                  >
                    <p className="text-[8px] sm:text-[10px] font-black opacity-50 uppercase tracking-widest mb-1">
                      Target Aktif
                    </p>
                    <p className="text-xl sm:text-3xl font-black tracking-tighter">
                      {goals.length}
                    </p>
                  </div>
                  <div
                    className={`p-4 sm:p-6 rounded-[1.5rem] sm:rounded-3xl border ${isDark ? "bg-white/5 border-white/5" : "bg-slate-50/50 border-slate-100"}`}
                  >
                    <p className="text-[8px] sm:text-[10px] font-black opacity-50 uppercase tracking-widest mb-1">
                      Tercapai
                    </p>
                    <p className="text-xl sm:text-3xl font-black tracking-tighter text-emerald-500">
                      {
                        goals.filter((g) => {
                          const wallet = wallets.find(
                            (w) => w.id === g.wallet_id,
                          );
                          const current = g.wallet_id
                            ? wallet?.current_balance || 0
                            : g.current_amount;
                          return current >= g.target_amount;
                        }).length
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-12 mt-4">
              <div className="flex items-center gap-2 sm:gap-3 mb-6 sm:mb-8 px-1">
                <div className="w-1 h-5 sm:w-1.5 sm:h-6 bg-indigo-600 rounded-full" />
                <h2
                  className={`text-sm sm:text-lg font-black ${isDark ? "text-white" : "text-slate-900"} uppercase tracking-tighter`}
                >
                  Daftar Impian
                </h2>
              </div>

              <div
                id="tour-goals-list"
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8"
              >
                {loading ? (
                  <div className="col-span-full p-12 sm:p-20 text-center">
                    <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 animate-pulse">
                      Menghitung Target Anda...
                    </p>
                  </div>
                ) : goals.length === 0 ? (
                  <div className="col-span-full p-12 text-center opacity-40 italic text-xs sm:text-sm lowercase">
                    Belum ada target yang dibuat. Mulai bangun masa depan Anda
                    sekarang!
                  </div>
                ) : (
                  goals.map((g) => {
                    const wallet = wallets.find((w) => w.id === g.wallet_id);
                    const current = g.wallet_id
                      ? wallet?.current_balance || 0
                      : g.current_amount;
                    const progress = Math.min(
                      (current / g.target_amount) * 100,
                      100,
                    );

                    return (
                      <div
                        key={g.id}
                        className={`p-5 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] border transition-all hover:scale-[1.02] relative overflow-hidden group ${isDark ? "bg-slate-900/60 border-white/5" : "bg-white border-slate-200"}`}
                      >
                        <div className="absolute right-0 top-0 w-24 h-24 sm:w-32 sm:h-32 -mr-6 -mt-6 sm:-mr-8 sm:-mt-8 opacity-5 group-hover:rotate-12 transition-transform duration-500">
                          <MinimalistIcon
                            icon={g.icon}
                            size={128}
                            style={{ color: g.color }}
                          />
                        </div>
                        <div className="flex justify-between items-start mb-4 sm:mb-6">
                          <div
                            className={`p-3 sm:p-4 rounded-2xl sm:rounded-3xl border ${isDark ? "bg-white/5 border-white/5" : "bg-slate-50 border-slate-100"}`}
                          >
                            <MinimalistIcon
                              icon={g.icon}
                              size={24}
                              className="sm:w-8 sm:h-8"
                              style={{ color: g.color }}
                            />
                          </div>
                          <div className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-indigo-500/10 border border-indigo-600/20">
                            <p className="text-[8px] sm:text-[10px] font-black text-indigo-600 tracking-wider font-mono">
                              {progress.toFixed(1)}%
                            </p>
                          </div>
                        </div>
                        <h3
                          className={`text-sm sm:text-lg font-black mb-0.5 sm:mb-1 truncate ${isDark ? "text-white" : "text-slate-900"}`}
                        >
                          {g.name}
                        </h3>
                        <p className="text-[8px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 sm:mb-6">
                          {g.wallet_id ? "Otomatis" : "Manual"}
                        </p>

                        <div className="flex justify-between items-baseline mb-3 sm:mb-4">
                          <div>
                            <p className="text-[8px] sm:text-[9px] font-black opacity-40 uppercase tracking-widest">
                              Saat Ini
                            </p>
                            <p
                              className={`text-xs sm:text-sm font-black tracking-tighter ${isDark ? "text-slate-200" : "text-slate-700"}`}
                            >
                              Rp {current.toLocaleString("id-ID")}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-[8px] sm:text-[9px] font-black opacity-40 uppercase tracking-widest">
                              Target
                            </p>
                            <p className="text-xs sm:text-sm font-black tracking-tighter opacity-60">
                              Rp {g.target_amount.toLocaleString("id-ID")}
                            </p>
                          </div>
                        </div>

                        <div
                          className={`h-1.5 sm:h-2 w-full rounded-full overflow-hidden ${isDark ? "bg-slate-800" : "bg-slate-200"}`}
                        >
                          <div
                            className="h-full transition-all duration-[1500ms]"
                            style={{
                              width: `${progress}%`,
                              backgroundColor: g.color,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

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

      {/* Mobile Bottom Navigation */}
      <div className="sm:hidden">
        <Navigation isDark={isDark} variant="bottom" />
      </div>
      <AppTour isDark={isDark} />
    </div>
  );
}

export default function GoalsPage() {
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
        <GoalsContent
          user={user}
          isDark={isDark}
          setIsDark={handleThemeChange}
        />
      )}
    </AuthWrapper>
  );
}
