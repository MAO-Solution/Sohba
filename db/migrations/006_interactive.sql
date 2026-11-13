-- Interactive lesson: 'quiz' (افتكر: comprehension check, feeds spaced review)
-- and 'action' (طبّق النهارده: one small practical step).
BEGIN;

ALTER TABLE blocks DROP CONSTRAINT blocks_type_check;
ALTER TABLE blocks ADD CONSTRAINT blocks_type_check CHECK (type IN (
  'heading', 'text', 'egy', 'quran', 'hadith', 'dua',
  'step', 'list', 'tip', 'note', 'map', 'memorize', 'link', 'ticker', 'quiz', 'action'));

INSERT INTO schema_migrations (name) VALUES ('006_interactive');

COMMIT;
