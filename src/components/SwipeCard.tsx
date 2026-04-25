import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { MapPin, Briefcase, Wifi, GraduationCap, Sparkles, Users, ListChecks, Clock, ChevronRight } from "lucide-react";
import MatchBadge from "@/components/MatchBadge";
import { timeAgo } from "@/lib/timeAgo";
import type { Job } from "@/domain/models";
import type { MatchResult } from "@/lib/matchScoring";

interface SwipeCardProps {
  job: Job;
  onSwipe: (direction: "left" | "right" | "save") => void;
  isTop: boolean;
  matchResult?: MatchResult;
  isSaved?: boolean;
  onTap?: () => void;
  forcedExitDirection?: "left" | "right" | null;
}

const EXIT_SPRING = { type: "spring" as const, stiffness: 68, damping: 16, mass: 0.95 };
const EXIT_DISTANCE = 900;

const SWIPE_THRESHOLD = 80;

const SwipeCard = ({ job, onSwipe, isTop, matchResult, isSaved, onTap, forcedExitDirection }: SwipeCardProps) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useTransform(x, [-320, 320], [-14, 14]);
  const rightOpacity = useTransform(x, [20, 120], [0, 1]);
  const leftOpacity = useTransform(x, [-120, -20], [1, 0]);
  const upOpacity = useTransform(y, [-120, -20], [1, 0]);

  const [exitDirection, setExitDirection] = useState<"left" | "right">("right");
  const didDrag = useRef(false);

  const resolvedExit = forcedExitDirection ?? exitDirection;

  const handleDragStart = () => { didDrag.current = false; };
  const handleDrag = () => { didDrag.current = true; };

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    const { x: dx, y: dy } = info.offset;
    // Vertical swipe up dominates if y is more pronounced
    if (-dy > SWIPE_THRESHOLD && Math.abs(dy) > Math.abs(dx)) {
      onSwipe("save");
      return;
    }
    if (Math.abs(dx) > SWIPE_THRESHOLD) {
      const dir = dx > 0 ? "right" : "left";
      setExitDirection(dir);
      onSwipe(dir);
    }
  };

  const handleTap = () => {
    if (!didDrag.current && onTap) onTap();
  };

  const hasSalary = job.salary && job.salary.trim().length > 0;
  const workMode = job.workMode
    || (job.type === "Remote" || job.location.toLowerCase().includes("zdaln") ? "Zdalnie"
      : job.type === "Contract" ? "Hybrydowo" : "Stacjonarnie");

  const summaryText = job.summary || job.description;
  const highlights = job.highlights || [];
  const seniority = job.seniority || job.experienceLevel;

  // Build metadata items for the compact strip
  const metaItems: { icon: typeof Clock; label: string }[] = [];
  if (job.teamSize) metaItems.push({ icon: Users, label: job.teamSize });
  if (job.recruitmentSteps?.length) metaItems.push({ icon: ListChecks, label: `${job.recruitmentSteps.length} etapów` });
  if (job.posted) metaItems.push({ icon: Clock, label: timeAgo(job.posted) });

  return (
    <motion.div
      className="absolute inset-0"
      style={{ x, y, rotate, zIndex: isTop ? 2 : 1, pointerEvents: isTop ? "auto" : "none", willChange: "transform" }}
      drag={isTop ? true : false}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.18}
      dragMomentum={false}
      onDragStart={handleDragStart}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
      onTap={handleTap}
      initial={{ scale: isTop ? 1 : 0.97, y: isTop ? 0 : 12, opacity: isTop ? 1 : 0.72 }}
      animate={{ scale: isTop ? 1 : 0.97, y: isTop ? 0 : 12, opacity: 1 }}
      exit={{
        x: resolvedExit === "right" ? EXIT_DISTANCE : -EXIT_DISTANCE,
        rotate: resolvedExit === "right" ? 18 : -18,
        scale: 0.96, opacity: 0,
        transition: {
          x: EXIT_SPRING, rotate: EXIT_SPRING,
          scale: { duration: 0.24 }, opacity: { duration: 0.24, ease: "easeOut" },
        },
      }}
    >
      <div
        className="card-gradient ring-highlight shimmer-overlay rounded-3xl shadow-card hover:shadow-card-hover border border-border/70 cursor-grab active:cursor-grabbing h-full flex flex-col overflow-hidden relative"
        data-testid="swipe-card"
      >
        {/* Subtle top accent line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent pointer-events-none" />
        {isTop && (
          <>
            {/* Tint overlays */}
            <motion.div
              className="absolute inset-0 z-10 pointer-events-none rounded-3xl"
              style={{ opacity: rightOpacity, background: "hsl(var(--accent) / 0.18)" }}
            />
            <motion.div
              className="absolute inset-0 z-10 pointer-events-none rounded-3xl"
              style={{ opacity: leftOpacity, background: "hsl(var(--destructive) / 0.18)" }}
            />
            <motion.div
              className="absolute inset-0 z-10 pointer-events-none rounded-3xl"
              style={{ opacity: upOpacity, background: "hsl(45 90% 55% / 0.18)" }}
            />

            <motion.div className="absolute top-6 right-6 z-20 swipe-indicator-right rotate-[-15deg]" style={{ opacity: rightOpacity }}>
              APLIKUJ ✓
            </motion.div>
            <motion.div className="absolute top-6 left-6 z-20 swipe-indicator-left rotate-[15deg]" style={{ opacity: leftOpacity }}>
              POMIŃ ✗
            </motion.div>
            <motion.div
              className="absolute top-6 left-1/2 -translate-x-1/2 z-20 border-2 rounded-xl px-4 py-2 font-bold text-lg uppercase tracking-wider"
              style={{
                opacity: upOpacity,
                borderColor: "hsl(45 90% 55%)",
                color: "hsl(45 90% 55%)",
                background: "hsl(45 90% 55% / 0.10)",
              }}
            >
              ZAPISZ ★
            </motion.div>
          </>
        )}

        <div className="h-full p-4 sm:p-5 lg:p-6 flex flex-col gap-2 lg:gap-3">
          {/* Header: Logo + Title + Company */}
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-secondary flex items-center justify-center shrink-0 overflow-hidden">
              {job.logo && (job.logo.startsWith("http") || job.logo.startsWith("/")) ? (
                <img src={job.logo} alt={`${job.company} logo`} className="w-full h-full object-contain" />
              ) : (
                <span className="text-lg">{job.logo || job.company?.slice(0, 2).toUpperCase()}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-display text-base sm:text-lg lg:text-xl font-bold text-foreground leading-tight line-clamp-2 break-words">{job.title}</h2>
              <p className="text-sm sm:text-base text-primary font-medium line-clamp-1 break-words">{job.company}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {isSaved && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-400/15 text-yellow-400 font-medium border border-yellow-400/30">⭐</span>
              )}
              {matchResult && <MatchBadge result={matchResult} compact />}
            </div>
          </div>

          {/* Salary */}
          <div>
            {hasSalary ? (
              <span className="text-sm sm:text-base font-bold text-accent">{job.salary}</span>
            ) : (
              <span className="text-xs text-muted-foreground italic">Wynagrodzenie nie podane</span>
            )}
          </div>

          {/* Meta chips: location, work mode, type, seniority */}
          <div className="flex flex-wrap gap-1.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground text-[11px] font-medium">
              <MapPin className="w-3 h-3 text-primary" /> {job.location}
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground text-[11px] font-medium">
              <Wifi className="w-3 h-3 text-accent" /> {workMode}
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground text-[11px] font-medium">
              <Briefcase className="w-3 h-3 text-primary" /> {job.contractType || job.type}
            </span>
            {seniority && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground text-[11px] font-medium">
                <GraduationCap className="w-3 h-3 text-primary" /> {seniority}
              </span>
            )}
          </div>

          {/* Summary teaser (max 2 lines) */}
          <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed line-clamp-3 lg:line-clamp-4 break-words">{summaryText}</p>

          {/* Dlaczego warto — offer highlights */}
          {highlights.length > 0 && (
            <div className="rounded-lg bg-accent/5 border border-accent/15 p-2.5">
              <span className="text-[10px] uppercase tracking-wider text-accent font-semibold mb-1.5 block">Dlaczego warto</span>
              <div className="space-y-1">
                {highlights.slice(0, 4).map((h, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-xs text-foreground">
                    <Sparkles className="w-3 h-3 text-accent shrink-0 mt-0.5" />
                    <span className="line-clamp-1">{h}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Compact match score row */}
          {matchResult && (
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-secondary/50 border border-border">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Dopasowanie</span>
              <span className="text-sm font-bold text-foreground">{matchResult.score}%</span>
              {matchResult.reasons.length > 0 && (
                <>
                  <span className="text-border">·</span>
                  <span className="text-[11px] text-muted-foreground truncate flex-1">{matchResult.reasons[0]}</span>
                </>
              )}
              {matchResult.score < 40 && matchResult.matchedSkills.length === 0 && (
                <Link to="/my-profile" className="text-[10px] text-primary font-medium hover:underline whitespace-nowrap ml-auto">
                  Uzupełnij profil →
                </Link>
              )}
            </div>
          )}

          {/* Requirements preview */}
          {job.requirements && job.requirements.length > 0 && (
            <div className="rounded-lg bg-secondary/40 border border-border p-2.5">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5 block">Wymagania</span>
              <div className="space-y-1">
                {job.requirements.slice(0, 4).map((r, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-xs text-foreground/80">
                    <span className="text-primary shrink-0 mt-0.5">•</span>
                    <span className="line-clamp-1">{r}</span>
                  </div>
                ))}
                {job.requirements.length > 4 && (
                  <span className="text-[10px] text-muted-foreground">+{job.requirements.length - 4} więcej</span>
                )}
              </div>
            </div>
          )}

          {/* Bottom section: metadata strip + tech tags */}
          <div className="mt-auto flex flex-col gap-2">
            {/* Metadata strip */}
            {metaItems.length > 0 && (
              <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                {metaItems.map((item, i) => (
                  <span key={i} className="inline-flex items-center gap-1">
                    <item.icon className="w-3 h-3" />
                    {item.label}
                  </span>
                ))}
              </div>
            )}

            {/* Tech stack tags */}
            <div className="flex flex-wrap gap-1.5">
              {job.tags.slice(0, 10).map((tag) => {
                const isMatched = matchResult?.matchedSkills.includes(tag);
                const isMissing = matchResult?.missingSkills.includes(tag);
                return (
                  <span
                    key={tag}
                    className={`px-2 py-0.5 rounded-md text-[11px] font-medium ${
                      isMatched
                        ? "bg-accent/15 text-accent border border-accent/30"
                        : isMissing
                          ? "bg-destructive/10 text-muted-foreground border border-destructive/20"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {tag}
                  </span>
                );
              })}
              {job.tags.length > 10 && (
                <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-muted text-muted-foreground">
                  +{job.tags.length - 10}
                </span>
              )}
            </div>

            {/* Tap hint */}
            <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground/60">
              <span>Kliknij, aby zobaczyć szczegóły</span>
              <ChevronRight className="w-3 h-3" />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default SwipeCard;
