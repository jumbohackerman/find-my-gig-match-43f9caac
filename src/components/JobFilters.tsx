import { Filter, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import type { Job } from "@/data/jobs";

export interface JobFiltersState {
  location: string;
  type: string;
  salaryMin: number;
  remote: string;
  seniority: string;
  requiredSkills: string[];
}

interface JobFiltersProps {
  filters: JobFiltersState;
  onChange: (filters: JobFiltersState) => void;
}

const locations = ["Wszystkie", "Warszawa", "Kraków", "Wrocław", "Gdańsk", "Poznań", "Zdalnie"];
const jobTypes = ["Wszystkie", "Full-time", "Part-time", "Contract", "Remote"];
const remoteOptions = ["Wszystkie", "Zdalnie", "Hybrydowo", "Stacjonarnie"];
const seniorityOptions = ["Wszystkie", "Junior", "Mid", "Senior", "Lead"];
const skillOptions = [
  "React", "TypeScript", "JavaScript", "Node.js", "Python", "Go",
  "GraphQL", "PostgreSQL", "AWS", "Docker", "Figma", "UI/UX",
  "React Native", "Next.js", "MongoDB", "Tailwind CSS",
];

export const defaultFilters: JobFiltersState = {
  location: "Wszystkie",
  type: "Wszystkie",
  salaryMin: 0,
  remote: "Wszystkie",
  seniority: "Wszystkie",
  requiredSkills: [],
};

const JobFilters = ({ filters, onChange }: JobFiltersProps) => {
  const [open, setOpen] = useState(false);

  const hasActiveFilters =
    filters.location !== "Wszystkie" ||
    filters.type !== "Wszystkie" ||
    filters.salaryMin > 0 ||
    filters.remote !== "Wszystkie" ||
    filters.seniority !== "Wszystkie" ||
    filters.requiredSkills.length > 0;

  const clearFilters = () => onChange({ ...defaultFilters });

  const toggleSkill = (skill: string) => {
    const skills = filters.requiredSkills.includes(skill)
      ? filters.requiredSkills.filter((s) => s !== skill)
      : [...filters.requiredSkills, skill];
    onChange({ ...filters, requiredSkills: skills });
  };

  return (
    <div className="w-full mb-4">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium hover:bg-muted transition-colors"
      >
        <Filter className="w-4 h-4" />
        Filtry
        {hasActiveFilters && (
          <span className="w-2 h-2 rounded-full bg-primary" />
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-3 p-4 rounded-xl bg-secondary/50 border border-border space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {/* Location */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Lokalizacja</label>
                  <Select value={filters.location} onValueChange={(v) => onChange({ ...filters, location: v })}>
                    <SelectTrigger className="h-9 bg-background border-border text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {locations.map((loc) => <SelectItem key={loc} value={loc}>{loc}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                {/* Job Type */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Typ pracy</label>
                  <Select value={filters.type} onValueChange={(v) => onChange({ ...filters, type: v })}>
                    <SelectTrigger className="h-9 bg-background border-border text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {jobTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                {/* Remote / Hybrid / On-site */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Tryb pracy</label>
                  <Select value={filters.remote} onValueChange={(v) => onChange({ ...filters, remote: v })}>
                    <SelectTrigger className="h-9 bg-background border-border text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {remoteOptions.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                {/* Seniority */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Poziom</label>
                  <Select value={filters.seniority} onValueChange={(v) => onChange({ ...filters, seniority: v })}>
                    <SelectTrigger className="h-9 bg-background border-border text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {seniorityOptions.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Salary */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Min. wynagrodzenie: {filters.salaryMin > 0 ? `${filters.salaryMin} 000 zł+` : "Dowolne"}
                </label>
                <Slider
                  value={[filters.salaryMin]}
                  onValueChange={([v]) => onChange({ ...filters, salaryMin: v })}
                  max={35}
                  step={1}
                />
              </div>

              {/* Skills multi-select */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Wymagane umiejętności</label>
                <div className="flex flex-wrap gap-1.5">
                  {skillOptions.map((s) => (
                    <button
                      key={s}
                      onClick={() => toggleSkill(s)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                        filters.requiredSkills.includes(s)
                          ? "bg-primary text-primary-foreground"
                          : "bg-background text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1.5 text-xs text-primary hover:underline"
                >
                  <X className="w-3 h-3" /> Wyczyść filtry
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default JobFilters;

export function filterJobs(jobs: Job[], filters: JobFiltersState): Job[] {
  return jobs.filter((job) => {
    if (filters.location !== "Wszystkie" && job.location !== filters.location) return false;
    if (filters.type !== "Wszystkie" && job.type !== filters.type) return false;
    if (filters.salaryMin > 0) {
      const match = job.salary.match(/(\d[\d\s]*)\s*zł/);
      const min = match ? parseInt(match[1].replace(/\s/g, "")) / 1000 : 0;
      if (min < filters.salaryMin) return false;
    }
    if (filters.remote !== "Wszystkie") {
      const loc = job.location.toLowerCase();
      const type = job.type.toLowerCase();
      if (filters.remote === "Zdalnie" && !loc.includes("zdaln") && type !== "remote") return false;
      if (filters.remote === "Stacjonarnie" && (loc.includes("zdaln") || type === "remote")) return false;
    }
    if (filters.seniority !== "Wszystkie") {
      const title = job.title.toLowerCase();
      const sen = filters.seniority.toLowerCase();
      if (sen === "senior" && !title.includes("senior") && !title.includes("sr")) return false;
      if (sen === "junior" && !title.includes("junior") && !title.includes("jr")) return false;
      if (sen === "lead" && !title.includes("lead") && !title.includes("principal")) return false;
    }
    if (filters.requiredSkills.length > 0) {
      const jobTags = job.tags.map((t) => t.toLowerCase());
      const hasAll = filters.requiredSkills.every((s) => jobTags.includes(s.toLowerCase()));
      if (!hasAll) return false;
    }
    return true;
  });
}
