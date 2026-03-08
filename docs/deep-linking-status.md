# Deep-Linking Status

## ✅ Supported Deep Links

| Parameter | Route | Behavior |
|---|---|---|
| `?tab=applied` | `/` | Opens the "Moje aplikacje" tab |
| `?tab=saved` | `/` | Opens the "Zapisane" tab |
| `?job={id}` | `/` | Opens job detail modal for that job ID |
| `?tab=saved&job={id}` | `/` | Opens saved tab + job detail modal |

## Behavior Details

- **Job modal**: `?job=` is set when opening a job detail modal and removed on close. Uses `replace` to avoid polluting history.
- **Tab**: `?tab=` is set for `applied` and `saved`; omitted for default `swipe` tab.
- **Invalid job ID**: If `?job=` references an unknown ID, the param is silently removed.
- **Back button**: Since params use `replace`, closing modals doesn't create extra history entries.
- **Route guards**: All existing auth/role guards remain intact — deep links only work after authentication.

## Implementation

- URL sync via `useSearchParams` in `src/pages/Index.tsx`
- No new routes — query params only
- Modal open/close callbacks update URL in place

## ⏳ Needs live backend to fully validate

- Job IDs from database (currently mock/static IDs work)
- Sharing a `?job=` link requires the recipient to be authenticated
- Employer-side deep links (e.g. `?app=`) not yet implemented
