/**
 * Anonymization helpers for employer-facing candidate display.
 *
 * BUSINESS RULE:
 * Before a candidate is shortlisted (paid), the employer sees only initials
 * derived from the candidate's full name. No avatars, no full names, no
 * contact details, no derived identity-revealing fields.
 */

/** "Anna Kowalska" → "A.K." | "Jan" → "J." | "" → "??" */
export function getInitials(fullName?: string | null): string {
  if (!fullName) return "??";
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "??";
  if (parts.length === 1) return `${parts[0][0]?.toUpperCase() || "?"}.`;
  return `${parts[0][0]?.toUpperCase() || "?"}.${parts[parts.length - 1][0]?.toUpperCase() || "?"}.`;
}

/** Generic placeholder for the avatar icon area (no emoji that hints identity) */
export const PREVIEW_AVATAR_PLACEHOLDER = "👤";
