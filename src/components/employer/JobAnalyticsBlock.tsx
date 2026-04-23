/**
 * Compact analytics block per job: shortlist→interview conversion,
 * hire rate, slot utilization, average match.
 */

import { TrendingUp, Target, Layers, BarChart3 } from "lucide-react";
import type { EnrichedEmployerApplication } from "@/domain/models";
import type { ShortlistJobBalance } from "@/domain/shortlist";

interface Props {
  apps: EnrichedEmployerApplication[];
  balance: ShortlistJobBalance;
}

const Stat = ({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
}) => (
  <div className="flex-1 min-w-[120px] rounded-lg bg-secondary/40 border border-border/60 p-2.5">
    <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
      {icon}
      {label}
    </div>
    <div className="mt-1 text-base font-bold text-foreground">{value}</div>
    {hint && <div className="text-[10px] text-muted-foreground/70">{hint}</div>}
  </div>
);

const JobAnalyticsBlock = ({ apps, balance }: Props) => {
  const total = apps.length;
  const shortlisted = apps.filter((a) => ["shortlisted", "interview", "hired"].includes(a.status)).length;
  const interviews = apps.filter((a) => ["interview", "hired"].includes(a.status)).length;
  const hired = apps.filter((a) => a.status === "hired").length;

  const conversion = shortlisted > 0 ? Math.round((interviews / shortlisted) * 100) : 0;
  const hireRate = shortlisted > 0 ? Math.round((hired / shortlisted) * 100) : 0;
  const utilization = balance.totalSlots > 0
    ? Math.round((balance.usedSlots / balance.totalSlots) * 100)
    : 0;
  const avgMatch = total > 0
    ? Math.round(apps.reduce((s, a) => s + (a.matchResult?.score || 0), 0) / total)
    : 0;

  return (
    <div className="flex flex-wrap gap-2 mt-3">
      <Stat
        icon={<TrendingUp className="w-3 h-3" />}
        label="Shortlist→Rozmowa"
        value={`${conversion}%`}
        hint={`${interviews}/${shortlisted}`}
      />
      <Stat
        icon={<Target className="w-3 h-3" />}
        label="Hire rate"
        value={`${hireRate}%`}
        hint={`${hired} zatrudnień`}
      />
      <Stat
        icon={<Layers className="w-3 h-3" />}
        label="Wykorzystanie slotów"
        value={balance.totalSlots > 0 ? `${utilization}%` : "—"}
        hint={balance.totalSlots > 0 ? `${balance.usedSlots}/${balance.totalSlots}` : "brak pakietu"}
      />
      <Stat
        icon={<BarChart3 className="w-3 h-3" />}
        label="Śr. dopasowanie"
        value={`${avgMatch}%`}
        hint={`${total} aplikacji`}
      />
    </div>
  );
};

export default JobAnalyticsBlock;
