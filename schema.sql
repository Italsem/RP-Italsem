CREATE TABLE IF NOT EXISTS cantieri (
  codice TEXT PRIMARY KEY,
  descrizione TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS mezzi (
  codice TEXT PRIMARY KEY,
  descrizione TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS dipendenti (
  codice TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  cognome TEXT NOT NULL,
  descrizione TEXT
);

CREATE TABLE IF NOT EXISTS movimenti (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  data TEXT NOT NULL,                -- YYYY-MM-DD
  cantiere_codice TEXT NOT NULL,

  tipo TEXT NOT NULL,                -- OPERAIO | MEZZO | HOTEL
  risorsa_codice TEXT NOT NULL,      -- codice dipendente | codice mezzo | H01/H02
  risorsa_descrizione TEXT NOT NULL, -- nome/cognome | descr mezzo | HOTEL 01/02

  note TEXT,
  ordinario REAL DEFAULT 0,
  notturno REAL DEFAULT 0,
  pioggia REAL DEFAULT 0,
  malattia REAL DEFAULT 0,
  trasferta REAL DEFAULT 0,

  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_mov_data ON movimenti(data);
CREATE INDEX IF NOT EXISTS idx_mov_cantiere ON movimenti(cantiere_codice);
CREATE INDEX IF NOT EXISTS idx_mov_tipo_ris ON movimenti(tipo, risorsa_codice);
