-- Seasons (الجمعة، رمضان، العشر من ذي الحجة...) are data, not code.
-- Each season points at a normal lesson (in an unlisted track), so its text goes through the same
-- shari'a review. The schedule (rule) is evaluated on the client, in the user's local/hijri date.
BEGIN;

-- Unlisted tracks hold season lessons: reachable by link, not shown on the home page.
ALTER TABLE tracks ADD COLUMN is_listed boolean NOT NULL DEFAULT true;

-- 'ticker': short lines for the scrolling bar. Not rendered inside the lesson itself.
ALTER TABLE blocks DROP CONSTRAINT blocks_type_check;
ALTER TABLE blocks ADD CONSTRAINT blocks_type_check CHECK (type IN (
  'heading', 'text', 'egy', 'quran', 'hadith', 'dua',
  'step', 'list', 'tip', 'note', 'map', 'memorize', 'link', 'ticker'));

CREATE TABLE seasons (
  key        text PRIMARY KEY CHECK (key ~ '^[a-z0-9-]+$'),
  lesson_id  int  REFERENCES lessons(id) ON DELETE SET NULL,
  rule       jsonb NOT NULL,   -- {"weekday":5} | {"hijri_month":9,"from":1,"to":30} | {"always":true}
  theme      text CHECK (theme ~ '^[a-z0-9-]+$'),
  sort       int  NOT NULL DEFAULT 0
);

INSERT INTO schema_migrations (name) VALUES ('005_seasons');

COMMIT;
