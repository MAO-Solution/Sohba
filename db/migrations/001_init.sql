-- Sohba (صحبة) — initial schema
-- One engine: tracks -> lessons -> blocks. A new track is data, not code.

BEGIN;

CREATE TABLE IF NOT EXISTS schema_migrations (
  name        text PRIMARY KEY,
  applied_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TYPE lesson_status AS ENUM ('draft', 'in_review', 'approved', 'published');

CREATE TABLE tracks (
  id            serial PRIMARY KEY,
  slug          text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9-]+$'),
  title         text NOT NULL,
  subtitle      text,
  sort          int  NOT NULL DEFAULT 0,
  is_available  boolean NOT NULL DEFAULT false,   -- false = shown as "قريباً"
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Every ayah / hadith / ruling must point to a source.
CREATE TABLE sources (
  id     serial PRIMARY KEY,
  key    text NOT NULL UNIQUE CHECK (key ~ '^[a-z0-9-]+$'),
  kind   text NOT NULL CHECK (kind IN ('quran', 'hadith', 'book', 'url')),
  title  text NOT NULL,
  ref    text,
  url    text
);

CREATE TABLE lessons (
  id           serial PRIMARY KEY,
  track_id     int  NOT NULL REFERENCES tracks(id) ON DELETE RESTRICT,
  slug         text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9-]+$'),
  title        text NOT NULL,
  summary      text,
  sort         int  NOT NULL DEFAULT 0,
  status       lesson_status NOT NULL DEFAULT 'draft',
  reviewed_by  text,
  reviewed_at  timestamptz,
  updated_at   timestamptz NOT NULL DEFAULT now(),
  -- nothing reaches "approved"/"published" without a named reviewer
  CONSTRAINT reviewed_before_publish CHECK (
    status IN ('draft', 'in_review') OR (reviewed_by IS NOT NULL AND reviewed_at IS NOT NULL)
  )
);
CREATE INDEX lessons_track_sort_idx ON lessons (track_id, sort);

CREATE TABLE blocks (
  id         serial PRIMARY KEY,
  lesson_id  int  NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  sort       int  NOT NULL,
  type       text NOT NULL CHECK (type IN (
               'heading', 'text', 'egy', 'quran', 'hadith', 'dua',
               'step', 'list', 'tip', 'note', 'map', 'memorize')),
  content    jsonb NOT NULL,
  source_id  int REFERENCES sources(id) ON DELETE RESTRICT,
  CONSTRAINT sourced_religious_text CHECK (
    type NOT IN ('quran', 'hadith', 'dua') OR source_id IS NOT NULL
  ),
  UNIQUE (lesson_id, sort)
);

-- Optional accounts (phase 2). Anonymous users keep progress on-device.
CREATE TABLE users (
  id             serial PRIMARY KEY,
  email          text NOT NULL,
  name           text,
  password_hash  text NOT NULL,
  created_at     timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX users_email_lower_idx ON users (lower(email));

-- Spaced repetition. Upsert with ON CONFLICT (user_id, lesson_id) to stay race-safe.
CREATE TABLE progress (
  user_id     int NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_id   int NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  step        smallint NOT NULL DEFAULT 0 CHECK (step BETWEEN 0 AND 5),
  due_at      timestamptz,
  updated_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, lesson_id)
);
CREATE INDEX progress_due_idx ON progress (user_id, due_at);

INSERT INTO schema_migrations (name) VALUES ('001_init');

COMMIT;
