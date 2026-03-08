# Toast / Feedback UX Status

Consistent toast feedback using `sonner` across all core product actions.

## ✅ Covered Actions

| Action | Success toast | Error toast | File(s) |
|---|---|---|---|
| **Swipe: Apply (right)** | "Zaaplikowano na: {title}" | "Nie udało się zaaplikować. Spróbuj ponownie." | `useJobFeed.ts` |
| **Swipe: Save (star)** | "Oferta zapisana ⭐" | "Nie udało się zapisać oferty" | `useJobFeed.ts` |
| **Swipe: Skip (left)** | Silent (expected UX) | Console warn only | `useJobFeed.ts` |
| **Apply from Saved** | "Zaaplikowano na: {title}" + "Usunięto z zapisanych" | Error from applyToJob | `useJobFeed.ts` |
| **Message sent** | "Wiadomość wysłana" | Inline error + retry button | `ChatPanel.tsx` |
| **Profile saved** | "Profil zapisany" | "Nie udało się zapisać profilu" | `MyProfile.tsx` |
| **CV uploaded** | "CV przesłane" | "Przesyłanie nie powiodło się" | `MyProfile.tsx` |
| **CV format error** | — | "Dozwolone tylko pliki PDF" | `MyProfile.tsx` |
| **Report submitted** | "Zgłoszenie wysłane — dziękujemy!" | "Nie udało się wysłać zgłoszenia" | `ReportButton.tsx` |
| **Job created** | "Ogłoszenie opublikowane" | "Nie udało się opublikować ogłoszenia" | `useEmployerJobs.ts` |
| **Job edited** | "Ogłoszenie zaktualizowane" | "Nie udało się zaktualizować ogłoszenia" | `useEmployerJobs.ts` |
| **Job archived** | "Ogłoszenie zamknięte" | "Nie udało się zamknąć ogłoszenia" | `useEmployerJobs.ts` |
| **Job deleted** | "Ogłoszenie usunięte" | "Nie udało się usunąć ogłoszenia" | `useEmployerJobs.ts` |
| **Job hidden** | "Oferta ukryta" | "Nie udało się zmienić statusu" | `Employer.tsx` |
| **Job unhidden** | "Oferta opublikowana ponownie" | "Nie udało się zmienić statusu" | `Employer.tsx` |
| **Status update** | "Status zaktualizowany" | "Nie udało się zmienić statusu. Spróbuj ponownie." | `Employer.tsx` |

## Pattern

- All toasts use `sonner` (`toast.success`, `toast.error`, `toast.info`)
- Success: green check, auto-dismiss ~4s
- Error: red, auto-dismiss ~5s
- Info: neutral, auto-dismiss ~3s (used for secondary confirmations like unsave)
- No toast for expected silent actions (skip)
- Inline error + retry used additionally for message send failures

## ⏳ Requires live backend to fully test

- Apply to job (requires `apply_to_job` RPC)
- Save/unsave job (requires `saved_jobs` table)
- Send message (requires `messages` table + realtime)
- Status update (requires `applications` table + employer RLS)
- CV upload (requires Storage bucket `cvs`)
- Report submission (requires `reports` table)
- Job CRUD (requires `jobs` table + employer RLS)
