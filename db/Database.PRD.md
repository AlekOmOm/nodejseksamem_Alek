# DATABASE.PRD.md
Single-page reference for persistent data in VM-Orchestrator after the “Users in Postgres, operational data in DynamoDB, Postgres cache for Jobs/Logs” decision.

---

## 1. Logical Overview

Frontend ──HTTP──► Node.js / Express  
               ├── users_router   ──► PostgreSQL (users + **jobs/logs cache**)  
               └── api_router     ──► AWS DynamoDB (vms, commands, jobs, logs)

• DynamoDB holds the authoritative copy of VMs, Commands, Jobs, Logs.  
• Postgres keeps GDPR-relevant Users **and** a *short-lived cache* of Jobs & Logs for quick queries / joins.  
• Cache lifetime ≈ 7 days; a cron removes stale rows.

---

## 2. PostgreSQL

```sql
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
  status     TEXT  NOT NULL CHECK (status IN ('running','success','failed')),
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  cached_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_jobs_vm_id ON jobs(vm_id);

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

-- Optional: purge rows older than 7 days (example)
-- CREATE POLICY purge_cache ...
```

Only these three tables live in Postgres.

---

## 3. DynamoDB (authoritative)

| Table | PK | SK | GSIs | TTL attr |
|-------|----|----|------|----------|
| vms       | vmId      | —  | byEnvironment | — |
| commands  | commandId | —  | byVmId        | — |

JobCacheTable removed – Postgres now fulfils that need.

---

## 4. Route Ownership

| Route prefix | Primary store | Notes |
|--------------|---------------|-------|
| /api/users/** | PostgreSQL | GDPR data |
| /api/jobs/**, /api/logs/** | DynamoDB (read-through + write-through to Postgres cache) | |
| others (/api/vms/**, /api/commands/**) | DynamoDB | |

The backend writes every job/log change to DynamoDB and **asynchronously** upserts the Postgres cache.

---

## 5. Dev Setup

1. `docker-compose up postgres`  
2. DynamoDB calls in dev hit AWS  
3. `.env` supplies Postgres vars + AWS creds  
4. A daily cron (make target `make purge-cache`) deletes Postgres rows older than 7 days.

---

This page is the canonical description of persistent data storage.