-- Tracks what the reviewer actually approved. The seed compares this hash with content/ on every
-- deploy: unchanged lessons keep their status; an approved/published lesson whose text changed
-- drops back to in_review so the sheikh reviews the new version.
BEGIN;

ALTER TABLE lessons ADD COLUMN content_hash text;

INSERT INTO schema_migrations (name) VALUES ('003_content_hash');

COMMIT;
