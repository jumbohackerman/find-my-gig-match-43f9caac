/**
 * Employer-side hook for shortlist management — DB-backed billing.
 *
 * NEW BUSINESS RULES:
 * - No hard-coded limit (5). Limit comes from active package(s).
 * - Each shortlist consumes exactly 1 slot via DB function `shortlist_candidate`.
 * - Idempotent: clicking twice on the same application does NOT double-charge.
 * - AI recommendations DO NOT trigger billing — they are non-paid suggestions.
 * - Removing a candidate does NOT refund a slot (per spec).
 */

import { useState, useEffect, useCallback } from "react";
import { getProvider } from "@/providers/registry";
import type { ShortlistJobBalance, PackageSize } from "@/domain/shortlist";
import { toast } from "sonner";

export function useEmployerShortlist(employerId: string | undefined, refetch: () => void) {
  const [balances, setBalances] = useState<Record<string, ShortlistJobBalance>>({});
  const [shortlistedAppIds, setShortlistedAppIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [busyAppId, setBusyAppId] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!employerId) return;
    setLoading(true);
    try {
      const map = await getProvider("shortlist").getBalances(employerId);
      setBalances(map);
    } finally {
      setLoading(false);
    }
  }, [employerId]);

  useEffect(() => {
    reload();
  }, [reload]);

  /** Bulk-load shortlisted application IDs for given jobs */
  const loadShortlistedIds = useCallback(async (jobIds: string[]) => {
    const all = new Set<string>();
    for (const jid of jobIds) {
      const ids = await getProvider("shortlist").listShortlistedApplicationIds(jid);
      ids.forEach((id) => all.add(id));
    }
    setShortlistedAppIds(all);
  }, []);

  /** Returns balance for a job (zeros if no package). */
  const getBalance = useCallback(
    (jobId: string): ShortlistJobBalance => {
      return (
        balances[jobId] || {
          jobId,
          totalSlots: 0,
          usedSlots: 0,
          remainingSlots: 0,
          activePackage: null,
          allPackages: [],
        }
      );
    },
    [balances],
  );

  const isShortlisted = useCallback(
    (appId: string) => shortlistedAppIds.has(appId),
    [shortlistedAppIds],
  );

  /** Buy a package — mock billing for now (no real payment). */
  const purchasePackage = useCallback(
    async (jobId: string, size: PackageSize) => {
      try {
        await getProvider("shortlist").purchasePackage(jobId, size);
        toast.success(`Aktywowano pakiet ${size} slotów shortlisty`);
        await reload();
        return true;
      } catch (e: any) {
        toast.error(`Nie udało się aktywować pakietu: ${e?.message || "błąd"}`);
        return false;
      }
    },
    [reload],
  );

  /** Atomic shortlist: consume 1 slot, snapshot, audit. Idempotent. */
  const shortlistCandidate = useCallback(
    async (applicationId: string, jobId: string): Promise<boolean> => {
      if (busyAppId === applicationId) return false; // re-entry guard
      const balance = getBalance(jobId);
      if (balance.remainingSlots <= 0) {
        toast.error("Brak wolnych slotów. Kup pakiet, aby shortlistować.");
        return false;
      }
      setBusyAppId(applicationId);
      try {
        const result = await getProvider("shortlist").shortlistCandidate(applicationId);
        if (result.status === "already_shortlisted") {
          toast.info("Kandydat jest już na shortliście");
        } else {
          toast.success(`Dodano do shortlisty (zostało ${result.slots_after !== undefined ? balance.remainingSlots - 1 : "?"} slotów)`);
        }
        await reload();
        await loadShortlistedIds([jobId]);
        refetch();
        return true;
      } catch (e: any) {
        const msg = String(e?.message || "");
        if (msg.includes("NO_SLOTS_AVAILABLE")) {
          toast.error("Brak wolnych slotów. Kup nowy pakiet.");
        } else {
          toast.error(`Nie udało się dodać do shortlisty: ${msg}`);
        }
        return false;
      } finally {
        setBusyAppId(null);
      }
    },
    [busyAppId, getBalance, reload, loadShortlistedIds, refetch],
  );

  return {
    balances,
    loading,
    busyAppId,
    getBalance,
    isShortlisted,
    purchasePackage,
    shortlistCandidate,
    loadShortlistedIds,
    reload,
  };
}
