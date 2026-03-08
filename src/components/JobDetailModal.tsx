import { motion, AnimatePresence } from "framer-motion";
import {
  X, MapPin, Briefcase, Clock, DollarSign, Users, Building2,
  CheckCircle2, ListChecks, Gift, ExternalLink, Wifi,
} from "lucide-react";
import type { Job } from "@/domain/models";
import type { MatchResult } from "@/lib/matchScoring";
import MatchBadge from "@/components/MatchBadge";

function formatPostedDate(raw: string): string {
  if (!raw) return "";
  const date = new Date(raw);
  if (isNaN(date.getTime())) return raw;
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
}

interface Props {
  job: Job | null;
  matchResult?: MatchResult;
  onClose: () => void;
  onApply?: (job: Job) => void;
}

const JobDetailModal = ({ job, matchResult, onClose, onApply }: Props) => {
  if (!job) return null;

  const workMode =
    job.type === "Remote" || job.location.toLowerCase().includes("zdaln")
      ? "Zdalnie"
      : job.type === "Contract"
      ? "Hybrydowo"
      : "Stacjonarnie";

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm px-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-lg max-h-[85vh] overflow-y-auto card-gradient rounded-2xl border border-border p-5 relative"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground z-10"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-xl bg-secondary flex items-center justify-center text-4xl">
              {job.logo}
            </div>
            <div className="flex-1">
              <h3 className="font-display text-xl font-bold text-foreground">{job.title}</h3>
              <p className="text-sm text-primary font-medium">{job.company}</p>
              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {job.location}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {formatPostedDate(job.posted)}
                </span>
              </div>
            </div>
          </div>

          {/* Badges */}
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <span className="px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-medium">
              {job.type}
            </span>
            <span className="px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-medium flex items-center gap-1">
              <Wifi className="w-3 h-3" /> {workMode}
            </span>
            {job.seniority && (
              <span className="px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-medium">
                {job.seniority}
              </span>
            )}
            {job.contractType && (
              <span className="px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-medium">
                {job.contractType}
              </span>
            )}
            {job.teamSize && (
              <span className="px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-medium flex items-center gap-1">
                <Users className="w-3 h-3" /> {job.teamSize}
              </span>
            )}
          </div>

          {/* Salary */}
          {job.salary && job.salary.trim().length > 0 && (
            <div className="mb-4 p-3 rounded-xl bg-accent/10 border border-accent/20">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-accent" />
                <span className="text-base font-bold text-accent">{job.salary}</span>
              </div>
            </div>
          )}

          {/* Match */}
          {matchResult && (
            <div className="mb-4 p-3 rounded-xl bg-secondary/50 border border-border">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5">
                Dopasowanie do Twojego profilu
              </p>
              <MatchBadge result={matchResult} />
            </div>
          )}

          {/* Description */}
          <div className="mb-4">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
              Opis stanowiska
            </h4>
            <p className="text-sm text-foreground leading-relaxed">{job.description}</p>
          </div>

          {/* About company */}
          {job.aboutCompany && (
            <div className="mb-4">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" /> O firmie
              </h4>
              <p className="text-sm text-foreground leading-relaxed">{job.aboutCompany}</p>
            </div>
          )}

          {/* Requirements */}
          {job.requirements && job.requirements.length > 0 && (
            <div className="mb-4">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <ListChecks className="w-3.5 h-3.5" /> Wymagania
              </h4>
              <ul className="space-y-1.5">
                {job.requirements.map((req, i) => (
                  <li key={i} className="text-sm text-foreground flex items-start gap-2">
                    <span className="mt-1 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                    {req}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Responsibilities */}
          {job.responsibilities && job.responsibilities.length > 0 && (
            <div className="mb-4">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5" /> Zakres obowiązków
              </h4>
              <ul className="space-y-1.5">
                {job.responsibilities.map((resp, i) => (
                  <li key={i} className="text-sm text-foreground flex items-start gap-2">
                    <span className="mt-1 w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
                    {resp}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Benefits */}
          {job.benefits && job.benefits.length > 0 && (
            <div className="mb-4">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Gift className="w-3.5 h-3.5" /> Benefity
              </h4>
              <div className="flex flex-wrap gap-2">
                {job.benefits.map((b, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-lg text-xs font-medium bg-accent/10 text-accent border border-accent/20"
                  >
                    {b}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          <div className="mb-4">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Technologie / Tagi
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {job.tags.map((tag) => {
                const isMatched = matchResult?.matchedSkills.includes(tag);
                return (
                  <span
                    key={tag}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                      isMatched
                        ? "bg-accent/15 text-accent border border-accent/30"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {tag}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Apply button */}
          {onApply && (
            <button
              onClick={() => { onApply(job); onClose(); }}
              className="w-full py-3 rounded-xl btn-gradient text-primary-foreground font-semibold text-sm hover:scale-[1.02] transition-transform flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" /> Aplikuj na to stanowisko
            </button>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default JobDetailModal;
