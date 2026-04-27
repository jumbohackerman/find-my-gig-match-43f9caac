/**
 * Hook for loading the current user's candidate profile.
 *
 * UWAGA: nie używamy już cichego fallbacku do DEFAULT_CANDIDATE jako "prawdziwego"
 * profilu — gdy użytkownik nie ma jeszcze rekordu w bazie, zwracamy `exists: false`,
 * żeby UI mogło pokazać jasny stan "uzupełnij profil".
 */

import { useState, useEffect } from "react";
import { getProvider } from "@/providers/registry";
import { useAuth } from "@/hooks/useAuth";
import { DEFAULT_CANDIDATE } from "@/data/defaults";
import type { Candidate } from "@/domain/models";

export function useCandidateProfile() {
  const { user } = useAuth();
  // Trzymamy DEFAULT_CANDIDATE jako wartość "rusztowanie do edycji",
  // ale exists=false jasno komunikuje, że to nie jest realny zapisany profil.
  const [candidate, setCandidate] = useState<Candidate>(DEFAULT_CANDIDATE);
  const [exists, setExists] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setCandidate(DEFAULT_CANDIDATE);
      setExists(false);
      setLoading(false);
      return;
    }

    let cancelled = false;
    getProvider("candidates")
      .getByUserId(user.id)
      .then((result) => {
        if (cancelled) return;
        if (result) {
          setCandidate(result);
          setExists(true);
        } else {
          setCandidate(DEFAULT_CANDIDATE);
          setExists(false);
        }
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setCandidate(DEFAULT_CANDIDATE);
        setExists(false);
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [user]);

  const updateProfile = (data: Partial<Candidate>) => {
    setCandidate((prev) => ({ ...prev, ...data }));
  };

  return { candidate, loading, exists, updateProfile };
}
