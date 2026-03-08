# Legal Pages Status

> Last updated: 2026-03-08

## Pages

| Page | Route | Status | Notes |
|------|-------|--------|-------|
| Polityka Prywatności | `/privacy` | ⚠️ Placeholder | Sections defined, links to /cookies. Needs real legal text |
| Regulamin | `/terms` | ⚠️ Placeholder | Sections defined, needs real legal text |
| Polityka Cookies | `/cookies` | ⚠️ Placeholder | Cookie categories (essential/analytics/functional), links to /privacy and /terms |
| Cookie Banner | (global component) | ✅ Functional | Consent stored in localStorage. Links to /cookies and /privacy |

## Auth Consent UX

- **Signup form**: Shows "Rejestrując się, akceptujesz Regulamin oraz Politykę Prywatności" with links
- **Login/forgot**: No consent text (not needed)

## Cross-Linking

| From | Links to |
|------|----------|
| Cookie Banner | /cookies, /privacy |
| Privacy Policy § 7 | /cookies |
| Cookies § 4 | /privacy, /terms |
| Footer (all pages) | /privacy, /terms, /cookies |
| Auth signup form | /terms, /privacy |

## What still needs final legal text

- [ ] Replace all `[Nazwa firmy]`, `[Adres]`, `[NIP]`, `[email]`, `[DATA]`, `[X]` placeholders
- [ ] Lawyer review for RODO/GDPR compliance
- [ ] Specific cookie names and tracking tool details in /cookies
- [ ] Data processing agreement (DPA) section if B2B employers process candidate data

## What still needs backend implementation

- [ ] **Consent logging**: Record cookie consent choice (all/essential), timestamp, user_id/session to a `consent_log` table
- [ ] **Consent retrieval**: Load prior consent on return visit (currently localStorage only — lost on device/browser change)
- [ ] **Consent withdrawal**: Allow users to change cookie preferences from /cookies page (currently requires clearing localStorage)
- [ ] **Signup consent audit**: Log that user accepted terms at signup (timestamp + version)
