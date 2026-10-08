CREATE TABLE IF NOT EXISTS saved_posts (
  user_id TEXT NOT NULL,
  post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  saved_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, post_id)
);
CREATE INDEX IF NOT EXISTS saved_posts_user_time ON saved_posts (user_id, saved_at DESC);

ALTER TABLE posts ADD COLUMN avatar_key TEXT NOT NULL DEFAULT '';
ALTER TABLE posts ADD COLUMN avatar_type TEXT NOT NULL DEFAULT '';
