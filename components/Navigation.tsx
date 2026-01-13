"use client"
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ArrowRightLeft } from 'lucide-react';

export default function Navigation({ isDark, variant = 'header' }: { isDark: boolean; variant?: 'header' | 'bottom' }) {
  const pathname = usePathname();

  const navItems = [
    { name: 'Dashboard', href: '/', icon: <LayoutDashboard size={variant === 'bottom' ? 24 : 16} /> },
    { name: 'Transaksi', href: '/transactions', icon: <ArrowRightLeft size={variant === 'bottom' ? 24 : 16} /> },
  ];

  if (variant === 'bottom') {
    return (
      <nav className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-sm p-2 rounded-[2rem] border shadow-2xl backdrop-blur-2xl flex items-center justify-around ${
        isDark ? 'glass-dark border-white/10 shadow-black/50' : 'glass border-white shadow-slate-200/50'
      }`}>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 transition-all px-6 py-2 rounded-2xl ${
                isActive 
                  ? 'text-rose-500 scale-110' 
                  : isDark ? 'text-slate-500 hover:text-white' : 'text-slate-400 hover:text-slate-900'
              }`}
            >
              {item.icon}
              <span className="text-[9px] font-black uppercase tracking-widest">{item.name}</span>
              {isActive && (
                <div className="w-1 h-1 bg-rose-500 rounded-full animate-pulse" />
              )}
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <nav className={`flex items-center gap-1 sm:gap-2 p-1 sm:p-1.5 rounded-xl sm:rounded-2xl border backdrop-blur-md ${
      isDark ? 'bg-slate-900/40 border-white/5' : 'bg-white/50 border-slate-200'
    }`}>
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 sm:gap-2 ${
              isActive
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-500/20 scale-105'
                : isDark ? 'text-slate-400 hover:text-white hover:bg-white/5' : 'text-slate-500 hover:text-rose-600 hover:bg-rose-50'
            }`}
          >
            {item.icon}
            <span className="hidden xs:inline sm:inline">{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}
