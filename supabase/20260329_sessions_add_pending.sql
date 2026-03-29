-- Migration: Add Debounce Queues to Active Sessions
-- Execute this natively inside the Supabase SQL Editor

ALTER TABLE public.sessions 
ADD COLUMN pending_messages jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.sessions 
ADD COLUMN last_message_at timestamp with time zone DEFAULT now();

-- Optional: Create an index on 'last_message_at' to significantly speed up Edge Function polling
CREATE INDEX idx_sessions_debounce ON public.sessions (status, last_message_at);
