ALTER TABLE registration_tickets ADD COLUMN access_token_enc TEXT;
ALTER TABLE registration_tickets ADD COLUMN refresh_token_enc TEXT;
ALTER TABLE registration_tickets ADD COLUMN access_expires_at INTEGER;

CREATE TABLE IF NOT EXISTS discord_credentials (
  discord_user_id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL UNIQUE REFERENCES user(id) ON DELETE CASCADE,
  access_token_enc TEXT NOT NULL,
  refresh_token_enc TEXT NOT NULL,
  access_expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
