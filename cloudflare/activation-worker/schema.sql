CREATE TABLE IF NOT EXISTS devices (
  device_code_hash TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS licenses (
  id TEXT PRIMARY KEY,
  device_code_hash TEXT NOT NULL,
  activation_code_hash TEXT NOT NULL UNIQUE,
  license_token_hash TEXT NOT NULL UNIQUE,
  feature TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  issued_at TEXT NOT NULL,
  last_verified_at TEXT,
  FOREIGN KEY (device_code_hash) REFERENCES devices(device_code_hash)
);

CREATE INDEX IF NOT EXISTS licenses_device_idx ON licenses(device_code_hash, feature, status);
