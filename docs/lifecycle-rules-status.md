# Entity Lifecycle Rules

## Design Principle

**Soft-delete by default.** Entities are status-flagged, not hard-deleted, unless they have no audit/legal value. This preserves referential integrity, supports moderation, and aligns with GDPR "right to erasure" (which allows anonymization over deletion).

## Entity Rules

### Jobs

| Action | Behavior | Status field | Notes |
|---|---|---|---|
| Create | Insert with `status = 'active'` | `jobs.status` | — |
| Hide (employer) | `status → 'hidden'` via `hide_job` RPC | `jobs.status` | Audit logged; reversible |
| Unhide | `status → 'active'` via `unhide_job` RPC | `jobs.status` | Audit logged |
| Close | `status → 'closed'` (future) | `jobs.status` | Not yet implemented; distinct from hidden |
| **Delete** | Hard delete via RLS (`employer_id = auth.uid()`) | — | ⚠️ Currently allowed; **should be changed to soft-delete** once `closed` status is live |

**Recommendation:** Remove hard-delete RLS policy and replace with `status → 'archived'` to preserve application history.

### Applications

| Action | Behavior | Notes |
|---|---|---|
| Apply | Insert with `status = 'applied'` | Via `apply_to_job` RPC (idempotent) |
| Status change | Update `status` field through pipeline | `applied → shortlisted → interview → hired / not_selected / position_closed` |
| Withdraw | Hard delete via RLS | ⚠️ Loses history; **should be changed to `status → 'withdrawn'`** |

**Recommendation:** Add `withdrawn` to `ApplicationStatus` union and update RLS from DELETE to UPDATE.

### Messages

| Action | Behavior | Notes |
|---|---|---|
| Send | Insert | Immutable — no UPDATE/DELETE RLS |
| **Delete** | Not allowed | ✅ Correct — messages are append-only |

**Status:** ✅ Already correct. No changes needed.

### Reports

| Action | Behavior | Notes |
|---|---|---|
| Submit | Insert with `status = 'pending'` | — |
| Review | `status → 'reviewed' / 'dismissed' / 'actioned'` | Future admin action |
| **Delete** | Not allowed | ✅ Correct — reports must be preserved for audit |

**Status:** ✅ Already correct.

### Audit Log

| Action | Behavior | Notes |
|---|---|---|
| Log | Insert only | Append-only by design |
| **Delete/Update** | Not allowed | ✅ Correct — audit trail must be immutable |

**Status:** ✅ Already correct.

### Profiles

| Action | Behavior | Notes |
|---|---|---|
| Create | Auto-created via `handle_new_user` trigger | — |
| Update | User can update own profile | — |
| **Delete** | Not allowed via RLS | ✅ Correct — profile deletion should go through account deletion flow |

**Recommendation:** When account deletion is implemented, anonymize profile data (set `full_name = 'Usunięty użytkownik'`, `avatar = null`) rather than hard-deleting, to preserve referential integrity with applications and messages.

### Saved Jobs

| Action | Behavior | Notes |
|---|---|---|
| Save | Insert | — |
| Unsave | Hard delete | ✅ Acceptable — no audit/legal value |

**Status:** ✅ No change needed.

### Swipe Events

| Action | Behavior | Notes |
|---|---|---|
| Record | Insert | — |
| Clear (reset feed) | Hard delete via RLS | ✅ Acceptable — user preference data, no legal retention |

**Status:** ✅ No change needed.

### Notifications

| Action | Behavior | Notes |
|---|---|---|
| Create | System-inserted (no user INSERT) | — |
| Mark read | Update `read = true` | — |
| Delete | Hard delete via RLS | ✅ Acceptable — ephemeral user data |

**Status:** ✅ No change needed.

### Candidates

| Action | Behavior | Notes |
|---|---|---|
| Create | Auto-created via `handle_new_user` trigger | — |
| Update | User can update own record | — |
| **Delete** | Not exposed via RLS | ✅ Correct — same as profiles |

**Status:** ✅ No change needed.

## Summary Matrix

| Entity | Hard delete OK? | Current behavior | Recommended change |
|---|---|---|---|
| Jobs | ❌ | Hard delete allowed | Soft-delete: `status → 'archived'` |
| Applications | ❌ | Hard delete (withdraw) | Soft-delete: `status → 'withdrawn'` |
| Messages | ✅ Already blocked | No delete | None |
| Reports | ✅ Already blocked | No delete | None |
| Audit log | ✅ Already blocked | No delete | None |
| Profiles | ✅ Already blocked | No delete | Anonymize on account deletion |
| Candidates | ✅ Already blocked | No delete | Anonymize on account deletion |
| Saved jobs | ✅ | Hard delete | None |
| Swipe events | ✅ | Hard delete | None |
| Notifications | ✅ | Hard delete | None |

## What Depends on Live DB Changes

| Change | Migration needed | Priority |
|---|---|---|
| Add `archived` to `JobStatus` | ALTER + RLS policy update | Before launch |
| Add `withdrawn` to `ApplicationStatus` | Domain type + RLS policy update | Before launch |
| Remove DELETE RLS on `jobs` | RLS policy drop + add soft-delete update | Before launch |
| Remove DELETE RLS on `applications` | RLS policy drop + add status update | Before launch |
| Profile anonymization function | New DB function for account deletion | Post-launch |
