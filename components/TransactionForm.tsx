"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { ArrowRight } from "lucide-react";

const CATEGORIES = {
  income: ["Saldo Awal", "Pendapatan", "Bonus", "Investasi"],
  outcome: [
    "Kebutuhan Pokok",
    "Lifestyle (Makan/Jajan)",
    "Personal Care",
    "Transport",
    "Cicilan",
    "Lainnya",
  ],
  saving: ["Tabungan", "Dana Darurat", "Investasi Saham/Emas", "Lainnya"],
};

import { User } from "@supabase/supabase-js";

export default function TransactionForm({
  onRefresh,
  isDark,
  editData,
  onCancel,
  user,
}: {
  onRefresh: () => void;
  isDark: boolean;
  editData?: any;
  onCancel?: () => void;
  user: User;
}) {
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [type, setType] = useState<"income" | "outcome" | "saving">(
    editData?.type || "outcome",
  );
  const [category, setCategory] = useState(
    editData?.category ||
      (editData?.type === "income" ? "Pendapatan" : "Lifestyle (Makan/Jajan)"),
  );
  const [loading, setLoading] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [wallets, setWallets] = useState<any[]>([]);
  const [selectedWalletId, setSelectedWalletId] = useState<string>("");
  const [sourceWalletId, setSourceWalletId] = useState<string>("");

  // Fetch Wallets
  useEffect(() => {
    const fetchWallets = async () => {
      const { data, error } = await supabase
        .from("wallet_balances")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true);

      if (data) {
        setWallets(data);
        // Default to first wallet if not editing
        if (!editData && data.length > 0) {
          setSelectedWalletId(data[0].id);
        }
      }
    };
    fetchWallets();
  }, [user.id, editData]);

  // Sync state when editData changes
  useEffect(() => {
    if (editData && editData.id) {
      // Logic for editing an existing transaction
      setDesc(editData.keterangan || "");
      const amountValue =
        editData.income || editData.outcome || editData.saving || 0;
      setAmount(amountValue.toString());
      setCategory(editData.kategori || "Others");
      setDate(editData.tanggal || new Date().toISOString().split("T")[0]);
      setSelectedWalletId(editData.wallet_id || "");
      if (editData.income > 0) setType("income");
      else if (editData.saving > 0) setType("saving");
      else setType("outcome");

      setSourceWalletId("");
      setErrorStatus(null);
    } else if (editData && editData.type) {
      // Logic for pre-setting type from Quick Action
      setType(editData.type);
      setCategory(
        editData.type === "income" ? "Pendapatan" : "Lifestyle (Makan/Jajan)",
      );
    } else if (!editData) {
      // Reset logic
      setDesc("");
      setAmount("");
      setDate(new Date().toISOString().split("T")[0]);
      setType("outcome");
      setCategory("Lifestyle (Makan/Jajan)");
      setSourceWalletId("");
      setErrorStatus(null);
    }
  }, [editData]);

  // Sync category when type changes (only if not editing)
  useEffect(() => {
    if (!editData) {
      if (type === "income") {
        setCategory("Pendapatan");
      } else if (type === "saving") {
        setCategory("Tabungan");
      } else {
        setCategory("Lifestyle (Makan/Jajan)");
      }
    }
  }, [type, editData]);

  // Auto-switch to 'saving' type if investment wallet is selected
  useEffect(() => {
    if (!editData && selectedWalletId && wallets.length > 0) {
      const wallet = wallets.find((w) => w.id === selectedWalletId);
      if (wallet?.type === "investment") {
        setType("saving");
      }
    }
  }, [selectedWalletId, wallets, editData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (Number(amount) <= 0) {
      setErrorStatus("Nominal harus lebih dari 0");
      return;
    }

    if (!selectedWalletId) {
      setErrorStatus("Pilih Wallet tujuan dana");
      return;
    }

    setLoading(true);
    setErrorStatus(null);
    const numAmount = Number(amount);
    const income = type === "income" ? numAmount : 0;
    const outcome = type === "outcome" ? numAmount : 0;
    const saving = type === "saving" ? numAmount : 0;

    try {
      if (type === "saving") {
        if (!sourceWalletId) {
          throw new Error("Pilih wallet asal dana tabungan");
        }
        if (sourceWalletId === selectedWalletId) {
          throw new Error("Wallet asal dan tujuan tidak boleh sama");
        }

        const sourceWallet = wallets.find((w) => w.id === sourceWalletId);
        const destWallet = wallets.find((w) => w.id === selectedWalletId);

        // Withdrawal from Source
        const { error: err1 } = await supabase.from("transaction").insert([
          {
            keterangan: `Tabungan Ke: ${destWallet?.name} (${desc})`,
            kategori: "Transfer Keluar",
            tanggal: date,
            income: 0,
            outcome: numAmount,
            saving: 0,
            user_id: user.id,
            wallet_id: sourceWalletId,
            is_transfer: true,
            transfer_from_wallet_id: sourceWalletId,
            transfer_to_wallet_id: selectedWalletId,
          },
        ]);

        if (err1) throw err1;

        // Saving to Destination
        const { error: err2 } = await supabase.from("transaction").insert([
          {
            keterangan: `Simpan Dari: ${sourceWallet?.name} (${desc})`,
            kategori: category,
            tanggal: date,
            income: 0,
            outcome: 0,
            saving: numAmount,
            user_id: user.id,
            wallet_id: selectedWalletId,
            is_transfer: true,
            transfer_from_wallet_id: sourceWalletId,
            transfer_to_wallet_id: selectedWalletId,
          },
        ]);

        if (err2) throw err2;
      } else {
        const payload = {
          keterangan: desc,
          kategori: category,
          tanggal: date,
          income,
          outcome,
          saving,
          user_id: user.id,
          wallet_id: selectedWalletId,
        };

        let error;
        if (editData?.id) {
          const { error: err } = await supabase
            .from("transaction")
            .update(payload)
            .eq("id", editData.id);
          error = err;
        } else {
          const { error: err } = await supabase
            .from("transaction")
            .insert([payload]);
          error = err;
        }
        if (error) throw error;
      }

      setDesc("");
      setAmount("");
      setSourceWalletId("");
      if (onCancel) onCancel();
      onRefresh();
    } catch (err: any) {
      setErrorStatus("Gagal menyimpan: " + err.message);
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
      <div
        className={`absolute -top-24 -right-24 w-48 h-48 rounded-full blur-[60px] opacity-20 ${
          type === "income"
            ? "bg-green-500"
            : type === "saving"
              ? "bg-indigo-500"
              : "bg-red-500"
        }`}
      />

      <div className="flex justify-between items-center mb-8 relative z-10">
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full animate-pulse ${
              type === "income"
                ? "bg-green-500"
                : type === "saving"
                  ? "bg-indigo-500"
                  : "bg-red-500"
            }`}
          />
          <label
            className={`text-sm font-black uppercase tracking-[0.2em] ${isDark ? "text-slate-400" : "text-slate-600"}`}
          >
            {editData ? "Mode Koreksi" : "Kategori Input"}
          </label>
        </div>
        {editData && (
          <button
            type="button"
            onClick={onCancel}
            className="text-sm font-black text-red-500 hover:text-red-400 transition-colors uppercase tracking-widest px-2 pb-2"
          >
            Batal
          </button>
        )}
      </div>

      <div className="space-y-6 relative z-10">
        <div className="grid grid-cols-3 gap-3">
          {[
            { id: "income", label: "Masuk", color: "green" },
            { id: "outcome", label: "Keluar", color: "red" },
            { id: "saving", label: "Simpan", color: "indigo" },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setType(t.id as any);
                setErrorStatus(null);
              }}
              className={`py-3 px-2 rounded-2xl text-[10px] font-black transition-all border-2 flex flex-col items-center gap-1 ${
                type === t.id
                  ? t.color === "green"
                    ? "bg-green-500/10 text-green-500 border-green-500/50"
                    : t.color === "red"
                      ? "bg-red-500/10 text-red-500 border-red-500/50"
                      : "bg-indigo-500/10 text-indigo-600 border-indigo-500/50"
                  : isDark
                    ? "bg-slate-900/50 text-slate-500 border-transparent hover:bg-slate-800"
                    : "bg-slate-100/50 text-slate-400 border-transparent hover:bg-slate-200"
              }`}
            >
              <div
                className={`w-1.5 h-1.5 rounded-full ${type === t.id ? (t.color === "green" ? "bg-green-500" : t.color === "red" ? "bg-red-500" : "bg-indigo-600") : "bg-slate-400"}`}
              />
              {t.label}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {type === "saving" ? (
              <>
                <div className="animate-in slide-in-from-left-4 duration-300">
                  <label className="block text-sm font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest mb-3 px-1">
                    Asal Wallet (Sumber)
                  </label>
                  <div className="relative">
                    <select
                      value={sourceWalletId}
                      onChange={(e) => setSourceWalletId(e.target.value)}
                      className={`w-full p-4 border rounded-2xl outline-none transition-all text-sm font-black appearance-none cursor-pointer ${
                        isDark
                          ? "bg-slate-950/50 border-white/5 text-white focus:border-indigo-500/50"
                          : "bg-white/50 border-slate-200 text-slate-900 focus:border-indigo-600"
                      }`}
                      required
                    >
                      <option value="" disabled>
                        Pilih Sumber
                      </option>
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
                <div>
                  <label className="block text-sm font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-3 px-1">
                    Tujuan (Investasi)
                  </label>
                  <div className="relative">
                    <select
                      value={selectedWalletId}
                      onChange={(e) => setSelectedWalletId(e.target.value)}
                      className={`w-full p-4 border rounded-2xl outline-none transition-all text-sm font-black appearance-none cursor-pointer ${
                        isDark
                          ? "bg-slate-950/50 border-white/5 text-white focus:border-indigo-500/50"
                          : "bg-white/50 border-slate-200 text-slate-900 focus:border-indigo-600"
                      }`}
                      required
                    >
                      <option value="" disabled>
                        Pilih Tujuan
                      </option>
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
              </>
            ) : (
              <div className="col-span-1">
                <label className="block text-sm font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-3 px-1">
                  Wallet
                </label>
                <div className="relative">
                  <select
                    value={selectedWalletId}
                    onChange={(e) => setSelectedWalletId(e.target.value)}
                    className={`w-full p-4 border rounded-2xl outline-none transition-all text-sm font-black appearance-none cursor-pointer ${
                      isDark
                        ? "bg-slate-950/50 border-white/5 text-white focus:border-indigo-500/50"
                        : "bg-white/50 border-slate-200 text-slate-900 focus:border-indigo-600"
                    }`}
                    required
                  >
                    <option value="" disabled>
                      Pilih Dompet
                    </option>
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
            )}
            <div className={`${type === "saving" ? "col-span-2" : ""}`}>
              <label className="block text-sm font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-3 px-1">
                Kategori
              </label>
              <div className="relative">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className={`w-full p-4 border rounded-2xl outline-none transition-all text-sm font-medium appearance-none cursor-pointer ${
                    isDark
                      ? "bg-slate-950/50 border-white/5 text-white focus:border-indigo-500/50"
                      : "bg-white/50 border-slate-200 text-slate-900 focus:border-indigo-600"
                  }`}
                >
                  {CATEGORIES[type].map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
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

          <div>
            <label className="block text-sm font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-3 px-1">
              Keterangan
            </label>
            <input
              value={desc}
              onChange={(e) => {
                setDesc(e.target.value);
                setErrorStatus(null);
              }}
              placeholder="Misal: Investasi Emas"
              className={`w-full p-4 border rounded-2xl outline-none transition-all text-sm font-medium ${
                isDark
                  ? "bg-slate-950/50 border-white/5 text-white focus:border-indigo-500/50"
                  : "bg-white/50 border-slate-200 text-slate-900 focus:border-indigo-600"
              }`}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-3 px-1">
              Tanggal
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                setErrorStatus(null);
              }}
              className={`w-full p-4 border rounded-2xl outline-none transition-all text-sm font-medium ${
                isDark
                  ? "bg-slate-950/50 border-white/5 text-white focus:border-indigo-500/50"
                  : "bg-white/50 border-slate-200 text-slate-900 focus:border-indigo-600"
              }`}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-3 px-1">
              Nominal (Rp)
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
              <span className="absolute left-6 top-1/2 -translate-y-1/2 text-sm font-black text-indigo-600/60">
                IDR
              </span>
            </div>
            {errorStatus && (
              <p className="text-sm text-red-500 mt-2 px-2 font-black uppercase tracking-widest">
                {errorStatus}
              </p>
            )}
          </div>
        </div>

        <button
          disabled={loading}
          className={`w-full mt-6 p-6 rounded-2xl font-black text-sm uppercase tracking-[0.2em] text-white transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2 ${
            editData
              ? "bg-slate-900 hover:bg-black"
              : type === "income"
                ? "bg-gradient-to-r from-green-600 to-emerald-600 shadow-green-500/20 hover:shadow-green-500/40"
                : type === "saving"
                  ? "bg-gradient-to-r from-indigo-600 to-violet-600 shadow-indigo-600/20 hover:shadow-indigo-600/40"
                  : "bg-gradient-to-r from-red-600 to-red-700 shadow-red-500/20 hover:shadow-red-500/40"
          } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <span className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.2em]">
              {editData
                ? "Simpan"
                : type === "saving"
                  ? "Simpan Tabungan"
                  : "Simpan Data"}
              <ArrowRight size={14} strokeWidth={3} />
            </span>
          )}
        </button>
      </div>
    </form>
  );
}
