/**
 * useSavedJobs — hook for saved-jobs through the provider registry.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { getProvider } from "@/providers/registry";
import { useAuth } from "@/hooks/useAuth";

export function useSavedJobs() {
  const { user } = useAuth();
  const userId = user?.id ?? "anonymous";
  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const pendingOps = useRef(new Set<string>());

  const fetch = useCallback(async () => {
    setLoading(true);
    const ids = await getProvider("savedJobs").listIds(userId);
    setSavedJobIds(new Set(ids));
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const saveJob = useCallback(
    async (jobId: string) => {
      if (pendingOps.current.has(`save-${jobId}`)) return;
      pendingOps.current.add(`save-${jobId}`);
      try {
        await getProvider("savedJobs").save(userId, jobId);
        setSavedJobIds((prev) => new Set(prev).add(jobId));
      } catch (err) {
        if (import.meta.env.DEV) console.error("[useSavedJobs] save failed:", err);
        throw err;
      } finally {
        pendingOps.current.delete(`save-${jobId}`);
      }
    },
    [userId],
  );

  const removeJob = useCallback(
    async (jobId: string) => {
      if (pendingOps.current.has(`remove-${jobId}`)) return;
      pendingOps.current.add(`remove-${jobId}`);
      try {
        await getProvider("savedJobs").remove(userId, jobId);
        setSavedJobIds((prev) => {
          const next = new Set(prev);
          next.delete(jobId);
          return next;
        });
      } catch (err) {
        if (import.meta.env.DEV) console.error("[useSavedJobs] remove failed:", err);
        throw err;
      } finally {
        pendingOps.current.delete(`remove-${jobId}`);
      }
    },
    [userId],
  );

  const isSaved = useCallback(
    (jobId: string) => savedJobIds.has(jobId),
    [savedJobIds],
  );

  return { savedJobIds, loading, saveJob, removeJob, isSaved, refetch: fetch };
}
