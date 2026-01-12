-- ============================================
-- Phase 2: Multi-Wallet System - Database Schema
-- ============================================

-- Step 1: Create wallets table
CREATE TABLE IF NOT EXISTS wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'cash', 'bank', 'ewallet', 'investment', 'other'
  icon VARCHAR(50) DEFAULT '💵', -- emoji or icon identifier
  color VARCHAR(20) DEFAULT '#10b981', -- hex color for UI
  initial_balance DECIMAL(15,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT unique_wallet_per_user UNIQUE(user_id, name)
);

-- Step 2: Enable Row Level Security on wallets
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;

-- Step 3: Create RLS Policies for wallets
CREATE POLICY "Users can view own wallets" 
ON wallets FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own wallets" 
ON wallets FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own wallets" 
ON wallets FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own wallets" 
ON wallets FOR DELETE 
USING (auth.uid() = user_id);

-- Step 4: Add wallet_id to transaction table
ALTER TABLE transaction 
ADD COLUMN IF NOT EXISTS wallet_id UUID REFERENCES wallets(id) ON DELETE SET NULL;

-- Step 5: Add transfer-related columns to transaction table
ALTER TABLE transaction 
ADD COLUMN IF NOT EXISTS is_transfer BOOLEAN DEFAULT false;

ALTER TABLE transaction 
ADD COLUMN IF NOT EXISTS transfer_to_wallet_id UUID REFERENCES wallets(id) ON DELETE SET NULL;

ALTER TABLE transaction 
ADD COLUMN IF NOT EXISTS transfer_from_wallet_id UUID REFERENCES wallets(id) ON DELETE SET NULL;

-- Step 6: Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_transaction_wallet_id ON transaction(wallet_id);
CREATE INDEX IF NOT EXISTS idx_transaction_user_wallet ON transaction(user_id, wallet_id);
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);

-- Step 7: Create default "Cash" wallet for existing users
INSERT INTO wallets (user_id, name, type, icon, color, initial_balance)
SELECT DISTINCT user_id, 'Cash', 'cash', '💵', '#10b981', 0
FROM transaction
WHERE user_id IS NOT NULL
ON CONFLICT (user_id, name) DO NOTHING;

-- Step 8: Link existing transactions to default Cash wallet
UPDATE transaction t
SET wallet_id = w.id
FROM wallets w
WHERE t.user_id = w.user_id 
  AND w.name = 'Cash'
  AND t.wallet_id IS NULL
  AND t.user_id IS NOT NULL;

-- Step 9: Create function to calculate wallet balance
CREATE OR REPLACE FUNCTION get_wallet_balance(wallet_uuid UUID)
RETURNS DECIMAL(15,2) AS $$
DECLARE
  balance DECIMAL(15,2);
  initial DECIMAL(15,2);
BEGIN
  -- Get initial balance
  SELECT initial_balance INTO initial FROM wallets WHERE id = wallet_uuid;
  
  -- Calculate balance from transactions
  SELECT COALESCE(SUM(
    CASE 
      WHEN is_transfer THEN 
        CASE 
          WHEN transfer_to_wallet_id = wallet_uuid THEN income
          WHEN transfer_from_wallet_id = wallet_uuid THEN -outcome
          ELSE 0
        END
      ELSE (income - outcome - saving)
    END
  ), 0) INTO balance
  FROM transaction
  WHERE wallet_id = wallet_uuid;
  
  RETURN initial + balance;
END;
$$ LANGUAGE plpgsql;

-- Step 10: Create view for wallet balances
CREATE OR REPLACE VIEW wallet_balances AS
SELECT 
  w.id,
  w.user_id,
  w.name,
  w.type,
  w.icon,
  w.color,
  w.initial_balance,
  w.is_active,
  get_wallet_balance(w.id) as current_balance,
  w.created_at,
  w.updated_at
FROM wallets w;

-- Grant access to the view
GRANT SELECT ON wallet_balances TO authenticated;
