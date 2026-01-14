-- SECURITY PATCH: REDECLARE VIEW WITH SECURITY INVOKER
-- Deskripsi: Mengatur agar View wallet_balances menghormati RLS dari user yang memanggilnya.

-- Hapus view lama
DROP VIEW IF EXISTS public.wallet_balances;

-- Buat ulang dengan opsi security_invoker = true (Postgres 15+)
CREATE VIEW public.wallet_balances 
WITH (security_invoker = true)
AS
SELECT 
    w.id,
    w.user_id,
    w.name,
    w.icon,
    w.color,
    w.type,
    w.is_active,
    w.created_at,
    (
        w.initial_balance +
        COALESCE((SELECT SUM(income) FROM public.transaction WHERE wallet_id = w.id), 0) -
        COALESCE((SELECT SUM(outcome) FROM public.transaction WHERE wallet_id = w.id), 0) -
        COALESCE((SELECT SUM(saving) FROM public.transaction WHERE wallet_id = w.id), 0)
    ) as current_balance
FROM public.wallets w;

-- Note: Jika Postgres Anda versi lama, Anda harus menggunakan RLS langsung pada tabel dasarnya
-- dan memastikan View tidak menggunakan SECURITY DEFINER.
