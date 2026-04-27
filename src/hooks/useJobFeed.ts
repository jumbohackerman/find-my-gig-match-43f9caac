/**
 * useJobFeed — orchestrator hook for the candidate job browsing flow.
 *
 * All persistence goes through the provider registry.
 * NO direct Supabase imports.
 */

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { getProvider } from "@/providers/registry";
import { useJobs } from "@/hooks/useJobs";
import { useAuth } from "@/hooks/useAuth";
import { useCandidateProfile } from "@/hooks/useCandidateProfile";
import { useSavedJobs } from "@/hooks/useSavedJobs";
import { useConsent } from "@/hooks/useConsent";
import { filterJobs, defaultFilters, type JobFiltersState } from "@/components/JobFilters";
import { calculateMatch, type MatchResult } from "@/lib/matchScoring";
import { toScoringCandidate } from "@/domain/models";
import { toast } from "sonner";
import type { Job } from "@/domain/models";

interface UndoEntry {
  direction: "left" | "save";
  job: Job;
  previousIndex: number;
}

export function useJobFeed() {
  const { user } = useAuth();
  const { jobs: allJobs, loading: jobsLoading } = useJobs();
  const { candidate: candidateProfile } = useCandidateProfile();
  const { savedJobIds, saveJob, removeJob: unsaveJob } = useSavedJobs();
  const { hasConsent, loading: consentLoading } = useConsent();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipedJobIds, setSwipedJobIds] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<JobFiltersState>({ ...defaultFilters });
  const [actionPending, setActionPending] = useState(false);
  const lastUndoableRef = useRef<UndoEntry | null>(null);

  const userId = user?.id ?? "anonymous";

  // Load swiped IDs on mount
  useEffect(() => {
    getProvider("swipeEvents")
      .listSwipedJobIds(userId)
      .then((ids) => setSwipedJobIds(new Set(ids)));
  }, [userId]);

  // Filtered AND not yet swiped — swiped jobs must never reappear,
  // even after page refresh or filter change.
  const filteredJobs = useMemo(
    () => filterJobs(allJobs, filters).filter((j) => !swipedJobIds.has(j.id)),
    [allJobs, filters, swipedJobIds],
  );

  // Match scores
  const matchResults = useMemo(() => {
    const map: Record<string, MatchResult> = {};
    filteredJobs.forEach((job) => {
      map[job.id] = calculateMatch(toScoringCandidate(candidateProfile), job);
    });
    return map;
  }, [filteredJobs, candidateProfile]);

  const remainingJobs = filteredJobs.slice(currentIndex);
  const isFinished = filteredJobs.length > 0 && currentIndex >= filteredJobs.length;

  // ── Apply to job (through provider) ────────────────────────────────────
  const applyToJob = useCallback(
    async (job: Job) => {
      if (!user) return;
      // Block 4: hard guard — no application without recorded AI consent.
      // Toast handled in handleSwipe; this remains as safety net.
      if (!consentLoading && !hasConsent) {
        throw new Error("AI_CONSENT_REQUIRED");
      }
      try {
        await getProvider("applications").apply(job, user.id);
        toast.success(`Zaaplikowano: ${job.title}`, {
          duration: 3000,
        });
      } catch (err: any) {
        if (err?.message !== "AI_CONSENT_REQUIRED") {
          console.error("Apply error:", err);
          const msg = String(err?.message || "");
          if (/duplicate|already|unique/i.test(msg)) {
            toast.info("Już aplikowałeś na tę ofertę.");
          } else if (/network|fetch|timeout|offline/i.test(msg)) {
            toast.error("Brak połączenia. Sprawdź internet i spróbuj ponownie.");
          } else {
            toast.error("Nie udało się wysłać aplikacji. Spróbuj ponownie za chwilę.");
          }
        }
        throw err;
      }
    },
    [user, hasConsent, consentLoading],
  );

  // ── Undo last skip/save ──────────────────────────────────────────────────
  const undoLast = useCallback(async () => {
    const entry = lastUndoableRef.current;
    if (!entry || actionPending) return;
    lastUndoableRef.current = null;

    // Revert index
    setCurrentIndex(entry.previousIndex);

    // Remove from swiped set
    setSwipedJobIds((prev) => {
      const next = new Set(prev);
      next.delete(entry.job.id);
      return next;
    });

    // Revert side-effect
    if (entry.direction === "save") {
      try {
        await unsaveJob(entry.job.id);
      } catch {
        // best-effort
      }
    }

    toast.info("Cofnięto");
  }, [actionPending, unsaveJob]);

  // ── Swipe handler ────────────────────────────────────────────────────────
  const handleSwipe = useCallback(
    async (direction: "left" | "right" | "save") => {
      if (actionPending) return;
      const job = filteredJobs[currentIndex];
      if (!job) return;

      // ── Pre-check: consent required for "right" (apply) ──
      if (direction === "right" && !consentLoading && !hasConsent) {
        toast.error("Aby aplikować, udziel zgody na analizę profilu przez AI w ustawieniach profilu.", {
          action: {
            label: "Przejdź do ustawień",
            onClick: () => {
              window.location.href = "/my-profile";
            },
          },
          duration: 6000,
        });
        return; // ← KLUCZOWE: nie przesuwaj karty, nie zapisuj swipe
      }

      setActionPending(true);
      lastUndoableRef.current = null; // clear previous undo
      toast.dismiss(); // ensure only one toast at a time on rapid swipes

      // For "right" (apply): try apply FIRST. If it fails, keep the card
      // (don't advance, don't mark as swiped) so user can retry.
      if (direction === "right") {
        try {
          await applyToJob(job);
        } catch {
          // applyToJob already showed a friendly toast.
          // Card stays — we do NOT record swipe, do NOT advance.
          setActionPending(false);
          return;
        }
      } else if (direction === "save") {
        try {
          await saveJob(job.id);
          lastUndoableRef.current = { direction: "save", job, previousIndex: currentIndex };
          toast.success("Zapisana ⭐", {
            action: { label: "Cofnij", onClick: () => undoLast() },
            duration: 2500,
          });
        } catch {
          toast.error("Nie udało się zapisać oferty. Spróbuj ponownie.");
          setActionPending(false);
          return;
        }
      } else {
        // direction === "left" (skip) — silent
        lastUndoableRef.current = { direction: "left", job, previousIndex: currentIndex };
      }

      // Side-effect succeeded → record swipe (non-blocking) + advance.
      try {
        await getProvider("swipeEvents").record(userId, job.id, direction);
      } catch (err) {
        console.warn("[useJobFeed] swipe record failed (non-blocking):", err);
      }
      setSwipedJobIds((prev) => new Set(prev).add(job.id));

      setCurrentIndex((prev) => prev + 1);
      setActionPending(false);
    },
    [currentIndex, filteredJobs, userId, applyToJob, saveJob, actionPending, undoLast, hasConsent, consentLoading],
  );

  // ── Apply from saved list ────────────────────────────────────────────────
  const applyFromSaved = useCallback(
    async (job: Job) => {
      if (actionPending) return;
      if (!hasConsent && !consentLoading) {
        toast.error("Aby aplikować, udziel zgody RODO w ustawieniach profilu.", {
          action: {
            label: "Ustawienia",
            onClick: () => {
              window.location.href = "/my-profile";
            },
          },
          duration: 6000,
        });
        return;
      }
      setActionPending(true);
      try {
        // Apply FIRST. If it fails, the job stays in saved.
        await applyToJob(job);
        // Only remove from saved after a successful apply.
        try {
          await unsaveJob(job.id);
        } catch (err) {
          console.warn("[useJobFeed] unsave after apply failed (non-blocking):", err);
        }
      } catch {
        // applyToJob already showed a friendly toast; saved entry preserved.
      } finally {
        setActionPending(false);
      }
    },
    [unsaveJob, applyToJob, actionPending, hasConsent, consentLoading],
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
    hasConsent,
    undoLast,
  };
}
