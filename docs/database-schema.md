# Department of Puns database schema

Cloudflare D1 is the application's managed SQLite database. This document describes the schema currently used by the Department of Puns site.

```mermaid
erDiagram
  SUBMISSIONS o|--o| PUNS : "may become"
  PUNS ||--o{ PUNS_TO_TOPICS : "is tagged by"
  TOPICS ||--o{ PUNS_TO_TOPICS : "categorizes"

  SUBMISSIONS {
    INTEGER submission_id PK
    TEXT pun_text
    TEXT submitted_by
    TEXT submitted_on
    TEXT status
    TEXT reviewed_on
    TEXT reviewer_note
  }

  PUNS {
    INTEGER pun_id PK
    INTEGER submission_id FK
    TEXT published_on
    INTEGER is_active
  }

  TOPICS {
    INTEGER topic_id PK
    TEXT topic_text
  }

  PUNS_TO_TOPICS {
    INTEGER pun_id PK, FK
    INTEGER topic_id PK, FK
  }
```

## Review flow

1. A visitor's submission begins in `submissions` with a `pending` status.
2. The Pun-dent changes it to `approved` or `declined`.
3. An approved submission receives a row in `puns`; `submission_id` retains the review trail and determines which text and optional credit are published.
4. One or more entries in `puns_to_topics` determine the topic filters available on the public site.
5. The public API returns only active puns that have at least one topic.

## D1 / SQLite definitions

```sql
CREATE TABLE submissions (
  submission_id INTEGER PRIMARY KEY,
  pun_text TEXT NOT NULL,
  submitted_by TEXT,
  submitted_on TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'declined')),
  reviewed_on TEXT,
  reviewer_note TEXT
);

CREATE TABLE puns (
  pun_id INTEGER PRIMARY KEY,
  submission_id INTEGER NOT NULL UNIQUE,
  published_on TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  is_active INTEGER NOT NULL DEFAULT 1
    CHECK (is_active IN (0, 1)),
  FOREIGN KEY (submission_id)
    REFERENCES submissions(submission_id)
);

CREATE TABLE topics (
  topic_id INTEGER PRIMARY KEY,
  topic_text TEXT NOT NULL COLLATE NOCASE UNIQUE
);

CREATE TABLE puns_to_topics (
  pun_id INTEGER NOT NULL,
  topic_id INTEGER NOT NULL,
  PRIMARY KEY (pun_id, topic_id),
  FOREIGN KEY (pun_id) REFERENCES puns(pun_id),
  FOREIGN KEY (topic_id) REFERENCES topics(topic_id)
);
```

## Not yet implemented

Groans/ratings, the private Pun-dent review page, and email notifications are intentionally not part of the current schema. They will be added through separate, reviewed migrations when those features are built.

The public submission form writes new records to `submissions` with the default `pending` status; it does not require another table. It includes server-side validation, Cloudflare Turnstile validation, and a basic bot trap.
