-- Adds the 'link' block type (external, curated resources for the اسمع track).
BEGIN;

ALTER TABLE blocks DROP CONSTRAINT blocks_type_check;
ALTER TABLE blocks ADD CONSTRAINT blocks_type_check CHECK (type IN (
  'heading', 'text', 'egy', 'quran', 'hadith', 'dua',
  'step', 'list', 'tip', 'note', 'map', 'memorize', 'link'));

INSERT INTO schema_migrations (name) VALUES ('002_link_block');

COMMIT;
