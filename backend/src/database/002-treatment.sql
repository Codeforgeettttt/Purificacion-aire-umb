CREATE TABLE IF NOT EXISTS technologies (
  id TEXT PRIMARY KEY, label TEXT NOT NULL, hepa INTEGER NOT NULL, carbon INTEGER NOT NULL, ventilation INTEGER NOT NULL
);
INSERT OR IGNORE INTO technologies VALUES
 ('hepa','HEPA',1,0,0), ('carbon','Carbón activado',0,1,0),
 ('ventilation','Ventilación',0,0,1), ('combined','HEPA + carbón + ventilación',1,1,1);
CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY,
  measurement_id INTEGER NOT NULL REFERENCES measurements(id),
  technology TEXT NOT NULL REFERENCES technologies(id),
  duration INTEGER NOT NULL CHECK(duration BETWEEN 1 AND 120),
  started_at INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'running' CHECK(status IN ('running','stopped','completed')),
  exterior TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS sessions_measurement ON sessions(measurement_id);
CREATE TABLE IF NOT EXISTS samples (
  session_id INTEGER NOT NULL REFERENCES sessions(id),
  minute INTEGER NOT NULL CHECK(minute >= 0),
  pm25 REAL NOT NULL, pm10 REAL NOT NULL, co2 REAL NOT NULL, co REAL NOT NULL,
  PRIMARY KEY(session_id, minute)
);
