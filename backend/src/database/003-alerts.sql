CREATE TABLE IF NOT EXISTS alerts (
  id INTEGER PRIMARY KEY,
  alert_key TEXT NOT NULL UNIQUE,
  measurement_id INTEGER NOT NULL REFERENCES measurements(id),
  session_id INTEGER REFERENCES sessions(id),
  pollutant TEXT,
  severity TEXT NOT NULL CHECK(severity IN ('Alta','Moderada')),
  message TEXT NOT NULL,
  origin TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
