-- View: login
-- Introspected DATABASE_URL before writing this: no tables exist yet in this database,
-- so `users` is a genuinely new table, not a duplicate of something another view created.
-- pgcrypto is already enabled at the project level (see tecnologias/tecnologia_bbdd.md).

CREATE TABLE IF NOT EXISTS users (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email                 VARCHAR(255) NOT NULL UNIQUE,
  password_hash         VARCHAR(255) NOT NULL,
  failed_login_attempts INTEGER NOT NULL DEFAULT 0 CHECK (failed_login_attempts >= 0),
  account_locked        BOOLEAN NOT NULL DEFAULT FALSE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Unique constraint on `email` above already creates an implicit btree index, covering the
-- lookup login-button's request needs (find-by-email). No additional index required for
-- this view.
