/**
 * Supabase implementation of ShortlistRepository.
 * Encapsulates packages, events, snapshots, and the atomic shortlist RPC.
 */

import { supabase } from "@/integrations/supabase/client";
import type {
  ShortlistPackage,
  ShortlistJobBalance,
  ShortlistEvent,
  PackageSize,
} from "@/domain/shortlist";

interface ShortlistResult {
  event_id: string;
  status: "shortlisted" | "already_shortlisted";
  slot_consumed: boolean;
  slots_after?: number;
  package_size?: number;
}

function mapPackage(row: any): ShortlistPackage {
  return {
    id: row.id,
    employerId: row.employer_id,
    jobId: row.job_id,
    packageSize: row.package_size as PackageSize,
    slotsTotal: row.slots_total,
    slotsUsed: row.slots_used,
    slotsRemaining: Math.max(0, row.slots_total - row.slots_used),
    priceAmount: row.price_amount,
    priceCurrency: row.price_currency,
    status: row.status,
    purchasedAt: row.purchased_at,
  };
}

function mapEvent(row: any): ShortlistEvent {
  return {
    id: row.id,
    eventType: row.event_type,
    employerId: row.employer_id,
    jobId: row.job_id,
    applicationId: row.application_id,
    candidateId: row.candidate_id,
    packageId: row.package_id,
    packageSize: row.package_size,
    slotsBefore: row.slots_before,
    slotsAfter: row.slots_after,
    priceAmount: row.price_amount,
    priceCurrency: row.price_currency,
    createdAt: row.created_at,
  };
}

export const supabaseShortlistRepository = {
  /** List all packages for an employer (across jobs) */
  async listPackages(employerId: string): Promise<ShortlistPackage[]> {
    const { data, error } = await supabase
      .from("shortlist_packages")
      .select("*")
      .eq("employer_id", employerId)
      .order("purchased_at", { ascending: false });

    if (error) {
      console.error("[shortlistRepo] listPackages error:", error);
      return [];
    }
    return (data || []).map(mapPackage);
  },

  /** Compute per-job balance for all jobs of an employer */
  async getBalances(employerId: string): Promise<Record<string, ShortlistJobBalance>> {
    const packages = await this.listPackages(employerId);
    const map: Record<string, ShortlistJobBalance> = {};

    for (const pkg of packages) {
      if (!map[pkg.jobId]) {
        map[pkg.jobId] = {
          jobId: pkg.jobId,
          totalSlots: 0,
          usedSlots: 0,
          remainingSlots: 0,
          activePackage: null,
          allPackages: [],
        };
      }
      const bal = map[pkg.jobId];
      bal.allPackages.push(pkg);
      if (pkg.status === "active") {
        bal.totalSlots += pkg.slotsTotal;
        bal.usedSlots += pkg.slotsUsed;
        bal.remainingSlots += pkg.slotsRemaining;
        if (!bal.activePackage || pkg.purchasedAt < bal.activePackage.purchasedAt) {
          bal.activePackage = pkg;
        }
      } else {
        // exhausted / refunded — count totals/used in history
        bal.totalSlots += pkg.slotsTotal;
        bal.usedSlots += pkg.slotsUsed;
      }
    }

    return map;
  },

  /** Buy a package (mock billing). Returns package id. */
  async purchasePackage(jobId: string, size: PackageSize): Promise<string> {
    const { data, error } = await supabase.rpc("purchase_shortlist_package", {
      _job_id: jobId,
      _package_size: size,
    });
    if (error) throw new Error(error.message);
    return data as string;
  },

  /** Atomic shortlist: consumes 1 slot, snapshots, audits, status=shortlisted. */
  async shortlistCandidate(applicationId: string): Promise<ShortlistResult> {
    const { data, error } = await supabase.rpc("shortlist_candidate", {
      _application_id: applicationId,
    });
    if (error) throw new Error(error.message);
    return data as unknown as ShortlistResult;
  },

  /** List shortlist events (audit log) for a job */
  async listEventsForJob(jobId: string): Promise<ShortlistEvent[]> {
    const { data, error } = await supabase
      .from("shortlist_events")
      .select("*")
      .eq("job_id", jobId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[shortlistRepo] listEventsForJob error:", error);
      return [];
    }
    return (data || []).map(mapEvent);
  },

  /** Get all shortlisted application IDs for a job (for fast lookup in UI) */
  async listShortlistedApplicationIds(jobId: string): Promise<Set<string>> {
    const { data, error } = await supabase
      .from("shortlist_events")
      .select("application_id")
      .eq("job_id", jobId)
      .eq("event_type", "shortlisted_paid");

    if (error) {
      console.error("[shortlistRepo] listShortlistedApplicationIds error:", error);
      return new Set();
    }
    return new Set((data || []).map((r: any) => r.application_id).filter(Boolean));
  },
};
