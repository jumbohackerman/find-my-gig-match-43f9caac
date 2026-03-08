/**
 * Consent logging hook point.
 *
 * Currently logs to console only. Replace the body of `logConsent`
 * with a real backend call (e.g. Supabase insert, edge function)
 * when consent audit logging is required.
 */

export interface ConsentEvent {
  /** Consent category: "cookies", "marketing", "analytics", etc. */
  type: string;
  /** Consent level or specific choice */
  level: string;
  /** ISO timestamp — auto-filled if omitted */
  timestamp?: string;
}

/**
 * Log a consent event. Safe to call from any component.
 * Currently a no-op stub beyond console logging.
 *
 * Future: POST to an edge function or insert into a `consent_log` table.
 */
export function logConsent(event: ConsentEvent): void {
  const entry = {
    ...event,
    timestamp: event.timestamp ?? new Date().toISOString(),
    userAgent: navigator.userAgent,
  };

  if (import.meta.env.DEV) {
    console.info("[consent]", entry);
  }

  // ── HOOK POINT ──────────────────────────────────────────────────────────
  // Replace this block with a real backend call when ready:
  //
  // supabase.from("consent_log").insert({
  //   user_id: currentUserId ?? null,
  //   type: entry.type,
  //   level: entry.level,
  //   user_agent: entry.userAgent,
  //   created_at: entry.timestamp,
  // });
  //
  // Or call an edge function:
  // supabase.functions.invoke("log-consent", { body: entry });
  // ────────────────────────────────────────────────────────────────────────
}
