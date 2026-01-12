-- ============================================
-- Create Default Wallet & Migrate Existing Data
-- ============================================

-- Step 1: Add unique constraint if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'unique_wallet_per_user'
  ) THEN
    ALTER TABLE wallets 
    ADD CONSTRAINT unique_wallet_per_user UNIQUE(user_id, name);
  END IF;
END $$;

-- Step 2: Create default "Cash" wallet for existing users
INSERT INTO wallets (user_id, name, type, icon, color, initial_balance, is_active)
SELECT DISTINCT 
  user_id, 
  'Cash' as name,
  'cash' as type,
  '💵' as icon,
  '#10b981' as color,
  0 as initial_balance,
  true as is_active
FROM transaction
WHERE user_id IS NOT NULL
ON CONFLICT (user_id, name) DO NOTHING;

-- Step 3: Link all existing transactions to their user's Cash wallet
UPDATE transaction t
SET wallet_id = w.id
FROM wallets w
WHERE t.user_id = w.user_id 
  AND w.name = 'Cash'
  AND t.wallet_id IS NULL
  AND t.user_id IS NOT NULL;

-- Step 4: Verify migration
SELECT 
  u.email,
  w.name as wallet_name,
  w.icon,
  COUNT(t.id) as transaction_count
FROM auth.users u
LEFT JOIN wallets w ON w.user_id = u.id
LEFT JOIN transaction t ON t.wallet_id = w.id
GROUP BY u.email, w.name, w.icon
ORDER BY u.email;
