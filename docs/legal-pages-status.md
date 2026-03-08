# Legal Pages Status

## Pages

| Page | Route | Status | Notes |
|------|-------|--------|-------|
| Polityka Prywatności | `/privacy` | ⚠️ Placeholder | Sections defined, needs real legal text |
| Regulamin | `/terms` | ⚠️ Placeholder | Sections defined, needs real legal text |
| Cookie Banner | (global component) | ⚠️ Placeholder | Functional consent UI, stores choice in localStorage |

## What needs final legal text

- [ ] Replace all `[Nazwa firmy]`, `[Adres]`, `[NIP]`, `[email]`, `[DATA]`, `[X]` placeholders in both pages
- [ ] Have a lawyer review RODO/GDPR compliance for the privacy policy
- [ ] Add specific cookie categories and tracking details
- [ ] Add data processing agreement (DPA) section if B2B employers process candidate data
- [ ] Consider adding a separate Cookie Policy page at `/cookies` (currently linked but not created)
- [ ] Add consent logging to the backend (currently localStorage only)

## Links

- Footer: visible on all main pages (Index, Auth)
- Privacy Policy page links to Cookie Policy
- Cookie banner links to Privacy Policy
- Auth page should link to Terms (for "by signing up you agree to..." — not yet added)
