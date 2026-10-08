-- Run this in D1 Studio using "Run all in transaction".
-- A row represents one anonymous browser groaning at one published pun.

CREATE TABLE pun_groans (
  pun_id INTEGER NOT NULL,
  visitor_token TEXT NOT NULL,
  groaned_on TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (pun_id, visitor_token),
  FOREIGN KEY (pun_id) REFERENCES puns(pun_id)
);
