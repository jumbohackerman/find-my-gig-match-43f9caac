import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, MapPin, Clock, Globe, Github, Linkedin, ExternalLink,
  Lock, Briefcase, Code2, Languages as LanguagesIcon, Banknote,
  Sparkles, GraduationCap, Wifi, CalendarClock,
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

const SHORTLISTED_STATUSES: ApplicationStatus[] = ["shortlisted", "interview", "hired"];

/* ── Section helper (mirrors JobDetailModal) ────────────────────────────── */
const Section = ({
  icon: Icon,
  title,
  children,
}: {
  icon: any;
  title: string;
  children: React.ReactNode;
}) => (
  <div className="mb-5">
    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
      <Icon className="w-3.5 h-3.5 text-primary" aria-hidden="true" /> {title}
    </h4>
    {children}
  </div>
);

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

  const isShortlisted = applicationStatus === undefined || SHORTLISTED_STATUSES.includes(applicationStatus);
  const activity = getActivityLabel(candidate.lastActive);
  const allSkills = getAllSkills(candidate);
  const links = candidate.links || {};
  const hasLinks = links.portfolio_url || links.github_url || links.linkedin_url || links.website_url;

  const displayName = isShortlisted ? candidate.fullName : "Kandydat";
  const displayLocation = isShortlisted
    ? candidate.location
    : (candidate.location?.split(",")[0]?.trim() || "—");

  const formatSalary = () => {
    if (!candidate.salaryMin || candidate.salaryMin <= 0) return null;
    const min = candidate.salaryMin > 1000 ? Math.round(candidate.salaryMin / 1000) : candidate.salaryMin;
    const maxRaw = candidate.salaryMax || candidate.salaryMin;
    const max = maxRaw > 1000 ? Math.round(maxRaw / 1000) : maxRaw;
    return `${min} 000 – ${max} 000 ${candidate.salaryCurrency || "PLN"}`;
  };
  const salaryStr = formatSalary();

  const content = (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm px-3 sm:px-4"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-label={`Profil kandydata: ${displayName}`}
      >
        <LocalErrorBoundary label="Profil kandydata">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-3xl max-h-[90vh] overflow-y-auto card-gradient rounded-2xl border border-border relative scrollbar-thin"
            onClick={(e) => e.stopPropagation()}
          >
            {/* ── Sticky top bar ── */}
            <div className="sticky top-0 z-10 bg-background/90 backdrop-blur-md border-b border-border px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-2xl shrink-0">
                  👤
                </div>
                <div className="min-w-0">
                  <h3 className="font-display text-sm font-bold text-foreground truncate">{displayName}</h3>
                  <p className="text-xs text-primary font-medium truncate">{candidate.title}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <ReportButton targetType="profile" targetId={candidate.id} targetLabel={displayName} />
                <button
                  ref={closeRef}
                  onClick={onClose}
                  className="text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg p-1"
                  aria-label="Zamknij"
                >
                  <X className="w-5 h-5" aria-hidden="true" />
                </button>
              </div>
            </div>

            <div className="p-5">
              {/* ── Hero ── */}
              <div className="mb-5">
                <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground mb-1">{displayName}</h2>
                <p className="text-sm text-primary font-medium mb-3">{candidate.title}</p>

                {/* Meta badges */}
                <div className="flex items-center gap-2 flex-wrap mb-4">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-secondary text-secondary-foreground text-xs font-medium">
                    <MapPin className="w-3 h-3" /> {displayLocation}
                  </span>
                  {candidate.workMode && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-secondary text-secondary-foreground text-xs font-medium">
                      <Wifi className="w-3 h-3" /> {candidate.workMode}
                    </span>
                  )}
                  {candidate.seniority && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-secondary text-secondary-foreground text-xs font-medium">
                      <GraduationCap className="w-3 h-3" /> {candidate.seniority}
                    </span>
                  )}
                  {candidate.employmentType && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-secondary text-secondary-foreground text-xs font-medium">
                      <Briefcase className="w-3 h-3" /> {candidate.employmentType}
                    </span>
                  )}
                  {isShortlisted && (
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-secondary text-xs font-medium ${activity.color}`}>
                      <Clock className="w-3 h-3" /> {activity.label}
                    </span>
                  )}
                </div>

                {/* Salary highlight box */}
                {isShortlisted && salaryStr && (
                  <div className="p-3 rounded-xl bg-accent/10 border border-accent/20 mb-4">
                    <div className="flex items-center gap-2">
                      <Banknote className="w-4 h-4 text-accent" />
                      <span className="text-base font-bold text-accent">{salaryStr}</span>
                      <span className="text-xs text-muted-foreground">brutto / mies.</span>
                    </div>
                  </div>
                )}

                {/* Match */}
                {match && (
                  <div className="p-3 rounded-xl bg-secondary/50 border border-border mb-4">
                    <MatchBadge result={match} />
                  </div>
                )}

                {/* Preview-mode notice */}
                {!isShortlisted && (
                  <div className="p-3 rounded-xl bg-secondary/40 border border-border/60 flex items-start gap-2 mb-4">
                    <Lock className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                    <div className="text-xs text-muted-foreground leading-relaxed">
                      <p className="font-medium text-foreground mb-0.5">Podgląd aplikacji</p>
                      <p>Pełny profil kandydata (doświadczenie, dane kontaktowe, linki) odsłoni się dopiero po dodaniu do shortlisty.</p>
                    </div>
                  </div>
                )}
              </div>

              {/* ── Two-column layout on desktop ── */}
              <div className="flex flex-col lg:flex-row gap-5">
                {/* LEFT: summary + experience */}
                <div className="flex-1 min-w-0">
                  {/* Podsumowanie */}
                  {isShortlisted && candidate.summary && (
                    <Section icon={Sparkles} title="Podsumowanie">
                      <p className="text-sm text-foreground leading-relaxed">{candidate.summary}</p>
                    </Section>
                  )}

                  {/* Doświadczenie */}
                  {isShortlisted && candidate.experienceEntries && candidate.experienceEntries.length > 0 && (
                    <Section icon={Briefcase} title="Doświadczenie">
                      <div className="space-y-3">
                        {candidate.experienceEntries.map((entry, idx) => (
                          <div key={idx} className="pl-3 border-l-2 border-primary/40">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-foreground truncate">
                                  {entry.company_name || "—"}
                                </p>
                                <p className="text-sm text-primary font-medium">{entry.job_title}</p>
                              </div>
                              <span className="text-[11px] text-muted-foreground shrink-0 whitespace-nowrap mt-0.5">
                                {entry.start_date} – {entry.is_current ? "Obecnie" : (entry.end_date || "—")}
                              </span>
                            </div>
                            {entry.description_points && entry.description_points.filter(Boolean).length > 0 && (
                              <ul className="space-y-1 mt-1.5">
                                {entry.description_points.filter(Boolean).map((b, bi) => (
                                  <li key={bi} className="text-xs text-muted-foreground flex items-start gap-2">
                                    <span className="mt-1.5 w-1 h-1 rounded-full bg-primary shrink-0" aria-hidden="true" />
                                    <span>{b}</span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        ))}
                      </div>
                    </Section>
                  )}

                  {/* Empty-state hint when shortlisted but no experience */}
                  {isShortlisted && (!candidate.experienceEntries || candidate.experienceEntries.length === 0) && !candidate.summary && (
                    <Section icon={Sparkles} title="Profil">
                      <p className="text-sm text-muted-foreground italic">Brak dodatkowych informacji.</p>
                    </Section>
                  )}
                </div>

                {/* RIGHT: sidebar */}
                <div className="lg:w-72 shrink-0 space-y-4">
                  {/* Umiejętności */}
                  <div className="p-4 rounded-xl bg-secondary/30 border border-border">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                      <Code2 className="w-3.5 h-3.5 text-primary" /> Umiejętności
                    </h4>
                    {allSkills.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {allSkills.map((s) => {
                          const matched = match?.matchedSkills.includes(s);
                          return (
                            <span
                              key={s}
                              className={`px-2 py-0.5 rounded-md text-[11px] font-medium ${
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
                    ) : (
                      <p className="text-xs text-muted-foreground italic">Nie dodano</p>
                    )}
                  </div>

                  {/* Języki */}
                  {isShortlisted && candidate.languages && candidate.languages.length > 0 && (
                    <div className="p-4 rounded-xl bg-secondary/30 border border-border">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                        <LanguagesIcon className="w-3.5 h-3.5 text-primary" /> Języki
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {candidate.languages.map((lang, i) => (
                          <span key={i} className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-muted text-foreground">
                            {lang.name}{lang.level ? ` (${lang.level})` : ""}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Dostępność */}
                  {candidate.availability && (
                    <div className="p-4 rounded-xl bg-secondary/30 border border-border">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <CalendarClock className="w-3.5 h-3.5 text-primary" /> Dostępność
                      </h4>
                      <p className="text-sm text-foreground">{candidate.availability}</p>
                    </div>
                  )}

                  {/* Linki */}
                  {isShortlisted && hasLinks && (
                    <div className="p-4 rounded-xl bg-secondary/30 border border-border">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-primary" /> Linki
                      </h4>
                      <div className="space-y-1.5">
                        {links.portfolio_url && (
                          <a href={links.portfolio_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-foreground hover:text-primary transition-colors">
                            <Globe className="w-3.5 h-3.5" /> Portfolio
                          </a>
                        )}
                        {links.github_url && (
                          <a href={links.github_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-foreground hover:text-primary transition-colors">
                            <Github className="w-3.5 h-3.5" /> GitHub
                          </a>
                        )}
                        {links.linkedin_url && (
                          <a href={links.linkedin_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-foreground hover:text-primary transition-colors">
                            <Linkedin className="w-3.5 h-3.5" /> LinkedIn
                          </a>
                        )}
                        {links.website_url && (
                          <a href={links.website_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-foreground hover:text-primary transition-colors">
                            <ExternalLink className="w-3.5 h-3.5" /> Strona
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* CV — never shown to employers per product rules */}
          </motion.div>
        </LocalErrorBoundary>
      </div>
    </AnimatePresence>
  );

  return createPortal(content, document.body);
};

export default CandidateProfileModal;
