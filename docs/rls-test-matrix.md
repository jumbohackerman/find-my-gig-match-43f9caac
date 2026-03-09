# RLS Test Matrix

This document provides a concrete, test-ready matrix for verifying Row Level Security (RLS) policies on the live Supabase environment. It defines the exact expected outcomes (data returned, empty results, or explicit errors) for various actor-entity interactions.

## Expected Behaviors in Supabase (PostgREST)
- **SELECT**: When RLS denies access, Supabase returns an **empty array `[]`** (or `null` for `.single()`), NOT a 403 error. 
- **INSERT/UPDATE/DELETE**: When RLS denies access, Supabase returns a **403 / 401 Permission Denied** error (often PGRST116 or 42501).

---

## 1. Jobs Table

| Actor | Action | Target Data | Expected Outcome |
| :--- | :--- | :--- | :--- |
| Guest (No Auth) | `SELECT` | Active Jobs | Empty Result `[]` (If walled garden enforced) |
| Candidate | `SELECT` | Active Jobs | Returns Rows ✅ |
| Candidate | `SELECT` | Hidden/Draft Jobs | Empty Result `[]` |
| Candidate | `INSERT` / `UPDATE` | Any Job | Explicit Error ❌ (403) |
| Employer A | `SELECT` | Own Jobs (All statuses) | Returns Rows ✅ |
| Employer A | `SELECT` | Employer B's Active Jobs | Returns Rows ✅ |
| Employer A | `SELECT` | Employer B's Hidden Jobs | Empty Result `[]` |
| Employer A | `UPDATE` | Own Jobs | Success ✅ |
| Employer A | `UPDATE` | Employer B's Jobs | Explicit Error ❌ (403) |

## 2. Applications Table

| Actor | Action | Target Data | Expected Outcome |
| :--- | :--- | :--- | :--- |
| Candidate A | `SELECT` | Own Applications | Returns Rows ✅ |
| Candidate A | `SELECT` | Candidate B's Applications| Empty Result `[]` |
| Candidate A | `UPDATE` | Own Application Status | Explicit Error ❌ (403) |
| Candidate A | `DELETE` | Own Application | Success ✅ (Withdraw) |
| Employer A | `SELECT` | Apps to Own Jobs | Returns Rows ✅ |
| Employer A | `SELECT` | Apps to Employer B's Jobs | Empty Result `[]` |
| Employer A | `UPDATE` | Apps to Own Jobs | Success ✅ |
| Employer A | `UPDATE` | Apps to Employer B's Jobs | Explicit Error ❌ (403) |

## 3. Profiles & Candidate Profiles

| Actor | Action | Target Data | Expected Outcome |
| :--- | :--- | :--- | :--- |
| Candidate A | `SELECT` | Own Profile | Returns Row ✅ |
| Candidate A | `SELECT` | Candidate B's Profile | Empty Result `[]` |
| Candidate A | `UPDATE` | Own Profile | Success ✅ |
| Candidate A | `UPDATE` | Candidate B's Profile | Explicit Error ❌ (403) |
| Employer A | `SELECT` | Profiles of their Applicants| Returns Rows ✅ |
| Employer A | `SELECT` | Profiles of non-applicants | Empty Result `[]` |
| Employer A | `SELECT` | Employer B's Applicants | Empty Result `[]` |

## 4. Messages Table

| Actor | Action | Target Data | Expected Outcome |
| :--- | :--- | :--- | :--- |
| Candidate A | `SELECT` | Messages in Own Apps | Returns Rows ✅ |
| Candidate A | `SELECT` | Messages in Other Apps | Empty Result `[]` |
| Candidate A | `INSERT` | Message in Own App | Success ✅ |
| Candidate A | `INSERT` | Message in Other App | Explicit Error ❌ (403) |
| Employer A | `SELECT` | Messages in Own Jobs' Apps| Returns Rows ✅ |
| Employer A | `SELECT` | Messages in Employer B's Apps| Empty Result `[]` |
| Employer A | `INSERT` | Message in Own Jobs' Apps | Success ✅ |

## 5. Storage (CVs / `cvs` bucket)

| Actor | Action | Target File Path | Expected Outcome |
| :--- | :--- | :--- | :--- |
| Candidate A | Download | `cvs/Candidate_A/file.pdf` | Success ✅ |
| Candidate A | Download | `cvs/Candidate_B/file.pdf` | Explicit Error ❌ (Storage 403) |
| Candidate A | Upload | `cvs/Candidate_A/new.pdf` | Success ✅ |
| Candidate A | Upload | `cvs/Candidate_B/new.pdf` | Explicit Error ❌ (Storage 403) |
| Employer A | Download | `cvs/Applicant_A/file.pdf` | Success ✅ (If A applied to Emp A) |
| Employer A | Download | `cvs/Non_Applicant/file.pdf`| Explicit Error ❌ (Storage 403) |

## 6. Reports & Audit Logs

| Actor | Action | Target Data | Expected Outcome |
| :--- | :--- | :--- | :--- |
| Any User | `SELECT` | Own Reports | Returns Rows ✅ |
| Any User | `SELECT` | Other Users' Reports | Empty Result `[]` |
| Any User | `SELECT` | Own Audit Logs | Returns Rows ✅ |
| Any User | `SELECT` | Other Users' Audit Logs | Empty Result `[]` |
| Moderator | `SELECT` | All Reports / Audit Logs | Returns Rows ✅ |

## 7. Company Scope (Future Expansion)

Once `company_members` is implemented, test scenarios should verify:
- **Recruiter A (Company X)** `SELECT` Jobs of Company X -> Returns Rows.
- **Recruiter A (Company X)** `SELECT` Apps of Company X -> Returns Rows.
- **Recruiter A (Company X)** `UPDATE` Apps of Company Y -> Explicit Error (403).
- **Viewer A (Company X)** `UPDATE` Apps of Company X -> Explicit Error (403).

---

## High-Risk Scenarios to Validate First

1. **Cross-Employer Data Leakage:** Ensure Employer A querying `SELECT * FROM applications` only receives rows related to their own `jobs.id`. Receiving another employer's applications is a critical PII breach.
2. **CV Bucket Enumeration:** Ensure Candidate A cannot write a script to download `cvs/{uuid}/resume.pdf` sequentially. The storage policy must reject non-owners and non-applied employers.
3. **Application Forgery:** Ensure Candidate A cannot run `INSERT INTO applications (candidate_id, ...)` using Candidate B's UUID.
4. **Message Interception:** Ensure a candidate cannot read the `messages` table for `application_id`s they do not own.