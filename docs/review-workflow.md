# Pun-dent review workflow

This guide describes the manual review process for the Department of Puns Cloudflare D1 database. Replace values in angle brackets (for example, `<submission_id>`) before running a statement.

The public website shows only puns that are:

1. approved in `submissions`,
2. promoted into `puns`,
3. active, and
4. assigned at least one topic.

## 1. Add a pun to the review queue

New puns enter the `submissions` table as `pending` automatically.

```sql
INSERT INTO submissions (pun_text, submitted_by)
VALUES (
  'I used to be addicted to soap, but I’m clean now.',
  NULL
);
```

Use a name in place of `NULL` only when the submitter has asked to be credited. To include a single quote in a pun, write it twice: `I''m`.

To intentionally save a line break, concatenate with `CHAR(10)`:

```sql
INSERT INTO submissions (pun_text)
VALUES ('First line' || CHAR(10) || 'Second line');
```

## 2. View the pending queue

```sql
SELECT submission_id, submitted_on, submitted_by, pun_text
FROM submissions
WHERE status = 'pending'
ORDER BY submission_id;
```

## 3. Approve a submission

```sql
UPDATE submissions
SET
  status = 'approved',
  reviewed_on = CURRENT_TIMESTAMP,
  reviewer_note = 'Approved by the Pun-dent'
WHERE submission_id = <submission_id>;
```

Approval records the editorial decision. It does not publish the pun by itself.

## 4. Promote an approved pun

This creates the public-ready `puns` record and retains the source submission for traceability. The public API reads the pun text and optional credit from `submissions`.

```sql
INSERT INTO puns (submission_id)
SELECT submission_id
FROM submissions
WHERE submission_id = <submission_id>
  AND status = 'approved';
```

Each submission can be promoted only once because `submission_id` is unique. If the pun is already promoted, this statement will report a uniqueness error rather than create a duplicate.

## 5. Assign a topic

First see the available topics:

```sql
SELECT topic_id, topic_text
FROM topics
ORDER BY topic_text;
```

Then assign one. A pun may have more than one topic; repeat the statement with a different topic as needed.

```sql
INSERT INTO puns_to_topics (pun_id, topic_id)
SELECT p.pun_id, t.topic_id
FROM puns AS p
JOIN topics AS t
WHERE p.submission_id = <submission_id>
  AND t.topic_text = 'Everyday life';
```

Once a promoted pun has a topic, it becomes visible on the website automatically.

## 6. Decline a submission

Declining preserves the submission and the reason, while keeping it out of the public collection.

```sql
UPDATE submissions
SET
  status = 'declined',
  reviewed_on = CURRENT_TIMESTAMP,
  reviewer_note = 'Not a fit for Department of Puns'
WHERE submission_id = <submission_id>;
```

## 7. Retire a published pun

If a published pun turns out to be too edgy or otherwise unsuitable, leave its records in place but deactivate it:

```sql
UPDATE submissions
SET
  status = 'declined',
  reviewed_on = CURRENT_TIMESTAMP,
  reviewer_note = 'Too edgy for Department of Puns'
WHERE submission_id = <submission_id>;

UPDATE puns
SET is_active = 0
WHERE submission_id = <submission_id>;
```

The public API returns only active puns, so the change appears on the site without a new deployment.

## 8. Review counts

```sql
SELECT status, COUNT(*) AS total
FROM submissions
GROUP BY status;
```
