-- ============================================
-- FIX: Create wallet_balances view (if failed before)
-- ============================================

-- Drop view if exists (in case of errors)
DROP VIEW IF EXISTS wallet_balances;

-- Create simplified view without function dependency
CREATE VIEW wallet_balances AS
SELECT 
  w.id,
  w.user_id,
  w.name,
  w.type,
  w.icon,
  w.color,
  w.initial_balance,
  w.is_active,
  w.created_at,
  w.updated_at,
  -- Calculate current balance inline
  (
    w.initial_balance + COALESCE((
      SELECT SUM(
        CASE 
          WHEN t.is_transfer THEN 
            CASE 
              WHEN t.transfer_to_wallet_id = w.id THEN t.income
              WHEN t.transfer_from_wallet_id = w.id THEN -t.outcome
              ELSE 0
            END
          ELSE (t.income - t.outcome - COALESCE(t.saving, 0))
        END
      )
      FROM transaction t
      WHERE t.wallet_id = w.id
    ), 0)
  ) as current_balance
FROM wallets w;

-- Grant access
GRANT SELECT ON wallet_balances TO authenticated;
