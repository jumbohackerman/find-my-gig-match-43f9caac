import { useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, MapPin, Briefcase, Clock, DollarSign, Users, Building2,
  CheckCircle2, ListChecks, Gift, Wifi, GraduationCap,
  Sparkles, ArrowRight, Heart,
} from "lucide-react";
import type { Job } from "@/domain/models";
import type { MatchResult } from "@/lib/matchScoring";
import MatchBadge from "@/components/MatchBadge";
import ReportButton from "@/components/ReportButton";
import LocalErrorBoundary from "@/components/LocalErrorBoundary";
import { timeAgo } from "@/lib/timeAgo";

interface Props {
  job: Job | null;
  matchResult?: MatchResult;
  onClose: () => void;
  onApply?: (job: Job) => void;
}

/* ── Section component ─────────────────────────────────────────────────────── */

const Section = ({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) => (
  <div className="mb-5">
    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
      <Icon className="w-3.5 h-3.5" aria-hidden="true" /> {title}
    </h4>
    {children}
  </div>
);

const BulletList = ({ items, color = "bg-primary" }: { items: string[]; color?: string }) => (
  <ul className="space-y-1.5">
    {items.map((item, i) => (
      <li key={i} className="text-sm text-foreground flex items-start gap-2">
        <span className={`mt-1.5 w-1.5 h-1.5 rounded-full ${color} shrink-0`} aria-hidden="true" />
        {item}
      </li>
    ))}
  </ul>
);

const CheckList = ({ items }: { items: string[] }) => (
  <ul className="space-y-1.5">
    {items.map((item, i) => (
      <li key={i} className="text-sm text-foreground flex items-start gap-2">
        <CheckCircle2 className="w-3.5 h-3.5 text-accent shrink-0 mt-0.5" aria-hidden="true" />
        {item}
      </li>
    ))}
  </ul>
);

const StepList = ({ items }: { items: string[] }) => (
  <ol className="space-y-2">
    {items.map((item, i) => (
      <li key={i} className="text-sm text-foreground flex items-start gap-2.5">
        <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
          {i + 1}
        </span>
        {item}
      </li>
    ))}
  </ol>
);

/* ── Main modal ────────────────────────────────────────────────────────────── */

const JobDetailModal = ({ job, matchResult, onClose, onApply }: Props) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") { onClose(); return; }
    if (e.key !== "Tab" || !dialogRef.current) return;
    const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }, [onClose]);

  useEffect(() => {
    if (!job) return;
    document.addEventListener("keydown", handleKeyDown);
    requestAnimationFrame(() => closeRef.current?.focus());
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [job, handleKeyDown]);

  if (!job) return null;

  const workMode = job.workMode
    || (job.type === "Remote" || job.location.toLowerCase().includes("zdaln") ? "Zdalnie"
      : job.type === "Contract" ? "Hybrydowo" : "Stacjonarnie");

  const hasStructured = !!(job.responsibilities?.length || job.requirements?.length || job.aboutRole);

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm px-3 sm:px-4"
        onClick={onClose}
        role="dialog" aria-modal="true" aria-label={`Szczegóły oferty: ${job.title}`}
      >
        <LocalErrorBoundary label="Szczegóły oferty">
          <motion.div
            ref={dialogRef}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-3xl max-h-[90vh] overflow-y-auto card-gradient rounded-2xl border border-border relative scrollbar-thin"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top bar */}
            <div className="sticky top-0 z-10 bg-background/90 backdrop-blur-md border-b border-border px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center overflow-hidden shrink-0">
                  {job.logo && (job.logo.startsWith("http") || job.logo.startsWith("/")) ? (
                    <img src={job.logo} alt={`${job.company} logo`} className="w-full h-full object-contain" />
                  ) : (
                    <span className="text-base">{job.logo || job.company?.slice(0, 2).toUpperCase()}</span>
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="font-display text-sm font-bold text-foreground truncate">{job.title}</h3>
                  <p className="text-xs text-primary font-medium truncate">{job.company}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <ReportButton targetType="job" targetId={job.id} targetLabel={`${job.title} — ${job.company}`} />
                <button ref={closeRef} onClick={onClose} className="text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg p-1" aria-label="Zamknij">
                  <X className="w-5 h-5" aria-hidden="true" />
                </button>
              </div>
            </div>

            <div className="p-5">
              {/* Hero section */}
              <div className="mb-5">
                <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground mb-1">{job.title}</h2>
                <p className="text-sm text-primary font-medium mb-3">{job.company}</p>

                {/* Meta badges */}
                <div className="flex items-center gap-2 flex-wrap mb-4">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-secondary text-secondary-foreground text-xs font-medium">
                    <MapPin className="w-3 h-3" /> {job.location}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-secondary text-secondary-foreground text-xs font-medium">
                    <Wifi className="w-3 h-3" /> {workMode}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-secondary text-secondary-foreground text-xs font-medium">
                    <Briefcase className="w-3 h-3" /> {job.contractType || job.type}
                  </span>
                  {(job.seniority || job.experienceLevel) && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-secondary text-secondary-foreground text-xs font-medium">
                      <GraduationCap className="w-3 h-3" /> {job.seniority || job.experienceLevel}
                    </span>
                  )}
                  {job.teamSize && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-secondary text-secondary-foreground text-xs font-medium">
                      <Users className="w-3 h-3" /> {job.teamSize}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-secondary text-secondary-foreground text-xs font-medium">
                    <Clock className="w-3 h-3" /> {timeAgo(job.posted)}
                  </span>
                </div>

                {/* Salary box */}
                <div className="p-3 rounded-xl bg-accent/10 border border-accent/20 mb-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-accent" />
                    <span className={`text-base font-bold ${job.salary?.trim() ? 'text-accent' : 'text-muted-foreground italic text-sm'}`}>
                      {job.salary?.trim() ? job.salary : 'Wynagrodzenie nie podane'}
                    </span>
                  </div>
                </div>

                {/* Match */}
                {matchResult && (
                  <div className="p-3 rounded-xl bg-secondary/50 border border-border mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Dopasowanie do Twojego profilu</span>
                      <MatchBadge result={matchResult} compact />
                    </div>
                    {matchResult.reasons.length > 0 && (
                      <div className="space-y-1">
                        {matchResult.reasons.slice(0, 5).map((r, i) => (
                          <p key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                            <span className="mt-0.5">•</span><span>{r}</span>
                          </p>
                        ))}
                      </div>
                    )}
                    {(matchResult.matchedSkills.length > 0 || matchResult.missingSkills.length > 0) && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {matchResult.matchedSkills.map((s) => (
                          <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-accent/15 text-accent font-medium">✓ {s}</span>
                        ))}
                        {matchResult.missingSkills.map((s) => (
                          <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">{s}</span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 2-column layout on desktop */}
              <div className="flex flex-col lg:flex-row gap-5">
                {/* Left column: role details */}
                <div className="flex-1 min-w-0">
                  {/* O roli */}
                  {(job.aboutRole || (!hasStructured && job.description)) && (
                    <Section icon={Sparkles} title="O roli">
                      <p className="text-sm text-foreground leading-relaxed">{job.aboutRole || job.description}</p>
                    </Section>
                  )}

                  {/* Zakres obowiązków */}
                  {job.responsibilities && job.responsibilities.length > 0 && (
                    <Section icon={ListChecks} title="Zakres obowiązków">
                      <BulletList items={job.responsibilities} color="bg-accent" />
                    </Section>
                  )}

                  {/* Wymagania */}
                  {job.requirements && job.requirements.length > 0 && (
                    <Section icon={CheckCircle2} title="Wymagania">
                      <CheckList items={job.requirements} />
                    </Section>
                  )}

                  {/* Mile widziane */}
                  {job.niceToHave && job.niceToHave.length > 0 && (
                    <Section icon={Heart} title="Mile widziane">
                      <BulletList items={job.niceToHave} color="bg-muted-foreground" />
                    </Section>
                  )}

                  {/* Fallback: show description if no structured content */}
                  {!hasStructured && !job.aboutRole && (
                    <Section icon={Sparkles} title="Opis stanowiska">
                      <p className="text-sm text-foreground leading-relaxed">{job.description}</p>
                    </Section>
                  )}
                </div>

                {/* Right column: sidebar */}
                <div className="lg:w-72 shrink-0 space-y-4">
                  {/* CTA */}
                  {onApply && (
                    <button
                      onClick={() => { onApply(job); onClose(); }}
                      className="w-full py-3 rounded-xl btn-gradient text-primary-foreground font-semibold text-sm hover:scale-[1.02] transition-transform flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring shadow-glow"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Aplikuj na to stanowisko
                    </button>
                  )}

                  {/* Benefits */}
                  {job.benefits && job.benefits.length > 0 && (
                    <div className="p-4 rounded-xl bg-secondary/30 border border-border">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                        <Gift className="w-3.5 h-3.5" /> Benefity
                      </h4>
                      <div className="space-y-1.5">
                        {job.benefits.map((b, i) => (
                          <div key={i} className="flex items-start gap-2 text-sm text-foreground">
                            <span className="text-accent mt-0.5">✓</span>
                            {b}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recruitment steps */}
                  {job.recruitmentSteps && job.recruitmentSteps.length > 0 && (
                    <div className="p-4 rounded-xl bg-secondary/30 border border-border">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                        <ArrowRight className="w-3.5 h-3.5" /> Etapy rekrutacji
                      </h4>
                      <StepList items={job.recruitmentSteps} />
                    </div>
                  )}

                  {/* Tech stack */}
                  <div className="p-4 rounded-xl bg-secondary/30 border border-border">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">
                      Tech Stack
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

                  {/* About company */}
                  {job.aboutCompany && (
                    <div className="p-4 rounded-xl bg-secondary/30 border border-border">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5" /> O firmie
                      </h4>
                      <p className="text-sm text-foreground leading-relaxed">{job.aboutCompany}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Mobile CTA (bottom, only on mobile when sidebar CTA scrolled away) */}
              {onApply && (
                <div className="lg:hidden mt-5 sticky bottom-0 pb-1">
                  <button
                    onClick={() => { onApply(job); onClose(); }}
                    className="w-full py-3 rounded-xl btn-gradient text-primary-foreground font-semibold text-sm hover:scale-[1.02] transition-transform flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring shadow-glow"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Aplikuj na to stanowisko
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </LocalErrorBoundary>
      </div>
    </AnimatePresence>
  );
};

export default JobDetailModal;
