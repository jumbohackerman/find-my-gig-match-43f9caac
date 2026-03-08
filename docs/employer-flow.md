# Employer-Side Flow Documentation

> Maps each employer action to its service layer, repository calls, and future DB operations.

## Architecture

```
Employer.tsx (UI shell)
  └── useEmployerDashboardData()    → fetches jobs + enriched applications
  └── useEmployerJobs()             → job CRUD via getProvider("jobs")
  └── useEmployerShortlist()        → shortlist logic via getProvider("applications")
  └── useEmployerApplications()     → status transitions via getProvider("applications")
  └── useEmployerMessages()         → chat via getProvider("messages")
```

## Flow → Repository Mapping

### 1. Create Job
| Step | Layer | Call |
|------|-------|------|
| Submit form | `useEmployerJobs.createJob()` | `getProvider("jobs").create(form)` |
| Refresh list | `useEmployerDashboardData.refetch()` | Re-fetches jobs + apps |

**Future DB**: `INSERT INTO jobs (...) VALUES (...) WHERE employer_id = auth.uid()`

### 2. Delete Job
| Step | Layer | Call |
|------|-------|------|
| Click delete | `useEmployerJobs.deleteJob(id)` | `getProvider("jobs").delete(id)` |
| Refresh | `refetch()` | |

**Future DB**: `DELETE FROM jobs WHERE id = $1 AND employer_id = auth.uid()`

### 3. Archive Job (future)
| Step | Layer | Call |
|------|-------|------|
| Click archive | `useEmployerJobs.archiveJob(id)` | `getProvider("jobs").update(id, { status: "closed" })` |
| Notify candidates | Edge function | `UPDATE applications SET status = 'position_closed'` |

### 4. Browse Applicants
| Step | Layer | Call |
|------|-------|------|
| Load dashboard | `useEmployerDashboardData()` | Fetches jobs → applications → candidates → profiles |
| Group by job | `applicationsByJob` (useMemo) | Client-side grouping |
| Sort by match | Auto-sort | `apps.sort((a,b) => b.matchResult.score - a.matchResult.score)` |

**Future DB**: `SELECT * FROM applications JOIN candidates ON ... WHERE job_id IN (employer's jobs)`

### 5. Shortlist Applicants
| Step | Layer | Call |
|------|-------|------|
| Manual pick | `useEmployerShortlist.shortlistCandidate()` | `getProvider("applications").updateStatus(id, "shortlisted", "employer")` |
| AI shortlist | `useEmployerShortlist.generateShortlist()` | Ranks by match score, batch-updates top N |
| Replace on full | `useEmployerShortlist.replaceShortlisted()` | Reverts old → shortlists new |

**Business rules**:
- Max 5 shortlisted per job
- Sources tracked: `"candidate"`, `"ai"`, `"employer"`
- Replace flow triggers when shortlist is full

**Future DB**: `UPDATE applications SET status = 'shortlisted', source = $source WHERE id = $id`

### 6. Update Application Status
| Step | Layer | Call |
|------|-------|------|
| Advance status | `useEmployerApplications.advanceStatus()` | `getProvider("applications").updateStatus(id, newStatus)` |
| Auto-view on open | `viewCandidate()` | Advances `"applied"` → `"viewed"` |

**Pipeline**: applied → shortlisted → viewed → interview → {hired, not_selected, position_closed}

### 7. Message Candidates
| Step | Layer | Call |
|------|-------|------|
| Unlock chat | `useEmployerMessages.unlockChat(appId)` | Local state toggle |
| Send message | `useEmployerMessages.sendMessage(appId, content)` | `getProvider("messages").send(appId, employerId, content)` |
| Load history | `useEmployerMessages.loadMessages(appId)` | `getProvider("messages").listByApplication(appId)` |

**Business rule**: Employer-led — chat unlocks only when employer sends first message.

**Future DB**: `INSERT INTO messages (application_id, sender_id, content) VALUES (...)`

### 8. Review Candidate Profiles
| Step | Layer | Call |
|------|-------|------|
| Click candidate | `viewCandidate(app)` | Returns domain `Candidate` with fallback |
| Open modal | `CandidateProfileModal` | Pure UI, receives `Candidate` + `MatchResult` |

### 9. Talent Search (future)
| Step | Layer | Call |
|------|-------|------|
| Search candidates | `useCandidates(filters)` | `getProvider("candidates").list(filters)` |
| Swipe pick | `EmployerCandidateSwipe` | `getProvider("applications").apply(jobId, candidateId, "employer")` |

## Company-Based Ownership (future)

Current: `employer_id` on jobs table references the individual user.

Future: Jobs belong to a `company`. Access controlled by `company_members` table.

```
companies
  └── company_members (user_id, company_id, role)

jobs.company_id → companies.id

RLS: is_company_member(auth.uid(), jobs.company_id, ['owner','admin','recruiter'])
```

All employer hooks accept `employerId` as a parameter — this can be swapped to `companyId` without changing the UI layer.

## Provider Registry Integration

All employer hooks use `getProvider()`:

| Provider Key | Used By | Current Implementation |
|-------------|---------|----------------------|
| `"jobs"` | `useEmployerJobs` | `mockJobRepository` (create/delete) |
| `"applications"` | `useEmployerShortlist`, `useEmployerApplications` | `mockApplicationRepository` |
| `"messages"` | `useEmployerMessages` | `mockMessageRepository` |
| `"candidates"` | `useCandidates` (talent search) | `mockCandidateRepository` |

**Note**: `useEmployerDashboardData` still uses direct Supabase calls for enrichment queries (joins across jobs, applications, candidates, profiles). This will be migrated to a dedicated `listForEmployer()` repository method that returns `EnrichedEmployerApplication[]` natively.

## Files

| File | Purpose |
|------|---------|
| `src/hooks/useEmployerDashboard.ts` | Data fetching + enrichment + realtime |
| `src/hooks/useEmployerJobs.ts` | Job CRUD |
| `src/hooks/useEmployerShortlist.ts` | Shortlist business logic |
| `src/hooks/useEmployerApplications.ts` | Status transitions + display helpers |
| `src/hooks/useEmployerMessages.ts` | Chat state + message repo calls |
| `src/pages/Employer.tsx` | Thin UI shell — no business logic |
| `src/components/employer/*` | Pure presentational components |
