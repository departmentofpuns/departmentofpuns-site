-- Normalize published puns: text and optional credit remain in submissions.
-- Run the preflight query first. It must return 0 before this migration runs.

SELECT COUNT(*) AS puns_without_submissions
FROM puns
WHERE source_submission_id IS NULL;

-- After confirming the preflight result, run the statements below as one batch.
-- Use the D1 console's /bookmark command first if you would like a restore point.

PRAGMA foreign_keys = OFF;

BEGIN;

CREATE TABLE puns_new (
  pun_id INTEGER PRIMARY KEY,
  submission_id INTEGER NOT NULL UNIQUE,
  published_on TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  is_active INTEGER NOT NULL DEFAULT 1
    CHECK (is_active IN (0, 1)),
  FOREIGN KEY (submission_id)
    REFERENCES submissions(submission_id)
);

INSERT INTO puns_new (pun_id, submission_id, published_on, is_active)
SELECT pun_id, source_submission_id, published_on, is_active
FROM puns;

DROP TABLE puns;
ALTER TABLE puns_new RENAME TO puns;

COMMIT;

PRAGMA foreign_keys = ON;

-- Confirm every publication record points to a submission.
PRAGMA foreign_key_check;
