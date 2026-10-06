-- Run this in D1 Studio using "Run all in transaction".
-- One row is created when the public API first chooses a pun for a calendar day.

CREATE TABLE daily_pun_selections (
  selection_date TEXT PRIMARY KEY
    CHECK (selection_date GLOB '????-??-??'),
  pun_id INTEGER NOT NULL,
  cycle_number INTEGER NOT NULL CHECK (cycle_number > 0),
  selected_on TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (pun_id) REFERENCES puns(pun_id),
  UNIQUE (cycle_number, pun_id)
);
