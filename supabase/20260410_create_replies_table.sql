-- Create replies table for tracking analyst communication
CREATE TABLE IF NOT EXISTS public.replies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alias TEXT NOT NULL REFERENCES public.alias_map(alias) ON DELETE CASCADE,
    message_sent TEXT NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.replies ENABLE ROW LEVEL SECURITY;

-- Allow service role to manage everything
CREATE POLICY "Service Role full access" ON public.replies
    USING (true)
    WITH CHECK (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_replies_alias ON public.replies(alias);
CREATE INDEX IF NOT EXISTS idx_replies_sent_at ON public.replies(sent_at);
