/**
 * Lightweight filter + sort bar for the candidate list inside a job.
 * Returns filter state via controlled props.
 */

import { ArrowDownUp, Filter as FilterIcon } from "lucide-react";
import type { ApplicationStatus } from "@/types/application";

export type SortKey = "match" | "date" | "activity";
export type ActivityFilter = "all" | "active_7d" | "active_30d";

export interface CandidateFilters {
  status: ApplicationStatus | "all";
  matchMin: 0 | 50 | 75;
  source: "all" | "candidate" | "ai" | "employer";
  activity: ActivityFilter;
  sort: SortKey;
}

export const DEFAULT_FILTERS: CandidateFilters = {
  status: "all",
  matchMin: 0,
  source: "all",
  activity: "all",
  sort: "match",
};

interface Props {
  filters: CandidateFilters;
  onChange: (next: CandidateFilters) => void;
  total: number;
  visible: number;
}

const Select = ({
  value,
  onChange,
  options,
  ariaLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  ariaLabel: string;
}) => (
  <select
    aria-label={ariaLabel}
    value={value}
    onChange={(e) => onChange(e.target.value)}
    style={{ padding: "2px 22px 2px 8px", fontSize: 11, height: 28, lineHeight: "24px" }}
    className="rounded-md bg-secondary border border-border text-foreground max-w-[170px] truncate focus:outline-none focus:ring-1 focus:ring-primary"
  >
    {options.map((o) => (
      <option key={o.value} value={o.value}>{o.label}</option>
    ))}
  </select>
);

const CandidateFilterBar = ({ filters, onChange, total, visible }: Props) => {
  const set = <K extends keyof CandidateFilters>(key: K, v: CandidateFilters[K]) =>
    onChange({ ...filters, [key]: v });

  return (
    <div className="flex flex-wrap items-center gap-2 py-2 px-3 rounded-lg bg-background/40 border border-border/60 mb-3">
      <FilterIcon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />

      <Select
        ariaLabel="Filtr statusu"
        value={filters.status}
        onChange={(v) => set("status", v as any)}
        options={[
          { value: "all", label: "Status: wszystkie" },
          { value: "applied", label: "Aplikowano" },
          { value: "viewed", label: "Wyświetlono" },
          { value: "shortlisted", label: "Shortlista" },
          { value: "interview", label: "Rozmowa" },
          { value: "hired", label: "Zatrudniono" },
          { value: "not_selected", label: "Niewybrani" },
          { value: "position_closed", label: "Zamknięte" },
        ]}
      />

      <Select
        ariaLabel="Filtr dopasowania"
        value={String(filters.matchMin)}
        onChange={(v) => set("matchMin", Number(v) as any)}
        options={[
          { value: "0", label: "Match: dowolny" },
          { value: "50", label: "Match ≥ 50%" },
          { value: "75", label: "Match ≥ 75%" },
        ]}
      />

      <Select
        ariaLabel="Filtr źródła"
        value={filters.source}
        onChange={(v) => set("source", v as any)}
        options={[
          { value: "all", label: "Źródło: każde" },
          { value: "candidate", label: "Aplikacja" },
          { value: "ai", label: "Rekom. AI" },
          { value: "employer", label: "Pracodawca" },
        ]}
      />

      <Select
        ariaLabel="Filtr aktywności"
        value={filters.activity}
        onChange={(v) => set("activity", v as ActivityFilter)}
        options={[
          { value: "all", label: "Aktywność: wszyscy" },
          { value: "active_7d", label: "Aktywni 7 dni" },
          { value: "active_30d", label: "Aktywni 30 dni" },
        ]}
      />

      <div className="ml-auto flex items-center gap-2">
        <ArrowDownUp className="w-3.5 h-3.5 text-muted-foreground" />
        <Select
          ariaLabel="Sortowanie"
          value={filters.sort}
          onChange={(v) => set("sort", v as SortKey)}
          options={[
            { value: "match", label: "Dopasowanie" },
            { value: "date", label: "Data aplikacji" },
            { value: "activity", label: "Ostatnia aktywność" },
          ]}
        />
        <span className="text-[10px] text-muted-foreground tabular-nums">
          {visible}/{total}
        </span>
      </div>
    </div>
  );
};

export default CandidateFilterBar;

// ── Pure helpers (used by JobPanel) ─────────────────────────────────────────

export function applyCandidateFilters<T extends {
  status: string;
  source: string;
  matchResult?: { score: number };
  candidate?: { lastActive?: string };
  appliedAt: string;
}>(apps: T[], f: CandidateFilters): T[] {
  const now = Date.now();
  const filtered = apps.filter((a) => {
    if (f.status !== "all" && a.status !== f.status) return false;
    if (f.matchMin > 0 && (a.matchResult?.score ?? 0) < f.matchMin) return false;
    if (f.source !== "all" && a.source !== f.source) return false;
    if (f.activity !== "all" && a.candidate?.lastActive) {
      const days = (now - new Date(a.candidate.lastActive).getTime()) / 86400000;
      const cap = f.activity === "active_7d" ? 7 : 30;
      if (days > cap) return false;
    }
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (f.sort === "match") return (b.matchResult?.score ?? 0) - (a.matchResult?.score ?? 0);
    if (f.sort === "date") return new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime();
    // activity
    const at = a.candidate?.lastActive ? new Date(a.candidate.lastActive).getTime() : 0;
    const bt = b.candidate?.lastActive ? new Date(b.candidate.lastActive).getTime() : 0;
    return bt - at;
  });

  return sorted;
}
