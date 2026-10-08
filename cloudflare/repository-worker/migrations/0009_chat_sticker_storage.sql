ALTER TABLE chat_stickers ADD COLUMN object_key TEXT NOT NULL DEFAULT '';
ALTER TABLE chat_stickers ADD COLUMN mime_type TEXT NOT NULL DEFAULT '';
ALTER TABLE chat_stickers ADD COLUMN size_bytes INTEGER NOT NULL DEFAULT 0;
ALTER TABLE chat_stickers ADD COLUMN last_used_at INTEGER NOT NULL DEFAULT 0;

UPDATE chat_stickers SET last_used_at = created_at WHERE last_used_at = 0;
CREATE INDEX IF NOT EXISTS chat_stickers_user_last_used ON chat_stickers (user_id, last_used_at);
