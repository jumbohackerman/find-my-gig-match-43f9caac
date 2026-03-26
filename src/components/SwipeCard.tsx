import { useState, useRef } from "react";
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { MapPin, Briefcase, Wifi, GraduationCap, Sparkles } from "lucide-react";
import MatchBadge from "@/components/MatchBadge";
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

const SwipeCard = ({ job, onSwipe, isTop, matchResult, isSaved, onTap, forcedExitDirection }: SwipeCardProps) => {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-320, 320], [-14, 14]);
  const rightOpacity = useTransform(x, [20, 120], [0, 1]);
  const leftOpacity = useTransform(x, [-120, -20], [1, 0]);

  const [exitDirection, setExitDirection] = useState<"left" | "right">("right");
  const didDrag = useRef(false);

  const resolvedExit = forcedExitDirection ?? exitDirection;

  const handleDragStart = () => { didDrag.current = false; };
  const handleDrag = () => { didDrag.current = true; };

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (Math.abs(info.offset.x) > 100) {
      const dir = info.offset.x > 0 ? "right" : "left";
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

  return (
    <motion.div
      className="absolute inset-0"
      style={{ x, rotate, zIndex: isTop ? 2 : 1, pointerEvents: isTop ? "auto" : "none", willChange: "transform" }}
      drag={isTop ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
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
        className="card-gradient rounded-2xl shadow-card border border-border cursor-grab active:cursor-grabbing h-full flex flex-col overflow-hidden"
        data-testid="swipe-card"
      >
        {isTop && (
          <>
            <motion.div className="absolute top-6 right-6 z-20 swipe-indicator-right rotate-[-15deg]" style={{ opacity: rightOpacity }}>
              APLIKUJ ✓
            </motion.div>
            <motion.div className="absolute top-6 left-6 z-20 swipe-indicator-left rotate-[15deg]" style={{ opacity: leftOpacity }}>
              POMIŃ ✗
            </motion.div>
          </>
        )}

        <div className="h-full p-4 sm:p-5 flex flex-col gap-2.5">
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
              <h2 className="font-display text-base sm:text-lg font-bold text-foreground leading-tight truncate">{job.title}</h2>
              <p className="text-sm text-primary font-medium truncate">{job.company}</p>
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
              <span className="text-sm font-bold text-accent">{job.salary}</span>
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
          <p className="text-muted-foreground text-xs leading-relaxed line-clamp-2">{summaryText}</p>

          {/* Key highlights (max 3) */}
          {highlights.length > 0 && (
            <div className="space-y-1">
              {highlights.slice(0, 3).map((h, i) => (
                <div key={i} className="flex items-start gap-1.5 text-xs text-foreground">
                  <Sparkles className="w-3 h-3 text-accent shrink-0 mt-0.5" />
                  <span className="line-clamp-1">{h}</span>
                </div>
              ))}
            </div>
          )}

          {/* Match score box */}
          {matchResult && (
            <div className="p-2.5 rounded-xl bg-secondary/50 border border-border">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Dopasowanie</span>
                <span className="text-sm font-bold text-foreground">{matchResult.score}%</span>
              </div>
              {matchResult.reasons.length > 0 && (
                <p className="text-[11px] text-muted-foreground mt-1 line-clamp-1">{matchResult.reasons[0]}</p>
              )}
            </div>
          )}

          {/* Tech stack tags */}
          <div className="mt-auto pt-1 flex flex-wrap gap-1.5">
            {job.tags.slice(0, 6).map((tag) => {
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
            {job.tags.length > 6 && (
              <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-muted text-muted-foreground">
                +{job.tags.length - 6}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default SwipeCard;
