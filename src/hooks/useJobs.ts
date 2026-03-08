/**
 * Hook for accessing jobs through the provider registry.
 * Pages use this instead of importing from src/data/ directly.
 */

import { useState, useEffect, useCallback } from "react";
import { getProvider } from "@/providers/registry";
import type { Job } from "@/domain/models";
import type { JobFilters } from "@/repositories/interfaces";

export function useJobs(filters?: JobFilters) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getProvider("jobs").list(filters);
      setJobs(result);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetch(); }, [fetch]);

  return { jobs, loading, refetch: fetch };
}

export function useJob(id: string | null) {
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id) { setJob(null); return; }
    setLoading(true);
    getProvider("jobs").getById(id).then(setJob).finally(() => setLoading(false));
  }, [id]);

  return { job, loading };
}
