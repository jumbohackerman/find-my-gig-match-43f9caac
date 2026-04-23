/**
 * Shortlist domain models — packages, events, snapshots.
 * UI/repo-agnostic.
 */

export type PackageSize = 5 | 10 | 20;
export type PackageStatus = "active" | "exhausted" | "refunded";

export interface ShortlistPackage {
  id: string;
  employerId: string;
  jobId: string;
  packageSize: PackageSize;
  slotsTotal: number;
  slotsUsed: number;
  slotsRemaining: number;
  priceAmount: number;        // grosze (PLN)
  priceCurrency: string;
  status: PackageStatus;
  purchasedAt: string;
}

export interface ShortlistJobBalance {
  jobId: string;
  totalSlots: number;
  usedSlots: number;
  remainingSlots: number;
  activePackage: ShortlistPackage | null;
  allPackages: ShortlistPackage[];
}

export type ShortlistEventType = "shortlisted_paid" | "package_purchased";

export interface ShortlistEvent {
  id: string;
  eventType: ShortlistEventType;
  employerId: string;
  jobId: string;
  applicationId: string | null;
  candidateId: string | null;
  packageId: string | null;
  packageSize: number | null;
  slotsBefore: number | null;
  slotsAfter: number | null;
  priceAmount: number | null;
  priceCurrency: string | null;
  createdAt: string;
}

/** Mock pricing in PLN grosze (must match DB) */
export const PACKAGE_PRICING: Record<PackageSize, number> = {
  5: 29900,
  10: 49900,
  20: 89900,
};

/** Format grosze -> "299 zł" */
export function formatPrice(grosze: number): string {
  const zl = Math.round(grosze / 100);
  return `${zl.toLocaleString("pl-PL")} zł`;
}

/** Compute price-per-slot label */
export function pricePerSlot(size: PackageSize): string {
  const total = PACKAGE_PRICING[size];
  return formatPrice(Math.round(total / size));
}
