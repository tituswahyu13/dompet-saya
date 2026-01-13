"use client"
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navigation({ isDark }: { isDark: boolean }) {
  const pathname = usePathname();

  const navItems = [
    { name: 'Dashboard', href: '/', icon: '📊' },
    { name: 'Transaksi', href: '/transactions', icon: '💸' },
    { name: 'Goals', href: '#goals', icon: '🎯' },
  ];

  return (
    <nav className={`flex items-center gap-2 p-1.5 rounded-2xl border backdrop-blur-md ${
      isDark ? 'bg-slate-900/40 border-white/5' : 'bg-white/50 border-slate-200'
    }`}>
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
              isActive
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20 scale-105'
                : isDark ? 'text-slate-400 hover:text-white hover:bg-white/5' : 'text-slate-500 hover:text-blue-600 hover:bg-blue-50'
            }`}
          >
            <span>{item.icon}</span>
            <span className="hidden sm:inline">{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}
