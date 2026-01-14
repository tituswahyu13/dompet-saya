-- MODUL SUBSCRIPTION: SETUP DATABASE
-- Deskripsi: Menyiapkan tabel langganan dan otomatisasi Free Trial 60 hari.

-- 1. Buat Tabel Subscriptions
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    tier TEXT DEFAULT 'free', -- 'free', 'pro'
    status TEXT DEFAULT 'trialing', -- 'active', 'trialing', 'past_due', 'canceled'
    payment_provider TEXT,
    customer_id TEXT,
    subscription_id TEXT,
    trial_start_date TIMESTAMPTZ DEFAULT now(),
    trial_end_date TIMESTAMPTZ DEFAULT (now() + interval '60 days'),
    expiry_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Aktifkan RLS
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- 3. Policy RLS
DROP POLICY IF EXISTS "Users can view own subscription" ON public.user_subscriptions;
CREATE POLICY "Users can view own subscription" ON public.user_subscriptions
    FOR SELECT USING (auth.uid() = user_id);

-- 4. Fungsi Otomatisasi New User (Otentikasi ke Tabel Subscriptions)
-- Fungsi ini akan dijalankan lewat trigger saat user baru mendaftar (signup)
CREATE OR REPLACE FUNCTION public.handle_new_user_subscription()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_subscriptions (user_id, tier, status)
    VALUES (NEW.id, 'pro', 'trialing'); -- Default Pro Tier saat trial
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Trigger untuk Fungsi di atas
-- Pastikan trigger ini baru dibuat jika belum ada
DROP TRIGGER IF EXISTS on_auth_user_created_subscription ON auth.users;
CREATE TRIGGER on_auth_user_created_subscription
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_subscription();

-- 6. Helper View: Status Langganan yang mudah dibaca
CREATE OR REPLACE VIEW public.vw_user_subscription_status AS
SELECT 
    user_id,
    tier,
    status,
    trial_end_date,
    (trial_end_date > now()) as is_trial_active,
    EXTRACT(DAY FROM (trial_end_date - now())) as days_left
FROM public.user_subscriptions;
