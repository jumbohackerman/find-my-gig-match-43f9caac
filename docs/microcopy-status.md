# Microcopy Consistency Status

## ✅ Reviewed & Updated

| Area | Change | File(s) |
|---|---|---|
| **Status labels** | "Aplikowano" → "Wysłano", "Wyświetlono" → "Przejrzano", "Shortlista" → "Na shortliście", "Nie wybrano" → "Odmowa", "Zatrudniony" → "Zatrudniony/a" | `types/application.ts` |
| **Empty: applications** | "Brak aplikacji." → "Nie masz jeszcze żadnych aplikacji." + "Przeglądaj oferty i aplikuj jednym gestem!" | `ApplicationStatusList.tsx` |
| **Auth: forgot password** | "Zapomniałeś hasła?" → "Nie pamiętasz hasła?" (gender-neutral) | `Auth.tsx` |
| **Auth: loading** | "Ładowanie…" → "Proszę czekać…" | `Auth.tsx` |
| **Chat unlock** | "Wyślij pierwszą wiadomość aby odblokować czat" → "Wyślij wiadomość, aby rozpocząć rozmowę" | `ChatPanel.tsx` |
| **Toast: skip** | "Pominięto" → "Oferta pominięta" | `useJobFeed.ts` |
| **Employer metrics** | "picki" → "wybrane", "śr." → "średnia" | `Employer.tsx` |
| **Employer AI analysis** | "ranking wg dopasowania" → "ranking kandydatów" | `Employer.tsx` |
| **Employer empty analysis** | "Brak kandydatów do analizy" → "Brak kandydatów" + actionable description | `Employer.tsx` |

## ✅ Already Consistent (no changes needed)

- Navigation labels (Navbar): "Mój profil", "Panel pracodawcy", "Znajdź talent", "Przeglądaj oferty"
- Tab labels: "Przeglądaj", "Moje aplikacje", "Zapisane"
- Onboarding steps: all Polish, clear, concise
- Error messages: consistent "Nie udało się…" + "Spróbuj ponownie" pattern
- Report reasons: Polish, clear
- Cookie banner: proper Polish, RODO-aligned tone
- Footer links: "Prywatność", "Regulamin", "Cookies"
- 404 page: proper Polish with helpful CTA

## ⏳ Future review needed

| Area | Notes |
|---|---|
| **Legal pages** | Privacy Policy, Terms, Cookies pages need legal/compliance review for final wording |
| **Email templates** | Auth emails (confirmation, reset) use defaults — need branded Polish copy |
| **Notification body text** | Generated server-side — needs review when backend notifications are live |
| **Employer job form labels** | Currently functional; may need UX writing pass for onboarding clarity |
