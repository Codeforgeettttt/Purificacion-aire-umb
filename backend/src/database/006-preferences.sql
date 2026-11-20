CREATE TABLE IF NOT EXISTS preferences (
  id INTEGER PRIMARY KEY CHECK (id=1),
  theme TEXT NOT NULL CHECK (theme IN ('light','dark')),
  defaultDuration INTEGER NOT NULL CHECK (defaultDuration BETWEEN 1 AND 120)
);
