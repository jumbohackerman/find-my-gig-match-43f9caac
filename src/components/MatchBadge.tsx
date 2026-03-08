import type { MatchResult } from "@/domain/models";

interface Props {
  result: MatchResult;
  compact?: boolean;
}

function scoreColor(score: number) {
  if (score >= 75) return "text-accent";
  if (score >= 50) return "text-yellow-400";
  return "text-muted-foreground";
}

function scoreBg(score: number) {
  if (score >= 75) return "bg-accent/15 border-accent/30";
  if (score >= 50) return "bg-yellow-400/15 border-yellow-400/30";
  return "bg-muted border-border";
}

const MatchBadge = ({ result, compact }: Props) => {
  if (compact) {
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${scoreBg(result.score)} ${scoreColor(result.score)}`}>
        {result.score}%
      </span>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className={`text-lg font-bold ${scoreColor(result.score)}`}>
          {result.score}% dopasowania
        </span>
      </div>
      <div className="space-y-1">
        {result.reasons.map((r, i) => (
          <p key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
            <span className="mt-0.5">•</span> {r}
          </p>
        ))}
      </div>
      {(result.matchedSkills.length > 0 || result.missingSkills.length > 0) && (
        <div className="flex flex-wrap gap-1.5 mt-1">
          {result.matchedSkills.map((s) => (
            <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-accent/15 text-accent font-medium">
              ✓ {s}
            </span>
          ))}
          {result.missingSkills.map((s) => (
            <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
              {s}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default MatchBadge;
