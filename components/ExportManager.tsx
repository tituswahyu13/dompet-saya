"use client";
import { useState } from "react";
import { parse, unparse } from "papaparse";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { Lock } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import UpgradeModal from "./UpgradeModal";

interface Transaction {
  id: string;
  tanggal: string;
  keterangan: string;
  kategori: string;
  income: number;
  outcome: number;
  saving: number;
  wallet_id: string;
  is_transfer: boolean;
}

interface ExportManagerProps {
  transactions: Transaction[];
  wallets: any[];
  isDark: boolean;
  onClose: () => void;
}

export default function ExportManager({
  transactions,
  wallets,
  isDark,
  onClose,
}: ExportManagerProps) {
  const { subscription } = useSubscription();
  const isPro = subscription?.is_pro;

  const [exportType, setExportType] = useState<"csv" | "pdf">("csv");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [selectedWallet, setSelectedWallet] = useState("all");
  const [includeTransfers, setIncludeTransfers] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const getFilteredTransactions = () => {
    return transactions.filter((t) => {
      const matchesWallet =
        selectedWallet === "all" || t.wallet_id === selectedWallet;
      const matchesTransfer = includeTransfers || !t.is_transfer;
      const matchesDateRange =
        (!dateRange.start || t.tanggal >= dateRange.start) &&
        (!dateRange.end || t.tanggal <= dateRange.end);
      return matchesWallet && matchesTransfer && matchesDateRange;
    });
  };

  const exportToCSV = () => {
    const filtered = getFilteredTransactions();

    const csvData = filtered.map((t) => {
      const wallet = wallets.find((w) => w.id === t.wallet_id);
      return {
        Tanggal: format(new Date(t.tanggal), "dd/MM/yyyy"),
        Keterangan: t.keterangan,
        Kategori: t.kategori,
        Wallet: wallet?.name || "-",
        Pemasukan: t.income || 0,
        Pengeluaran: t.outcome || 0,
        Tabungan: t.saving || 0,
        Transfer: t.is_transfer ? "Ya" : "Tidak",
      };
    });

    const csv = unparse(csvData);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `transactions_${format(new Date(), "yyyy-MM-dd")}.csv`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    alert("✅ CSV berhasil diunduh!");
  };

  const exportToPDF = async () => {
    const filtered = getFilteredTransactions();
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // 1. Header
    // Gradient Background
    doc.setFillColor(79, 70, 229); // Indigo 600
    doc.rect(0, 0, pageWidth, 40, "F");

    // Title
    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text("LAPORAN KEUANGAN", 15, 20);

    // Subtitle
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Dompet Saya Pro - Financial Intelligence", 15, 28);

    // Date
    doc.setFontSize(10);
    doc.text(
      `Dicetak pada: ${format(new Date(), "dd MMMM yyyy, HH:mm")}`,
      pageWidth - 15,
      20,
      { align: "right" },
    );
    doc.text(
      `Periode: ${dateRange.start ? format(new Date(dateRange.start), "dd/MM/yy") : "Awal"} - ${
        dateRange.end ? format(new Date(dateRange.end), "dd/MM/yy") : "Sekarang"
      }`,
      pageWidth - 15,
      28,
      { align: "right" },
    );

    // 2. Summary Section
    const totalIncome = filtered.reduce((sum, t) => sum + (t.income || 0), 0);
    const totalOutcome = filtered.reduce((sum, t) => sum + (t.outcome || 0), 0);
    const totalSaving = filtered.reduce((sum, t) => sum + (t.saving || 0), 0);
    const balance = totalIncome - totalOutcome - totalSaving;

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Ringkasan", 15, 55);

    // Summary Cards Logic (simplified as text for PDF)
    const startY = 60;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    // Income
    doc.setFillColor(240, 253, 244); // Green 50
    doc.setDrawColor(34, 197, 94); // Green 500
    doc.roundedRect(15, startY, 40, 20, 2, 2, "FD");
    doc.setTextColor(21, 128, 61); // Green 700
    doc.text("Pemasukan", 18, startY + 6);
    doc.setFont("helvetica", "bold");
    doc.text(`Rp ${(totalIncome / 1000).toFixed(0)}k`, 18, startY + 14);

    // Outcome
    doc.setFillColor(255, 241, 242); // Rose 50
    doc.setDrawColor(244, 63, 94); // Rose 500
    doc.roundedRect(60, startY, 40, 20, 2, 2, "FD");
    doc.setTextColor(190, 18, 60); // Rose 700
    doc.setFont("helvetica", "normal");
    doc.text("Pengeluaran", 63, startY + 6);
    doc.setFont("helvetica", "bold");
    doc.text(`Rp ${(totalOutcome / 1000).toFixed(0)}k`, 63, startY + 14);

    // Savings
    doc.setFillColor(239, 246, 255); // Blue 50
    doc.setDrawColor(59, 130, 246); // Blue 500
    doc.roundedRect(105, startY, 40, 20, 2, 2, "FD");
    doc.setTextColor(29, 78, 216); // Blue 700
    doc.setFont("helvetica", "normal");
    doc.text("Tabungan", 108, startY + 6);
    doc.setFont("helvetica", "bold");
    doc.text(`Rp ${(totalSaving / 1000).toFixed(0)}k`, 108, startY + 14);

    // Balance
    doc.setFillColor(250, 250, 250); // Gray 50
    doc.setDrawColor(100, 100, 100); // Gray
    doc.roundedRect(150, startY, 40, 20, 2, 2, "FD");
    doc.setTextColor(0, 0, 0); // Black
    doc.setFont("helvetica", "normal");
    doc.text("Saldo Bersih", 153, startY + 6);
    doc.setFont("helvetica", "bold");
    doc.text(`Rp ${(balance / 1000).toFixed(0)}k`, 153, startY + 14);

    // 3. Table
    const tableData = filtered.map((t) => [
      format(new Date(t.tanggal), "dd/MM/yyyy"),
      t.keterangan,
      t.kategori,
      t.is_transfer
        ? "Transfer"
        : t.income > 0
          ? "Masuk"
          : t.outcome > 0
            ? "Keluar"
            : "Tabungan",
      `Rp ${(t.income || t.outcome || t.saving).toLocaleString("id-ID")}`,
    ]);

    autoTable(doc, {
      startY: 90,
      head: [["Tanggal", "Keterangan", "Kategori", "Tipe", "Jumlah"]],
      body: tableData,
      theme: "grid",
      headStyles: {
        fillColor: [79, 70, 229],
        textColor: 255,
        fontStyle: "bold",
      },
      styles: { fontSize: 9, cellPadding: 3 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });

    // Footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(
        "Dompet Saya Pro - Generated by AI Report System",
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: "center" },
      );
    }

    doc.save(`laporan_keuangan_pro_${format(new Date(), "yyyy-MM-dd")}.pdf`);
    alert("✅ Laporan PDF Professional berhasil dibuat!");
  };

  const handleExport = () => {
    if (exportType === "csv") {
      exportToCSV();
    } else {
      exportToPDF();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div
        className={`w-full max-w-2xl rounded-[2.5rem] border shadow-2xl animate-in zoom-in-95 duration-300 ${
          isDark
            ? "bg-slate-900/95 border-white/5 shadow-black/50"
            : "bg-white/95 border-slate-200 shadow-slate-200/50"
        }`}
      >
        {/* Header */}
        <div
          className={`p-8 border-b ${isDark ? "border-white/5" : "border-slate-200"}`}
        >
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
                <span className="text-2xl">📄</span>
              </div>
              <div>
                <h2
                  className={`text-xl font-black uppercase tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}
                >
                  Ekspor Data
                </h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">
                  Unduh Catatan Keuangan Anda
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isDark ? "bg-white/5 text-slate-400 hover:text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-8 space-y-6">
          {/* Export Type Selection */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest mb-3 opacity-60">
              Format Ekspor
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setExportType("csv")}
                className={`p-4 rounded-2xl border transition-all ${
                  exportType === "csv"
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-lg"
                    : isDark
                      ? "bg-slate-800 border-white/5 text-slate-400"
                      : "bg-white border-slate-200 text-slate-500"
                }`}
              >
                <div className="text-2xl mb-2">📊</div>
                <div className="text-xs font-black uppercase">CSV / Excel</div>
                <div className="text-[8px] opacity-60 mt-1">
                  Format spreadsheet
                </div>
              </button>
              <button
                onClick={() => {
                  if (isPro) setExportType("pdf");
                  else setShowUpgradeModal(true);
                }}
                className={`p-4 rounded-2xl border transition-all relative overflow-hidden ${
                  exportType === "pdf"
                    ? "bg-violet-600 text-white border-violet-600 shadow-lg"
                    : isDark
                      ? "bg-slate-800 border-white/5 text-slate-400"
                      : "bg-white border-slate-200 text-slate-500"
                } ${!isPro ? "opacity-70" : ""}`}
              >
                {!isPro && (
                  <div className="absolute top-2 right-2">
                    <Lock size={12} className="text-violet-500" />
                  </div>
                )}
                <div className="text-2xl mb-2">📄</div>
                <div className="text-xs font-black uppercase flex items-center justify-center gap-1">
                  PDF Report
                  {!isPro && (
                    <span className="text-[8px] bg-violet-600 text-white px-1 rounded">
                      PRO
                    </span>
                  )}
                </div>
                <div className="text-[8px] opacity-60 mt-1">
                  Format profesional
                </div>
              </button>
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest mb-3 opacity-60">
                Tanggal Mulai
              </label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) =>
                  setDateRange({ ...dateRange, start: e.target.value })
                }
                className={`w-full px-4 py-3 rounded-xl border outline-none transition-all ${isDark ? "bg-slate-800 border-white/5 text-white" : "bg-slate-50 border-slate-200"}`}
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest mb-3 opacity-60">
                Tanggal Selesai
              </label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) =>
                  setDateRange({ ...dateRange, end: e.target.value })
                }
                className={`w-full px-4 py-3 rounded-xl border outline-none transition-all ${isDark ? "bg-slate-800 border-white/5 text-white" : "bg-slate-50 border-slate-200"}`}
              />
            </div>
          </div>

          {/* Wallet Filter */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest mb-3 opacity-60">
              Filter berdasarkan Dompet
            </label>
            <select
              value={selectedWallet}
              onChange={(e) => setSelectedWallet(e.target.value)}
              className={`w-full px-4 py-3 rounded-xl border outline-none transition-all ${isDark ? "bg-slate-800 border-white/5 text-white" : "bg-slate-50 border-slate-200"}`}
            >
              <option value="all">Semua Dompet</option>
              {wallets.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.icon} {w.name}
                </option>
              ))}
            </select>
          </div>

          {/* Include Transfers */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="includeTransfers"
              checked={includeTransfers}
              onChange={(e) => setIncludeTransfers(e.target.checked)}
              className="w-5 h-5 rounded border-2 accent-indigo-600"
            />
            <label
              htmlFor="includeTransfers"
              className={`text-sm font-bold ${isDark ? "text-white" : "text-slate-900"}`}
            >
              Termasuk transfer internal
            </label>
          </div>

          {/* Summary */}
          <div
            className={`p-4 rounded-xl border ${isDark ? "bg-slate-800/40 border-white/5" : "bg-slate-50 border-slate-200"}`}
          >
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
              Ringkasan Ekspor
            </p>
            <p
              className={`text-sm font-bold ${isDark ? "text-white" : "text-slate-900"}`}
            >
              {getFilteredTransactions().length} transaksi akan diekspor
            </p>
          </div>

          {/* Export Button */}
          <button
            onClick={handleExport}
            disabled={getFilteredTransactions().length === 0}
            className={`w-full py-4 text-white text-xs font-black uppercase tracking-[0.2em] rounded-2xl hover:scale-[1.02] shadow-xl active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
              exportType === "pdf"
                ? "bg-gradient-to-r from-violet-600 to-indigo-600 shadow-violet-500/20"
                : "bg-gradient-to-r from-indigo-600 to-indigo-700 shadow-indigo-500/20"
            }`}
          >
            {exportType === "csv" ? "📊 Unduh CSV" : "📄 Buat Laporan PDF"}
          </button>
        </div>
      </div>

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        isDark={isDark}
        title="Fitur PDF Professional"
        message="Export laporan keuangan dalam format PDF yang profesional hanya tersedia untuk pengguna Pro. Dapatkan laporan lengkap dengan visualisasi data yang menarik!"
        feature="PDF Export"
      />
    </div>
  );
}
