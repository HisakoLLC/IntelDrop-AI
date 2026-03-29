-- 0. Add hmac_id column to alias_map for deterministic lookups
ALTER TABLE alias_map ADD COLUMN hmac_id TEXT;

-- 1. Make it unique to ensure one chat_id maps to exactly one alias
ALTER TABLE alias_map ADD CONSTRAINT unique_hmac_id UNIQUE (hmac_id);

-- 2. Create an index on hmac_id for faster lookups when the webhook fires
CREATE INDEX idx_alias_map_hmac_id ON alias_map(hmac_id);
