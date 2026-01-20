"use client";
import { useSubscription } from "@/hooks/useSubscription";
import { Sparkles, Clock, ChevronRight } from "lucide-react";
import Link from "next/link";

export default function TrialBanner({ isDark }: { isDark: boolean }) {
  const { subscription, loading } = useSubscription();

  if (loading || !subscription) return null;

  // Only show if user is in trial mode
  if (subscription.status !== "trialing" || !subscription.is_pro) return null;

  return (
    <div
      className={`mb-8 p-4 sm:p-5 rounded-[2rem] border transition-all relative overflow-hidden group ${
        isDark
          ? "bg-indigo-500/10 border-indigo-500/20 shadow-2xl shadow-indigo-900/20"
          : "bg-indigo-50 border-indigo-100 shadow-xl shadow-indigo-200/20"
      }`}
    >
      {/* Background patterns */}
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-700">
        <Sparkles size={120} className="text-indigo-500" />
      </div>

      <div className="relative z-10 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/40 shrink-0">
            <Clock className="text-white" size={24} />
          </div>
          <div>
            <h3
              className={`text-sm sm:text-base font-black uppercase tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}
            >
              Uji Coba Pro Aktif ✨
            </h3>
            <p
              className={`text-[10px] sm:text-xs font-medium opacity-70 ${isDark ? "text-slate-300" : "text-slate-600"}`}
            >
              Nikmati fitur analisis AI & ekspor PDF gratis selama{" "}
              {subscription.days_left} hari lagi.
            </p>
          </div>
        </div>

        <Link
          href="/pricing"
          className={`w-full sm:w-auto px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 ${
            isDark
              ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-600/20"
              : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-600/20"
          }`}
        >
          Lihat Paket Pro <ChevronRight size={14} />
        </Link>
      </div>
    </div>
  );
}
