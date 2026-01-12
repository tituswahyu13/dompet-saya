-- ============================================
-- Create Wallet for User: e16e8c9f-c3c3-4d63-966b-ca6263b392b6
-- ============================================

-- Step 1: Add unique constraint (if not exists) using DO block
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

-- Step 2: Create Cash wallet
INSERT INTO wallets (user_id, name, type, icon, color, initial_balance, is_active)
VALUES ('e16e8c9f-c3c3-4d63-966b-ca6263b392b6', 'Cash', 'cash', '💵', '#10b981', 0, true)
ON CONFLICT (user_id, name) DO NOTHING;

-- Step 3: Link all 20 transactions to Cash wallet
UPDATE transaction 
SET wallet_id = (
  SELECT id FROM wallets 
  WHERE user_id = 'e16e8c9f-c3c3-4d63-966b-ca6263b392b6' 
  AND name = 'Cash'
)
WHERE user_id = 'e16e8c9f-c3c3-4d63-966b-ca6263b392b6' 
AND wallet_id IS NULL;

-- Step 4: Verify
SELECT 
  w.name,
  w.icon,
  w.type,
  COUNT(t.id) as linked_transactions,
  SUM(t.income - t.outcome - COALESCE(t.saving, 0)) as calculated_balance
FROM wallets w
LEFT JOIN transaction t ON t.wallet_id = w.id
WHERE w.user_id = 'e16e8c9f-c3c3-4d63-966b-ca6263b392b6'
GROUP BY w.id, w.name, w.icon, w.type;
