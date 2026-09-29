CREATE TABLE IF NOT EXISTS user (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  emailVerified INTEGER NOT NULL DEFAULT 0,
  image TEXT,
  username TEXT UNIQUE,
  discordUserId TEXT UNIQUE,
  discordAccessStatus TEXT NOT NULL DEFAULT 'unknown',
  discordAccessCheckedAt INTEGER,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS session (
  id TEXT PRIMARY KEY NOT NULL,
  expiresAt INTEGER NOT NULL,
  token TEXT NOT NULL UNIQUE,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL,
  ipAddress TEXT,
  userAgent TEXT,
  userId TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS session_userId_idx ON session(userId);

CREATE TABLE IF NOT EXISTS account (
  id TEXT PRIMARY KEY NOT NULL,
  accountId TEXT NOT NULL,
  providerId TEXT NOT NULL,
  userId TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  accessToken TEXT,
  refreshToken TEXT,
  idToken TEXT,
  accessTokenExpiresAt INTEGER,
  refreshTokenExpiresAt INTEGER,
  scope TEXT,
  password TEXT,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS account_userId_idx ON account(userId);

CREATE TABLE IF NOT EXISTS verification (
  id TEXT PRIMARY KEY NOT NULL,
  identifier TEXT NOT NULL,
  value TEXT NOT NULL,
  expiresAt INTEGER NOT NULL,
  createdAt INTEGER,
  updatedAt INTEGER
);
CREATE INDEX IF NOT EXISTS verification_identifier_idx ON verification(identifier);

CREATE TABLE IF NOT EXISTS registration_flows (
  id TEXT PRIMARY KEY NOT NULL,
  state_hash TEXT NOT NULL UNIQUE,
  flow_nonce_hash TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  consumed_at INTEGER
);

CREATE TABLE IF NOT EXISTS registration_tickets (
  ticket_hash TEXT PRIMARY KEY NOT NULL,
  flow_id TEXT NOT NULL REFERENCES registration_flows(id) ON DELETE CASCADE,
  discord_user_id TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  consumed_at INTEGER
);
CREATE INDEX IF NOT EXISTS registration_tickets_flow_idx ON registration_tickets(flow_id, expires_at);

CREATE TABLE IF NOT EXISTS email_challenges (
  id TEXT PRIMARY KEY NOT NULL,
  flow_id TEXT NOT NULL REFERENCES registration_flows(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  expires_at INTEGER NOT NULL,
  last_sent_at INTEGER NOT NULL,
  consumed_at INTEGER,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS email_challenges_flow_email_idx ON email_challenges(flow_id, email, expires_at);

CREATE TABLE IF NOT EXISTS email_verification_tickets (
  ticket_hash TEXT PRIMARY KEY NOT NULL,
  flow_id TEXT NOT NULL REFERENCES registration_flows(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  consumed_at INTEGER
);
CREATE INDEX IF NOT EXISTS email_tickets_flow_idx ON email_verification_tickets(flow_id, expires_at);

CREATE TABLE IF NOT EXISTS registration_claims (
  id TEXT PRIMARY KEY NOT NULL,
  eligibility_ticket_hash TEXT NOT NULL UNIQUE,
  email_ticket_hash TEXT NOT NULL UNIQUE,
  discord_user_id TEXT NOT NULL UNIQUE,
  user_id TEXT NOT NULL UNIQUE REFERENCES user(id) ON DELETE CASCADE,
  claimed_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS rate_limits (
  limit_key TEXT PRIMARY KEY NOT NULL,
  window_started_at INTEGER NOT NULL,
  hit_count INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS discord_access_cache (
  discord_user_id TEXT PRIMARY KEY NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'no_role', 'not_in_guild', 'check_failed')),
  checked_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
