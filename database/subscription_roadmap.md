# Future Roadmap: Subscription System (SaaS Integration) 💸

Rencana ini merinci langkah-langkah untuk mengubah **Dompet Saya Pro** menjadi aplikasi model langganan (SaaS).

## 1. Pembagian Fitur (Pricing Tiers)

| Benefit             | Free Tier            | Pro Tier (Monthly/Yearly)       |
| :------------------ | :------------------- | :------------------------------ |
| Dompet              | Maksimal 3           | Unlimited                       |
| Target Keuangan     | Maksimal 2           | Unlimited                       |
| Transaksi Berulang  | Maksimal 1           | Unlimited                       |
| Budget Categories   | Maksimal 2           | Unlimited                       |
| Akses Data Historis | 2 Bulan Terakhir     | Unlimited                       |
| AI Insights Dasar   | Dasar (Trend harian) | Penuh (Prediksi & Rekomendasi)  |
| Ekspor Data         | Hanya CSV            | CSV, Excel, & PDF Professional  |
| **Uji Coba**        | **-**                | **60 Hari untuk Pengguna Baru** |

## 2. Struktur Database (Supabase)

Kita akan menambahkan tabel baru untuk melacak status pembayaran user:

```sql
-- Tabel untuk menyimpan status langganan
CREATE TABLE public.user_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) NOT NULL UNIQUE,
    tier TEXT DEFAULT 'free', -- 'free', 'pro'
    status TEXT DEFAULT 'trialing', -- 'active', 'trialing', 'past_due', 'canceled'
    payment_provider TEXT, -- 'midtrans', 'stripe', 'xendit'
    customer_id TEXT, -- ID dari payment gateway
    subscription_id TEXT,
    trial_start_date TIMESTAMPTZ DEFAULT now(),
    trial_end_date TIMESTAMPTZ DEFAULT (now() + interval '60 days'),
    expiry_date TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: Hanya user yang bersangkutan yang bisa melihat info langganannya
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own subscription" ON public.user_subscriptions
    FOR SELECT USING (auth.uid() = user_id);
```

## 3. Strategi Implementasi (Frontend)

### A. Subscription Hook

Membuat hook `useSubscription` untuk mempermudah pengecekan status di seluruh komponen.

```tsx
// hooks/useSubscription.ts
export const useSubscription = () => {
  const [tier, setTier] = useState("free");

  useEffect(() => {
    // Fetch data from user_subscriptions table
  }, []);

  return { isPro: tier === "pro", tier };
};
```

### B. Feature Gating (Hiding Pro Features)

Membungkus fitur premium dengan komponen pelindung.

```tsx
<PremiumFeature>
  <AIInsights />
</PremiumFeature>
```

## 4. Integrasi Payment Gateway (Edge Functions)

1.  **Checkout Flow**: User memilih paket -> Frontend memanggil Supabase Edge Function -> Edge Function membuat transaksi di Midtrans/Stripe -> Berikan URL Pembayaran ke User.
2.  **Webhook Handler**: Gateway (Midtrans/Stripe) mengirim sinyal ke `/api/webhooks` saat pembayaran sukses -> Edge Function memperbarui tabel `user_subscriptions`.

## 5. Tahapan Eksekusi

- **Tahap 1**: Siapkan tabel `user_subscriptions` dan hubungkan dengan data user.
- **Tahap 2**: Terapkan logika "Limit" (contoh: user free tidak bisa tambah dompet ke-4).
- **Tahap 3**: Integrasi Payment Gateway API.
- **Tahap 4**: Halaman konfirmasi pembayaran dan manajemen langganan (batal/upgrade).

---

_Created by Antigravity for Dompet Saya Pro Evolution_
