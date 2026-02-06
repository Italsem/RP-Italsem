-- 1) aggiungo nome/cognome su users
ALTER TABLE users ADD COLUMN first_name TEXT;
ALTER TABLE users ADD COLUMN last_name TEXT;

-- 2) tabella rapportini (salviamo payload JSON per v1)
CREATE TABLE IF NOT EXISTS rapportini (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  month TEXT NOT NULL,              -- es "2026-02"
  created_by INTEGER NOT NULL,
  payload TEXT NOT NULL,            -- JSON
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY(created_by) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_rapportini_month ON rapportini(month);
CREATE INDEX IF NOT EXISTS idx_rapportini_created_by ON rapportini(created_by);

-- 3) set admin name/surname (Luca Franceschetti) se admin esiste
UPDATE users
SET first_name='Luca', last_name='Franceschetti'
WHERE username='admin';
