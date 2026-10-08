ALTER TABLE direct_messages ADD COLUMN reply_to_id TEXT;

CREATE INDEX IF NOT EXISTS direct_messages_reply ON direct_messages (reply_to_id);

CREATE TABLE IF NOT EXISTS blocked_users (
  blocker_id TEXT NOT NULL,
  blocked_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (blocker_id, blocked_id),
  CHECK (blocker_id <> blocked_id)
);

CREATE INDEX IF NOT EXISTS blocked_users_target ON blocked_users (blocked_id, blocker_id);
