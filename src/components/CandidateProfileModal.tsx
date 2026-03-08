import { useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, MapPin, Clock, Globe, Github, Linkedin, ExternalLink,
  FileText, Briefcase,
} from "lucide-react";
import type { Candidate, MatchResult } from "@/domain/models";
import { getActivityLabel } from "@/domain/models";
import MatchBadge from "@/components/MatchBadge";
import ReportButton from "@/components/ReportButton";
import LocalErrorBoundary from "@/components/LocalErrorBoundary";

interface Props {
  candidate: Candidate | null;
  match?: MatchResult;
  onClose: () => void;
}

const CandidateProfileModal = ({ candidate, match, onClose }: Props) => {
  const closeRef = useRef<HTMLButtonElement>(null);

  // ESC to close + auto-focus
  useEffect(() => {
    if (!candidate) return;
    requestAnimationFrame(() => closeRef.current?.focus());
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [candidate, onClose]);

  if (!candidate) return null;

  const activity = getActivityLabel(candidate.lastActive);
  const coreSkills = candidate.skills.slice(0, 5);
  const additionalSkills = candidate.skills.slice(5);
  const links = candidate.links || {};
  const hasLinks = links.portfolio || links.github || links.linkedin || links.website;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm px-4" onClick={onClose} role="dialog" aria-modal="true" aria-label={`Profil kandydata: ${candidate.name}`}>
        <LocalErrorBoundary label="Profil kandydata">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-lg max-h-[85vh] overflow-y-auto card-gradient rounded-2xl border border-border p-5 relative"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
            <ReportButton targetType="profile" targetId={candidate.id} targetLabel={candidate.name} />
            <button ref={closeRef} onClick={onClose} className="text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg p-1" aria-label="Zamknij">
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>

          {/* Hero */}
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-xl bg-secondary flex items-center justify-center text-4xl">
              {candidate.avatar}
            </div>
            <div className="flex-1">
              <h3 className="font-display text-xl font-bold text-foreground">{candidate.name}</h3>
              <p className="text-sm text-primary font-medium">{candidate.title}</p>
              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {candidate.location}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {candidate.experience}
                </span>
              </div>
            </div>
          </div>

          {/* Badges */}
          <div className="flex items-center gap-2 mb-4">
            <span className="px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-medium">
              {candidate.availability}
            </span>
            {candidate.seniority && (
              <span className="px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-medium">
                {candidate.seniority}
              </span>
            )}
            {candidate.workMode && (
              <span className="px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-medium">
                {candidate.workMode}
              </span>
            )}
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${activity.color} bg-secondary`}>
              {activity.label}
            </span>
          </div>

          {/* Match */}
          {match && (
            <div className="mb-4 p-3 rounded-xl bg-secondary/50 border border-border">
              <MatchBadge result={match} />
            </div>
          )}

          {/* Summary */}
          {candidate.summary && (
            <div className="mb-4">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Podsumowanie</h4>
              <p className="text-sm text-foreground leading-relaxed">{candidate.summary}</p>
            </div>
          )}

          {/* Skills */}
          <div className="mb-4">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Umiejętności
            </h4>
            {coreSkills.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-1.5">
                {coreSkills.map((s) => {
                  const matched = match?.matchedSkills.includes(s);
                  return (
                    <span
                      key={s}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                        matched
                          ? "bg-accent/15 text-accent border border-accent/30"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {s}
                    </span>
                  );
                })}
              </div>
            )}
            {additionalSkills.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {additionalSkills.map((s) => (
                  <span key={s} className="px-2.5 py-1 rounded-lg text-xs font-medium bg-muted text-muted-foreground">
                    {s}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Experience */}
          {candidate.experienceEntries && candidate.experienceEntries.length > 0 && (
            <div className="mb-4">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Doświadczenie</h4>
              <div className="space-y-3">
                {candidate.experienceEntries.map((entry, idx) => (
                  <div key={idx} className="pl-3 border-l-2 border-border">
                    <p className="text-sm font-medium text-foreground">
                      {entry.title}{entry.company ? ` — ${entry.company}` : ""}
                    </p>
                    <p className="text-xs text-muted-foreground mb-1">
                      {entry.startDate} – {entry.endDate}
                    </p>
                    {entry.bullets?.filter(Boolean).map((b, bi) => (
                      <p key={bi} className="text-xs text-muted-foreground flex items-start gap-1.5">
                        <span className="mt-0.5">•</span> {b}
                      </p>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Salary */}
          {candidate.salaryMin && candidate.salaryMin > 0 && (
            <div className="mb-4">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                Oczekiwania finansowe
              </h4>
              <p className="text-sm text-foreground">
                {candidate.salaryMin > 1000
                  ? `${(candidate.salaryMin / 1000).toFixed(0)} 000 zł – ${((candidate.salaryMax || candidate.salaryMin) / 1000).toFixed(0)} 000 zł brutto / mies.`
                  : `${candidate.salaryMin} 000 zł – ${candidate.salaryMax || candidate.salaryMin} 000 zł brutto / mies.`
                }
              </p>
            </div>
          )}

          {/* Links */}
          {hasLinks && (
            <div className="mb-2">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Linki</h4>
              <div className="flex gap-2">
                {links.portfolio && (
                  <a href={links.portfolio} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-secondary hover:bg-muted transition-colors">
                    <Globe className="w-4 h-4 text-primary" />
                  </a>
                )}
                {links.github && (
                  <a href={links.github} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-secondary hover:bg-muted transition-colors">
                    <Github className="w-4 h-4 text-primary" />
                  </a>
                )}
                {links.linkedin && (
                  <a href={links.linkedin} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-secondary hover:bg-muted transition-colors">
                    <Linkedin className="w-4 h-4 text-primary" />
                  </a>
                )}
                {links.website && (
                  <a href={links.website} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-secondary hover:bg-muted transition-colors">
                    <ExternalLink className="w-4 h-4 text-primary" />
                  </a>
                )}
              </div>
            </div>
          )}

          {/* CV */}
          {candidate.cvUrl && (
            <div className="pt-2 border-t border-border">
              <span className="flex items-center gap-1.5 text-xs text-accent">
                <FileText className="w-3.5 h-3.5" /> CV dostępne
              </span>
            </div>
          )}
        </motion.div>
        </LocalErrorBoundary>
      </div>
    </AnimatePresence>
  );
};

export default CandidateProfileModal;
