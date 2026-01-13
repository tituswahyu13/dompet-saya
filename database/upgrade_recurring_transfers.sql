-- Database Migration: Add Transfer Support to Recurring Engine
-- Run this in Supabase SQL Editor

ALTER TABLE public.recurring_templates 
ADD COLUMN target_wallet_id UUID REFERENCES public.wallets(id) ON DELETE CASCADE;

-- Update the type constraint to support 'transfer'
ALTER TABLE public.recurring_templates 
DROP CONSTRAINT IF EXISTS recurring_templates_type_check;

ALTER TABLE public.recurring_templates 
ADD CONSTRAINT recurring_templates_type_check 
CHECK (type IN ('income', 'outcome', 'saving', 'transfer'));
