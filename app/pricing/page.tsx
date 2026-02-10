"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { useSubscription } from "@/hooks/useSubscription";
import AuthWrapper from "@/components/AuthWrapper";
import Navigation from "@/components/Navigation";
import { Check, X, Sparkles, Crown, ArrowLeft } from "lucide-react";
import Link from "next/link";

import { Sun, Moon, LogOut } from "lucide-react";

function PricingContent({ user }: { user: User }) {
  const router = useRouter();
  const { subscription, loading } = useSubscription();
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

  const features = [
    { name: "Jumlah Dompet", free: "3 Dompet", pro: "Tanpa Batas" },
    { name: "Target Keuangan", free: "2 Target", pro: "Tanpa Batas" },
    { name: "Transaksi Berulang", free: "1 Transaksi", pro: "Tanpa Batas" },
    { name: "Kategori Anggaran", free: "2 Kategori", pro: "Tanpa Batas" },
    { name: "Akses Data Historis", free: "2 Bulan", pro: "Selamanya" },
    { name: "AI Insights Dasar", free: true, pro: true },
    { name: "AI Advanced Prediction", free: false, pro: true },
    { name: "AI Financial Advisor", free: false, pro: true },
    { name: "Export PDF Professional", free: false, pro: true },
    { name: "Analisis Anomali Pro", free: true, pro: true },
  ];

  const handleActivateTrial = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("user_subscriptions")
      .update({
        tier: "pro",
        status: "trialing",
        trial_end_date: new Date(
          Date.now() + 60 * 24 * 60 * 60 * 1000,
        ).toISOString(),
      })
      .eq("user_id", user.id);

    if (!error) {
      router.push("/");
    } else {
      alert("Gagal: " + error.message);
    }
  };

  if (loading) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${isDark ? "bg-slate-950" : "bg-slate-50"}`}
      >
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen transition-all duration-700 relative overflow-hidden ${isDark ? "bg-[#020617] text-slate-100" : "bg-slate-50 text-slate-900"}`}
    >
      {/* Immersive Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[10%] right-[-10%] w-[50%] h-[50%] bg-violet-600/10 rounded-full blur-[160px] animate-float opacity-50" />
      <div className="absolute top-[30%] right-[10%] w-[20%] h-[20%] bg-indigo-600/5 rounded-full blur-[100px] animate-pulse-slow" />

      <header className="px-6 pt-8 pb-4 relative z-20">
        <div className="max-w-[1600px] mx-auto flex justify-between items-center">
          <div className="flex flex-col">
            <h1
              className={`text-xl font-bold tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}
            >
              Hai, {user.email?.split("@")[0]}
            </h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => handleThemeChange(!isDark)}
              className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${isDark ? "bg-slate-800 text-amber-400 border border-white/5" : "bg-white text-slate-500 border border-slate-200 shadow-sm"} hover:scale-105 active:scale-95`}
              title="Ganti Tema"
            >
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <button
              onClick={async () => {
                const { error } = await supabase.auth.signOut();
                if (error) alert("Gagal keluar: " + error.message);
              }}
              className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${isDark ? "bg-red-500/10 text-red-500 border border-red-500/20" : "bg-red-50 text-red-600 border border-red-100 shadow-sm"} hover:scale-105 active:scale-95`}
              title="Keluar"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-6 py-8 sm:py-20 relative z-10 transition-all duration-500">
        {/* Back Button */}
        <Link
          href="/"
          className={`inline-flex items-center gap-2 mb-12 text-xs font-black uppercase tracking-[0.3em] ${isDark ? "text-slate-500 hover:text-indigo-400" : "text-slate-400 hover:text-indigo-600"} transition-all group`}
        >
          <ArrowLeft
            size={16}
            className="group-hover:-translate-x-1 transition-transform"
          />
          Kembali ke Dasbor
        </Link>

        {/* Header Section */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-3 px-6 py-2.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-8 backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <Crown className="text-indigo-600" size={18} />
            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.4em]">
              Keanggotaan Elite
            </span>
          </div>
          <h1
            className={`text-4xl sm:text-7xl font-black uppercase tracking-tighter mb-8 max-w-4xl mx-auto leading-[0.9] animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200 ${isDark ? "text-white" : "text-slate-900"}`}
          >
            Kuasai{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-800">
              Takdir Finansial
            </span>{" "}
            Anda
          </h1>
          <p
            className={`text-base sm:text-xl font-bold max-w-2xl mx-auto opacity-70 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-500 ${isDark ? "text-slate-400" : "text-slate-600"}`}
          >
            Buka kerangka kerja finansial tercanggih di dunia. Didukung AI,
            dibangun untuk akurasi, dirancang untuk eksklusivitas.
          </p>
        </div>

        {/* Pricing Architecture */}
        <div className="grid lg:grid-cols-2 gap-8 mb-24 max-w-5xl mx-auto">
          {/* Free Tier: The Genesis */}
          <div
            className={`group p-10 rounded-[3rem] border transition-all duration-500 hover:border-indigo-500/30 ${isDark ? "glass-dark border-white/5" : "glass border-slate-200"} animate-in fade-in zoom-in-95 duration-1000 delay-700`}
          >
            <div className="mb-10">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-4">
                The Essentials
              </p>
              <h3
                className={`text-3xl font-black uppercase tracking-tight mb-4 ${isDark ? "text-white" : "text-slate-900"}`}
              >
                Free Tier
              </h3>
              <div className="flex items-baseline gap-2">
                <span
                  className={`text-5xl font-black ${isDark ? "text-white" : "text-slate-900"}`}
                >
                  Rp 0
                </span>
                <span
                  className={`text-sm font-black uppercase tracking-widest ${isDark ? "text-slate-500" : "text-slate-400"}`}
                >
                  / Bulan
                </span>
              </div>
            </div>

            <div className="space-y-4 mb-12">
              {features.map((f, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-4 ${!f.free ? "opacity-30" : ""}`}
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center ${f.free ? "bg-emerald-500/10 text-emerald-500" : "bg-slate-500/10 text-slate-500"}`}
                  >
                    {f.free ? (
                      <Check size={14} strokeWidth={3} />
                    ) : (
                      <X size={14} strokeWidth={3} />
                    )}
                  </div>
                  <p
                    className={`text-xs font-bold uppercase tracking-widest ${isDark ? "text-slate-300" : "text-slate-700"}`}
                  >
                    {f.name}{" "}
                    <span className="opacity-50 font-medium ml-1">
                      ─ {typeof f.free === "string" ? f.free : ""}
                    </span>
                  </p>
                </div>
              ))}
            </div>

            <button
              disabled
              className={`w-full py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] transition-all border ${isDark ? "bg-white/5 text-slate-600 border-white/5" : "bg-slate-100 text-slate-400 border-transparent"} cursor-not-allowed`}
            >
              Paket Saat Ini
            </button>
          </div>

          {/* Pro Tier: The Evolution */}
          <div
            className={`relative group p-1 split-glow rounded-[3rem] animate-in fade-in zoom-in-95 duration-1000 delay-1000`}
          >
            {/* Glow Aura */}
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-800 rounded-[3rem] blur opacity-40 group-hover:opacity-70 transition-opacity duration-700" />

            <div
              className={`relative h-full p-10 rounded-[2.9rem] flex flex-col overflow-hidden ${isDark ? "bg-slate-950/90" : "bg-white/95"}`}
            >
              {/* Visual Centerpiece */}
              <div className="absolute top-[-20px] right-[-20px] w-40 h-40 opacity-20 pointer-events-none grayscale brightness-150">
                <img
                  src="/DompetSaya.svg"
                  alt="Elite"
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="mb-10">
                <div className="flex justify-between items-start mb-4">
                  <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.4em]">
                    Kecerdasan Elite
                  </p>
                  <div className="px-3 py-1 bg-indigo-600 text-[8px] font-black text-white uppercase tracking-[0.2em] rounded-full shadow-lg shadow-indigo-600/40">
                    Paling Dicari
                  </div>
                </div>
                <h3
                  className={`text-3xl font-black uppercase tracking-tight mb-4 ${isDark ? "text-white" : "text-slate-900"}`}
                >
                  Pro Edition
                </h3>
                <div className="flex items-baseline gap-2">
                  <span
                    className={`text-5xl font-black ${isDark ? "text-white" : "text-slate-900"}`}
                  >
                    Rp 19rb
                  </span>
                  <span
                    className={`text-sm font-black uppercase tracking-widest ${isDark ? "text-slate-500" : "text-slate-400"}`}
                  >
                    / Bulan
                  </span>
                </div>
                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mt-4 flex items-center gap-2">
                  <Sparkles size={12} /> Harga Pengenalan
                </p>
              </div>

              <div className="space-y-4 mb-12 flex-1">
                {features.map((f, i) => (
                  <div key={i} className="flex items-center gap-4 group/item">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-md">
                      <Check size={14} strokeWidth={3} />
                    </div>
                    <p
                      className={`text-xs font-black uppercase tracking-widest ${isDark ? "text-white" : "text-slate-900"} group-hover/item:translate-x-1 transition-transform`}
                    >
                      {f.name}{" "}
                      <span className="opacity-40 font-bold ml-1">
                        ─ {typeof f.pro === "string" ? f.pro : "Akses Penuh"}
                      </span>
                    </p>
                  </div>
                ))}
              </div>

              {subscription?.status === "trialing" ? (
                <div className="w-full py-5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-2xl text-center text-[10px] font-black uppercase tracking-[0.3em] backdrop-blur-sm">
                  Uji Coba Aktif: Sisa {subscription.days_left} Hari
                </div>
              ) : subscription?.is_pro ? (
                <div className="w-full py-5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 rounded-2xl text-center text-[10px] font-black uppercase tracking-[0.3em] backdrop-blur-sm">
                  Akses Elite Diberikan
                </div>
              ) : (
                <button
                  onClick={handleActivateTrial}
                  className="w-full py-5 bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-800 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] hover:scale-[1.03] active:scale-95 transition-all shadow-indigo-600/20 flex items-center justify-center gap-3 group/btn"
                >
                  <Sparkles
                    size={16}
                    className="group-hover:rotate-12 transition-transform"
                  />
                  Coba Elite Pro ─ Gratis 60 Hari
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Global FAQs: The Trust Layer */}
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-12">
            <div className="w-12 h-px bg-slate-500/20" />
            <h3
              className={`text-sm font-black uppercase tracking-[0.4em] ${isDark ? "text-slate-500" : "text-slate-400"}`}
            >
              Transparansi Finansial
            </h3>
            <div className="w-12 h-px bg-slate-500/20" />
          </div>

          <div className="grid md:grid-cols-2 gap-10">
            {[
              {
                q: "Payment Security",
                a: "Sistem pembayaran sedang dikembangkan secara aman. Trial 60 hari tersedia segera untuk akses penuh.",
              },
              {
                q: "Cancellation Policy",
                a: "Otonomi penuh. Batalkan langganan kapan saja dari dasbor manajemen tanpa interupsi.",
              },
              {
                q: "Post-Trial Protocol",
                a: "Kembali ke paket Free secara otomatis. Integritas data Anda tetap terjaga 100%.",
              },
              {
                q: "Enterprise Grade",
                a: "Butuh kustomisasi lebih? Hubungi tim pendukung kami untuk solusi keuangan skala besar.",
              },
            ].map((faq, i) => (
              <div key={i} className="group">
                <h4
                  className={`text-xs font-black uppercase tracking-widest mb-3 ${isDark ? "text-white" : "text-slate-900"} group-hover:text-indigo-600 transition-colors`}
                >
                  {faq.q}
                </h4>
                <p
                  className={`text-sm leading-relaxed ${isDark ? "text-slate-400" : "text-slate-600"}`}
                >
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </main>

      <style jsx>{`
        .animate-float {
          animation: float 20s infinite ease-in-out;
        }
        .animate-pulse-slow {
          animation: pulse 12s infinite ease-in-out;
        }
        @keyframes float {
          0%,
          100% {
            transform: translate(0, 0);
          }
          50% {
            transform: translate(5%, 10%);
          }
        }
      `}</style>
    </div>
  );
}

export default function PricingPage() {
  return <AuthWrapper>{(user) => <PricingContent user={user} />}</AuthWrapper>;
}
