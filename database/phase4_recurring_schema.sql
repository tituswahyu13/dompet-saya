-- Database Schema: Phase 4 - Recurring Transactions
-- Track recurring transaction templates for automated generation

CREATE TABLE IF NOT EXISTS public.recurring_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    wallet_id UUID REFERENCES public.wallets(id) ON DELETE CASCADE NOT NULL,
    keterangan TEXT NOT NULL,
    kategori TEXT NOT NULL,
    amount NUMERIC NOT NULL DEFAULT 0,
    type TEXT NOT NULL CHECK (type IN ('income', 'outcome', 'saving')),
    frequency TEXT NOT NULL DEFAULT 'monthly' CHECK (frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
    day_of_month INTEGER CHECK (day_of_month >= 1 AND day_of_month <= 31),
    last_generated TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS Policies
ALTER TABLE public.recurring_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own recurring templates"
    ON public.recurring_templates FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own recurring templates"
    ON public.recurring_templates FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own recurring templates"
    ON public.recurring_templates FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own recurring templates"
    ON public.recurring_templates FOR DELETE
    USING (auth.uid() = user_id);
