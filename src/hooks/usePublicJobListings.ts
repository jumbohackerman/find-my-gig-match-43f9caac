/**
 * usePublicJobListings — read-only fetch of public active jobs
 * for employer market research. Excludes the requester's own jobs.
 *
 * Pure data access via provider registry — never reuses employer management queries.
 */

import { useEffect, useState, useCallback } from "react";
import { getProvider } from "@/providers/registry";
import type {
  PublicJobListing,
  PublicJobListingDetail,
  PublicJobListingFilters,
} from "@/repositories/supabase/publicJobListings";

export type { PublicJobListing, PublicJobListingDetail, PublicJobListingFilters };

export function usePublicJobListings(filters: PublicJobListingFilters) {
  const [items, setItems] = useState<PublicJobListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Stable cache key
  const key = JSON.stringify(filters);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const repo = getProvider("publicJobListings");
      const data = await repo.list(filters);
      setItems(data);
    } catch (e) {
      console.error("[usePublicJobListings] error:", e);
      setError("Nie udało się pobrać ofert.");
      setItems([]);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { items, loading, error, refetch: fetchData };
}

export function usePublicJobListingDetail(id: string | null, requesterId?: string) {
  const [detail, setDetail] = useState<PublicJobListingDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!id) {
      setDetail(null);
      return;
    }
    setLoading(true);
    const repo = getProvider("publicJobListings");
    repo
      .getById(id, requesterId)
      .then((d) => { if (!cancelled) setDetail(d); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id, requesterId]);

  return { detail, loading };
}
