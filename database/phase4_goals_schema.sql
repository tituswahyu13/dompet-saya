-- Database Schema: Financial Goals Tracking
-- Description: Table to store user financial goals and track progress.

CREATE TABLE IF NOT EXISTS financial_goals (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    target_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    current_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    wallet_id UUID REFERENCES wallets(id) ON DELETE SET NULL, -- Optional: link to a specific wallet's balance
    deadline DATE,
    icon TEXT DEFAULT '🎯',
    color TEXT DEFAULT '#3b82f6',
    is_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE financial_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own goals" 
ON financial_goals FOR ALL 
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_financial_goals_updated_at
    BEFORE UPDATE ON financial_goals
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();
