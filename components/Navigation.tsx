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
          className={`fixed bottom-0 left-0 right-0 z-[100] pb-safe pt-2 px-2 border-t backdrop-blur-2xl ${
            isDark
              ? "bg-slate-950/80 border-white/5"
              : "bg-white/80 border-slate-200"
          }`}
        >
          <div className="grid grid-cols-5 items-end justify-items-center relative">
            {navItems.map((item, index) => {
              const isActive = pathname === item.href;
              // Add empty div for center column (index 2)
              if (index === 2) {
                return (
                  <>
                    <div key="center-spacer" className="pointer-events-none" />
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-300 ${
                        isActive
                          ? "text-indigo-500"
                          : "text-slate-400 hover:text-indigo-500"
                      }`}
                    >
                      <div
                        className={`${isActive ? "scale-110" : "scale-100"} transition-transform`}
                      >
                        {item.icon}
                      </div>
                    </Link>
                  </>
                );
              }
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-300 ${
                    isActive
                      ? "text-indigo-500"
                      : "text-slate-400 hover:text-indigo-500"
                  }`}
                >
                  <div
                    className={`${isActive ? "scale-110" : "scale-100"} transition-transform`}
                  >
                    {item.icon}
                  </div>
                </Link>
              );
            })}

            {/* Centered Floating Quick Action Button */}
            <div className="absolute -top-8 left-1/2 -translate-x-1/2">
              <div className="relative">
                {showQuickMenu && (
                  <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex flex-col gap-2 animate-in slide-in-from-bottom-4 duration-200 items-center">
                    {quickActions.map((action) => (
                      <button
                        key={action.id}
                        onClick={() => handleQuickActionClick(action.id)}
                        className={`${action.color} ${action.hoverColor} text-white px-5 py-3 rounded-2xl shadow-lg flex items-center gap-3 transition-all active:scale-95 min-w-[140px] whitespace-nowrap`}
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
                  className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-all border-[4px] ${
                    isDark ? "border-slate-950" : "border-white"
                  } ${
                    showQuickMenu
                      ? "bg-indigo-600 shadow-indigo-600/50 rotate-45"
                      : "bg-indigo-600 shadow-indigo-600/30"
                  }`}
                >
                  <Plus size={28} className={`transition-colors text-white`} />
                </button>
              </div>
            </div>
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
