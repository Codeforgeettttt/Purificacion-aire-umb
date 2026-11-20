CREATE TABLE IF NOT EXISTS measurements (
  id INTEGER PRIMARY KEY,
  recorded_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  source TEXT NOT NULL CHECK (source IN ('manual','simulated')),
  pm25 REAL NOT NULL CHECK(pm25 >= 0),
  pm10 REAL NOT NULL CHECK(pm10 >= pm25),
  co2 REAL NOT NULL CHECK(co2 >= 0),
  co REAL NOT NULL CHECK(co >= 0)
);
