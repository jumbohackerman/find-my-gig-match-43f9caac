# Supabase Schema Plan

> **Status**: Planning only — not yet integrated.  
> **Last updated**: 2026-03-08  
> **Target**: Supabase Postgres + pgvector + RLS + Storage + Realtime

---

## Table of Contents

1. [Design Principles](#design-principles)
2. [Auth Metadata vs DB](#auth-metadata-vs-db)
3. [Enums](#enums)
4. [Tables](#tables)
5. [Indexes](#indexes)
6. [jsonb vs Normalized Decisions](#jsonb-vs-normalized)
7. [Soft Delete Strategy](#soft-delete-strategy)
8. [Ownership Model & RLS](#ownership-model--rls)
9. [pgvector Strategy](#pgvector-strategy)
10. [Flow → Table Map](#flow--table-map)

---

## Design Principles

- **UUID primary keys** everywhere (`gen_random_uuid()`)
- **`created_at` / `updated_at`** on every table (trigger-maintained `updated_at`)
- **No foreign keys to `auth.users`** — reference `user_id uuid` without FK constraint (Supabase best practice)
- **snake_case** column names — domain model mappers convert to camelCase
- **RLS on every table** — no exceptions
- **No CHECK constraints with `now()`** — use validation triggers instead
- Roles stored in a **dedicated `user_roles` table**, never on profiles

---

## Auth Metadata vs DB

| Field | Location | Reason |
|---|---|---|
| `email` | `auth.users` only | Managed by Supabase Auth |
| `role` (initial) | `auth.users.raw_user_meta_data.role` | Set at signup, copied to `profiles.role` by trigger |
| `full_name` | `auth.users.raw_user_meta_data` + `profiles.full_name` | Metadata for quick access, DB for queries |
| `avatar` | `profiles.avatar` only | Not auth-critical |
| Everything else | DB tables | Auth metadata is for auth, not business data |

**Rule**: Auth metadata is write-once at signup. All mutable user data lives in DB tables.

---

## Enums

Defined as Postgres enums for type safety and indexability:

```sql
CREATE TYPE public.app_role AS ENUM ('candidate', 'employer', 'admin');
CREATE TYPE public.seniority_level AS ENUM ('Junior', 'Mid', 'Senior', 'Lead');
CREATE TYPE public.work_mode AS ENUM ('Zdalnie', 'Hybrydowo', 'Stacjonarnie');
CREATE TYPE public.employment_type AS ENUM ('Full-time', 'Contract', 'Part-time');
CREATE TYPE public.job_type AS ENUM ('Full-time', 'Part-time', 'Contract', 'Remote');
CREATE TYPE public.job_status AS ENUM ('active', 'closed', 'draft');
CREATE TYPE public.application_status AS ENUM (
  'applied', 'shortlisted', 'viewed', 'interview',
  'hired', 'not_selected', 'position_closed'
);
CREATE TYPE public.application_source AS ENUM ('candidate', 'ai', 'employer');
CREATE TYPE public.notification_type AS ENUM (
  'status_change', 'new_message', 'shortlisted',
  'interview_scheduled', 'hired'
);
CREATE TYPE public.swipe_direction AS ENUM ('left', 'right', 'save');
CREATE TYPE public.currency AS ENUM ('PLN', 'EUR', 'USD');
CREATE TYPE public.salary_period AS ENUM ('month', 'hour', 'year');
CREATE TYPE public.audit_action AS ENUM (
  'create', 'update', 'delete', 'status_change',
  'login', 'signup', 'password_reset'
);
CREATE TYPE public.company_member_role AS ENUM ('owner', 'admin', 'recruiter', 'viewer');
```

---

## Tables

### 1. `profiles`

Auth-adjacent user profile. Created automatically by `handle_new_user()` trigger.

```
profiles
├── id              uuid        PK  DEFAULT gen_random_uuid()
├── user_id         uuid        NOT NULL  UNIQUE  -- references auth.users.id (no FK)
├── full_name       text        NOT NULL  DEFAULT ''
├── avatar          text        DEFAULT '👤'
├── role            app_role    NOT NULL  -- 'candidate' | 'employer' | 'admin'
├── locale          text        DEFAULT 'pl'
├── timezone        text        DEFAULT 'Europe/Warsaw'
├── onboarded_at    timestamptz -- NULL = not onboarded
├── created_at      timestamptz NOT NULL  DEFAULT now()
└── updated_at      timestamptz NOT NULL  DEFAULT now()
```

**Unique**: `(user_id)`  
**RLS**: Users read/update own row. Employers can read profiles of candidates who applied to their jobs.

---

### 2. `user_roles`

Dedicated roles table for privilege escalation protection. Separated from profiles per security best practice.

```
user_roles
├── id              uuid        PK  DEFAULT gen_random_uuid()
├── user_id         uuid        NOT NULL  -- references auth.users.id (no FK)
├── role            app_role    NOT NULL
├── granted_at      timestamptz NOT NULL  DEFAULT now()
└── granted_by      uuid        -- NULL = system
```

**Unique**: `(user_id, role)`  
**RLS**: Read own roles. Admins can manage all roles.  
**Security definer function**: `has_role(uuid, app_role) → boolean` for RLS policies.

---

### 3. `candidates`

Extended candidate profile data. One row per candidate user.

```
candidates
├── id                  uuid        PK  DEFAULT gen_random_uuid()
├── user_id             uuid        NOT NULL  UNIQUE
├── title               text        NOT NULL  DEFAULT ''
├── location            text        NOT NULL  DEFAULT ''
├── bio                 text        NOT NULL  DEFAULT ''
├── summary             text        NOT NULL  DEFAULT ''
├── skills              text[]      NOT NULL  DEFAULT '{}'
├── seniority           seniority_level  NOT NULL  DEFAULT 'Mid'
├── experience          text        NOT NULL  DEFAULT ''  -- human-readable "5 lat"
├── work_mode           work_mode   NOT NULL  DEFAULT 'Zdalnie'
├── employment_type     employment_type  NOT NULL  DEFAULT 'Full-time'
├── availability        text        NOT NULL  DEFAULT 'Elastycznie'
├── salary_min          integer     NOT NULL  DEFAULT 0  -- PLN, monthly
├── salary_max          integer     NOT NULL  DEFAULT 0
├── salary_currency     currency    NOT NULL  DEFAULT 'PLN'
├── salary_period       salary_period  NOT NULL  DEFAULT 'month'
├── experience_entries  jsonb       NOT NULL  DEFAULT '[]'
├── links               jsonb       NOT NULL  DEFAULT '{}'
├── cv_url              text        -- path in Storage bucket "cvs"
├── last_active         timestamptz NOT NULL  DEFAULT now()
├── embedding           vector(1536) -- pgvector, populated by AI service
├── created_at          timestamptz NOT NULL  DEFAULT now()
└── updated_at          timestamptz NOT NULL  DEFAULT now()
```

**Unique**: `(user_id)`  
**RLS**: Own row CRUD. Employers can SELECT candidates who applied to their jobs.  
**jsonb rationale**: `experience_entries` and `links` are variable-structure, rarely queried independently — jsonb is appropriate.

---

### 4. `employers`

Employer-specific profile data (beyond the base profile).

```
employers
├── id              uuid        PK  DEFAULT gen_random_uuid()
├── user_id         uuid        NOT NULL  UNIQUE
├── company_id      uuid        -- FK → companies.id (NULL if solo employer)
├── position        text        DEFAULT ''  -- e.g. "Head of Talent"
├── phone           text
├── created_at      timestamptz NOT NULL  DEFAULT now()
└── updated_at      timestamptz NOT NULL  DEFAULT now()
```

**Unique**: `(user_id)`  
**RLS**: Own row CRUD. Candidates can read employer profiles for jobs they applied to.

---

### 5. `companies`

Company entities, independent of individual employer users.

```
companies
├── id              uuid        PK  DEFAULT gen_random_uuid()
├── name            text        NOT NULL
├── logo            text        DEFAULT '🏢'
├── website         text
├── description     text        DEFAULT ''
├── industry        text
├── size            text        -- e.g. "50-200"
├── location        text
├── verified        boolean     NOT NULL  DEFAULT false
├── created_at      timestamptz NOT NULL  DEFAULT now()
└── updated_at      timestamptz NOT NULL  DEFAULT now()
```

**Unique**: `(name)` — soft unique, consider `LOWER(name)` index  
**RLS**: Public read for verified companies. Company members can update.

---

### 6. `company_members`

Many-to-many: which employers belong to which companies, with role.

```
company_members
├── id              uuid        PK  DEFAULT gen_random_uuid()
├── company_id      uuid        NOT NULL  FK → companies.id ON DELETE CASCADE
├── user_id         uuid        NOT NULL
├── role            company_member_role  NOT NULL  DEFAULT 'recruiter'
├── invited_by      uuid
├── joined_at       timestamptz NOT NULL  DEFAULT now()
└── removed_at      timestamptz -- soft removal
```

**Unique**: `(company_id, user_id)`  
**RLS**: Members can read own company members. Owners/admins can manage.

---

### 7. `jobs`

```
jobs
├── id              uuid        PK  DEFAULT gen_random_uuid()
├── employer_id     uuid        NOT NULL  -- user who posted
├── company_id      uuid        FK → companies.id  -- optional
├── title           text        NOT NULL
├── company_name    text        NOT NULL  -- denormalized for display
├── logo            text        NOT NULL  DEFAULT '🏢'
├── location        text        NOT NULL
├── salary_display  text        NOT NULL  DEFAULT ''  -- "18 000 zł - 25 000 zł"
├── salary_min      integer     -- structured, nullable
├── salary_max      integer
├── salary_currency currency    DEFAULT 'PLN'
├── salary_period   salary_period  DEFAULT 'month'
├── type            job_type    NOT NULL  DEFAULT 'Full-time'
├── seniority       seniority_level
├── description     text        NOT NULL  DEFAULT ''
├── requirements    text[]      DEFAULT '{}'
├── responsibilities text[]     DEFAULT '{}'
├── benefits        text[]      DEFAULT '{}'
├── tags            text[]      NOT NULL  DEFAULT '{}'
├── status          job_status  NOT NULL  DEFAULT 'draft'
├── published_at    timestamptz -- set when status → active
├── closes_at       timestamptz -- optional expiry
├── apply_url       text        -- external apply link
├── embedding       vector(1536) -- pgvector for semantic job matching
├── created_at      timestamptz NOT NULL  DEFAULT now()
└── updated_at      timestamptz NOT NULL  DEFAULT now()
```

**Indexes**: See [Indexes](#indexes)  
**RLS**: Authenticated users can read active jobs + own draft/closed. Employers CRUD own jobs.  
**Note**: `company_name` is denormalized from `companies.name` for query performance. A trigger keeps it in sync.

---

### 8. `applications`

```
applications
├── id              uuid        PK  DEFAULT gen_random_uuid()
├── job_id          uuid        NOT NULL  FK → jobs.id ON DELETE CASCADE
├── candidate_id    uuid        NOT NULL  -- user_id of the candidate
├── status          application_status  NOT NULL  DEFAULT 'applied'
├── source          application_source  NOT NULL  DEFAULT 'candidate'
├── cover_letter    text
├── match_score     smallint    -- cached 0-100 score from AI
├── match_breakdown jsonb       -- cached ScoreBreakdown
├── applied_at      timestamptz NOT NULL  DEFAULT now()
├── withdrawn_at    timestamptz -- soft withdrawal
├── created_at      timestamptz NOT NULL  DEFAULT now()
└── updated_at      timestamptz NOT NULL  DEFAULT now()
```

**Unique**: `(job_id, candidate_id)` — prevent duplicate applications  
**RLS**: Candidates read/delete own. Employers read/update for their jobs.

---

### 9. `application_events`

Immutable audit trail of every status change on an application.

```
application_events
├── id              uuid        PK  DEFAULT gen_random_uuid()
├── application_id  uuid        NOT NULL  FK → applications.id ON DELETE CASCADE
├── from_status     application_status  -- NULL for initial "applied"
├── to_status       application_status  NOT NULL
├── triggered_by    uuid        NOT NULL  -- user_id who changed it
├── source          application_source  -- 'ai', 'employer', 'candidate'
├── note            text        -- optional recruiter note
├── created_at      timestamptz NOT NULL  DEFAULT now()
```

**RLS**: Readable by application participants. Insert by employers + system.  
**No UPDATE/DELETE** — append-only log.

---

### 10. `saved_jobs`

Candidate bookmarks.

```
saved_jobs
├── id              uuid        PK  DEFAULT gen_random_uuid()
├── user_id         uuid        NOT NULL
├── job_id          uuid        NOT NULL  FK → jobs.id ON DELETE CASCADE
├── created_at      timestamptz NOT NULL  DEFAULT now()
```

**Unique**: `(user_id, job_id)`  
**RLS**: Own rows only.

---

### 11. `swipe_events`

Records every swipe action for analytics and "don't show again" logic.

```
swipe_events
├── id              uuid        PK  DEFAULT gen_random_uuid()
├── user_id         uuid        NOT NULL
├── job_id          uuid        NOT NULL  FK → jobs.id ON DELETE CASCADE
├── direction       swipe_direction  NOT NULL  -- 'left', 'right', 'save'
├── created_at      timestamptz NOT NULL  DEFAULT now()
```

**Index**: `(user_id, job_id)` — for "already swiped" lookups  
**RLS**: Own rows only. Insert-only (no update/delete).

---

### 12. `messages`

```
messages
├── id              uuid        PK  DEFAULT gen_random_uuid()
├── application_id  uuid        NOT NULL  FK → applications.id ON DELETE CASCADE
├── sender_id       uuid        NOT NULL
├── content         text        NOT NULL  DEFAULT ''
├── read_at         timestamptz -- NULL = unread
├── created_at      timestamptz NOT NULL  DEFAULT now()
```

**RLS**: Participants of the application (candidate + employer who owns the job) can read and insert. No update/delete.  
**Realtime**: Enable `supabase_realtime` publication for this table.

---

### 13. `notifications`

```
notifications
├── id              uuid        PK  DEFAULT gen_random_uuid()
├── user_id         uuid        NOT NULL
├── type            notification_type  NOT NULL
├── title           text        NOT NULL
├── body            text        NOT NULL  DEFAULT ''
├── read            boolean     NOT NULL  DEFAULT false
├── reference_id    uuid        -- polymorphic: application_id, job_id, message_id
├── reference_type  text        -- 'application', 'job', 'message'
├── created_at      timestamptz NOT NULL  DEFAULT now()
```

**Index**: `(user_id, read, created_at DESC)` — unread-first queries  
**RLS**: Own rows. Insert by system (SECURITY DEFINER functions).  
**Realtime**: Enable for push notifications.

---

### 14. `candidate_preferences`

Key-value store for user preferences (replaces localStorage).

```
candidate_preferences
├── id              uuid        PK  DEFAULT gen_random_uuid()
├── user_id         uuid        NOT NULL
├── key             text        NOT NULL  -- e.g. 'onboarded', 'theme', 'locale'
├── value           text        NOT NULL
├── updated_at      timestamptz NOT NULL  DEFAULT now()
```

**Unique**: `(user_id, key)`  
**RLS**: Own rows only.

---

### 15. `candidate_resumes`

Track multiple CV uploads per candidate with parsing status.

```
candidate_resumes
├── id              uuid        PK  DEFAULT gen_random_uuid()
├── user_id         uuid        NOT NULL
├── file_path       text        NOT NULL  -- Storage bucket path
├── file_name       text        NOT NULL  -- original filename
├── file_size       integer     -- bytes
├── mime_type       text        DEFAULT 'application/pdf'
├── is_primary      boolean     NOT NULL  DEFAULT false
├── parsed_at       timestamptz -- NULL = not yet parsed
├── parsed_data     jsonb       -- structured output from AI CV parser
├── embedding       vector(1536) -- pgvector embedding of resume content
├── created_at      timestamptz NOT NULL  DEFAULT now()
```

**Index**: `(user_id, is_primary)`  
**RLS**: Own rows. Employers can read resumes of candidates who applied.  
**Storage**: Files live in the `cvs` bucket. `file_path` = `{user_id}/cv-{timestamp}.pdf`.

---

### 16. `job_screening_questions`

Employer-defined screening questions per job.

```
job_screening_questions
├── id              uuid        PK  DEFAULT gen_random_uuid()
├── job_id          uuid        NOT NULL  FK → jobs.id ON DELETE CASCADE
├── question        text        NOT NULL
├── question_type   text        NOT NULL  DEFAULT 'text'  -- 'text', 'yes_no', 'choice'
├── options         jsonb       -- for 'choice' type: ["Option A", "Option B"]
├── required        boolean     NOT NULL  DEFAULT true
├── sort_order      smallint    NOT NULL  DEFAULT 0
├── created_at      timestamptz NOT NULL  DEFAULT now()
```

**RLS**: Public read (active jobs). Employer CRUD for own jobs.

---

### 17. `application_answers`

Candidate answers to screening questions.

```
application_answers
├── id              uuid        PK  DEFAULT gen_random_uuid()
├── application_id  uuid        NOT NULL  FK → applications.id ON DELETE CASCADE
├── question_id     uuid        NOT NULL  FK → job_screening_questions.id ON DELETE CASCADE
├── answer          text        NOT NULL
├── created_at      timestamptz NOT NULL  DEFAULT now()
```

**Unique**: `(application_id, question_id)`  
**RLS**: Candidate can insert own. Employer can read for their jobs.

---

### 18. `audit_logs`

System-wide audit trail for compliance and debugging.

```
audit_logs
├── id              uuid        PK  DEFAULT gen_random_uuid()
├── user_id         uuid        -- NULL for system actions
├── action          audit_action  NOT NULL
├── table_name      text        NOT NULL
├── record_id       uuid
├── old_data        jsonb       -- previous state (for updates)
├── new_data        jsonb       -- new state
├── ip_address      inet
├── user_agent      text
├── created_at      timestamptz NOT NULL  DEFAULT now()
```

**No RLS** — accessible only via SECURITY DEFINER functions or service role.  
**Append-only** — no UPDATE or DELETE policies.  
**Partitioned**: Consider range partitioning by `created_at` monthly if volume is high.

---

## Indexes

```sql
-- profiles
CREATE UNIQUE INDEX idx_profiles_user_id ON profiles (user_id);

-- candidates
CREATE UNIQUE INDEX idx_candidates_user_id ON candidates (user_id);
CREATE INDEX idx_candidates_skills ON candidates USING GIN (skills);
CREATE INDEX idx_candidates_seniority ON candidates (seniority);
CREATE INDEX idx_candidates_location ON candidates (location);
CREATE INDEX idx_candidates_last_active ON candidates (last_active DESC);
-- pgvector (when extension enabled)
-- CREATE INDEX idx_candidates_embedding ON candidates USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- employers
CREATE UNIQUE INDEX idx_employers_user_id ON employers (user_id);

-- companies
CREATE INDEX idx_companies_name_lower ON companies (LOWER(name));

-- company_members
CREATE UNIQUE INDEX idx_company_members_unique ON company_members (company_id, user_id);
CREATE INDEX idx_company_members_user ON company_members (user_id);

-- jobs
CREATE INDEX idx_jobs_employer ON jobs (employer_id);
CREATE INDEX idx_jobs_company ON jobs (company_id);
CREATE INDEX idx_jobs_status ON jobs (status);
CREATE INDEX idx_jobs_status_published ON jobs (status, published_at DESC) WHERE status = 'active';
CREATE INDEX idx_jobs_tags ON jobs USING GIN (tags);
CREATE INDEX idx_jobs_location ON jobs (location);
CREATE INDEX idx_jobs_type ON jobs (type);
CREATE INDEX idx_jobs_salary ON jobs (salary_min, salary_max) WHERE salary_min IS NOT NULL;
-- pgvector
-- CREATE INDEX idx_jobs_embedding ON jobs USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- applications
CREATE UNIQUE INDEX idx_applications_unique ON applications (job_id, candidate_id);
CREATE INDEX idx_applications_candidate ON applications (candidate_id);
CREATE INDEX idx_applications_job_status ON applications (job_id, status);
CREATE INDEX idx_applications_applied ON applications (applied_at DESC);

-- application_events
CREATE INDEX idx_app_events_application ON application_events (application_id, created_at);

-- saved_jobs
CREATE UNIQUE INDEX idx_saved_jobs_unique ON saved_jobs (user_id, job_id);

-- swipe_events
CREATE INDEX idx_swipe_events_user_job ON swipe_events (user_id, job_id);
CREATE INDEX idx_swipe_events_analytics ON swipe_events (job_id, direction, created_at);

-- messages
CREATE INDEX idx_messages_application ON messages (application_id, created_at);

-- notifications
CREATE INDEX idx_notifications_user_unread ON notifications (user_id, read, created_at DESC);

-- candidate_preferences
CREATE UNIQUE INDEX idx_preferences_unique ON candidate_preferences (user_id, key);

-- candidate_resumes
CREATE INDEX idx_resumes_user ON candidate_resumes (user_id);
CREATE INDEX idx_resumes_primary ON candidate_resumes (user_id) WHERE is_primary = true;

-- job_screening_questions
CREATE INDEX idx_screening_job ON job_screening_questions (job_id, sort_order);

-- application_answers
CREATE UNIQUE INDEX idx_answers_unique ON application_answers (application_id, question_id);

-- audit_logs
CREATE INDEX idx_audit_user ON audit_logs (user_id, created_at DESC);
CREATE INDEX idx_audit_table ON audit_logs (table_name, record_id);
CREATE INDEX idx_audit_created ON audit_logs (created_at DESC);
```

---

## jsonb vs Normalized

| Field | Storage | Rationale |
|---|---|---|
| `candidates.experience_entries` | **jsonb** | Variable structure (0-N entries with bullets), rarely queried independently, always loaded as a whole |
| `candidates.links` | **jsonb** | Key-value bag (portfolio, github, etc.), schema may grow |
| `candidate_resumes.parsed_data` | **jsonb** | AI parser output, schema may vary between parser versions |
| `applications.match_breakdown` | **jsonb** | Cached scoring object, read-only, never queried by subfield |
| `job_screening_questions.options` | **jsonb** | Array of choice options, only relevant for 'choice' type |
| `audit_logs.old_data / new_data` | **jsonb** | Arbitrary table snapshots |
| `jobs.requirements / responsibilities / benefits` | **text[]** | Simple ordered lists — Postgres arrays are simpler than jsonb here |
| `candidates.skills` | **text[]** | Needs GIN index for containment queries (`@>`) |

---

## Soft Delete Strategy

| Table | Strategy | Field |
|---|---|---|
| `profiles` | **Hard delete** via cascade from auth.users | — |
| `candidates` | **Hard delete** (cascade from auth) | — |
| `employers` | **Hard delete** (cascade from auth) | — |
| `companies` | **Soft delete** | `deleted_at timestamptz` (add when needed) |
| `company_members` | **Soft removal** | `removed_at` |
| `jobs` | **Soft close** | `status = 'closed'` — never deleted, for audit trail |
| `applications` | **Soft withdrawal** | `withdrawn_at` — keep for analytics |
| `application_events` | **Never deleted** | Immutable audit trail |
| `messages` | **Never deleted** | Compliance requirement |
| `notifications` | **Hard delete** after 90 days (cron) | — |
| `saved_jobs` | **Hard delete** on unsave | — |
| `swipe_events` | **Never deleted** | Analytics data |
| `audit_logs` | **Partition + archive** | Move old partitions to cold storage |

---

## Ownership Model & RLS

### Core principle

Every table with user data has a `user_id` or ownership chain back to a user. RLS policies enforce:

1. **Candidates** see only their own data
2. **Employers** see their own data + applications/candidates for their jobs
3. **Admins** have full access via `has_role(auth.uid(), 'admin')`

### Ownership chains

```
auth.users
  └── profiles (user_id)
  └── user_roles (user_id)
  └── candidates (user_id)
  └── employers (user_id)
        └── company_members (user_id → company_id)
              └── companies (via company_members)
  └── jobs (employer_id)
        └── job_screening_questions (job_id)
        └── applications (job_id)
              └── application_events (application_id)
              └── application_answers (application_id)
              └── messages (application_id)
  └── applications (candidate_id)
  └── saved_jobs (user_id)
  └── swipe_events (user_id)
  └── notifications (user_id)
  └── candidate_preferences (user_id)
  └── candidate_resumes (user_id)
```

### Key RLS patterns

```sql
-- Self-access: user sees own rows
USING (user_id = auth.uid())

-- Employer sees candidates who applied to their jobs
USING (
  user_id IN (
    SELECT a.candidate_id FROM applications a
    JOIN jobs j ON a.job_id = j.id
    WHERE j.employer_id = auth.uid()
  )
)

-- Admin bypass (via security definer function)
USING (has_role(auth.uid(), 'admin'))

-- Application participants (messages, events)
USING (
  application_id IN (
    SELECT id FROM applications WHERE candidate_id = auth.uid()
    UNION
    SELECT a.id FROM applications a JOIN jobs j ON a.job_id = j.id
    WHERE j.employer_id = auth.uid()
  )
)
```

---

## pgvector Strategy

### Extension

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### Embedding fields

| Table | Column | Dimensions | Source |
|---|---|---|---|
| `candidates` | `embedding` | 1536 | Generated from skills + bio + summary + experience via OpenAI `text-embedding-3-small` |
| `candidate_resumes` | `embedding` | 1536 | Generated from parsed CV text |
| `jobs` | `embedding` | 1536 | Generated from title + description + requirements + tags |

### Matching flow

1. When a candidate profile is updated → edge function regenerates `candidates.embedding`
2. When a job is published → edge function regenerates `jobs.embedding`
3. **Candidate → Job match**: `SELECT * FROM jobs WHERE status = 'active' ORDER BY embedding <=> $candidate_embedding LIMIT 20`
4. **Job → Candidate match**: `SELECT * FROM candidates ORDER BY embedding <=> $job_embedding LIMIT 20`
5. Match scores combine vector similarity (semantic) + rule-based scoring (skills, salary, location) into final `match_score`

### Index strategy

Use `ivfflat` for initial deployment (faster to build), migrate to `hnsw` when data grows:

```sql
-- Phase 1: ivfflat (up to ~100k rows)
CREATE INDEX idx_candidates_embedding ON candidates
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Phase 2: hnsw (100k+ rows, better recall)
CREATE INDEX idx_candidates_embedding ON candidates
  USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64);
```

---

## Flow → Table Map

### Candidate flows

| Flow | Read | Write |
|---|---|---|
| Sign up | — | `profiles`, `candidates`, `user_roles` (via trigger) |
| Onboarding | `candidate_preferences` | `candidates`, `candidate_preferences` |
| Browse jobs (swipe) | `jobs`, `swipe_events`, `saved_jobs` | `swipe_events` |
| Save job | `saved_jobs` | `saved_jobs` |
| Apply to job | `jobs`, `applications` | `applications`, `application_events`, `application_answers` |
| View own applications | `applications`, `jobs`, `application_events` | — |
| Upload CV | `candidate_resumes` | `candidate_resumes` (+ Storage bucket) |
| Edit profile | `candidates`, `profiles` | `candidates`, `profiles` |
| View notifications | `notifications` | `notifications` (mark read) |
| Chat with employer | `messages`, `applications` | `messages` |

### Employer flows

| Flow | Read | Write |
|---|---|---|
| Sign up | — | `profiles`, `employers`, `user_roles` (via trigger) |
| Create company | — | `companies`, `company_members` |
| Post job | `companies` | `jobs`, `job_screening_questions` |
| View applications | `applications`, `candidates`, `profiles`, `application_events` | — |
| AI shortlist | `applications`, `candidates`, `jobs` | `applications` (status), `application_events` |
| Manual shortlist | `applications` | `applications` (status), `application_events` |
| Advance candidate | `applications` | `applications` (status), `application_events` |
| Chat with candidate | `messages`, `applications` | `messages` |
| View notifications | `notifications` | `notifications` (mark read) |
| Browse talent pool | `candidates`, `profiles` | — |

### System / Edge Function flows

| Flow | Read | Write |
|---|---|---|
| Generate embeddings | `candidates`, `jobs`, `candidate_resumes` | `candidates.embedding`, `jobs.embedding`, `candidate_resumes.embedding` |
| Parse CV | `candidate_resumes` (Storage) | `candidate_resumes.parsed_data`, `candidate_resumes.parsed_at` |
| AI match scoring | `candidates`, `jobs` | `applications.match_score`, `applications.match_breakdown` |
| Send notification | `applications`, `profiles` | `notifications` |
| Audit logging | — | `audit_logs` |
| Cleanup old notifications | `notifications` | `notifications` (DELETE) |

---

## Migration from current schema

The current production schema has 5 tables: `profiles`, `candidates`, `jobs`, `applications`, `messages`. The plan adds 13 new tables. Migration order:

1. **Phase 1** (no breaking changes): Add `user_roles`, `saved_jobs`, `swipe_events`, `candidate_preferences`, `notifications`
2. **Phase 2** (schema additions): Add `employers`, `companies`, `company_members`, `candidate_resumes`, `audit_logs`
3. **Phase 3** (schema additions): Add `job_screening_questions`, `application_answers`, `application_events`
4. **Phase 4** (pgvector): Enable extension, add `embedding` columns, create indexes, deploy edge functions
5. **Phase 5** (structured salary): Add `salary_min`, `salary_max`, `salary_currency`, `salary_period` to `jobs`; backfill from `salary_display`

Each phase is a standalone migration. No phase requires downtime. Existing RLS policies remain compatible.
