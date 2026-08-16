-- Auth reliability: store hashed magic-link tokens + request metadata for abuse controls.
-- Existing plaintext tokens were never emailed in production; truncate safely.

TRUNCATE magic_link_tokens;

ALTER TABLE magic_link_tokens RENAME COLUMN token TO token_hash;

ALTER TABLE magic_link_tokens
  ADD COLUMN IF NOT EXISTS request_ip TEXT;

CREATE INDEX IF NOT EXISTS idx_magic_link_tokens_email_created
  ON magic_link_tokens (email, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_magic_link_tokens_ip_created
  ON magic_link_tokens (request_ip, created_at DESC)
  WHERE request_ip IS NOT NULL;
