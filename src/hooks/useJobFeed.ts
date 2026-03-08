/**
 * useJobFeed — orchestrator hook for the candidate job browsing flow.
 *
 * All persistence goes through the provider registry.
 * NO direct Supabase imports.
 */

import { useState, useCallback, useMemo, useEffect } from "react";
import { getProvider } from "@/providers/registry";
import { useJobs } from "@/hooks/useJobs";
import { useAuth } from "@/hooks/useAuth";
import { useCandidateProfile } from "@/hooks/useCandidateProfile";
import { useSavedJobs } from "@/hooks/useSavedJobs";
import { filterJobs, defaultFilters, type JobFiltersState } from "@/components/JobFilters";
import { calculateMatch, type MatchResult } from "@/lib/matchScoring";
import { toast } from "sonner";
import type { Job } from "@/domain/models";

export function useJobFeed() {
  const { user } = useAuth();
  const { jobs: allJobs, loading: jobsLoading } = useJobs();
  const { candidate: candidateProfile } = useCandidateProfile();
  const { savedJobIds, saveJob, removeJob: unsaveJob } = useSavedJobs();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipedJobIds, setSwipedJobIds] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<JobFiltersState>({ ...defaultFilters });
  const [actionPending, setActionPending] = useState(false);

  const userId = user?.id ?? "anonymous";

  // Load swiped IDs on mount
  useEffect(() => {
    getProvider("swipeEvents")
      .listSwipedJobIds(userId)
      .then((ids) => setSwipedJobIds(new Set(ids)));
  }, [userId]);

  // Filtered and un-swiped jobs
  const filteredJobs = useMemo(() => filterJobs(allJobs, filters), [allJobs, filters]);

  // Match scores
  const matchResults = useMemo(() => {
    const map: Record<string, MatchResult> = {};
    filteredJobs.forEach((job) => {
      map[job.id] = calculateMatch(candidateProfile, job);
    });
    return map;
  }, [filteredJobs, candidateProfile]);

  const remainingJobs = filteredJobs.slice(currentIndex);
  const isFinished = currentIndex >= filteredJobs.length;

  // ── Apply to job (through provider) ────────────────────────────────────
  const applyToJob = useCallback(
    async (job: Job) => {
      if (!user) return;
      try {
        await getProvider("applications").apply(job, user.id);
        toast.success(`Zaaplikowano na: ${job.title}`);
      } catch (err: any) {
        console.error("Apply error:", err);
        toast.error("Nie udało się zaaplikować. Spróbuj ponownie.");
        throw err;
      }
    },
    [user],
  );

  // ── Swipe handler ────────────────────────────────────────────────────────
  const handleSwipe = useCallback(
    async (direction: "left" | "right" | "save") => {
      if (actionPending) return;
      const job = filteredJobs[currentIndex];
      if (!job) return;

      setActionPending(true);

      // Record swipe event — non-blocking; don't let failures stop the UX
      try {
        await getProvider("swipeEvents").record(userId, job.id, direction);
      } catch (err) {
        console.warn("[useJobFeed] swipe record failed (non-blocking):", err);
      }
      setSwipedJobIds((prev) => new Set(prev).add(job.id));

      if (direction === "right") {
        try {
          await applyToJob(job);
        } catch {
          // toast already shown in applyToJob — advance card anyway
        }
      } else if (direction === "save") {
        try {
          await saveJob(job.id);
          toast.success("Oferta zapisana ⭐");
        } catch {
          toast.error("Nie udało się zapisać oferty");
        }
      }

      setCurrentIndex((prev) => prev + 1);
      setActionPending(false);
    },
    [currentIndex, filteredJobs, userId, applyToJob, saveJob, actionPending],
  );

  // ── Apply from saved list ────────────────────────────────────────────────
  const applyFromSaved = useCallback(
    async (job: Job) => {
      await unsaveJob(job.id);
      toast.info("Usunięto z zapisanych");
      await applyToJob(job);
    },
    [unsaveJob, applyToJob],
  );

  // ── Reset feed ───────────────────────────────────────────────────────────
  const resetFeed = useCallback(async () => {
    await getProvider("swipeEvents").clear(userId);
    setSwipedJobIds(new Set());
    setCurrentIndex(0);
  }, [userId]);

  // ── Update filters (resets index) ────────────────────────────────────────
  const updateFilters = useCallback((newFilters: JobFiltersState) => {
    setFilters(newFilters);
    setCurrentIndex(0);
  }, []);

  // ── Saved jobs as full Job objects ───────────────────────────────────────
  const savedJobs = useMemo(
    () => allJobs.filter((j) => savedJobIds.has(j.id)),
    [allJobs, savedJobIds],
  );

  return {
    allJobs,
    filteredJobs,
    remainingJobs,
    savedJobs,
    savedJobIds,
    currentIndex,
    isFinished,
    jobsLoading,
    filters,
    matchResults,
    actionPending,
    handleSwipe,
    applyFromSaved,
    applyToJob,
    resetFeed,
    updateFilters,
  };
}
