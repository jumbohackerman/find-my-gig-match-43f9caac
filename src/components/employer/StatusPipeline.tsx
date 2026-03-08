import { STATUS_ORDER, STATUS_LABELS, OUTCOME_STATUSES, isOutcome, type ApplicationStatus } from "@/types/application";

interface Props {
  currentStatus: ApplicationStatus;
}

const StatusPipeline = ({ currentStatus }: Props) => {
  const isOutcomeStatus = isOutcome(currentStatus);
  const currentIdx = STATUS_ORDER.indexOf(currentStatus);

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {STATUS_ORDER.map((status, idx) => {
        const isActive = !isOutcomeStatus
          ? idx <= currentIdx
          : true; // all pipeline steps filled before outcome
        const isCurrent = !isOutcomeStatus && status === currentStatus;
        return (
          <div key={status} className="flex items-center gap-1">
            <div
              className={`px-2 py-0.5 rounded text-[9px] font-semibold transition-colors ${
                isCurrent
                  ? "bg-accent text-accent-foreground"
                  : isActive
                  ? "bg-accent/20 text-accent"
                  : "bg-secondary text-muted-foreground"
              }`}
            >
              {STATUS_LABELS[status]}
            </div>
            {idx < STATUS_ORDER.length - 1 && (
              <div className={`w-2 h-px ${isActive ? "bg-accent" : "bg-border"}`} />
            )}
          </div>
        );
      })}
      {isOutcomeStatus && (
        <>
          <div className="w-2 h-px bg-border" />
          <div
            className={`px-2 py-0.5 rounded text-[9px] font-semibold ${
              currentStatus === "hired"
                ? "bg-accent/20 text-accent border border-accent/40"
                : currentStatus === "not_selected"
                ? "bg-destructive/15 text-destructive"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {STATUS_LABELS[currentStatus]}
          </div>
        </>
      )}
    </div>
  );
};

export default StatusPipeline;
