-- 'sequence' (رتّب الخطوات): put steps in order (الوضوء، الركعة، الصلوات، الأركان…).
BEGIN;

ALTER TABLE blocks DROP CONSTRAINT blocks_type_check;
ALTER TABLE blocks ADD CONSTRAINT blocks_type_check CHECK (type IN (
  'heading', 'text', 'egy', 'quran', 'hadith', 'dua',
  'step', 'list', 'tip', 'note', 'map', 'memorize', 'link', 'ticker', 'quiz', 'action',
  'guide', 'scene', 'deep', 'situation', 'family', 'tasmee', 'sequence'));

INSERT INTO schema_migrations (name) VALUES ('009_sequence');

COMMIT;
