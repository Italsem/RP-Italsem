CREATE TABLE IF NOT EXISTS day_sheets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  work_date TEXT NOT NULL,      -- YYYY-MM-DD
  cantiere_code TEXT NOT NULL,
  cantiere_desc TEXT NOT NULL,
  payload TEXT NOT NULL,        -- JSON
  created_by INTEGER NOT NULL,
  updated_at TEXT DEFAULT (datetime('now')),
  UNIQUE(work_date, cantiere_code)
);

CREATE INDEX IF NOT EXISTS idx_day_sheets_date ON day_sheets(work_date);
CREATE INDEX IF NOT EXISTS idx_day_sheets_cant ON day_sheets(cantiere_code);
