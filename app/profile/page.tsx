"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import AuthWrapper from "@/components/AuthWrapper";
import Navigation from "@/components/Navigation";
import { User } from "@supabase/supabase-js";
import {
  Sun,
  Moon,
  LogOut,
  User as UserIcon,
  Mail,
  Calendar,
  Crown,
  Settings,
  Bell,
  Shield,
  HelpCircle,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { useSubscription } from "@/hooks/useSubscription";
import AppTour from "@/components/AppTour";

function ProfileContent({
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
  const [loading, setLoading] = useState(false);

  const handleSignOut = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signOut();
    if (error) {
      alert("Gagal keluar: " + error.message);
      setLoading(false);
    }
  };

  interface ProfileItem {
    icon: React.ReactNode;
    label: string;
    value: string | number | undefined | null;
    color: string;
    action?: () => void;
    isToggle?: boolean;
  }

  const profileSections: { title: string; items: ProfileItem[] }[] = [
    {
      title: "Akun",
      items: [
        {
          icon: <Mail size={20} />,
          label: "Email",
          value: user.email,
          color: "text-blue-500",
        },
        {
          icon: <Calendar size={20} />,
          label: "Bergabung Sejak",
          value: new Date(user.created_at || "").toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
          }),
          color: "text-purple-500",
        },
      ],
    },
    {
      title: "Preferensi",
      items: [
        {
          icon: isDark ? <Sun size={20} /> : <Moon size={20} />,
          label: "Tema",
          value: isDark ? "Mode Gelap" : "Mode Terang",
          color: isDark ? "text-amber-500" : "text-amber-500",
          action: () => setIsDark(!isDark),
          isToggle: true,
        },
        {
          icon: <Bell size={20} />,
          label: "Notifikasi",
          value: "Aktif",
          color: "text-green-500",
        },
      ],
    },
  ];

  return (
    <div
      className={`min-h-screen transition-all duration-700 relative overflow-hidden ${isDark ? "bg-[#020617] text-slate-100" : "bg-slate-50 text-slate-900"}`}
    >
      {/* Background Decorative Elements */}
      <div className="absolute top-[-15%] left-[-15%] w-[50%] h-[50%] bg-indigo-600/10 rounded-full blur-[160px] animate-float opacity-50" />
      <div
        className="absolute bottom-[-15%] right-[-15%] w-[50%] h-[50%] bg-violet-600/10 rounded-full blur-[160px] animate-float opacity-50"
        style={{ animationDelay: "-3s" }}
      />

      {/* Header */}
      <header className="px-6 pt-8 pb-4 relative z-20">
        <div className="max-w-[1600px] mx-auto flex justify-between items-center">
          <div className="flex flex-col min-w-0 pr-2">
            <h1
              className={`text-lg sm:text-xl font-bold tracking-tight truncate ${isDark ? "text-white" : "text-slate-900"}`}
            >
              Profil Saya
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
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-6 py-8 space-y-8 pb-32 relative z-10">
        {/* Profile Header Card */}
        <section>
          <div className="py-4 relative overflow-hidden">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              {/* Avatar */}
              <div
                className={`w-24 h-24 rounded-[2rem] flex items-center justify-center ${
                  isPro
                    ? "bg-gradient-to-br from-indigo-600 to-violet-600"
                    : "bg-gradient-to-br from-slate-600 to-slate-700"
                } text-white shadow-xl relative`}
              >
                <UserIcon size={48} strokeWidth={2} />
                {isPro && (
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center shadow-lg">
                    <Crown size={16} className="text-white" />
                  </div>
                )}
              </div>

              {/* User Info */}
              <div className="flex-1 text-center sm:text-left">
                <h2
                  className={`text-2xl font-black uppercase tracking-tight mb-1 ${isDark ? "text-white" : "text-slate-900"}`}
                >
                  {user.email?.split("@")[0]}
                </h2>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-3">
                  {isPro ? "Member Pro" : "Member Free"}
                </p>
                {isPro && subscription?.status === "trialing" && (
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                    <Sparkles size={14} className="text-amber-500" />
                    <span className="text-xs font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                      Trial: {subscription.days_left} hari tersisa
                    </span>
                  </div>
                )}
              </div>

              {/* Sign Out Button */}
              <button
                onClick={handleSignOut}
                disabled={loading}
                className={`px-6 py-3 rounded-2xl font-black text-sm uppercase tracking-wider transition-all ${
                  loading
                    ? "bg-slate-400 cursor-not-allowed"
                    : "bg-red-500 hover:bg-red-600 active:scale-95"
                } text-white shadow-lg`}
              >
                {loading ? "Keluar..." : "Keluar"}
              </button>
            </div>
          </div>
        </section>

        {/* Profile Sections */}
        {profileSections.map((section, sectionIndex) => (
          <section key={sectionIndex}>
            <h3
              className={`text-lg font-black uppercase tracking-tight mb-4 px-1 ${isDark ? "text-white" : "text-slate-900"}`}
            >
              {section.title}
            </h3>
            <div
              className={`p-6 rounded-[2.5rem] border ${
                isDark
                  ? "bg-slate-900 border-white/5 shadow-2xl shadow-black/40"
                  : "bg-white border-slate-100 shadow-xl shadow-slate-200/50"
              }`}
            >
              <div className="space-y-4">
                {section.items.map((item, itemIndex) => (
                  <button
                    key={itemIndex}
                    onClick={item.action}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${
                      item.action
                        ? isDark
                          ? "hover:bg-white/5 cursor-pointer"
                          : "hover:bg-slate-50 cursor-pointer"
                        : "cursor-default"
                    }`}
                  >
                    <div
                      className={`w-12 h-12 rounded-xl ${isDark ? "bg-white/5" : "bg-slate-100"} flex items-center justify-center ${item.color}`}
                    >
                      {item.icon}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        {item.label}
                      </p>
                      <p
                        className={`text-sm font-bold mt-0.5 ${isDark ? "text-white" : "text-slate-900"}`}
                      >
                        {item.value}
                      </p>
                    </div>
                    {item.action && (
                      <ChevronRight
                        size={20}
                        className="text-slate-400 opacity-50"
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </section>
        ))}

        {/* Quick Links */}
        <section>
          <h3
            className={`text-lg font-black uppercase tracking-tight mb-4 px-1 ${isDark ? "text-white" : "text-slate-900"}`}
          >
            Bantuan
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              href="/pricing"
              className={`p-6 rounded-2xl border transition-all hover:scale-105 active:scale-95 ${
                isDark
                  ? "bg-slate-900 border-white/5 hover:border-indigo-500/30"
                  : "bg-white border-slate-100 hover:border-indigo-200"
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                  <Crown size={20} />
                </div>
                <div>
                  <p
                    className={`font-black text-sm ${isDark ? "text-white" : "text-slate-900"}`}
                  >
                    Upgrade ke Pro
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">Fitur Premium</p>
                </div>
              </div>
            </Link>

            <button
              className={`p-6 rounded-2xl border transition-all hover:scale-105 active:scale-95 ${
                isDark
                  ? "bg-slate-900 border-white/5 hover:border-blue-500/30"
                  : "bg-white border-slate-100 hover:border-blue-200"
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                  <HelpCircle size={20} />
                </div>
                <div className="text-left">
                  <p
                    className={`font-black text-sm ${isDark ? "text-white" : "text-slate-900"}`}
                  >
                    Pusat Bantuan
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">FAQ & Panduan</p>
                </div>
              </div>
            </button>
          </div>
        </section>

        {/* App Version */}
        <div className="text-center pt-8">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
            Dompet Saya Pro v1.0.0
          </p>
          <p className="text-[10px] font-bold text-slate-400 mt-1">
            © 2026 Platform Kecerdasan Finansial
          </p>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="sm:hidden">
        <Navigation isDark={isDark} variant="bottom" />
      </div>

      <AppTour isDark={isDark} />
    </div>
  );
}

export default function ProfilePage() {
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
        <ProfileContent
          user={user}
          isDark={isDark}
          setIsDark={handleThemeChange}
        />
      )}
    </AuthWrapper>
  );
}
