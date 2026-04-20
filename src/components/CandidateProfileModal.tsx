import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, MapPin, Clock, Globe, Github, Linkedin, ExternalLink,
  Lock,
} from "lucide-react";
import type { Candidate, MatchResult, ApplicationStatus } from "@/domain/models";
import { getActivityLabel, getAllSkills } from "@/domain/models";
import MatchBadge from "@/components/MatchBadge";
import ReportButton from "@/components/ReportButton";
import LocalErrorBoundary from "@/components/LocalErrorBoundary";

interface Props {
  candidate: Candidate | null;
  match?: MatchResult;
  onClose: () => void;
  /**
   * Application status controls data disclosure:
   * - Before shortlist (`applied`, `viewed`): minimal applicant_preview only
   * - After shortlist (`shortlisted`, `interview`, `hired`): full shortlisted_profile (still no CV)
   */
  applicationStatus?: ApplicationStatus;
}

// Statuses that unlock the shortlisted_profile view
const SHORTLISTED_STATUSES: ApplicationStatus[] = ["shortlisted", "interview", "hired"];

const CandidateProfileModal = ({ candidate, match, onClose, applicationStatus }: Props) => {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!candidate) return;
    requestAnimationFrame(() => closeRef.current?.focus());
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [candidate, onClose]);

  if (!candidate) return null;

  // If applicationStatus is not provided, default to unlocked (candidate self-view, etc.)
  // In employer flow, status is always passed — so this safely defaults to "full" only when not in employer context.
  const isShortlisted = applicationStatus === undefined || SHORTLISTED_STATUSES.includes(applicationStatus);

  const activity = getActivityLabel(candidate.lastActive);
  const allSkills = getAllSkills(candidate);
  const coreSkills = allSkills.slice(0, 5);
  const additionalSkills = allSkills.slice(5);
  const links = candidate.links || {};
  const hasLinks = links.portfolio_url || links.github_url || links.linkedin_url || links.website_url;

  // Anonymize display when preview-only
  const displayName = isShortlisted ? candidate.fullName : "Kandydat";
  const displayLocation = isShortlisted
    ? candidate.location
    : (candidate.location?.split(",")[0]?.trim() || "—");

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm px-4" onClick={onClose} role="dialog" aria-modal="true" aria-label={`Profil kandydata: ${displayName}`}>
        <LocalErrorBoundary label="Profil kandydata">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-lg max-h-[85vh] overflow-y-auto card-gradient rounded-2xl border border-border p-5 relative"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
            <ReportButton targetType="profile" targetId={candidate.id} targetLabel={displayName} />
            <button ref={closeRef} onClick={onClose} className="text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg p-1" aria-label="Zamknij">
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>

          {/* Hero */}
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-xl bg-secondary flex items-center justify-center text-4xl">
              👤
            </div>
            <div className="flex-1">
              <h3 className="font-display text-xl font-bold text-foreground">{displayName}</h3>
              <p className="text-sm text-primary font-medium">{candidate.title}</p>
              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {displayLocation}
                </span>
                {isShortlisted && candidate.experienceEntries.length > 0 && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {candidate.experienceEntries.length} pozycji
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Badges */}
          <div className="flex items-center gap-2 mb-4 flex-wrap">
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
            {isShortlisted && (
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${activity.color} bg-secondary`}>
                {activity.label}
              </span>
            )}
          </div>

          {/* Match */}
          {match && (
            <div className="mb-4 p-3 rounded-xl bg-secondary/50 border border-border">
              <MatchBadge result={match} />
            </div>
          )}

          {/* Preview-mode notice */}
          {!isShortlisted && (
            <div className="mb-4 p-3 rounded-xl bg-secondary/40 border border-border/60 flex items-start gap-2">
              <Lock className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
              <div className="text-xs text-muted-foreground leading-relaxed">
                <p className="font-medium text-foreground mb-0.5">Podgląd aplikacji</p>
                <p>Pełny profil kandydata (doświadczenie, dane kontaktowe, linki) odsłoni się dopiero po dodaniu do shortlisty.</p>
              </div>
            </div>
          )}

          {/* Summary — shortlisted only */}
          {isShortlisted && candidate.summary && (
            <div className="mb-4">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Podsumowanie</h4>
              <p className="text-sm text-foreground leading-relaxed">{candidate.summary}</p>
            </div>
          )}

          {/* Experience — shortlisted only */}
          {isShortlisted && candidate.experienceEntries && candidate.experienceEntries.length > 0 && (
            <div className="mb-4">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Doświadczenie</h4>
              <div className="space-y-3">
                {candidate.experienceEntries.map((entry, idx) => (
                  <div key={idx} className="pl-3 border-l-2 border-border">
                    <p className="text-sm font-medium text-foreground">
                      {entry.job_title}{entry.company_name ? ` — ${entry.company_name}` : ""}
                    </p>
                    <p className="text-xs text-muted-foreground mb-1">
                      {entry.start_date} – {entry.end_date}
                    </p>
                    {entry.description_points?.filter(Boolean).map((b, bi) => (
                      <p key={bi} className="text-xs text-muted-foreground flex items-start gap-1.5">
                        <span className="mt-0.5">•</span> {b}
                      </p>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Skills */}
          <div className="mb-4">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              {isShortlisted ? "Umiejętności" : "Kluczowe umiejętności"}
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
            {isShortlisted && additionalSkills.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {additionalSkills.map((s) => (
                  <span key={s} className="px-2.5 py-1 rounded-lg text-xs font-medium bg-muted text-muted-foreground">
                    {s}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Languages — shortlisted only */}
          {isShortlisted && candidate.languages && candidate.languages.length > 0 && (
            <div className="mb-4">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Języki</h4>
              <div className="flex flex-wrap gap-1.5">
                {candidate.languages.map((lang, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-lg text-xs font-medium bg-secondary text-secondary-foreground">
                    {lang.name}{lang.level ? ` (${lang.level})` : ""}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Salary — shortlisted only */}
          {isShortlisted && candidate.salaryMin && candidate.salaryMin > 0 && (
            <div className="mb-4">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                Oczekiwania finansowe
              </h4>
              <p className="text-sm text-foreground">
                {candidate.salaryMin > 1000
                  ? `${(candidate.salaryMin / 1000).toFixed(0)} 000 – ${((candidate.salaryMax || candidate.salaryMin) / 1000).toFixed(0)} 000 ${candidate.salaryCurrency || "PLN"} brutto / mies.`
                  : `${candidate.salaryMin} 000 – ${candidate.salaryMax || candidate.salaryMin} 000 ${candidate.salaryCurrency || "PLN"} brutto / mies.`
                }
              </p>
            </div>
          )}

          {/* Links — shortlisted only */}
          {isShortlisted && hasLinks && (
            <div className="mb-2">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Linki</h4>
              <div className="flex gap-2">
                {links.portfolio_url && (
                  <a href={links.portfolio_url} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-secondary hover:bg-muted transition-colors">
                    <Globe className="w-4 h-4 text-primary" />
                  </a>
                )}
                {links.github_url && (
                  <a href={links.github_url} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-secondary hover:bg-muted transition-colors">
                    <Github className="w-4 h-4 text-primary" />
                  </a>
                )}
                {links.linkedin_url && (
                  <a href={links.linkedin_url} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-secondary hover:bg-muted transition-colors">
                    <Linkedin className="w-4 h-4 text-primary" />
                  </a>
                )}
                {links.website_url && (
                  <a href={links.website_url} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-secondary hover:bg-muted transition-colors">
                    <ExternalLink className="w-4 h-4 text-primary" />
                  </a>
                )}
              </div>
            </div>
          )}

          {/* CV — never shown to employers per product rules */}
        </motion.div>
        </LocalErrorBoundary>
      </div>
    </AnimatePresence>
  );
};

export default CandidateProfileModal;
