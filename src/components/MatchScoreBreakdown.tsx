import type { ScoreBreakdown } from "@/domain/models";

interface Props {
  breakdown: ScoreBreakdown;
  totalScore: number;
}

function barColor(score: number) {
  if (score >= 80) return "bg-accent";
  if (score >= 50) return "bg-yellow-400";
  return "bg-destructive";
}

const MatchScoreBreakdown = ({ breakdown, totalScore }: Props) => {
  const items = [
    { label: "Umiejętności", value: breakdown.skills, weight: "40%" },
    { label: "Doświadczenie", value: breakdown.experience, weight: "15%" },
    { label: "Wynagrodzenie", value: breakdown.salary, weight: "15%" },
    { label: "Lokalizacja", value: breakdown.location, weight: "15%" },
    { label: "Tryb pracy", value: breakdown.workMode, weight: "15%" },
  ];

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-1">
        <span className={`text-sm font-bold ${totalScore >= 75 ? "text-accent" : totalScore >= 50 ? "text-yellow-400" : "text-muted-foreground"}`}>
          Dopasowanie: {totalScore}%
        </span>
      </div>
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-2">
          <span className="text-[11px] text-muted-foreground w-28 flex items-center justify-between">
            <span>{item.label}</span>
            <span className="text-[9px] opacity-60">({item.weight})</span>
          </span>
          <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
            <div
              className={`h-full rounded-full ${barColor(item.value)} transition-all`}
              style={{ width: `${item.value}%` }}
            />
          </div>
          <span className="text-[11px] font-medium text-foreground w-8 text-right">{item.value}%</span>
        </div>
      ))}
    </div>
  );
};

export default MatchScoreBreakdown;

// Re-export for backward compatibility
export { type ScoreBreakdown } from "@/domain/models";
