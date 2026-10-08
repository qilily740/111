CREATE TABLE IF NOT EXISTS friend_requests (
  id TEXT PRIMARY KEY NOT NULL,
  from_user_id TEXT NOT NULL,
  from_username TEXT NOT NULL,
  to_user_id TEXT NOT NULL,
  to_username TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted')),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE (from_user_id, to_user_id),
  CHECK (from_user_id <> to_user_id)
);
CREATE INDEX IF NOT EXISTS friend_requests_to_status ON friend_requests (to_user_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS friend_requests_from_status ON friend_requests (from_user_id, status, created_at DESC);
