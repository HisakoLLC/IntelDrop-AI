-- Migration: Multi-turn Session State
-- Execute this natively inside the Supabase SQL Editor

CREATE TABLE public.sessions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    alias text NOT NULL,
    messages jsonb NOT NULL DEFAULT '[]'::jsonb,
    status text NOT NULL DEFAULT 'active',
    created_at timestamp with time zone DEFAULT now()
);

-- Index for faster session lookups against active aliases
CREATE INDEX idx_sessions_alias on public.sessions(alias);

-- Apply Row Level Security Constraints (Admin / Service Role isolated)
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
