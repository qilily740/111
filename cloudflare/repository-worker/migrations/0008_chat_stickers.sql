CREATE TABLE IF NOT EXISTS chat_stickers (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  label TEXT NOT NULL,
  group_name TEXT NOT NULL DEFAULT '默认',
  source_url TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  deleted_at INTEGER
);

CREATE INDEX IF NOT EXISTS chat_stickers_user_created ON chat_stickers (user_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS chat_stickers_user_url ON chat_stickers (user_id, source_url) WHERE deleted_at IS NULL;

ALTER TABLE direct_messages ADD COLUMN message_type TEXT NOT NULL DEFAULT 'text';
ALTER TABLE direct_messages ADD COLUMN sticker_id TEXT;
CREATE INDEX IF NOT EXISTS direct_messages_sticker_expiry ON direct_messages (sticker_id, expires_at);
