-- SECURITY PATCH: ENABLE ROW LEVEL SECURITY
-- Deskripsi: Mengaktifkan RLS agar Policy yang sudah dibuat benar-benar ditegakkan oleh database.

-- 1. Aktifkan RLS untuk tabel wallets
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

-- 2. Aktifkan RLS untuk tabel transaction (sebagai jaga-jaga)
ALTER TABLE public.transaction ENABLE ROW LEVEL SECURITY;

-- Note: Tanpa perintah ENABLE RLS, semua Policy yang Anda buat akan diabaikan oleh Supabase.
泛
