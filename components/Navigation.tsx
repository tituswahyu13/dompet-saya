"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ArrowRightLeft,
  Wallet,
  BarChart3,
  Target,
  Percent,
} from "lucide-react";

export default function Navigation({
  isDark,
  variant = "header",
}: {
  isDark: boolean;
  variant?: "header" | "bottom";
}) {
  const pathname = usePathname();

  const navItems = [
    {
      name: "Beranda",
      href: "/",
      icon: <LayoutDashboard size={variant === "bottom" ? 22 : 16} />,
    },
    {
      name: "Dompet",
      href: "/wallets",
      icon: <Wallet size={variant === "bottom" ? 22 : 16} />,
    },
    {
      name: "Analitik",
      href: "/analytics",
      icon: <BarChart3 size={variant === "bottom" ? 22 : 16} />,
    },
    {
      name: "Transaksi",
      href: "/transactions",
      icon: <ArrowRightLeft size={variant === "bottom" ? 22 : 16} />,
    },
    {
      name: "Anggaran",
      href: "/budgets",
      icon: <Percent size={variant === "bottom" ? 22 : 16} />,
    },
    {
      name: "Target",
      href: "/goals",
      icon: <Target size={variant === "bottom" ? 22 : 16} />,
    },
  ];

  if (variant === "bottom") {
    return (
      <nav
        className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] w-[96%] max-w-md p-1 rounded-[2rem] border shadow-2xl backdrop-blur-2xl flex items-center justify-around ${
          isDark
            ? "glass-dark border-white/10 shadow-black/50"
            : "glass border-white shadow-slate-200/50"
        }`}
      >
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center py-2 px-1 rounded-2xl transition-all duration-300 flex-1 ${
                isActive
                  ? isDark
                    ? "bg-white/10 text-indigo-400"
                    : "bg-indigo-50 text-indigo-600"
                  : "text-slate-400 hover:text-indigo-600"
              }`}
            >
              <div
                className={`${isActive ? "scale-110" : "scale-100"} transition-transform`}
              >
                {item.icon}
              </div>
              <span className="text-[8px] font-black uppercase tracking-tighter mt-1 opacity-80">
                {item.name === "Transactions" ? "Tx" : item.name}
              </span>
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <nav
      className={`flex items-center gap-1 sm:gap-2 p-1 sm:p-1.5 rounded-xl sm:rounded-2xl border backdrop-blur-md ${
        isDark
          ? "bg-slate-900/40 border-white/5"
          : "bg-white/50 border-slate-200"
      }`}
    >
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 sm:gap-2 ${
              isActive
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 scale-105"
                : isDark
                  ? "text-slate-400 hover:text-white hover:bg-white/5"
                  : "text-slate-500 hover:text-indigo-600 hover:bg-indigo-50"
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
