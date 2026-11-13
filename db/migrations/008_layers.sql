-- Layered lessons (one lesson for kids and adults):
--   guide     the companion (الهدهد) says a short line
--   scene     3-4 symbol panels that tell the story (no people)
--   deep      "انزل أعمق": an optional deeper layer for adults
--   situation a real-life dilemma before a hadith (school / work variants)
--   family    سؤال العيلة: one question for parents to ask their kids
--   tasmee    تسميع: order / complete / listen, generated from the lesson's ayat
BEGIN;

ALTER TABLE blocks DROP CONSTRAINT blocks_type_check;
ALTER TABLE blocks ADD CONSTRAINT blocks_type_check CHECK (type IN (
  'heading', 'text', 'egy', 'quran', 'hadith', 'dua',
  'step', 'list', 'tip', 'note', 'map', 'memorize', 'link', 'ticker', 'quiz', 'action',
  'guide', 'scene', 'deep', 'situation', 'family', 'tasmee'));

INSERT INTO schema_migrations (name) VALUES ('008_layers');

COMMIT;
