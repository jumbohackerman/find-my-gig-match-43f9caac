import { STATUS_ORDER, STATUS_LABELS, type ApplicationStatus } from "@/types/application";

interface Props {
  currentStatus: ApplicationStatus;
}

const StatusPipeline = ({ currentStatus }: Props) => {
  const currentIdx = STATUS_ORDER.indexOf(currentStatus);
  const isClosed = currentStatus === "closed";

  return (
    <div className="flex items-center gap-1">
      {STATUS_ORDER.map((status, idx) => {
        const isActive = !isClosed && idx <= currentIdx;
        const isCurrent = status === currentStatus;
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
      {isClosed && (
        <>
          <div className="w-2 h-px bg-border" />
          <div className="px-2 py-0.5 rounded text-[9px] font-semibold bg-destructive/15 text-destructive">
            Closed
          </div>
        </>
      )}
    </div>
  );
};

export default StatusPipeline;
