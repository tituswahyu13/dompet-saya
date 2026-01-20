"use client";
import { useState, useEffect, useMemo } from "react";
import { format, differenceInDays, isAfter, isBefore } from "date-fns";
import {
  Bell,
  CircleAlert,
  Clock,
  Trophy,
  ShieldAlert,
  CheckCircle2,
} from "lucide-react";

interface Notification {
  id: string;
  type: "budget_alert" | "recurring_reminder" | "goal_milestone" | "anomaly";
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

interface NotificationCenterProps {
  transactions: any[];
  budgets: any[];
  goals: any[];
  recurringTemplates: any[];
  wallets: any[];
  isDark: boolean;
}

export default function NotificationCenter({
  transactions,
  budgets,
  goals,
  recurringTemplates,
  wallets,
  isDark,
}: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [readIds, setReadIds] = useState<string[]>([]);

  // Load readIds from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("read_notification_ids");
    if (saved) {
      try {
        setReadIds(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse read notifications", e);
      }
    }
  }, []);

  // Save readIds to localStorage
  const saveReadIds = (ids: string[]) => {
    setReadIds(ids);
    localStorage.setItem("read_notification_ids", JSON.stringify(ids));
  };

  // Generate smart notifications based on data
  const generateNotifications = useMemo(() => {
    const alerts: Notification[] = [];
    const now = new Date();

    // Helper to check if read
    const isRead = (id: string) => readIds.includes(id);

    // Budget Alerts
    budgets.forEach((budget) => {
      const spent = transactions
        .filter(
          (t) =>
            t.kategori === budget.kategori &&
            new Date(t.tanggal).getMonth() === now.getMonth(),
        )
        .reduce((sum, t) => sum + (t.outcome || 0), 0);

      const percentage = (spent / budget.limit) * 100;

      if (percentage >= 100) {
        const id = `budget-${budget.id}-100`;
        alerts.push({
          id,
          type: "budget_alert",
          title: "Anggaran Terlampaui!",
          message: `Anda telah melebihi anggaran untuk "${budget.kategori}" sebesar Rp ${(spent - budget.limit).toLocaleString("id-ID")}`,
          is_read: isRead(id),
          created_at: now.toISOString(),
        });
      } else if (percentage >= 90) {
        const id = `budget-${budget.id}-90`;
        alerts.push({
          id,
          type: "budget_alert",
          title: "Peringatan Anggaran",
          message: `Anda telah menggunakan ${percentage.toFixed(0)}% dari anggaran "${budget.kategori}"`,
          is_read: isRead(id),
          created_at: now.toISOString(),
        });
      } else if (percentage >= 80) {
        const id = `budget-${budget.id}-80`;
        alerts.push({
          id,
          type: "budget_alert",
          title: "Info Anggaran",
          message: `Anda telah menggunakan ${percentage.toFixed(0)}% dari anggaran "${budget.kategori}"`,
          is_read: isRead(id),
          created_at: now.toISOString(),
        });
      }
    });

    // Goal Milestones
    goals.forEach((goal) => {
      const wallet = wallets.find((w) => w.id === goal.wallet_id);
      const current = goal.wallet_id
        ? wallet?.current_balance || 0
        : goal.current_amount;
      const percentage = (current / goal.target_amount) * 100;

      if (percentage >= 100) {
        const id = `goal-${goal.id}-100`;
        alerts.push({
          id,
          type: "goal_milestone",
          title: "Target Tercapai!",
          message: `Selamat! Anda telah mencapai target: "${goal.name}"!`,
          is_read: isRead(id),
          created_at: now.toISOString(),
        });
      } else if (percentage >= 75 && percentage < 80) {
        const id = `goal-${goal.id}-75`;
        alerts.push({
          id,
          type: "goal_milestone",
          title: "Hampir Sampai!",
          message: `Anda sudah mencapai 75% dari target "${goal.name}"! Terus semangat!`,
          is_read: isRead(id),
          created_at: now.toISOString(),
        });
      } else if (percentage >= 50 && percentage < 55) {
        const id = `goal-${goal.id}-50`;
        alerts.push({
          id,
          type: "goal_milestone",
          title: "Titik Tengah!",
          message: `Anda telah mencapai 50% dari target "${goal.name}"!`,
          is_read: isRead(id),
          created_at: now.toISOString(),
        });
      }
    });

    // Recurring Reminders (upcoming in next 3 days)
    recurringTemplates.forEach((template) => {
      if (!template.is_active || !template.last_generated) return;

      const lastGen = new Date(template.last_generated);
      const nextDue = new Date(lastGen);

      // Calculate next due date based on pattern
      if (template.pattern === "daily") {
        nextDue.setDate(nextDue.getDate() + 1);
      } else if (template.pattern === "weekly") {
        nextDue.setDate(nextDue.getDate() + 7);
      } else if (template.pattern === "monthly") {
        nextDue.setMonth(nextDue.getMonth() + 1);
      }

      const daysUntil = differenceInDays(nextDue, now);

      if (daysUntil >= 0 && daysUntil <= 3) {
        const id = `recurring-${template.id}`;
        alerts.push({
          id,
          type: "recurring_reminder",
          title: "🪄 Transaksi Rutin Jatuh Tempo",
          message: `"${template.keterangan}" jatuh tempo dalam ${daysUntil} hari`,
          is_read: isRead(id),
          created_at: now.toISOString(),
        });
      }
    });

    // Anomaly Detection (spending 2x above average)
    const past30Days = transactions.filter((t) => {
      const txDate = new Date(t.tanggal);
      return (
        differenceInDays(now, txDate) <= 30 &&
        differenceInDays(now, txDate) > 0 &&
        t.outcome > 0
      );
    });

    const avgDaily = past30Days.reduce((sum, t) => sum + t.outcome, 0) / 30;
    const today = transactions.filter((t) => {
      const txDate = new Date(t.tanggal);
      return differenceInDays(now, txDate) === 0 && t.outcome > 0;
    });

    const todayTotal = today.reduce((sum, t) => sum + t.outcome, 0);

    if (todayTotal > avgDaily * 2 && todayTotal > 150000 && avgDaily > 0) {
      const id = `anomaly-${now.toISOString().split("T")[0]}`; // Consistent ID per day
      alerts.push({
        id,
        type: "anomaly",
        title: "Pengeluaran Tidak Biasa",
        message: `Pengeluaran hari ini (Rp ${todayTotal.toLocaleString("id-ID")}) mencapai ${(todayTotal / avgDaily).toFixed(1)}x lipat rata-rata harian Anda`,
        is_read: isRead(id),
        created_at: now.toISOString(),
      });
    }

    return alerts;
  }, [transactions, budgets, goals, recurringTemplates, wallets, readIds]);

  // Get active (unread) notifications
  const activeNotifications = useMemo(() => {
    return generateNotifications.filter((n) => !n.is_read);
  }, [generateNotifications]);

  const unreadCount = activeNotifications.length;

  const markAsRead = (id: string) => {
    if (!readIds.includes(id)) {
      saveReadIds([...readIds, id]);
    }
  };

  const markAllAsRead = () => {
    const allIds = activeNotifications.map((n) => n.id);
    const newReadIds = Array.from(new Set([...readIds, ...allIds]));
    saveReadIds(newReadIds);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "budget_alert":
        return <CircleAlert className="text-red-500" size={18} />;
      case "recurring_reminder":
        return <Clock className="text-indigo-600" size={18} />;
      case "goal_milestone":
        return <Trophy className="text-yellow-500" size={18} />;
      case "anomaly":
        return <ShieldAlert className="text-orange-500" size={18} />;
      default:
        return <Bell size={18} />;
    }
  };

  return (
    <div className="relative">
      {/* Bell Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isDark ? "bg-slate-800 text-slate-400 border border-white/5" : "bg-slate-100 text-slate-500 border border-slate-200"} hover:scale-105 active:scale-95`}
        title="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 border-2 border-inherit rounded-full animate-pulse" />
        )}
      </button>

      {/* Notification Dropdown & Backdrop */}
      {isOpen && (
        <>
          {/* Mobile Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/20 backdrop-blur-[2px] z-40 sm:hidden"
            onClick={() => setIsOpen(false)}
          />

          <div
            className={`fixed inset-x-4 top-20 sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 w-[calc(100%-2rem)] sm:w-80 md:w-96 max-h-[70vh] sm:max-h-[500px] overflow-hidden rounded-2xl border shadow-2xl z-50 flex flex-col ${
              isDark
                ? "bg-slate-900 border-white/10 shadow-black/40"
                : "bg-white border-slate-200 shadow-slate-200/50"
            }`}
          >
            {/* Header */}
            <div
              className={`p-4 border-b shrink-0 ${isDark ? "bg-slate-900 border-white/10" : "bg-white border-slate-200"}`}
            >
              <div className="flex justify-between items-center">
                <h3
                  className={`text-sm font-black uppercase tracking-wider ${isDark ? "text-white" : "text-slate-900"}`}
                >
                  Notifikasi ({unreadCount})
                </h3>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-[10px] font-black text-indigo-500 uppercase tracking-widest hover:text-indigo-400"
                  >
                    Tandai Semua Dibaca
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-200 dark:divide-white/5">
              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-sm text-slate-400 italic">
                    Belum ada notifikasi baru
                  </p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-4 transition-all cursor-pointer ${
                      notif.is_read
                        ? isDark
                          ? "bg-slate-900 opacity-60"
                          : "bg-white opacity-60"
                        : isDark
                          ? "bg-slate-800/40 hover:bg-slate-800"
                          : "bg-indigo-50/50 hover:bg-indigo-100/30"
                    }`}
                    onClick={() => {
                      markAsRead(notif.id);
                      if (window.innerWidth < 640) setIsOpen(false);
                    }}
                  >
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-lg bg-slate-400/10">
                        {getIcon(notif.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4
                          className={`text-xs sm:text-sm font-bold mb-1 ${isDark ? "text-white" : "text-slate-900"}`}
                        >
                          {notif.title}
                        </h4>
                        <p
                          className={`text-[10px] sm:text-xs leading-relaxed ${isDark ? "text-slate-400" : "text-slate-600"}`}
                        >
                          {notif.message}
                        </p>
                        <p className="text-[9px] text-slate-500 mt-2 font-medium">
                          {format(
                            new Date(notif.created_at),
                            "dd MMM yyyy, HH:mm",
                          )}
                        </p>
                      </div>
                      {!notif.is_read && (
                        <div className="w-2 h-2 bg-indigo-600 rounded-full flex-shrink-0 mt-2" />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
