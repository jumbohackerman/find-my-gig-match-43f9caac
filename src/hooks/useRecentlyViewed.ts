/**
 * Tracks recently viewed jobs in sessionStorage.
 * Max 20 items, newest first, deduplicated by job ID.
 * Designed to be swapped to DB persistence later (same interface).
 */

import { useState, useCallback } from "react";
import type { Job } from "@/domain/models";

const STORAGE_KEY = "recently_viewed_jobs";
const MAX_ITEMS = 10;

interface ViewedEntry {
  job: Job;
  viewedAt: string;
}

function loadEntries(): ViewedEntry[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveEntries(entries: ViewedEntry[]) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, MAX_ITEMS)));
}

export function useRecentlyViewed() {
  const [entries, setEntries] = useState<ViewedEntry[]>(loadEntries);

  const trackView = useCallback((job: Job) => {
    setEntries((prev) => {
      const filtered = prev.filter((e) => e.job.id !== job.id);
      const next = [{ job, viewedAt: new Date().toISOString() }, ...filtered].slice(0, MAX_ITEMS);
      saveEntries(next);
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEY);
    setEntries([]);
  }, []);

  return {
    recentJobs: entries.map((e) => e.job),
    recentEntries: entries,
    trackView,
    clear,
    count: entries.length,
  };
}
