"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import AuthWrapper from "@/components/AuthWrapper";
import WalletManager from "@/components/WalletManager";
import NotificationCenter from "@/components/NotificationCenter";
import MinimalistIcon from "@/components/MinimalistIcon";
import { User } from "@supabase/supabase-js";
import {
  Sun,
  Moon,
  LogOut,
  Wallet,
  TrendingUp as TrendIcon,
  Coins,
  Smartphone,
  Plus,
  Crown,
  Building2,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useSubscription } from "@/hooks/useSubscription";

import Navigation from "@/components/Navigation";
import TransactionForm from "@/components/TransactionForm";
import TransferForm from "@/components/TransferForm";
import AppTour from "@/components/AppTour";
import Skeleton from "@/components/Skeleton";

function WalletsContent({
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
  const [wallets, setWallets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWalletManager, setShowWalletManager] = useState(false);
  const [selectedWalletFilter, setSelectedWalletFilter] = useState("All");
  const [activeQuickAction, setActiveQuickAction] = useState<
    "income" | "outcome" | "transfer" | null
  >(null);

  const fetchData = async (user: User) => {
    setLoading(true);
    const { data: wData } = await supabase
      .from("wallet_balances")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true);

    if (wData) {
      setWallets(wData);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData(user);
  }, [user]);

  const groupedWallets = wallets.reduce((acc: any, w) => {
    const type = w.type || "other";
    if (!acc[type]) acc[type] = [];
    acc[type].push(w);
    return acc;
  }, {});

  const typeLabels: any = {
    cash: "Tunai",
    bank: "Akun Bank",
    ewallet: "Dompet Digital",
    investment: "Investasi",
    other: "Lainnya",
  };

  const totalBalance = wallets.reduce(
    (acc, w) => acc + (w.current_balance || 0),
    0,
  );

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

      <main className="max-w-[1600px] mx-auto px-6 py-8 sm:py-12 space-y-12 pb-32 relative z-10 transition-all duration-500">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <h2 className="text-xl sm:text-3xl font-black mb-1 sm:mb-2 tracking-tighter uppercase text-indigo-600 sm:text-inherit">
              Arsitektur Dompet
            </h2>
            <p className="text-[8px] sm:text-sm font-bold opacity-50 uppercase tracking-widest">
              Manajemen Aset & Alokasi Dana
            </p>
          </div>
          <div
            id="tour-wallets-total"
            className="w-full sm:w-auto p-4 sm:p-0 rounded-2xl sm:rounded-none bg-indigo-500/5 sm:bg-transparent border border-indigo-600/10 sm:border-0"
          >
            <p className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
              Total Saldo Terkonsolidasi
            </p>
            <p className="text-xl sm:text-2xl font-black tracking-tighter text-indigo-600">
              <span className="text-[10px] mr-1.5 opacity-60">IDR</span>
              {totalBalance.toLocaleString("id-ID")}
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="w-full h-px bg-slate-200 dark:bg-white/10" />

        <section id="tour-wallets-list" className="py-4">
          <div className="flex justify-between items-center mb-6 sm:mb-10">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-1 h-5 sm:w-1.5 sm:h-6 bg-indigo-600 rounded-full" />
              <h2
                className={`text-sm sm:text-lg font-black ${isDark ? "text-white" : "text-slate-900"} uppercase tracking-tighter`}
              >
                Struktur Aset
              </h2>
            </div>
            <button
              id="tour-wallets-manage"
              onClick={() => setShowWalletManager(true)}
              className={`px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl text-[8px] sm:text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 ${isDark ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" : "bg-indigo-700 text-white shadow-lg shadow-indigo-600/20"} hover:scale-105 active:scale-95`}
            >
              <Wallet size={12} className="sm:w-3.5 sm:h-3.5" />{" "}
              <span className="hidden sm:inline">Kelola Dompet</span>
              <span className="sm:hidden">Kelola</span>
            </button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-12">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="space-y-4 sm:space-y-6">
                  <div className="flex items-center gap-3 px-1">
                    <Skeleton className="w-8 h-8 rounded-xl" />
                    <div className="space-y-1">
                      <Skeleton className="w-16 h-3 rounded" />
                      <Skeleton className="w-24 h-4 rounded" />
                    </div>
                  </div>
                  <div className="space-y-2.5">
                    <Skeleton className="w-full h-16 rounded-[1.5rem]" />
                    <Skeleton className="w-full h-16 rounded-[1.5rem]" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-12">
              {Object.keys(groupedWallets)
                .sort()
                .map((type) => (
                  <div key={type} className="space-y-4 sm:space-y-6">
                    <div className="flex items-center gap-3 px-1">
                      <div
                        className={`p-1.5 sm:p-2 rounded-lg sm:rounded-xl ${isDark ? "bg-indigo-500/10" : "bg-indigo-50"}`}
                      >
                        {type === "cash" && (
                          <Coins size={16} className="text-indigo-600" />
                        )}
                        {type === "bank" && (
                          <Building2 size={16} className="text-indigo-600" />
                        )}
                        {type === "ewallet" && (
                          <Smartphone size={16} className="text-indigo-600" />
                        )}
                        {type === "investment" && (
                          <TrendIcon size={16} className="text-indigo-600" />
                        )}
                        {type === "other" && (
                          <Wallet size={16} className="text-indigo-600" />
                        )}
                      </div>
                      <div>
                        <p className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] sm:tracking-[0.25em]">
                          {typeLabels[type] || type.toUpperCase()}
                        </p>
                        <p
                          className={`text-[10px] sm:text-xs font-bold ${isDark ? "text-slate-200" : "text-slate-600"}`}
                        >
                          Rp{" "}
                          {groupedWallets[type]
                            .reduce(
                              (acc: number, w: any) =>
                                acc + (w.current_balance || 0),
                              0,
                            )
                            .toLocaleString("id-ID")}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2.5">
                      {groupedWallets[type].map((w: any) => (
                        <div
                          key={w.id}
                          className={`p-4 sm:p-5 rounded-[1.5rem] sm:rounded-3xl border transition-all flex items-center justify-between group relative overflow-hidden ${isDark ? "bg-slate-900/40 border-white/5 hover:bg-slate-900/60" : "bg-white border-slate-100 hover:bg-slate-50 shadow-sm"}`}
                        >
                          <div
                            className="absolute left-0 top-0 bottom-0 w-1 transition-all"
                            style={{ backgroundColor: w.color }}
                          />
                          <div className="flex items-center gap-3 sm:gap-4">
                            <div className="scale-100 group-hover:scale-110 transition-transform">
                              <MinimalistIcon
                                icon={w.icon}
                                size={20}
                                style={{ color: w.color }}
                              />
                            </div>
                            <div>
                              <p
                                className={`text-xs sm:text-sm font-black ${isDark ? "text-white" : "text-slate-900"}`}
                              >
                                {w.name}
                              </p>
                              <p className="text-[8px] sm:text-[10px] font-bold text-slate-500 uppercase">
                                {w.type?.toUpperCase()}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p
                              className={`text-xs sm:text-sm font-black tracking-tighter ${isDark ? "text-white" : "text-slate-900"}`}
                            >
                              Rp {w.current_balance?.toLocaleString("id-ID")}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </section>
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

export default function WalletsPage() {
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
        <WalletsContent
          user={user}
          isDark={isDark}
          setIsDark={handleThemeChange}
        />
      )}
    </AuthWrapper>
  );
}
