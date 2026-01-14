"use client"
import { Crown, Sparkles, X } from 'lucide-react';
import Link from 'next/link';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  title: string;
  message: string;
  feature: string;
}

export default function UpgradeModal({ isOpen, onClose, isDark, title, message, feature }: UpgradeModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[200] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className={`w-full max-w-md rounded-[2.5rem] border shadow-2xl animate-in zoom-in-95 duration-300 relative overflow-hidden ${
        isDark ? 'bg-slate-900/95 border-white/5 shadow-black/50' : 'bg-white/95 border-slate-200 shadow-slate-200/50'
      }`}>
        {/* Decorative Background */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-[80px]" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-pink-500/10 rounded-full blur-[80px]" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className={`absolute top-6 right-6 w-8 h-8 rounded-xl flex items-center justify-center transition-all z-10 ${
            isDark ? 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
          }`}
        >
          <X size={16} />
        </button>

        {/* Content */}
        <div className="relative z-10 p-8 text-center">
          {/* Icon */}
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-rose-500 to-pink-600 rounded-[2rem] flex items-center justify-center shadow-xl shadow-rose-500/30 animate-pulse">
            <Crown className="text-white" size={40} />
          </div>

          {/* Title */}
          <h3 className={`text-xl font-black uppercase tracking-tight mb-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {title}
          </h3>

          {/* Feature Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rose-500/10 border border-rose-500/20 mb-4">
            <Sparkles className="text-rose-500" size={14} />
            <span className="text-xs font-black text-rose-500 uppercase tracking-widest">{feature}</span>
          </div>

          {/* Message */}
          <p className={`text-sm mb-8 leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            {message}
          </p>

          {/* Buttons */}
          <div className="flex flex-col gap-3">
            <Link
              href="/pricing"
              className="w-full py-4 bg-gradient-to-r from-rose-600 to-pink-600 text-white rounded-xl text-sm font-black uppercase tracking-widest hover:scale-[1.02] transition-all shadow-xl shadow-rose-500/20 flex items-center justify-center gap-2"
            >
              <Crown size={16} />
              Upgrade ke Pro
            </Link>
            <button
              onClick={onClose}
              className={`w-full py-3 rounded-xl text-sm font-bold transition-all ${
                isDark ? 'bg-white/5 text-slate-400 hover:bg-white/10' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Nanti Saja
            </button>
          </div>

          {/* Trial Info */}
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-6">
            ✨ Coba gratis 60 hari tanpa kartu kredit
          </p>
        </div>
      </div>
    </div>
  );
}
