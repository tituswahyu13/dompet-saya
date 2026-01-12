-- ============================================
-- SIMPLE: Manual Wallet Creation
-- Run this if automatic migration doesn't work
-- ============================================

-- First, check if you have user_id in transactions
SELECT user_id, COUNT(*) as count
FROM transaction
WHERE user_id IS NOT NULL
GROUP BY user_id;

-- If you see your user_id above, use it in the next query
-- Replace 'YOUR_USER_ID_HERE' with your actual user_id from auth.users

-- Get your user_id first:
SELECT id, email FROM auth.users;

-- Then create wallet manually (replace the UUID below):
-- INSERT INTO wallets (user_id, name, type, icon, color, initial_balance)
-- VALUES ('YOUR_USER_ID_HERE', 'Cash', 'cash', '💵', '#10b981', 0);

-- After wallet is created, link transactions:
-- UPDATE transaction 
-- SET wallet_id = (SELECT id FROM wallets WHERE user_id = 'YOUR_USER_ID_HERE' AND name = 'Cash')
-- WHERE user_id = 'YOUR_USER_ID_HERE' AND wallet_id IS NULL;
