-- Rollback for 004-add-pun-groans.up.sql.
-- This permanently removes all groan counts and anonymous browser-vote records.

DROP TABLE pun_groans;
