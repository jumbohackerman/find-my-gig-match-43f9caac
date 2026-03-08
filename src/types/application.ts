/**
 * Application status constants — labels, colors, ordering.
 * Types are canonical in domain/models.ts; this file holds UI constants.
 */

import type { ApplicationStatus } from "@/domain/models";

export const STATUS_ORDER: ApplicationStatus[] = [
  "applied",
  "shortlisted",
  "viewed",
  "interview",
];

export const OUTCOME_STATUSES: ApplicationStatus[] = ["hired", "not_selected", "position_closed"];

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  applied: "Aplikowano",
  shortlisted: "Shortlista",
  viewed: "Wyświetlono",
  interview: "Rozmowa",
  hired: "Zatrudniony",
  not_selected: "Nie wybrano",
  position_closed: "Stanowisko zamknięte",
};

export const STATUS_COLORS: Record<ApplicationStatus, string> = {
  applied: "bg-secondary text-secondary-foreground",
  shortlisted: "bg-accent/15 text-accent border border-accent/30",
  viewed: "bg-primary/15 text-primary border border-primary/30",
  interview: "bg-yellow-400/15 text-yellow-500 border border-yellow-400/30",
  hired: "bg-accent/20 text-accent border border-accent/40",
  not_selected: "bg-destructive/15 text-destructive border border-destructive/30",
  position_closed: "bg-muted text-muted-foreground border border-border",
};

export function isOutcome(status: ApplicationStatus): boolean {
  return OUTCOME_STATUSES.includes(status);
}

// Re-export type for backward compatibility
export type { ApplicationStatus, ApplicationSource } from "@/domain/models";
