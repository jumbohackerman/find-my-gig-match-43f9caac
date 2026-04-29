import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { MapPin, Briefcase, Sparkles, Users, ListChecks, Clock, ChevronRight, Shield, GraduationCap, Building2, Gift, CalendarDays, Languages } from "lucide-react";
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
  hasConsent?: boolean;
}

const EXIT_SPRING = { type: "spring" as const, stiffness: 68, damping: 16, mass: 0.95 };
const EXIT_DISTANCE = 900;

const SWIPE_THRESHOLD = 80;

let lastThresholdVibration = 0;
const vibrateOnThreshold = () => {
  const now = Date.now();
  if (now - lastThresholdVibration > 300 && typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
    navigator.vibrate(10);
    lastThresholdVibration = now;
  }
};

const SwipeCard = ({ job, onSwipe, isTop, matchResult, isSaved, onTap, forcedExitDirection, hasConsent = true }: SwipeCardProps) => {
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
  const handleDrag = () => {
    didDrag.current = true;
    const xVal = x.get();
    const yVal = y.get();
    if (Math.abs(xVal) > SWIPE_THRESHOLD * 0.8 || -yVal > SWIPE_THRESHOLD * 0.8) {
      vibrateOnThreshold();
    }
  };

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
        className="rounded-3xl shadow-card hover:shadow-card-hover border border-border/60 cursor-grab active:cursor-grabbing h-full flex flex-col overflow-hidden relative"
        style={{
          background: "linear-gradient(160deg, hsl(var(--card)) 0%, hsl(var(--card) / 0.92) 55%, hsl(var(--background)) 100%)",
        }}
        data-testid="swipe-card"
      >
        {/* Top accent line — primary glow */}
        <div
          className="absolute top-0 left-0 right-0 h-[2px] rounded-t-3xl pointer-events-none"
          style={{ background: "linear-gradient(90deg, transparent, hsl(var(--primary) / 0.6), transparent)" }}
        />

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

        <div className="flex-1 overflow-y-auto overscroll-contain scrollbar-none p-4 sm:p-5 flex flex-col">
          {/* Header: Logo + Company label + Title + Match */}
          <div className="flex items-start gap-3 mb-2">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 overflow-hidden border border-border/60"
              style={{
                background: "linear-gradient(135deg, hsl(var(--primary) / 0.15), hsl(var(--card) / 0.4))",
              }}
            >
              {job.logo && (job.logo.startsWith("http") || job.logo.startsWith("/")) ? (
                <img src={job.logo} alt={`${job.company} logo`} className="w-full h-full object-contain" />
              ) : (
                <span className="text-2xl">{job.logo || job.company?.slice(0, 2).toUpperCase()}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium line-clamp-1">
                {job.company}
              </p>
              <h2 className="font-display font-bold text-foreground leading-tight text-base sm:text-[17px] line-clamp-2 mt-0.5 break-words">
                {job.title}
              </h2>
            </div>
            <div className="flex flex-col items-end gap-1.5 shrink-0">
              {matchResult && <MatchBadge result={matchResult} compact />}
              {isSaved && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-yellow-400/15 text-yellow-400 font-medium border border-yellow-400/30">⭐</span>
              )}
            </div>
          </div>

          {/* Meta chips: location, work mode, seniority */}
          <div className="flex flex-wrap gap-1.5 mb-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-secondary/60 border border-border/60 text-[11px] text-foreground/80">
              <MapPin className="w-3 h-3" /> {job.location}
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-secondary/60 border border-border/60 text-[11px] text-foreground/80">
              {workMode}
            </span>
            {seniority && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-secondary/60 border border-border/60 text-[11px] text-foreground/80">
                <Briefcase className="w-3 h-3" /> {seniority}
              </span>
            )}
          </div>

          {/* Summary */}
          {summaryText && (
            <p className="text-[12px] text-muted-foreground leading-relaxed mb-2.5 line-clamp-2 break-words">
              {summaryText}
            </p>
          )}

          {/* Tech tags — primary-tinted like demo */}
          {job.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2.5">
              {job.tags.slice(0, 6).map((tag) => {
                const isMatched = matchResult?.matchedSkills.includes(tag);
                const isMissing = matchResult?.missingSkills.includes(tag);
                return (
                  <span
                    key={tag}
                    className={`px-2 py-0.5 rounded-md text-[11px] font-medium border ${
                      isMatched
                        ? "bg-accent/15 text-accent border-accent/35"
                        : isMissing
                          ? "bg-destructive/10 text-muted-foreground border-destructive/25"
                          : "bg-primary/10 text-primary border-primary/30"
                    }`}
                  >
                    {tag}
                  </span>
                );
              })}
              {job.tags.length > 6 && (
                <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-secondary/60 text-muted-foreground border border-border/60">
                  +{job.tags.length - 6}
                </span>
              )}
            </div>
          )}

          {/* Compact info grid — 2 columns with icons */}
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 mb-2.5 text-[10.5px] text-muted-foreground">
            {job.experienceLevel && (
              <div className="flex items-center gap-1.5">
                <GraduationCap className="w-3 h-3 text-muted-foreground/60 shrink-0" />
                <span className="truncate">{job.experienceLevel}</span>
              </div>
            )}
            {(job.contractType || job.type) && (
              <div className="flex items-center gap-1.5">
                <Building2 className="w-3 h-3 text-muted-foreground/60 shrink-0" />
                <span className="truncate">{job.contractType || job.type}</span>
              </div>
            )}
            {job.teamSize && (
              <div className="flex items-center gap-1.5">
                <Users className="w-3 h-3 text-muted-foreground/60 shrink-0" />
                <span className="truncate">{job.teamSize}</span>
              </div>
            )}
            {job.recruitmentSteps?.length ? (
              <div className="flex items-center gap-1.5">
                <ListChecks className="w-3 h-3 text-muted-foreground/60 shrink-0" />
                <span className="truncate">{job.recruitmentSteps.length} etapów</span>
              </div>
            ) : null}
            {job.posted && (
              <div className="flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-muted-foreground/60 shrink-0" />
                <span className="truncate">{timeAgo(job.posted)}</span>
              </div>
            )}
          </div>

          {/* Oferujemy — benefits / highlights */}
          {(job.benefits?.length || highlights.length > 0) && (
            <div className="mb-2">
              <p className="text-[9.5px] uppercase tracking-wider text-muted-foreground/70 font-semibold mb-1">
                Oferujemy
              </p>
              <ul className="space-y-0.5">
                {(job.benefits && job.benefits.length > 0 ? job.benefits : highlights).slice(0, 2).map((b, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-[11px] text-foreground/80 leading-snug">
                    <Gift className="w-3 h-3 text-primary/80 shrink-0 mt-[2px]" />
                    <span className="line-clamp-1">{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Highlights inline — single line with sparkle */}
          {highlights.length > 0 && job.benefits && job.benefits.length > 0 && (
            <div className="flex items-center gap-1.5 text-[10.5px] text-muted-foreground mb-2">
              <Sparkles className="w-3 h-3 text-primary/70 shrink-0" />
              <span className="truncate">{highlights.slice(0, 3).join(" · ")}</span>
            </div>
          )}

          {/* Match score row — compact */}
          {matchResult && (
            <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-secondary/40 border border-border/50 mb-2">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Dopasowanie</span>
              <span className={`text-xs font-bold ${
                matchResult.score >= 75 ? "text-accent" :
                matchResult.score >= 50 ? "text-yellow-500" :
                matchResult.score >= 30 ? "text-orange-400" :
                "text-destructive"
              }`}>{matchResult.score}%</span>
              {matchResult.reasons.length > 0 && (
                <>
                  <span className="text-border">·</span>
                  <span className="text-[10px] text-muted-foreground truncate flex-1">{matchResult.reasons[0]}</span>
                </>
              )}
              {matchResult.score < 40 && matchResult.matchedSkills.length === 0 && (
                <Link to="/my-profile" className="text-[10px] text-primary font-medium hover:underline whitespace-nowrap ml-auto" onClick={(e) => e.stopPropagation()}>
                  Uzupełnij profil →
                </Link>
              )}
            </div>
          )}

          {/* Footer: Salary (left) + Tap hint / consent (right) — separated by border */}
          <div className="mt-auto pt-3 border-t border-border/60">
            <div className="flex items-end justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground/70 uppercase tracking-wider mb-0.5">
                  Wynagrodzenie
                </p>
                {hasSalary ? (
                  <span className="font-semibold text-foreground text-[13px] truncate block">{job.salary}</span>
                ) : (
                  <span className="text-[11px] text-muted-foreground italic">Nie podane</span>
                )}
              </div>
              {job.recruitmentSteps?.length ? (
                <div className="text-right shrink-0">
                  <p className="text-[10px] text-muted-foreground/70 uppercase tracking-wider mb-0.5">
                    Etapy
                  </p>
                  <span className="font-semibold text-foreground/80 text-[13px]">{job.recruitmentSteps.length}</span>
                </div>
              ) : null}
            </div>

            {/* RODO consent banner */}
            {!hasConsent && isTop && (
              <Link
                to="/my-profile"
                className="mt-2 flex items-center gap-2 px-3 py-2 rounded-lg bg-yellow-400/10 border border-yellow-400/20 text-[11px] text-yellow-500 font-medium hover:bg-yellow-400/20 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <Shield className="w-3.5 h-3.5 shrink-0" />
                <span>Udziel zgody RODO aby móc aplikować</span>
                <ChevronRight className="w-3 h-3 ml-auto shrink-0" />
              </Link>
            )}

            {/* Tap hint */}
            <div className="mt-2 flex items-center justify-center gap-1 text-[9px] text-muted-foreground/60">
              <span>Kliknij, aby zobaczyć szczegóły</span>
              <ChevronRight className="w-2.5 h-2.5" />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default SwipeCard;
