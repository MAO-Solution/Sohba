-- Admin & shari'a review workflow.
BEGIN;

-- Staff roles. NULL = regular (future) user account.
--   reviewer: the sheikh. The only role that can approve or send a lesson back.
--   admin:    submits lessons for review, publishes approved ones.
ALTER TABLE users ADD COLUMN role text CHECK (role IN ('admin', 'reviewer'));

-- Audit trail: who moved which lesson, from what to what, on which exact content.
CREATE TABLE lesson_reviews (
  id            serial PRIMARY KEY,
  lesson_id     int  NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  user_id       int  REFERENCES users(id) ON DELETE SET NULL,   -- NULL = system (seed)
  action        text NOT NULL CHECK (action IN
                  ('submit', 'approve', 'request_changes', 'publish', 'unpublish', 'content_changed')),
  from_status   lesson_status NOT NULL,
  to_status     lesson_status NOT NULL,
  content_hash  text,
  note          text CHECK (char_length(note) <= 2000),
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX lesson_reviews_lesson_idx ON lesson_reviews (lesson_id, created_at DESC);

-- Failed logins, for brute-force throttling that works across serverless instances.
CREATE TABLE auth_failures (
  key  text NOT NULL,                       -- 'ip:<addr>' or 'email:<lower(email)>'
  at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX auth_failures_key_at_idx ON auth_failures (key, at);

INSERT INTO schema_migrations (name) VALUES ('004_admin');

COMMIT;
