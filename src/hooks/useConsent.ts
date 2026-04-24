/**
 * useConsent — manages candidate AI processing consent (Block 4).
 *
 * Reads/writes `candidate_consents` table.
 * Required for any application action — guard via `requireConsent()`.
 */

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface ConsentRecord {
  id: string;
  ai_processing_consent: boolean;
  consented_at: string | null;
  updated_at: string;
}

export function useConsent() {
  const { user } = useAuth();
  const [consent, setConsent] = useState<ConsentRecord | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchConsent = useCallback(async () => {
    if (!user) {
      setConsent(null);
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from("candidate_consents")
      .select("id, ai_processing_consent, consented_at, updated_at")
      .eq("candidate_id", user.id)
      .maybeSingle();
    setConsent(data ?? null);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchConsent();
  }, [fetchConsent]);

  /** Grant AI processing consent. */
  const grantConsent = useCallback(async () => {
    if (!user) return;
    const now = new Date().toISOString();
    if (consent) {
      const { data } = await supabase
        .from("candidate_consents")
        .update({ ai_processing_consent: true, consented_at: now, updated_at: now })
        .eq("candidate_id", user.id)
        .select("id, ai_processing_consent, consented_at, updated_at")
        .maybeSingle();
      if (data) setConsent(data);
    } else {
      const { data } = await supabase
        .from("candidate_consents")
        .insert({
          candidate_id: user.id,
          ai_processing_consent: true,
          consented_at: now,
        })
        .select("id, ai_processing_consent, consented_at, updated_at")
        .maybeSingle();
      if (data) setConsent(data);
    }
  }, [user, consent]);

  /** Withdraw consent (or record refusal). */
  const withdrawConsent = useCallback(async () => {
    if (!user) return;
    const now = new Date().toISOString();
    if (consent) {
      const { data } = await supabase
        .from("candidate_consents")
        .update({ ai_processing_consent: false, updated_at: now })
        .eq("candidate_id", user.id)
        .select("id, ai_processing_consent, consented_at, updated_at")
        .maybeSingle();
      if (data) setConsent(data);
    } else {
      const { data } = await supabase
        .from("candidate_consents")
        .insert({
          candidate_id: user.id,
          ai_processing_consent: false,
        })
        .select("id, ai_processing_consent, consented_at, updated_at")
        .maybeSingle();
      if (data) setConsent(data);
    }
  }, [user, consent]);

  const hasConsent = consent?.ai_processing_consent === true;
  /** True if the user has neither granted nor refused (no row at all). */
  const hasDecided = consent !== null;

  return { consent, loading, hasConsent, hasDecided, grantConsent, withdrawConsent, refresh: fetchConsent };
}
