"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";

export default function TransferForm({
  onRefresh,
  isDark,
  onCancel,
  user,
}: {
  onRefresh: () => void;
  isDark: boolean;
  onCancel: () => void;
  user: User;
}) {
  const [amount, setAmount] = useState("");
  const [adminFee, setAdminFee] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [fromWalletId, setFromWalletId] = useState("");
  const [toWalletId, setToWalletId] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [wallets, setWallets] = useState<any[]>([]);

  useEffect(() => {
    const fetchWallets = async () => {
      const { data } = await supabase
        .from("wallet_balances")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true);

      if (data) {
        setWallets(data);
        if (data.length >= 2) {
          setFromWalletId(data[0].id);
          setToWalletId(data[1].id);
        } else if (data.length === 1) {
          setFromWalletId(data[0].id);
        }
      }
    };
    fetchWallets();
  }, [user.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (Number(amount) <= 0) {
      setErrorStatus("Nominal harus lebih dari 0");
      return;
    }
    if (!fromWalletId || !toWalletId) {
      setErrorStatus("Pilih wallet asal dan tujuan");
      return;
    }
    if (fromWalletId === toWalletId) {
      setErrorStatus("Wallet asal dan tujuan tidak boleh sama");
      return;
    }

    setLoading(true);
    setErrorStatus(null);
    const numAmount = Number(amount);
    const numFee = Number(adminFee) || 0;

    // Internal Transfer Logic:
    // We create TWO or THREE transactions
    // 1. Withdrawal from source wallet (outcome = amount, income = 0, is_transfer = true)
    // 2. Deposit to destination wallet (income = amount, outcome = 0, is_transfer = true)
    // 3. Admin Fee (if > 0) from source wallet (outcome = fee, is_transfer = false)

    try {
      const fromWalletName = wallets.find((w) => w.id === fromWalletId)?.name;
      const toWalletName = wallets.find((w) => w.id === toWalletId)?.name;

      const { error: err1 } = await supabase.from("transaction").insert([
        {
          keterangan: `Transfer Ke: ${toWalletName}${note ? " - " + note : ""}${numFee > 0 ? " (Ad: " + numFee.toLocaleString("id-ID") + ")" : ""}`,
          kategori: "Transfer Keluar",
          tanggal: date,
          income: 0,
          outcome: numAmount,
          saving: 0,
          user_id: user.id,
          wallet_id: fromWalletId,
          is_transfer: true,
          transfer_from_wallet_id: fromWalletId,
          transfer_to_wallet_id: toWalletId,
        },
      ]);

      if (err1) throw err1;

      const { error: err2 } = await supabase.from("transaction").insert([
        {
          keterangan: `Transfer Dari: ${fromWalletName}${note ? " - " + note : ""}`,
          kategori: "Transfer Masuk",
          tanggal: date,
          income: numAmount,
          outcome: 0,
          saving: 0,
          user_id: user.id,
          wallet_id: toWalletId,
          is_transfer: true,
          transfer_from_wallet_id: fromWalletId,
          transfer_to_wallet_id: toWalletId,
        },
      ]);

      if (err2) throw err2;

      // Create Admin Fee transaction as standard expense
      if (numFee > 0) {
        const { error: err3 } = await supabase.from("transaction").insert([
          {
            keterangan: `Biaya Admin Transfer: ${fromWalletName} ke ${toWalletName}`,
            kategori: "Others",
            tanggal: date,
            income: 0,
            outcome: numFee,
            saving: 0,
            user_id: user.id,
            wallet_id: fromWalletId,
            is_transfer: false, // Important: this counts as real spending
          },
        ]);

        if (err3) throw err3;
      }

      setAmount("");
      setAdminFee("");
      setNote("");
      onCancel();
      onRefresh();
    } catch (error: any) {
      setErrorStatus("Gagal transfer: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`p-8 rounded-[2.5rem] shadow-xl border transition-all duration-500 relative overflow-hidden ${
        isDark ? "glass-dark border-white/5" : "glass border-white/50"
      }`}
    >
      {/* Decorative Glow */}
      <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full blur-[60px] opacity-20 bg-indigo-500" />

      <div className="flex justify-between items-center mb-8 relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full animate-pulse bg-indigo-500" />
          <label
            className={`text-xs font-black uppercase tracking-[0.2em] ${isDark ? "text-slate-400" : "text-slate-500"}`}
          >
            Transfer Antar Dompet
          </label>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="text-[10px] font-black text-red-500 hover:text-red-400 transition-colors uppercase tracking-widest"
        >
          Batal
        </button>
      </div>

      <div className="space-y-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">
              Dari Dompet (Asal)
            </label>
            <div className="relative">
              <select
                value={fromWalletId}
                onChange={(e) => setFromWalletId(e.target.value)}
                className={`w-full p-4 border rounded-2xl outline-none transition-all text-sm font-black appearance-none cursor-pointer ${
                  isDark
                    ? "bg-slate-950/50 border-white/5 text-white focus:border-indigo-500/50"
                    : "bg-white/50 border-slate-200 text-slate-900 focus:border-indigo-600"
                }`}
                required
              >
                {wallets.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.icon} {w.name} (Rp{" "}
                    {w.current_balance?.toLocaleString("id-ID")})
                  </option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
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
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center md:pt-6">
            <div
              className={`p-2 rounded-full ${isDark ? "bg-indigo-500/10" : "bg-indigo-50"}`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-indigo-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">
              Ke Dompet (Tujuan)
            </label>
            <div className="relative">
              <select
                value={toWalletId}
                onChange={(e) => setToWalletId(e.target.value)}
                className={`w-full p-4 border rounded-2xl outline-none transition-all text-sm font-black appearance-none cursor-pointer ${
                  isDark
                    ? "bg-slate-950/50 border-white/5 text-white focus:border-green-500/50"
                    : "bg-white/50 border-slate-200 text-slate-900 focus:border-green-500"
                }`}
                required
              >
                {wallets.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.icon} {w.name} (Rp{" "}
                    {w.current_balance?.toLocaleString("id-ID")})
                  </option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
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
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">
              Tanggal
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={`w-full p-4 border rounded-2xl outline-none transition-all text-sm font-medium ${
                isDark
                  ? "bg-slate-950/50 border-white/5 text-white focus:border-indigo-500/50"
                  : "bg-white/50 border-slate-200 text-slate-900 focus:border-indigo-600"
              }`}
              required
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">
              Catatan
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Misal: Isi saldo GoPay"
              className={`w-full p-4 border rounded-2xl outline-none transition-all text-sm font-medium ${
                isDark
                  ? "bg-slate-950/50 border-white/5 text-white focus:border-indigo-500/50"
                  : "bg-white/50 border-slate-200 text-slate-900 focus:border-indigo-600"
              }`}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">
              Jumlah (Rp)
            </label>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setErrorStatus(null);
                }}
                placeholder="0"
                className={`w-full p-4 pl-12 border rounded-2xl outline-none transition-all text-lg font-black tracking-tighter ${
                  errorStatus && amount && Number(amount) <= 0
                    ? isDark
                      ? "border-red-500/50 bg-red-500/5"
                      : "border-red-500 bg-red-50"
                    : isDark
                      ? "bg-slate-950/50 border-white/5 text-white focus:border-indigo-500/50"
                      : "bg-white/50 border-slate-200 text-slate-900 focus:border-indigo-600"
                }`}
                required
              />
              <span className="absolute left-5 top-1/2 -translate-y-1/2 text-xs font-black text-indigo-600/50">
                IDR
              </span>
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">
              Biaya Admin (Rp)
            </label>
            <div className="relative">
              <input
                type="number"
                value={adminFee}
                onChange={(e) => setAdminFee(e.target.value)}
                placeholder="0"
                className={`w-full p-4 pl-12 border rounded-2xl outline-none transition-all text-lg font-black tracking-tighter ${
                  isDark
                    ? "bg-slate-950/50 border-white/5 text-white focus:border-indigo-500/50"
                    : "bg-white/50 border-slate-200 text-slate-900 focus:border-indigo-600"
                }`}
              />
              <span className="absolute left-5 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">
                FEES
              </span>
            </div>
          </div>
        </div>

        {errorStatus && (
          <p className="text-[10px] text-red-500 px-2 font-black uppercase tracking-widest">
            {errorStatus}
          </p>
        )}

        <button
          disabled={loading || wallets.length < 1}
          className={`w-full mt-4 p-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] text-white transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 shadow-indigo-600/20 hover:shadow-indigo-600/40 ${loading || wallets.length < 1 ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              Eksekusi Transfer
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 opacity-70"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
