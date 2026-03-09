# Event Taxonomy — Final Draft

Standardized product event definitions for future analytics integration.

## Naming Convention

- All events use `snake_case`
- Pattern: `[noun]_[action]` (e.g., `job_viewed`, `apply_completed`)
- No PII in event payloads — use IDs for downstream joins

---

## Universal Payload

Every event includes these base fields:

```typescript
interface BaseEvent {
  event_name: string;
  timestamp: string;          // ISO 8601
  user_id: string | null;     // null if anonymous
  session_id: string;
  role: "candidate" | "employer" | "anonymous";
  platform: "web";
}
```

---

## Authentication Events

### `signup_started`
Fired when user lands on signup form.

```typescript
{ role_selected: "candidate" | "employer" }
```

### `signup_completed`
Fired after successful account creation.

```typescript
{ role: "candidate" | "employer", method: "email" }
```

### `login_completed`
Fired after successful login.

```typescript
{ method: "email" }
```

### `logout_completed`
Fired after user signs out.

```typescript
{}
```

---

## Job Discovery Events (Candidate)

### `job_viewed`
Fired when a job card becomes the top/active card in the swipe deck or when job detail modal opens.

```typescript
{
  job_id: string;
  source: "swipe_deck" | "saved_list" | "search" | "deep_link";
  match_score?: number;       // 0–100 if available
}
```

### `job_swiped_left`
Fired when candidate skips a job.

```typescript
{
  job_id: string;
  match_score?: number;
}
```

### `job_saved`
Fired when candidate saves a job (star action).

```typescript
{
  job_id: string;
  source: "swipe_deck" | "detail_modal";
  match_score?: number;
}
```

### `job_unsaved`
Fired when candidate removes a job from saved list.

```typescript
{
  job_id: string;
}
```

### `filters_changed`
Fired when candidate updates job filters.

```typescript
{
  filters: {
    location?: string;
    work_mode?: string;
    salary_min?: number;
    tags?: string[];
  };
  result_count: number;
}
```

---

## Application Pipeline Events (Candidate)

### `apply_started`
Fired when candidate initiates application (swipe right or tap Apply).

```typescript
{
  job_id: string;
  source: "swipe" | "button" | "saved_list";
  match_score?: number;
}
```

### `apply_completed`
Fired after application is successfully recorded in backend.

```typescript
{
  job_id: string;
  application_id: string;
  source: "swipe" | "button" | "saved_list";
}
```

### `apply_failed`
Fired if application submission fails.

```typescript
{
  job_id: string;
  error_type: "network" | "auth" | "duplicate" | "unknown";
}
```

---

## Communication Events

### `message_sent`
Fired when a message is successfully sent.

```typescript
{
  application_id: string;
  sender_role: "candidate" | "employer";
  message_length: number;     // character count, no content
}
```

### `message_failed`
Fired when message send fails.

```typescript
{
  application_id: string;
  error_type: "network" | "auth" | "unknown";
}
```

---

## Profile Events (Candidate)

### `profile_section_edited`
Fired when candidate edits a profile section.

```typescript
{
  section: "basic" | "preferences" | "competence" | "links";
}
```

### `profile_saved`
Fired when candidate saves profile changes.

```typescript
{
  completeness_score: number; // 0–100
  fields_updated: string[];   // e.g., ["title", "skills"]
}
```

### `profile_completed`
Fired when profile completeness reaches 100% for the first time.

```typescript
{
  completeness_score: 100;
}
```

### `cv_uploaded`
Fired when CV file is successfully uploaded.

```typescript
{
  file_size_kb: number;
}
```

### `cv_removed`
Fired when CV file is deleted.

```typescript
{}
```

---

## Employer Events

### `candidate_viewed`
Fired when employer views a candidate profile.

```typescript
{
  candidate_id: string;
  job_id: string;
  source: "pipeline" | "shortlist" | "search";
}
```

### `status_changed`
Fired when employer changes application status.

```typescript
{
  application_id: string;
  from_status: string;
  to_status: string;
}
```

### `job_created`
Fired when employer publishes a new job.
```typescript
{
  job_id: string;
}
```

### `job_archived`
Fired when employer closes/archives a job.
```typescript
{
  job_id: string;
}
```

---

## Safety / Moderation Events

### `report_submitted`
Fired when user submits a report.

```typescript
{
  target_type: "job" | "candidate" | "message";
  target_id: string;
  reason_category: string;
}
```

---

## Implementation Status

| Event | Defined | Instrumented |
|-------|---------|--------------|
| `signup_started` | ✅ | ⏳ |
| `signup_completed` | ✅ | ⏳ |
| `login_completed` | ✅ | ⏳ |
| `logout_completed` | ✅ | ⏳ |
| `job_viewed` | ✅ | ⏳ |
| `job_swiped_left` | ✅ | ⏳ |
| `job_saved` | ✅ | ⏳ |
| `job_unsaved` | ✅ | ⏳ |
| `filters_changed` | ✅ | ⏳ |
| `apply_started` | ✅ | ⏳ |
| `apply_completed` | ✅ | ⏳ |
| `apply_failed` | ✅ | ⏳ |
| `message_sent` | ✅ | ⏳ |
| `message_failed` | ✅ | ⏳ |
| `profile_section_edited` | ✅ | ⏳ |
| `profile_saved` | ✅ | ⏳ |
| `profile_completed` | ✅ | ⏳ |
| `cv_uploaded` | ✅ | ⏳ |
| `cv_removed` | ✅ | ⏳ |
| `candidate_viewed` | ✅ | ⏳ |
| `status_changed` | ✅ | ⏳ |
| `job_created` | ✅ | ⏳ |
| `job_archived` | ✅ | ⏳ |
| `report_submitted` | ✅ | ⏳ |

---

## Next Steps

1. Create `src/lib/analytics.ts` with a centralized `track()` utility
2. Instrument events at their corresponding code locations
3. Connect provider (PostHog / Mixpanel / GA4) when ready
