-- 1. Create tips table
CREATE TABLE IF NOT EXISTS tips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alias TEXT NOT NULL,
    encrypted_content TEXT NOT NULL,
    category TEXT NOT NULL,
    priority TEXT NOT NULL,
    media_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create alias_map table
CREATE TABLE IF NOT EXISTS alias_map (
    alias TEXT PRIMARY KEY,
    encrypted_telegram_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create client_settings table
CREATE TABLE IF NOT EXISTS client_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_name TEXT NOT NULL,
    client_logo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE tips ENABLE ROW LEVEL SECURITY;
ALTER TABLE alias_map ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tips
CREATE POLICY "Enable read access for authenticated users only" ON tips
    FOR SELECT
    TO authenticated
    USING (true);

-- RLS Policies for alias_map
CREATE POLICY "Enable read access for authenticated users only" ON alias_map
    FOR SELECT
    TO authenticated
    USING (true);

-- Note: client_settings has RLS enabled but no explicit SELECT policy yet.
-- This ensures it remains private until a specific policy is defined.
