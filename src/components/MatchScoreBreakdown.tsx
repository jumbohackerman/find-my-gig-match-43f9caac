import type { MatchResult } from "@/lib/matchScoring";
import type { CandidateProfile, JobForScoring } from "@/lib/matchScoring";

interface ScoreBreakdown {
  skills: number;
  experience: number;
  salary: number;
  location: number;
}

export function computeBreakdown(candidate: CandidateProfile, job: JobForScoring): ScoreBreakdown {
  // Skills
  const jobSkills = job.tags.map((t) => t.toLowerCase());
  const candidateSkills = candidate.skills.map((s) => s.toLowerCase());
  const matchedCount = job.tags.filter((t) => candidateSkills.includes(t.toLowerCase())).length;
  const skillScore = jobSkills.length > 0 ? Math.round((matchedCount / jobSkills.length) * 100) : 50;

  // Experience / Seniority
  const inferSeniority = (title: string) => {
    const t = title.toLowerCase();
    if (t.includes("lead") || t.includes("principal")) return "Lead";
    if (t.includes("senior") || t.includes("sr")) return "Senior";
    if (t.includes("junior") || t.includes("jr")) return "Junior";
    return "Mid";
  };
  const levels = ["Junior", "Mid", "Senior", "Lead"];
  const diff = Math.abs(levels.indexOf(inferSeniority(job.title)) - levels.indexOf(candidate.seniority));
  const experienceScore = diff === 0 ? 100 : diff === 1 ? 70 : 30;

  // Salary
  const salaryMatch = job.salary.match(/\$(\d+)k\s*-\s*\$(\d+)k/i);
  let salaryScore = 50;
  if (salaryMatch) {
    const jMin = parseInt(salaryMatch[1]);
    const jMax = parseInt(salaryMatch[2]);
    const overlap = Math.min(jMax, candidate.preferredSalaryMax) - Math.max(jMin, candidate.preferredSalaryMin);
    salaryScore = overlap >= 0 ? Math.min(100, Math.round((overlap / (jMax - jMin || 1)) * 100 + 30)) : 10;
  }

  // Location
  const jobLoc = job.location.toLowerCase();
  let locationScore = 50;
  if (candidate.remotePreference === "Any" || jobLoc.includes("remote") || job.type === "Remote") {
    locationScore = 100;
  } else if (jobLoc.includes(candidate.location.toLowerCase().split(",")[0])) {
    locationScore = 100;
  } else {
    locationScore = 30;
  }

  return { skills: skillScore, experience: experienceScore, salary: salaryScore, location: locationScore };
}

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
    { label: "Skills", value: breakdown.skills },
    { label: "Experience", value: breakdown.experience },
    { label: "Salary", value: breakdown.salary },
    { label: "Location", value: breakdown.location },
  ];

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-1">
        <span className={`text-sm font-bold ${totalScore >= 75 ? "text-accent" : totalScore >= 50 ? "text-yellow-400" : "text-muted-foreground"}`}>
          Match score: {totalScore}%
        </span>
      </div>
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-2">
          <span className="text-[11px] text-muted-foreground w-20">{item.label}</span>
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
