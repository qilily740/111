CREATE TABLE IF NOT EXISTS repository_profiles (
  user_id TEXT PRIMARY KEY,
  nickname TEXT NOT NULL DEFAULT '',
  bio TEXT NOT NULL DEFAULT '',
  note TEXT NOT NULL DEFAULT ''
);
