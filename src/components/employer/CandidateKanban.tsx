/**
 * Kanban view for candidate applications grouped by status.
 * Status transitions happen via action buttons (no drag-and-drop).
 */
import { UserCheck, Zap } from "lucide-react";
import type { EnrichedEmployerApplication, ApplicationStatus } from "@/domain/models";
import { STATUS_LABELS, STATUS_COLORS } from "@/types/application";
import { getActivityLabel, getAllSkills } from "@/domain/models";
import { getCandidateDisplayName, getCandidateAvatar } from "@/hooks/useEmployerApplications";
import MatchBadge from "@/components/MatchBadge";

type ColumnKey = "applied" | "viewed" | "shortlisted" | "interview" | "outcome";

const COLUMNS: { key: ColumnKey; label: string; statuses: ApplicationStatus[] }[] = [
  { key: "applied", label: "Nowa", statuses: ["applied"] },
  { key: "viewed", label: "Przejrzano", statuses: ["viewed"] },
  { key: "shortlisted", label: "Na shortliście", statuses: ["shortlisted"] },
  { key: "interview", label: "Rozmowa", statuses: ["interview"] },
  { key: "outcome", label: "Wynik", statuses: ["hired", "not_selected", "position_closed"] },
];

interface Props {
  apps: EnrichedEmployerApplication[];
  canShortlist: boolean;
  jobClosed: boolean;
  onView: (app: EnrichedEmployerApplication) => void;
  onShortlist: (app: EnrichedEmployerApplication) => void;
  onAdvanceStatus: (appId: string, status: ApplicationStatus) => void;
}

const CandidateKanban = ({
  apps,
  canShortlist,
  jobClosed,
  onView,
  onShortlist,
  onAdvanceStatus,
}: Props) => {
  const grouped = COLUMNS.reduce<Record<ColumnKey, EnrichedEmployerApplication[]>>(
    (acc, col) => {
      acc[col.key] = apps.filter((a) =>
        col.statuses.includes(a.status as ApplicationStatus)
      );
      return acc;
    },
    {} as Record<ColumnKey, EnrichedEmployerApplication[]>
  );

  return (
    <div className="flex gap-3 overflow-x-auto scrollbar-thin pb-2">
      {COLUMNS.map((col) => {
        const items = grouped[col.key];
        return (
          <div
            key={col.key}
            className="min-w-[220px] flex-1 flex flex-col rounded-xl bg-secondary/30 border border-border"
          >
            <div className="px-3 py-2 border-b border-border flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-foreground">
                {col.label}
              </p>
              <span className="text-[11px] text-muted-foreground font-medium">
                {items.length}
              </span>
            </div>
            <div className="p-2 space-y-2 min-h-[80px]">
              {items.length === 0 ? (
                <p className="text-[11px] text-muted-foreground/60 italic px-1 py-2">
                  Brak kandydatów
                </p>
              ) : (
                items.map((app) => (
                  <KanbanCard
                    key={app.id}
                    app={app}
                    canShortlist={canShortlist}
                    jobClosed={jobClosed}
                    onView={() => onView(app)}
                    onShortlist={() => onShortlist(app)}
                    onAdvanceStatus={onAdvanceStatus}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

function KanbanCard({
  app,
  canShortlist,
  jobClosed,
  onView,
  onShortlist,
  onAdvanceStatus,
}: {
  app: EnrichedEmployerApplication;
  canShortlist: boolean;
  jobClosed: boolean;
  onView: () => void;
  onShortlist: () => void;
  onAdvanceStatus: (appId: string, status: ApplicationStatus) => void;
}) {
  const name = getCandidateDisplayName(app);
  const avatar = getCandidateAvatar(app);
  const candidate = app.candidate;
  const matchResult = app.matchResult;
  const activity = getActivityLabel(candidate?.lastActive);
  const status = app.status as ApplicationStatus;
  const statusColor = STATUS_COLORS[status];

  return (
    <div className="rounded-lg bg-card border border-border overflow-hidden hover:border-primary/30 transition-colors">
      <button
        type="button"
        onClick={onView}
        className="w-full text-left p-2.5 space-y-1.5"
      >
        <div className="flex items-start gap-2">
          <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center text-xs shrink-0">
            {avatar}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-foreground truncate">{name}</p>
            <p className="text-[11px] text-muted-foreground truncate">
              {candidate?.title || "–"}
            </p>
          </div>
          {matchResult && <MatchBadge result={matchResult} compact />}
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={`text-[9px] font-medium ${activity.color}`}>
            {activity.label}
          </span>
          {(status === "hired" || status === "not_selected" || status === "position_closed") && (
            <span className={`text-[9px] px-1.5 py-0.5 rounded ${statusColor}`}>
              {STATUS_LABELS[status]}
            </span>
          )}
        </div>
      </button>

      {/* Action buttons */}
      <div className="px-2 pb-2 flex flex-wrap gap-1">
        {(status === "applied" || status === "viewed") && !jobClosed && (
          <button
            onClick={onShortlist}
            className={`text-[10px] px-2 py-0.5 rounded flex items-center gap-0.5 ${
              canShortlist
                ? "bg-accent/15 text-accent hover:bg-accent/25"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
            title={canShortlist ? "Dodaj do shortlisty" : "Brak slotów — kup pakiet"}
          >
            <UserCheck className="w-3 h-3" />
            {canShortlist ? "Shortlista" : "Brak slotów"}
          </button>
        )}
        {status === "shortlisted" && (
          <button
            onClick={() => onAdvanceStatus(app.id, "interview")}
            className="text-[10px] px-2 py-0.5 rounded bg-primary/15 text-primary hover:bg-primary/25"
          >
            Rozmowa
          </button>
        )}
        {status === "interview" && (
          <>
            <button
              onClick={() => onAdvanceStatus(app.id, "hired")}
              className="text-[10px] px-2 py-0.5 rounded bg-accent/15 text-accent hover:bg-accent/25"
            >
              Zatrudnij
            </button>
            <button
              onClick={() => onAdvanceStatus(app.id, "not_selected")}
              className="text-[10px] px-2 py-0.5 rounded bg-destructive/15 text-destructive hover:bg-destructive/25"
            >
              Odmowa
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default CandidateKanban;
