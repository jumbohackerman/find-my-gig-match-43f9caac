/**
 * LimitedCandidateCard — Block 5E
 * Pre-shortlist limited view: only name, job title, salary expectations, years of experience.
 * Shows lock icon explaining full profile unlocks after AI shortlist runs.
 */
import { Lock, Briefcase, DollarSign, Calendar } from "lucide-react";
import type { EnrichedEmployerApplication } from "@/domain/models";

interface Props {
  app: EnrichedEmployerApplication;
}

function formatSalary(c: { salaryMin?: number; salaryMax?: number }) {
  const min = c.salaryMin ?? 0;
  const max = c.salaryMax ?? 0;
  if (!min && !max) return "Nie podano";
  const f = (n: number) => `${n.toLocaleString("pl-PL")} zł`;
  if (min && max) return `${f(min)} – ${f(max)}`;
  return f(min || max);
}

export default function LimitedCandidateCard({ app }: Props) {
  const c = app.candidate;
  const fullName = (c as any)?.fullName || (c as any)?.full_name || "Kandydat";
  const title = (c as any)?.title || (c as any)?.normalizedTitle || "—";
  const years = (c as any)?.yearsOfExperience ?? (c as any)?.years_of_experience ?? 0;

  return (
    <div className="relative rounded-xl bg-secondary/40 border border-border p-3">
      <div className="absolute top-2 right-2" title="Pełny profil i dane kontaktowe odblokują się po uruchomieniu Shortlisty">
        <Lock className="w-3.5 h-3.5 text-muted-foreground/60" />
      </div>
      <p className="font-semibold text-foreground text-sm pr-6">{fullName}</p>
      <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
        <Briefcase className="w-3 h-3" /> {title}
      </p>
      <div className="grid grid-cols-2 gap-2 mt-2 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <DollarSign className="w-3 h-3" /> {formatSalary({ salaryMin: (c as any)?.salaryMin, salaryMax: (c as any)?.salaryMax })}
        </span>
        <span className="flex items-center gap-1">
          <Calendar className="w-3 h-3" /> {years} lat doświadczenia
        </span>
      </div>
      <p className="text-[10px] text-muted-foreground/50 mt-2 italic">
        Pełne dane po Shortliście
      </p>
    </div>
  );
}
