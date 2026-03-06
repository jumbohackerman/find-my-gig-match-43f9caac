import { STATUS_LABELS, STATUS_COLORS, type ApplicationStatus } from "@/types/application";

interface Props {
  status: ApplicationStatus;
}

const StatusBadge = ({ status }: Props) => (
  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${STATUS_COLORS[status]}`}>
    {STATUS_LABELS[status]}
  </span>
);

export default StatusBadge;
