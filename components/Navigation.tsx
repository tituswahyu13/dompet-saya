"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  ArrowRightLeft,
  Wallet,
  Target,
  Percent,
  TrendingUp,
  User as UserIcon,
  Plus,
  TrendingDown,
  LogIn,
  Repeat,
} from "lucide-react";

export default function Navigation({
  isDark,
  variant = "header",
  onQuickAction,
}: {
  isDark: boolean;
  variant?: "header" | "bottom";
  onQuickAction?: (action: "income" | "outcome" | "transfer") => void;
}) {
  const pathname = usePathname();
  const [showQuickMenu, setShowQuickMenu] = useState(false);

  const navItems = [
    {
      name: "Beranda",
      href: "/",
      icon: <LayoutDashboard size={variant === "bottom" ? 22 : 16} />,
    },
    {
      name: "Tren",
      href: "/analytics",
      icon: <TrendingUp size={variant === "bottom" ? 22 : 16} />,
    },
    {
      name: "Dompet",
      href: "/wallets",
      icon: <Wallet size={variant === "bottom" ? 22 : 16} />,
    },
    {
      name: "Profil",
      href: "/profile",
      icon: <UserIcon size={variant === "bottom" ? 22 : 16} />,
    },
  ];

  const quickActions = [
    {
      id: "income" as const,
      label: "Masuk",
      icon: <LogIn size={20} />,
      color: "bg-green-500",
      hoverColor: "hover:bg-green-600",
    },
    {
      id: "outcome" as const,
      label: "Keluar",
      icon: <TrendingDown size={20} />,
      color: "bg-red-500",
      hoverColor: "hover:bg-red-600",
    },
    {
      id: "transfer" as const,
      label: "Transfer",
      icon: <Repeat size={20} />,
      color: "bg-indigo-500",
      hoverColor: "hover:bg-indigo-600",
    },
  ];

  const handleQuickActionClick = (
    actionId: "income" | "outcome" | "transfer",
  ) => {
    setShowQuickMenu(false);
    if (onQuickAction) {
      onQuickAction(actionId);
    }
  };

  if (variant === "bottom") {
    return (
      <>
        {/* Quick Action Menu Overlay */}
        {showQuickMenu && (
          <div
            className="fixed inset-0 z-[99] bg-black/20 backdrop-blur-sm"
            onClick={() => setShowQuickMenu(false)}
          />
        )}

        {/* Bottom Navigation */}
        <nav
          className={`fixed bottom-0 left-0 right-0 z-[100] pb-6 pt-3 px-6 border-t backdrop-blur-2xl flex items-center justify-between ${
            isDark
              ? "bg-slate-950/80 border-white/5"
              : "bg-white/80 border-slate-200"
          }`}
        >
          <div className="flex flex-1 items-center justify-around max-w-sm mr-4 bg-slate-800/20 rounded-3xl p-1 border border-white/5 backdrop-blur-md">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl transition-all duration-300 flex-1 ${
                    isActive ? "text-white" : "text-slate-500 hover:text-white"
                  }`}
                >
                  <div
                    className={`${isActive ? "scale-110" : "scale-100 opacity-60"} transition-transform`}
                  >
                    {item.icon}
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Quick Action Button */}
          <div className="relative">
            {showQuickMenu && (
              <div className="absolute bottom-20 right-0 flex flex-col gap-2 animate-in slide-in-from-bottom-4 duration-200">
                {quickActions.map((action) => (
                  <button
                    key={action.id}
                    onClick={() => handleQuickActionClick(action.id)}
                    className={`${action.color} ${action.hoverColor} text-white px-5 py-3 rounded-2xl shadow-lg flex items-center gap-3 transition-all active:scale-95 min-w-[140px]`}
                  >
                    {action.icon}
                    <span className="font-black text-sm uppercase tracking-wider">
                      {action.label}
                    </span>
                  </button>
                ))}
              </div>
            )}

            <button
              id="tour-quick-action"
              onClick={() => setShowQuickMenu(!showQuickMenu)}
              className={`w-16 h-16 rounded-full flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-all ${
                showQuickMenu
                  ? "bg-indigo-600 shadow-indigo-600/40 rotate-45"
                  : "bg-white shadow-white/20"
              }`}
            >
              <Plus
                size={32}
                className={`transition-colors ${showQuickMenu ? "text-white" : "text-slate-950"}`}
              />
            </button>
          </div>
        </nav>
      </>
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
