"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText, Sun, Moon, RefreshCw, Wallet, LogOut } from "lucide-react";
import { supabase } from "@/lib/supabase";
import TransactionForm from "@/components/TransactionForm";
import TransferForm from "@/components/TransferForm";
import AuthWrapper from "@/components/AuthWrapper";
import WalletManager from "@/components/WalletManager";
import Navigation from "@/components/Navigation";
import RecurringManager from "@/components/RecurringManager";
import ExportManager from "@/components/ExportManager";
import ConfirmationModal from "@/components/ConfirmationModal";
import NotificationCenter from "@/components/NotificationCenter";
import AppTour from "@/components/AppTour";
import { User } from "@supabase/supabase-js";
import { useSubscription } from "@/hooks/useSubscription";
import { subMonths } from "date-fns";

function TransactionsContent({
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
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMonth, setFilterMonth] = useState<string>("All");
  const [filterYear, setFilterYear] = useState<string>(
    new Date().getFullYear().toString(),
  );
  const [editingTransaction, setEditingTransaction] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [showWalletManager, setShowWalletManager] = useState(false);
  const [isTransferMode, setIsTransferMode] = useState(false);
  const [selectedWalletFilter, setSelectedWalletFilter] = useState("All");
  const [showRecurringManager, setShowRecurringManager] = useState(false);
  const [wallets, setWallets] = useState<any[]>([]);
  const [transactionToDelete, setTransactionToDelete] = useState<any>(null);
  const [showExportManager, setShowExportManager] = useState(false);
  const [budgets, setBudgets] = useState<any[]>([]); // Added for NotificationCenter
  const [goals, setGoals] = useState<any[]>([]); // Added for NotificationCenter
  const [recurringTemplates, setRecurringTemplates] = useState<any[]>([]); // Added for NotificationCenter
  const ITEMS_PER_PAGE = 15;

  const fetchData = async (user: User) => {
    setLoading(true);
    const { data: txData } = await supabase
      .from("transaction")
      .select("*")
      .eq("user_id", user.id)
      .order("tanggal", { ascending: false });
    if (txData) setTransactions(txData);
    const { data: wData } = await supabase
      .from("wallet_balances")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true);
    if (wData) setWallets(wData);
    // Fetch budgets, goals, recurringTemplates if needed for NotificationCenter
    const { data: budgetData } = await supabase
      .from("budgets")
      .select("*")
      .eq("user_id", user.id);
    if (budgetData) setBudgets(budgetData);
    const { data: goalData } = await supabase
      .from("goals")
      .select("*")
      .eq("user_id", user.id);
    if (goalData) setGoals(goalData);
    const { data: recurringData } = await supabase
      .from("recurring_transactions")
      .select("*")
      .eq("user_id", user.id);
    if (recurringData) setRecurringTemplates(recurringData);

    setLoading(false);
  };

  const getFilteredTransactions = () => {
    // Historical data limit: 2 months for free users
    const twoMonthsAgo = subMonths(new Date(), 2);

    return transactions.filter((t) => {
      const date = new Date(t.tanggal);
      const matchesSearch = t.keterangan
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesMonth =
        filterMonth === "All" ||
        (date.getMonth() + 1).toString() === filterMonth;
      const matchesYear =
        filterYear === "All" || date.getFullYear().toString() === filterYear;
      const matchesWallet =
        selectedWalletFilter === "All" || t.wallet_id === selectedWalletFilter;
      const matchesHistoricalLimit = isPro || date >= twoMonthsAgo; // Free users can only see last 2 months

      return (
        matchesSearch &&
        matchesMonth &&
        matchesYear &&
        matchesWallet &&
        matchesHistoricalLimit
      );
    });
  };

  const filteredTransactions = getFilteredTransactions();
  const paginatedTransactions = filteredTransactions.slice(
    0,
    page * ITEMS_PER_PAGE,
  );

  useEffect(() => {
    fetchData(user);
  }, [user]);

  const confirmDelete = async () => {
    if (!transactionToDelete) return;
    const { error } = await supabase
      .from("transaction")
      .delete()
      .eq("id", transactionToDelete.id);
    if (!error) fetchData(user);
    else alert("Gagal menghapus: " + error.message);
    setTransactionToDelete(null);
  };

  const handleEdit = (transaction: any) => {
    setEditingTransaction(transaction);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const exportToCSV = () => {
    const headers = [
      "Tanggal",
      "Keterangan",
      "Kategori",
      "Pemasukan",
      "Pengeluaran",
      "Tabungan",
    ];
    const rows = filteredTransactions.map((t) => [
      t.tanggal,
      t.keterangan,
      t.kategori,
      t.income || 0,
      t.outcome || 0,
      t.saving || 0,
    ]);
    const csvContent = [headers, ...rows].map((e) => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute(
      "download",
      `dompet-ledger-${new Date().toISOString().split("T")[0]}.csv`,
    );
    link.click();
  };

  return (
    <div
      className={`min-h-screen transition-all duration-700 relative overflow-hidden ${isDark ? "bg-[#020617] text-slate-100" : "bg-slate-50 text-slate-900"}`}
    >
      <div className="absolute top-[-15%] left-[-15%] w-[50%] h-[50%] bg-indigo-600/10 rounded-full blur-[160px] animate-float opacity-50" />
      <div
        className="absolute bottom-[-15%] right-[-15%] w-[50%] h-[50%] bg-violet-600/10 rounded-full blur-[160px] animate-float opacity-50"
        style={{ animationDelay: "-3s" }}
      />

      {/* Mobile Bottom Navigation */}
      <div className="sm:hidden">
        <Navigation isDark={isDark} variant="bottom" />
      </div>

      <header
        className={`sticky top-0 z-50 border-b backdrop-blur-xl transition-all duration-500 ${isDark ? "bg-slate-950/40 border-white/5 shadow-2xl shadow-black/20" : "bg-white/60 border-slate-200/50 shadow-xl shadow-slate-200/20"}`}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center gap-3">
          <div className="flex items-center gap-2 sm:gap-4 group cursor-pointer flex-shrink-0">
            <div className="w-9 h-9 sm:w-11 sm:h-11 bg-white/10 backdrop-blur-md rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 overflow-hidden border border-white/20">
              <img
                src="/DompetSaya.svg"
                alt="Dompet Saya Mascot"
                className="w-full h-full object-contain p-1"
              />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-tight">
                Kecerdasan
                <br />
                Finansial
              </p>
              <h1
                className={`text-sm font-black uppercase tracking-widest ${isDark ? "text-white" : "text-slate-900"}`}
              >
                {isDark ? "Dompet" : "Dompet"} Saya
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-6 justify-end flex-1 min-w-0">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsDark(!isDark)}
                className={`w-10 h-10 rounded-xl flex items-center justify-center border ${isDark ? "bg-slate-800 text-amber-400 border-white/5" : "bg-slate-100 text-slate-500 border-slate-200"} hover:scale-105 transition-all`}
              >
                {isDark ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              <button
                id="tour-tx-recurring"
                onClick={() => setShowRecurringManager(true)}
                className={`w-10 h-10 rounded-xl flex items-center justify-center border ${isDark ? "bg-indigo-600/10 text-indigo-400 border-indigo-600/20 hover:bg-indigo-600/20" : "bg-indigo-50 text-indigo-600 border-indigo-100 hover:bg-indigo-100"} hover:scale-105 transition-all`}
                title="Penjadwalan Rutin"
              >
                <RefreshCw size={20} />
              </button>
              <button
                onClick={async () => {
                  const { error } = await supabase.auth.signOut();
                  if (error) alert("Gagal keluar: " + error.message);
                }}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isDark ? "bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20" : "bg-red-50 text-red-600 border border-red-100 hover:bg-red-100"} hover:scale-105 active:scale-95`}
                title="Keluar"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12 relative z-10 space-y-12 pb-32 sm:pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div
            id="tour-tx-form"
            className="lg:col-span-4 lg:sticky lg:top-28 h-fit space-y-8"
          >
            <section>
              <div className="flex items-center justify-between mb-6 px-1">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-1.5 h-6 ${isTransferMode ? "bg-violet-600" : "bg-indigo-600"} rounded-full`}
                  />
                  <h2
                    className={`text-lg font-black uppercase tracking-tighter ${isDark ? "text-white" : "text-slate-900"}`}
                  >
                    {editingTransaction
                      ? "Koreksi Data"
                      : isTransferMode
                        ? "Transfer Dana"
                        : "Transaksi Baru"}
                  </h2>
                </div>
                {!editingTransaction && (
                  <button
                    id="tour-tx-mode"
                    onClick={() => setIsTransferMode(!isTransferMode)}
                    className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg border bg-indigo-500/10 text-indigo-600 border-indigo-600/20"
                  >
                    {isTransferMode ? "Ke Transaksi" : "Ke Transfer"}
                  </button>
                )}
              </div>
              {isTransferMode && !editingTransaction ? (
                <TransferForm
                  user={user}
                  isDark={isDark}
                  onRefresh={() => fetchData(user)}
                  onCancel={() => setIsTransferMode(false)}
                />
              ) : (
                <TransactionForm
                  user={user}
                  isDark={isDark}
                  editData={editingTransaction}
                  onRefresh={() => fetchData(user)}
                  onCancel={() => {
                    setEditingTransaction(null);
                    setIsTransferMode(false);
                  }}
                />
              )}
            </section>
          </div>

          <div className="lg:col-span-8 space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 px-1">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-6 bg-slate-400 rounded-full" />
                <h2
                  className={`text-lg font-black uppercase tracking-tighter ${isDark ? "text-white" : "text-slate-900"}`}
                >
                  Buku Besar Cloud
                </h2>
              </div>

              <div className="flex flex-wrap w-full md:w-auto items-center gap-3">
                <div
                  id="tour-tx-filters"
                  className="flex items-center gap-2 bg-slate-200/20 dark:bg-white/5 p-1.5 rounded-2xl border border-white/5"
                >
                  <select
                    value={filterMonth}
                    onChange={(e) => setFilterMonth(e.target.value)}
                    className="p-2 px-3 text-[10px] font-black uppercase tracking-widest bg-transparent outline-none"
                  >
                    <option value="All">Semua Bulan</option>
                    {[
                      "Januari",
                      "Februari",
                      "Maret",
                      "April",
                      "Mei",
                      "Juni",
                      "Juli",
                      "Agustus",
                      "September",
                      "Oktober",
                      "November",
                      "Desember",
                    ].map((m, i) => (
                      <option key={m} value={(i + 1).toString()}>
                        {m}
                      </option>
                    ))}
                  </select>
                  <div className="w-px h-4 bg-slate-400/20" />
                  <select
                    value={filterYear}
                    onChange={(e) => setFilterYear(e.target.value)}
                    className="p-2 px-3 text-[10px] font-black uppercase tracking-widest bg-transparent outline-none"
                  >
                    {[
                      "2020",
                      "2021",
                      "2022",
                      "2023",
                      "2024",
                      "2025",
                      "2026",
                      "2027",
                      "2028",
                      "2029",
                      "2030",
                    ].map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-1 md:flex-none items-center gap-2 bg-slate-200/20 dark:bg-white/5 p-1.5 rounded-2xl border border-white/5">
                  <input
                    type="text"
                    placeholder="Cari..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 md:w-32 p-2 px-3 text-[10px] font-black uppercase tracking-widest bg-transparent outline-none"
                  />
                  <button
                    id="tour-tx-export"
                    onClick={exportToCSV}
                    className="p-2 px-4 text-[10px] font-black bg-indigo-600/10 text-indigo-600 uppercase tracking-widest rounded-xl hover:bg-indigo-600 hover:text-white transition-all"
                  >
                    CSV
                  </button>
                </div>
              </div>
            </div>

            <div
              id="tour-tx-list"
              className={`rounded-[2.5rem] border overflow-hidden backdrop-blur-sm transition-all duration-500 ${isDark ? "glass-dark border-white/5 shadow-2xl shadow-black/40" : "glass border-white shadow-xl shadow-slate-200/50"}`}
            >
              {loading ? (
                <div className="p-20 text-center animate-pulse text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
                  Sinkronisasi Data...
                </div>
              ) : filteredTransactions.length === 0 ? (
                <div className="p-20 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">
                  Tidak ada catatan transaksi ditemukan.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr
                        className={`${isDark ? "bg-white/5 border-white/5" : "bg-slate-50 border-slate-100"} border-b`}
                      >
                        <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                          Garis Waktu
                        </th>
                        <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                          Aktivitas
                        </th>
                        <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">
                          Nilai
                        </th>
                        <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center w-32">
                          Kontrol
                        </th>
                      </tr>
                    </thead>
                    <tbody
                      className={`divide-y ${isDark ? "divide-white/5" : "divide-slate-100"}`}
                    >
                      {paginatedTransactions.map((t) => (
                        <tr
                          key={t.id}
                          className="hover:bg-white/[0.02] group transition-all duration-300"
                        >
                          <td className="p-6">
                            <div className="text-md font-black tracking-tighter">
                              {new Date(t.tanggal).toLocaleDateString("id-ID", {
                                day: "2-digit",
                                month: "short",
                              })}
                            </div>
                            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                              {new Date(t.tanggal).getFullYear()}
                            </div>
                          </td>
                          <td className="p-6">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-bold">
                                {t.keterangan}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tight ${isDark ? "bg-slate-800 text-slate-400" : "bg-slate-100 text-slate-500"}`}
                              >
                                {
                                  wallets.find((w) => w.id === t.wallet_id)
                                    ?.name
                                }
                              </span>
                            </div>
                            <span
                              className={`text-[8px] font-black px-2 py-1 rounded-full uppercase tracking-wider ${t.income > 0 ? "bg-green-500/10 text-green-500" : t.saving > 0 ? "bg-blue-500/10 text-blue-500" : "bg-red-500/10 text-red-500"}`}
                            >
                              {t.kategori}
                            </span>
                          </td>
                          <td
                            className={`p-6 text-right font-black tracking-tighter ${t.income > 0 ? "text-green-500" : t.saving > 0 ? "text-blue-500" : "text-red-500"}`}
                          >
                            {(t.income || t.outcome || t.saving).toLocaleString(
                              "id-ID",
                            )}
                          </td>
                          <td className="p-6">
                            <div className="flex justify-center gap-2 transition-all">
                              <button
                                onClick={() => handleEdit(t)}
                                className="w-8 h-8 rounded-lg flex items-center justify-center bg-indigo-500/10 text-indigo-600 hover:bg-indigo-500 text-white transition-all"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-4 w-4"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                  />
                                </svg>
                              </button>
                              <button
                                onClick={() => setTransactionToDelete(t)}
                                className="w-8 h-8 rounded-lg flex items-center justify-center bg-red-500/10 text-red-500 hover:bg-red-500 text-white transition-all"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-4 w-4"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredTransactions.length >
                    paginatedTransactions.length && (
                    <div className="p-8 text-center border-t border-white/5">
                      <button
                        onClick={() => setPage(page + 1)}
                        className="px-10 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl bg-slate-800 text-white hover:bg-slate-700 transition-all"
                      >
                        Muat Lebih Banyak
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {showWalletManager && (
        <WalletManager
          user={user}
          isDark={isDark}
          onClose={() => {
            setShowWalletManager(false);
            fetchData(user);
          }}
        />
      )}
      {showRecurringManager && (
        <RecurringManager
          user={user}
          isDark={isDark}
          onClose={() => {
            setShowRecurringManager(false);
            fetchData(user);
          }}
        />
      )}

      <ConfirmationModal
        isOpen={!!transactionToDelete}
        title="Hapus Transaksi"
        message={`Apakah Anda yakin ingin menghapus "${transactionToDelete?.keterangan}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Hapus Permanen"
        onConfirm={confirmDelete}
        onCancel={() => setTransactionToDelete(null)}
        isDark={isDark}
      />
      {showExportManager && (
        <ExportManager
          transactions={transactions}
          wallets={wallets}
          isDark={isDark}
          onClose={() => setShowExportManager(false)}
        />
      )}
      <AppTour isDark={isDark} />
    </div>
  );
}

export default function TransactionsPage() {
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

  return (
    <AuthWrapper isDark={isDark}>
      {(user) => (
        <TransactionsContent
          user={user}
          isDark={isDark}
          setIsDark={handleThemeChange}
        />
      )}
    </AuthWrapper>
  );
}
