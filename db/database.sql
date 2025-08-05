CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users (GDPR-sensitive)
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL CHECK (role IN ('admin','dev','viewer')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_users_email ON users(email);

-- Jobs (cache)
CREATE TABLE jobs (
  id         UUID PRIMARY KEY,
  vm_id      TEXT  NOT NULL,           -- mirrors DynamoDB vmId
  command    TEXT  NOT NULL,
  type       TEXT  NOT NULL,           -- execution type (ssh, stream, terminal)
  status     TEXT  NOT NULL CHECK (status IN ('running','success','failed')),
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  exit_code  INTEGER,                  -- process exit code
  cached_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_jobs_vm_id ON jobs(vm_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_type ON jobs(type);

-- Job logs (cache)
CREATE TABLE job_logs (
  job_id    UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  ts        TIMESTAMPTZ NOT NULL,
  stream    TEXT NOT NULL CHECK (stream IN ('stdout','stderr')),
  data      TEXT NOT NULL,
  cached_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (job_id, ts)
);
CREATE INDEX idx_job_logs_job_ts ON job_logs(job_id, ts);
