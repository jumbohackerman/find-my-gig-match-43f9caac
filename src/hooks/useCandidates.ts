/**
 * Hook for accessing candidates through the provider registry.
 * Pages use this instead of importing from src/data/ directly.
 */

import { useState, useEffect, useCallback } from "react";
import { getProvider } from "@/providers/registry";
import type { Candidate } from "@/domain/models";
import type { CandidateFilters } from "@/repositories/interfaces";

export function useCandidates(filters?: CandidateFilters) {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getProvider("candidates").list(filters);
      setCandidates(result);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetch(); }, [fetch]);

  return { candidates, loading, refetch: fetch };
}
