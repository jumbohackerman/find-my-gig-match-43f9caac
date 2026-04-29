import { STATUS_ORDER, STATUS_LABELS, OUTCOME_STATUSES, isOutcome, type ApplicationStatus } from "@/types/application";

interface Props {
  currentStatus: ApplicationStatus;
  size?: "sm" | "lg";
}

const StatusPipeline = ({ currentStatus, size = "sm" }: Props) => {
  const isOutcomeStatus = isOutcome(currentStatus);
  const currentIdx = STATUS_ORDER.indexOf(currentStatus);

  const isLg = size === "lg";
  const gap = isLg ? "gap-2" : "gap-1";
  const chip = isLg
    ? "px-3 py-1.5 rounded-md text-sm"
    : "px-2 py-0.5 rounded text-[9px]";
  const connector = isLg ? "w-4 h-0.5" : "w-2 h-px";

  return (
    <div className={`flex items-center ${gap} flex-wrap`}>
      {STATUS_ORDER.map((status, idx) => {
        const isActive = !isOutcomeStatus
          ? idx <= currentIdx
          : true;
        const isCurrent = !isOutcomeStatus && status === currentStatus;
        return (
          <div key={status} className={`flex items-center ${gap}`}>
            <div
              className={`${chip} font-semibold transition-colors ${
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
              <div className={`${connector} ${isActive ? "bg-accent" : "bg-border"}`} />
            )}
          </div>
        );
      })}
      {isOutcomeStatus && (
        <>
          <div className={`${connector} bg-border`} />
          <div
            className={`${chip} font-semibold ${
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
