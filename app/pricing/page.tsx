"use client"
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useSubscription } from '@/hooks/useSubscription';
import AuthWrapper from '@/components/AuthWrapper';
import Navigation from '@/components/Navigation';
import { Check, X, Sparkles, Crown, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

function PricingContent() {
  const router = useRouter();
  const { subscription, loading } = useSubscription();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    setIsDark(savedTheme === 'dark');
  }, []);

  const features = [
    { name: 'Jumlah Dompet', free: '3 Dompet', pro: 'Unlimited' },
    { name: 'Target Keuangan', free: '2 Target', pro: 'Unlimited' },
    { name: 'Transaksi Berulang', free: '1 Transaksi', pro: 'Unlimited' },
    { name: 'Budget Categories', free: '2 Kategori', pro: 'Unlimited' },
    { name: 'Akses Data Historis', free: '2 Bulan Terakhir', pro: 'Unlimited' },
    { name: 'AI Insights Dasar', free: true, pro: true },
    { name: 'Prediksi Pengeluaran AI', free: false, pro: true },
    { name: 'Rekomendasi Hemat AI', free: false, pro: true },
    { name: 'Export CSV/Excel', free: true, pro: true },
    { name: 'Export PDF Professional', free: false, pro: true },
    { name: 'Analisis Pola Pengeluaran', free: true, pro: true },
    { name: 'Deteksi Anomali', free: true, pro: true },
  ];

  const handleActivateTrial = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Update user to Pro Trial
    const { error } = await supabase
      .from('user_subscriptions')
      .update({
        tier: 'pro',
        status: 'trialing',
        trial_end_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString()
      })
      .eq('user_id', user.id);

    if (!error) {
      alert('🎉 Selamat! Uji Coba Pro 60 Hari Anda telah diaktifkan!');
      router.push('/');
    } else {
      alert('Gagal mengaktifkan trial: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-rose-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}>
      <Navigation isDark={isDark} />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Back Button */}
        <Link href="/" className={`inline-flex items-center gap-2 mb-8 text-sm font-bold ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'} transition-colors`}>
          <ArrowLeft size={16} />
          Kembali ke Dashboard
        </Link>

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rose-500/10 border border-rose-500/20 mb-4">
            <Crown className="text-rose-500" size={20} />
            <span className="text-sm font-black text-rose-500 uppercase tracking-widest">Upgrade ke Pro</span>
          </div>
          <h1 className={`text-3xl sm:text-5xl font-black uppercase tracking-tight mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Kelola Keuangan Lebih Cerdas
          </h1>
          <p className={`text-lg ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Dapatkan akses penuh ke fitur AI dan analisis profesional
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {/* Free Plan */}
          <div className={`p-8 rounded-[2.5rem] border ${isDark ? 'bg-slate-900/50 border-white/10' : 'bg-white border-slate-200'}`}>
            <div className="mb-6">
              <h3 className={`text-2xl font-black uppercase tracking-tight mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Free
              </h3>
              <div className="flex items-baseline gap-2">
                <span className={`text-4xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>Rp 0</span>
                <span className={`text-sm font-bold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>/bulan</span>
              </div>
            </div>
            <div className="space-y-3 mb-8">
              {features.map((feature, i) => (
                <div key={i} className="flex items-center gap-3">
                  {typeof feature.free === 'boolean' ? (
                    feature.free ? (
                      <Check size={16} className="text-emerald-500 shrink-0" />
                    ) : (
                      <X size={16} className="text-slate-400 shrink-0" />
                    )
                  ) : (
                    <Check size={16} className="text-emerald-500 shrink-0" />
                  )}
                  <span className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    {feature.name}: {typeof feature.free === 'boolean' ? '' : feature.free}
                  </span>
                </div>
              ))}
            </div>
            <button
              disabled
              className={`w-full py-4 rounded-xl text-sm font-black uppercase tracking-widest transition-all ${isDark ? 'bg-slate-800 text-slate-500' : 'bg-slate-100 text-slate-400'} cursor-not-allowed`}
            >
              Paket Saat Ini
            </button>
          </div>

          {/* Pro Plan */}
          <div className={`p-8 rounded-[2.5rem] border-2 border-rose-500 relative overflow-hidden ${isDark ? 'bg-gradient-to-br from-rose-900/20 to-pink-900/20' : 'bg-gradient-to-br from-rose-50 to-pink-50'}`}>
            {/* Popular Badge */}
            <div className="absolute top-6 right-6">
              <div className="px-3 py-1 bg-rose-500 rounded-full">
                <span className="text-[10px] font-black text-white uppercase tracking-widest">Popular</span>
              </div>
            </div>

            <div className="mb-6">
              <h3 className={`text-2xl font-black uppercase tracking-tight mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Pro
              </h3>
              <div className="flex items-baseline gap-2">
                <span className={`text-4xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>Rp 49K</span>
                <span className={`text-sm font-bold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>/bulan</span>
              </div>
              <p className="text-xs text-rose-500 font-bold mt-2">💸 Hemat 20% dengan paket tahunan</p>
            </div>

            <div className="space-y-3 mb-8">
              {features.map((feature, i) => (
                <div key={i} className="flex items-center gap-3">
                  {typeof feature.pro === 'boolean' ? (
                    feature.pro ? (
                      <Check size={16} className="text-rose-500 shrink-0" />
                    ) : (
                      <X size={16} className="text-slate-400 shrink-0" />
                    )
                  ) : (
                    <Check size={16} className="text-rose-500 shrink-0" />
                  )}
                  <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {feature.name}: {typeof feature.pro === 'boolean' ? '' : feature.pro}
                  </span>
                </div>
              ))}
            </div>

            {subscription?.status === 'trialing' ? (
              <div className={`w-full py-4 rounded-xl text-center text-sm font-black uppercase tracking-widest ${isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700'}`}>
                ✅ Trial Aktif ({subscription.days_left} Hari Tersisa)
              </div>
            ) : subscription?.is_pro ? (
              <div className={`w-full py-4 rounded-xl text-center text-sm font-black uppercase tracking-widest ${isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700'}`}>
                ✅ Anda Sudah Pro
              </div>
            ) : (
              <button
                onClick={handleActivateTrial}
                className="w-full py-4 bg-gradient-to-r from-rose-600 to-pink-600 text-white rounded-xl text-sm font-black uppercase tracking-widest hover:scale-[1.02] transition-all shadow-xl shadow-rose-500/20 flex items-center justify-center gap-2"
              >
                <Sparkles size={16} />
                Coba Gratis 60 Hari
              </button>
            )}
          </div>
        </div>

        {/* FAQ */}
        <div className={`p-8 rounded-[2.5rem] border ${isDark ? 'bg-slate-900/50 border-white/10' : 'bg-white border-slate-200'}`}>
          <h3 className={`text-xl font-black uppercase tracking-tight mb-6 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Pertanyaan Umum
          </h3>
          <div className="space-y-4">
            <div>
              <h4 className={`font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>Bagaimana cara pembayaran?</h4>
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Saat ini sistem pembayaran sedang dalam tahap pengembangan. Anda bisa menikmati trial 60 hari terlebih dahulu!
              </p>
            </div>
            <div>
              <h4 className={`font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>Apakah bisa dibatalkan kapan saja?</h4>
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Ya! Anda bisa membatalkan langganan kapan saja tanpa biaya tambahan.
              </p>
            </div>
            <div>
              <h4 className={`font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>Apa yang terjadi setelah trial berakhir?</h4>
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Akun Anda akan otomatis kembali ke paket Free. Data Anda tetap aman dan tidak akan hilang.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function PricingPage() {
  return (
    <AuthWrapper>
      {() => <PricingContent />}
    </AuthWrapper>
  );
}
