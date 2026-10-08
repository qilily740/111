CREATE TABLE IF NOT EXISTS direct_messages (
  id TEXT PRIMARY KEY NOT NULL,
  sender_id TEXT NOT NULL,
  recipient_id TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  read_at INTEGER,
  CHECK (sender_id <> recipient_id)
);
CREATE INDEX IF NOT EXISTS direct_messages_sender_time ON direct_messages (sender_id, created_at DESC);
CREATE INDEX IF NOT EXISTS direct_messages_recipient_time ON direct_messages (recipient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS direct_messages_expiry ON direct_messages (expires_at);
