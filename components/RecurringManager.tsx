"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import ConfirmationModal from "./ConfirmationModal";
import { Sparkles } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import UpgradeModal from "./UpgradeModal";

interface RecurringTemplate {
  id: string;
  keterangan: string;
  amount: number;
  type: "income" | "outcome" | "saving" | "transfer";
  kategori: string;
  wallet_id: string;
  target_wallet_id?: string | null;
  frequency: string;
  day_of_month: number;
  is_active: boolean;
  last_generated: string | null;
}

const CATEGORIES = {
  pemasukan: ["Gaji", "Bonus", "Investasi", "Lainnya"],
  pengeluaran: [
    "Makan & Minum",
    "Transportasi",
    "Belanja",
    "Tagihan",
    "Hiburan",
    "Kesehatan",
    "Pendidikan",
    "Lainnya",
  ],
  tabungan: ["Tabungan Mandiri", "Dana Darurat", "Investasi Saham"],
  transfer: ["Transfer Rutin", "Automated Savings", "E-Wallet Topup"],
};

export default function RecurringManager({
  user,
  isDark,
  onClose,
}: {
  user: User;
  isDark: boolean;
  onClose: () => void;
}) {
  const { subscription } = useSubscription();
  const isPro = subscription?.is_pro;
  const [templates, setTemplates] = useState<RecurringTemplate[]>([]);
  const [wallets, setWallets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmingAction, setConfirmingAction] = useState<{
    type: "generate" | "delete";
    template: RecurringTemplate;
  } | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const [formData, setFormData] = useState({
    keterangan: "",
    amount: 0,
    type: "outcome" as "income" | "outcome" | "saving" | "transfer",
    kategori: "Tagihan",
    wallet_id: "",
    target_wallet_id: "" as string | null,
    frequency: "monthly",
    day_of_month: 1,
    is_active: true,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    // Fetch Templates
    const { data: tData } = await supabase
      .from("recurring_templates")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    // Fetch Wallets
    const { data: wData } = await supabase
      .from("wallet_balances")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true);

    if (tData) setTemplates(tData);
    if (wData) {
      setWallets(wData);
      if (wData.length > 0 && !formData.wallet_id) {
        setFormData((prev) => ({ ...prev, wallet_id: wData[0].id }));
      }
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Restriction: Max 1 recurring transaction for free users
    if (!editingId && !isPro && templates.length >= 1) {
      setShowUpgradeModal(true);
      return;
    }

    if (formData.type === "transfer" && !formData.target_wallet_id) {
      alert("Harap pilih dompet tujuan transfer!");
      return;
    }

    setLoading(true);

    const payload = {
      ...formData,
      target_wallet_id:
        formData.type === "transfer" && formData.target_wallet_id
          ? formData.target_wallet_id
          : null,
      user_id: user.id,
    };

    if (editingId) {
      const { error } = await supabase
        .from("recurring_templates")
        .update(payload)
        .eq("id", editingId);
      if (error) alert(error.message);
    } else {
      const { error } = await supabase
        .from("recurring_templates")
        .insert(payload);
      if (error) alert(error.message);
    }

    fetchData();
    resetForm();
    setLoading(false);
  };

  const handleManualTrigger = async (template: RecurringTemplate) => {
    setConfirmingAction({ type: "generate", template });
  };

  const executeManualTrigger = async (template: RecurringTemplate) => {
    setLoading(true);
    setConfirmingAction(null);

    try {
      if (template.type === "transfer") {
        if (!template.target_wallet_id) {
          alert("Target wallet tidak ditemukan untuk transfer ini.");
          setLoading(false);
          return;
        }

        const fromWalletName = wallets.find(
          (w) => w.id === template.wallet_id,
        )?.name;
        const toWalletName = wallets.find(
          (w) => w.id === template.target_wallet_id,
        )?.name;

        // 1. Withdrawal
        const { error: err1 } = await supabase.from("transaction").insert([
          {
            user_id: user.id,
            wallet_id: template.wallet_id,
            keterangan: `Transfer Rutin Ke: ${toWalletName}`,
            kategori: "Transfer Keluar",
            income: 0,
            outcome: template.amount,
            saving: 0,
            tanggal: new Date().toISOString().split("T")[0],
            is_transfer: true,
            transfer_from_wallet_id: template.wallet_id,
            transfer_to_wallet_id: template.target_wallet_id,
          },
        ]);

        if (err1) throw err1;

        // 2. Deposit
        const { error: err2 } = await supabase.from("transaction").insert([
          {
            user_id: user.id,
            wallet_id: template.target_wallet_id,
            keterangan: `Transfer Rutin Dari: ${fromWalletName}`,
            kategori: "Transfer Masuk",
            income: template.amount,
            outcome: 0,
            saving: 0,
            tanggal: new Date().toISOString().split("T")[0],
            is_transfer: true,
            transfer_from_wallet_id: template.wallet_id,
            transfer_to_wallet_id: template.target_wallet_id,
          },
        ]);

        if (err2) throw err2;
      } else {
        const txPayload = {
          user_id: user.id,
          wallet_id: template.wallet_id,
          keterangan: template.keterangan,
          kategori: template.kategori,
          income: template.type === "income" ? template.amount : 0,
          outcome: template.type === "outcome" ? template.amount : 0,
          saving: template.type === "saving" ? template.amount : 0,
          tanggal: new Date().toISOString().split("T")[0],
          is_transfer: false,
        };
        const { error: txError } = await supabase
          .from("transaction")
          .insert(txPayload);
        if (txError) throw txError;
      }

      await supabase
        .from("recurring_templates")
        .update({ last_generated: new Date().toISOString() })
        .eq("id", template.id);
      fetchData();
      alert("Transaksi berhasil digenerate! 🪄");
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (template: RecurringTemplate) => {
    setConfirmingAction({ type: "delete", template });
  };

  const executeDelete = async (template: RecurringTemplate) => {
    setConfirmingAction(null);
    await supabase.from("recurring_templates").delete().eq("id", template.id);
    fetchData();
  };

  const resetForm = () => {
    setFormData({
      keterangan: "",
      amount: 0,
      type: "outcome",
      kategori: "Tagihan",
      wallet_id: wallets[0]?.id || "",
      target_wallet_id: "",
      frequency: "monthly",
      day_of_month: 0,
      is_active: true,
    });
    setEditingId(null);
    setIsAdding(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[200] flex items-center justify-center p-4">
      <div
        className={`w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-[2.5rem] border shadow-2xl animate-in zoom-in-95 duration-300 pb-20 sm:pb-0 ${
          isDark
            ? "bg-slate-900/95 border-white/5 shadow-black/50"
            : "bg-white/95 border-slate-200 shadow-slate-200/50"
        }`}
      >
        {/* Header */}
        <div
          className={`sticky top-0 p-8 border-b backdrop-blur-md z-10 ${
            isDark
              ? "bg-slate-900/80 border-white/5"
              : "bg-white/80 border-slate-200"
          }`}
        >
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <h2
                  className={`text-xl font-black uppercase tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}
                >
                  Mesin Berulang
                </h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">
                  Sinyal Finansial Otomatis
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
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-8">
          {!isAdding ? (
            <div className="space-y-8">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-6 bg-indigo-600 rounded-full" />
                  <h3
                    className={`text-sm font-black uppercase tracking-widest ${isDark ? "text-slate-300" : "text-slate-700"}`}
                  >
                    Template Aktif ({templates.length})
                  </h3>
                </div>
                <button
                  onClick={() => setIsAdding(true)}
                  className="px-6 py-3 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/30 active:scale-95"
                >
                  + Signal Baru
                </button>
              </div>

              {loading && templates.length === 0 ? (
                <div className="text-center py-20 animate-pulse text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
                  Memindai pola berulang...
                </div>
              ) : templates.length === 0 ? (
                <div
                  className={`p-16 text-center rounded-[2.5rem] border border-dashed ${isDark ? "border-white/10" : "border-slate-200"}`}
                >
                  <p className="text-sm font-bold opacity-40 uppercase tracking-widest">
                    Belum ada template rutin terdeteksi.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {templates.map((t) => (
                    <div
                      key={t.id}
                      className={`p-6 rounded-[2rem] border transition-all hover:scale-[1.02] group relative overflow-hidden ${isDark ? "bg-slate-800/40 border-white/5" : "bg-slate-50 border-slate-200"}`}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="space-y-1">
                          <div
                            className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full inline-block ${
                              t.type === "income"
                                ? "bg-green-500/10 text-green-500"
                                : t.type === "saving"
                                  ? "bg-indigo-500/10 text-indigo-600"
                                  : t.type === "transfer"
                                    ? "bg-indigo-500/10 text-indigo-600"
                                    : "bg-red-500/10 text-red-500"
                            }`}
                          >
                            {t.type === "transfer" ? "TRANSFER" : t.kategori}
                          </div>
                          <h4
                            className={`text-base font-black tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}
                          >
                            {t.type === "transfer" ? (
                              <span className="flex items-center gap-2">
                                {
                                  wallets.find((w) => w.id === t.wallet_id)
                                    ?.name
                                }
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-3 w-3 opacity-40"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                                {
                                  wallets.find(
                                    (w) => w.id === t.target_wallet_id,
                                  )?.name
                                }
                              </span>
                            ) : (
                              t.keterangan
                            )}
                          </h4>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setEditingId(t.id);
                              setFormData({
                                keterangan: t.keterangan,
                                amount: t.amount,
                                type: t.type,
                                kategori: t.kategori,
                                wallet_id: t.wallet_id,
                                target_wallet_id: t.target_wallet_id || null,
                                frequency: t.frequency,
                                day_of_month: t.day_of_month,
                                is_active: t.is_active,
                              });
                              setIsAdding(true);
                            }}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${isDark ? "bg-white/5 text-slate-400 hover:text-white" : "bg-white text-slate-500 hover:bg-slate-100 border border-slate-200"}`}
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
                                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                              />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(t)}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${isDark ? "bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white" : "bg-red-50 text-red-600 hover:bg-red-100"}`}
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
                      </div>
                      <div className="flex items-center justify-between mt-6">
                        <div className="space-y-0.5">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                            Nilai Sinyal
                          </p>
                          <p
                            className={`text-lg font-black tracking-tighter ${t.type === "income" ? "text-green-500" : t.type === "saving" ? "text-indigo-600" : t.type === "transfer" ? "text-indigo-600" : isDark ? "text-white" : "text-slate-900"}`}
                          >
                            Rp {t.amount?.toLocaleString("id-ID")}
                          </p>
                        </div>
                        <button
                          onClick={() => handleManualTrigger(t)}
                          className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${isDark ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" : "bg-indigo-50 text-indigo-600 border border-indigo-100 hover:bg-indigo-600 hover:text-white"} active:scale-95`}
                        >
                          🪄 Generate Sekarang
                        </button>
                      </div>
                      <div
                        className={`mt-4 pt-4 border-t flex items-center justify-between ${isDark ? "border-white/5" : "border-slate-200"}`}
                      >
                        <p className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">
                          🗓️ Setiap tgl {t.day_of_month}
                        </p>
                        {t.last_generated && (
                          <p className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">
                            Terakhir:{" "}
                            {new Date(t.last_generated).toLocaleDateString(
                              "id-ID",
                              { day: "2-digit", month: "short" },
                            )}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="space-y-8 animate-in slide-in-from-right-4 duration-500"
            >
              <div className="flex justify-between items-center mb-4">
                <h3
                  className={`text-sm font-black uppercase tracking-widest ${isDark ? "text-slate-300" : "text-slate-700"}`}
                >
                  {editingId ? "Koreksi Pattern" : "Konfigurasi Pattern Baru"}
                </h3>
                <button
                  type="button"
                  onClick={resetForm}
                  className={`text-xs font-black uppercase tracking-widest ${isDark ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-900"}`}
                >
                  Batal
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest mb-3 opacity-60">
                      Keterangan Sinyal
                    </label>
                    <input
                      type="text"
                      value={formData.keterangan}
                      onChange={(e) =>
                        setFormData({ ...formData, keterangan: e.target.value })
                      }
                      required
                      className={`w-full px-5 py-4 rounded-2xl border outline-none transition-all ${isDark ? "bg-slate-800 border-white/5 text-white" : "bg-slate-50 border-slate-200"}`}
                      placeholder="Contoh: Tagihan Listrik"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest mb-3 opacity-60">
                      Value (IDR)
                    </label>
                    <input
                      type="number"
                      value={formData.amount === 0 ? "" : formData.amount}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          amount: Number(e.target.value),
                        })
                      }
                      required
                      className={`w-full px-5 py-4 rounded-2xl border outline-none transition-all ${isDark ? "bg-slate-800 border-white/5 text-white" : "bg-slate-50 border-slate-200"}`}
                    />
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {["income", "outcome", "saving", "transfer"].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            type: type as any,
                            kategori:
                              type === "income"
                                ? "Gaji"
                                : type === "saving"
                                  ? "Tabungan Mandiri"
                                  : type === "transfer"
                                    ? "Transfer Rutin"
                                    : "Tagihan",
                          })
                        }
                        className={`py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${formData.type === type ? "bg-indigo-600 text-white border-indigo-700 shadow-lg" : isDark ? "bg-slate-800 border-white/5 text-slate-400" : "bg-white border-slate-200 text-slate-500"}`}
                      >
                        {type === "income"
                          ? "Pemasukan"
                          : type === "outcome"
                            ? "Pengeluaran"
                            : type === "saving"
                              ? "Simpan"
                              : "Transfer"}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-6">
                  <div
                    className={`grid grid-cols-1 ${formData.type === "transfer" ? "md:grid-cols-2" : ""} gap-4`}
                  >
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest mb-3 opacity-60">
                        {formData.type === "transfer"
                          ? "Wallet Sumber"
                          : "Sumber/Tujuan Wallet"}
                      </label>
                      <select
                        value={formData.wallet_id}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            wallet_id: e.target.value,
                          })
                        }
                        className={`w-full px-5 py-4 rounded-2xl border outline-none transition-all ${isDark ? "bg-slate-800 border-white/5 text-white" : "bg-slate-50 border-slate-200"}`}
                      >
                        {wallets.map((w) => (
                          <option key={w.id} value={w.id}>
                            {w.icon} {w.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    {formData.type === "transfer" && (
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest mb-3 opacity-60">
                          Wallet Tujuan
                        </label>
                        <select
                          value={formData.target_wallet_id || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              target_wallet_id: e.target.value,
                            })
                          }
                          className={`w-full px-5 py-4 rounded-2xl border outline-none transition-all ${isDark ? "bg-slate-800 border-white/5 text-white" : "bg-slate-50 border-slate-200"}`}
                          required={formData.type === "transfer"}
                        >
                          <option value="">Pilih Tujuan...</option>
                          {wallets
                            .filter((w) => w.id !== formData.wallet_id)
                            .map((w) => (
                              <option key={w.id} value={w.id}>
                                {w.icon} {w.name}
                              </option>
                            ))}
                        </select>
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest mb-3 opacity-60">
                        Frekuensi
                      </label>
                      <select
                        value={formData.frequency}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            frequency: e.target.value,
                          })
                        }
                        className={`w-full px-5 py-4 rounded-2xl border outline-none transition-all ${isDark ? "bg-slate-800 border-white/5 text-white" : "bg-slate-50 border-slate-200"}`}
                      >
                        <option value="monthly">Bulanan</option>
                        <option value="weekly">Mingguan</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest mb-3 opacity-60">
                        Tgl Eksekusi (1-31)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="31"
                        value={
                          formData.day_of_month === 0
                            ? ""
                            : formData.day_of_month
                        }
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            day_of_month: Number(e.target.value),
                          })
                        }
                        className={`w-full px-5 py-4 rounded-2xl border outline-none transition-all ${isDark ? "bg-slate-800 border-white/5 text-white" : "bg-slate-50 border-slate-200"}`}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest mb-3 opacity-60">
                      Kategori
                    </label>
                    <select
                      value={formData.kategori}
                      onChange={(e) =>
                        setFormData({ ...formData, kategori: e.target.value })
                      }
                      className={`w-full px-5 py-4 rounded-2xl border outline-none transition-all ${isDark ? "bg-slate-800 border-white/5 text-white" : "bg-slate-50 border-slate-200"}`}
                    >
                      {(formData.type === "income"
                        ? CATEGORIES.pemasukan
                        : formData.type === "saving"
                          ? CATEGORIES.tabungan
                          : formData.type === "transfer"
                            ? CATEGORIES.transfer
                            : CATEGORIES.pengeluaran
                      ).map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="pt-8">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs font-black uppercase tracking-[0.2em] rounded-2xl hover:scale-[1.02] shadow-xl shadow-indigo-600/20 active:scale-95 transition-all"
                >
                  {loading
                    ? "Memproses Pola..."
                    : editingId
                      ? "Simpan Perubahan"
                      : "Aktifkan Pola Rutin"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      <ConfirmationModal
        isOpen={!!confirmingAction}
        title={
          confirmingAction?.type === "generate"
            ? "Generate Transaksi"
            : "Hapus Template"
        }
        message={
          confirmingAction?.type === "generate"
            ? `Apakah Anda yakin ingin men-generate transaksi baru untuk "${confirmingAction.template.keterangan}" sekarang?`
            : `Apakah Anda yakin ingin menghapus template rutin "${confirmingAction?.template.keterangan}"? Tindakan ini tidak dapat dibatalkan.`
        }
        confirmText={
          confirmingAction?.type === "generate"
            ? "Generate 🪄"
            : "Hapus Permanen"
        }
        onConfirm={() => {
          if (confirmingAction) {
            confirmingAction.type === "generate"
              ? executeManualTrigger(confirmingAction.template)
              : executeDelete(confirmingAction.template);
          }
        }}
        onCancel={() => setConfirmingAction(null)}
        isDark={isDark}
        type={confirmingAction?.type === "generate" ? "info" : "danger"}
      />

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        isDark={isDark}
        title="Batas Transaksi Berulang Tercapai"
        message="Pengguna Free hanya dapat memiliki maksimal 1 transaksi berulang. Upgrade ke Pro untuk membuat transaksi berulang tanpa batas dan otomatisasi keuangan Anda!"
        feature="Unlimited Recurring"
      />
    </div>
  );
}
