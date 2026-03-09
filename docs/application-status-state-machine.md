# Application Status State Machine

This document serves as the single source of truth for application status transitions within the system.

## Statuses
The application lifecycle uses the following statuses:

1. **`applied`** (Initial): Candidate has submitted their application.
2. **`shortlisted`**: Employer marked the candidate as highly promising.
3. **`viewed`**: Employer has opened and reviewed the application.
4. **`interview`**: Employer has invited the candidate for an interview.
5. **`hired`** (Terminal): Employer has hired the candidate.
6. **`not_selected`** (Terminal): Candidate was rejected by the employer.
7. **`position_closed`** (Terminal): Job was closed before a decision was made on this application.

## Actors
- **`candidate`**: The user applying for the job.
- **`employer`**: The user who posted the job and is evaluating applications.
- **`system`**: Automated backend processes (e.g., closing all pending applications when a job is marked closed).

## Transition Rules

All transitions are strictly validated. If a status is **Terminal**, no further transitions are allowed.

| Current Status | Allowed Next Status | Triggered By | Notification | Email | Audit Log |
| :--- | :--- | :--- | :---: | :---: | :---: |
| `applied` | `shortlisted` | `employer` | Yes | No | Yes |
| `applied` | `viewed` | `employer` | Yes | No | No |
| `applied` | `interview` | `employer` | Yes | Yes | Yes |
| `applied` | `not_selected` | `employer` | Yes | Yes | Yes |
| `applied` | `position_closed` | `employer`, `system` | Yes | No | Yes |
| `shortlisted` | `applied` | `employer` | No | No | Yes |
| `shortlisted` | `viewed` | `employer` | No | No | No |
| `shortlisted` | `interview` | `employer` | Yes | Yes | Yes |
| `shortlisted` | `not_selected` | `employer` | Yes | Yes | Yes |
| `shortlisted` | `position_closed` | `employer`, `system` | Yes | No | Yes |
| `viewed` | `shortlisted` | `employer` | Yes | No | Yes |
| `viewed` | `interview` | `employer` | Yes | Yes | Yes |
| `viewed` | `not_selected` | `employer` | Yes | Yes | Yes |
| `viewed` | `position_closed` | `employer`, `system` | Yes | No | Yes |
| `interview` | `hired` | `employer` | Yes | Yes | Yes |
| `interview` | `not_selected` | `employer` | Yes | Yes | Yes |
| `interview` | `position_closed` | `employer`, `system` | Yes | No | Yes |

*Note: Self-transitions (e.g., `applied` -> `applied`) are treated as no-ops.*

## Terminal States
The following statuses are irreversible (terminal):
- `hired`
- `not_selected`
- `position_closed`

Attempts to transition out of a terminal state will result in an `InvalidTransitionError`.

## Implementation Details
- The state machine configuration and transition logic are encapsulated in `src/domain/application-state-machine.ts`.
- Transitions are validated centrally using the `validateTransition(from, to, actor)` function.
- The `StatusTransition` interface maps which operations (like Notifications, Emails, and Audit Logs) should be executed after a successful transition.

## Future Integrations (Mapped but not yet live)
- **Notification Routing:** Transition metadata dictates `triggersNotification`. When enabled, the application hook or backend listener should dispatch an in-app notification.
- **Email Delivery:** Transition metadata dictates `triggersEmail`. Currently mapped for critical events (`interview`, `hired`, `not_selected`), but awaiting the integration of an email provider or Supabase Edge Function to dispatch them.
- **Audit Logging:** Transitions marked `requiresAudit: true` are planned for insertion into an `audit_log` table to maintain recruitment compliance and history tracking.
