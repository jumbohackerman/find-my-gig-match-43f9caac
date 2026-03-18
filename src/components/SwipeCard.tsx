import { useState, useRef } from "react";
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { MapPin, Clock, Briefcase, Wifi } from "lucide-react";
import MatchBadge from "@/components/MatchBadge";
import type { Job } from "@/domain/models";
import type { MatchResult } from "@/lib/matchScoring";
import { timeAgo } from "@/lib/timeAgo";

interface SwipeCardProps {
  job: Job;
  onSwipe: (direction: "left" | "right" | "save") => void;
  isTop: boolean;
  matchResult?: MatchResult;
  isSaved?: boolean;
  onTap?: () => void;
  forcedExitDirection?: "left" | "right" | null;
}

/* ── Premium spring config ─────────────────────────────────────────────── */
const EXIT_SPRING = { type: "spring" as const, stiffness: 80, damping: 18, mass: 1.2 };

const SwipeCard = ({ job, onSwipe, isTop, matchResult, isSaved, onTap, forcedExitDirection }: SwipeCardProps) => {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-300, 300], [-12, 12]);
  const rightOpacity = useTransform(x, [0, 80], [0, 1]);
  const leftOpacity = useTransform(x, [-80, 0], [1, 0]);

  const [exitDirection, setExitDirection] = useState<"left" | "right">("right");
  const didDrag = useRef(false);

  const resolvedExit = forcedExitDirection ?? exitDirection;

  const handleDragStart = () => { didDrag.current = false; };
  const handleDrag = () => { didDrag.current = true; };

  const handleDragEnd = (_: any, info: PanInfo) => {
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
  const workMode =
    job.type === "Remote" || job.location.toLowerCase().includes("zdaln")
      ? "Zdalnie"
      : job.type === "Contract"
      ? "Hybrydowo"
      : "Stacjonarnie";

  return (
    <motion.div
      className="absolute inset-0"
      style={{
        x,
        rotate,
        zIndex: isTop ? 2 : 1,
        pointerEvents: isTop ? "auto" : "none",
      }}
      drag={isTop ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.7}
      onDragStart={handleDragStart}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
      onTap={handleTap}
      initial={{ scale: isTop ? 1 : 0.96, y: isTop ? 0 : 10, opacity: isTop ? 1 : 0.7 }}
      animate={{ scale: isTop ? 1 : 0.96, y: isTop ? 0 : 10, opacity: 1 }}
      exit={{
        x: resolvedExit === "right" ? 600 : -600,
        rotate: resolvedExit === "right" ? 15 : -15,
        opacity: 0,
        transition: {
          x: EXIT_SPRING,
          rotate: EXIT_SPRING,
          opacity: { duration: 0.35, delay: 0.1 },
        },
      }}
    >
      <div
        className="card-gradient rounded-2xl shadow-card border border-border cursor-grab active:cursor-grabbing h-full flex flex-col"
        data-testid="swipe-card"
      >
        {/* Swipe indicators */}
        {isTop && (
          <>
            <motion.div
              className="absolute top-6 right-6 z-20 swipe-indicator-right rotate-[-15deg]"
              style={{ opacity: rightOpacity }}
            >
              APLIKUJ ✓
            </motion.div>
            <motion.div
              className="absolute top-6 left-6 z-20 swipe-indicator-left rotate-[15deg]"
              style={{ opacity: leftOpacity }}
            >
              POMIŃ ✗
            </motion.div>
          </>
        )}

        {/* Card content — single scrollable region if needed */}
        <div className="p-4 sm:p-5 flex-1 min-h-0 overflow-y-auto">
          {/* Company header */}
          <div className="flex items-center gap-3 mb-2.5">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-secondary flex items-center justify-center text-xl sm:text-2xl shrink-0">
              {job.logo}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-display text-sm text-muted-foreground truncate">{job.company}</h3>
              <p className="text-xs text-muted-foreground">{timeAgo(job.posted)}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {isSaved && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-400/15 text-yellow-400 font-medium border border-yellow-400/30">
                  ⭐
                </span>
              )}
              {matchResult && <MatchBadge result={matchResult} compact />}
            </div>
          </div>

          <h2 className="font-display text-base sm:text-lg font-bold text-foreground mb-1 leading-tight">{job.title}</h2>

          {/* Salary */}
          <div className="mb-2">
            {hasSalary ? (
              <span className="text-sm font-bold text-accent">{job.salary}</span>
            ) : (
              <span className="text-xs text-muted-foreground italic">Wynagrodzenie nie podane</span>
            )}
          </div>

          <p className="text-muted-foreground text-xs leading-relaxed mb-3 line-clamp-2">{job.description}</p>

          {/* Match explainability */}
          {matchResult && (
            <div className="mb-3 p-2.5 rounded-xl bg-secondary/50 border border-border">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">
                Dlaczego to pasuje
              </p>
              <MatchBadge result={matchResult} />
            </div>
          )}

          {/* Details grid */}
          <div className="grid grid-cols-2 gap-1.5 mb-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="w-3 h-3 text-primary shrink-0" />
              <span className="truncate">{job.location}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Briefcase className="w-3 h-3 text-primary shrink-0" />
              {job.type}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Wifi className="w-3 h-3 text-accent shrink-0" />
              {workMode}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="w-3 h-3 text-muted-foreground shrink-0" />
              {timeAgo(job.posted)}
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5">
            {job.tags.map((tag) => {
              const isMatched = matchResult?.matchedSkills.includes(tag);
              const isMissing = matchResult?.missingSkills.includes(tag);
              return (
                <span
                  key={tag}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium ${
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
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default SwipeCard;
