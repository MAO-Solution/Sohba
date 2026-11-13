-- Chapters inside a track (أجزاء القرآن، فترات السيرة) and computed lesson metadata.
BEGIN;

-- [{"key":"juz-30","title":"جزء عمّ"}, ...] in display order.
ALTER TABLE tracks ADD COLUMN chapters jsonb NOT NULL DEFAULT '[]';

ALTER TABLE lessons ADD COLUMN chapter text;
-- Computed by the seed from the blocks (not reviewed content): {"surah":112,"ayat":4,"words":15}
ALTER TABLE lessons ADD COLUMN meta jsonb NOT NULL DEFAULT '{}';

INSERT INTO schema_migrations (name) VALUES ('007_chapters');

COMMIT;
