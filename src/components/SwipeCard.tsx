import { useState, useRef } from "react";
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { MapPin, Clock, Briefcase, Wifi } from "lucide-react";
import { pl } from "date-fns/locale";
import MatchBadge from "@/components/MatchBadge";
import type { Job } from "@/domain/models";
import type { MatchResult } from "@/lib/matchScoring";

function formatPosted(raw: string): string {
  if (!raw) return "";
  const date = new Date(raw);
  if (isNaN(date.getTime())) return raw;
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
}

interface SwipeCardProps {
  job: Job;
  onSwipe: (direction: "left" | "right" | "save") => void;
  isTop: boolean;
  matchResult?: MatchResult;
  isSaved?: boolean;
  onTap?: () => void;
}

const SwipeCard = ({ job, onSwipe, isTop, matchResult, isSaved, onTap }: SwipeCardProps) => {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const rightOpacity = useTransform(x, [0, 100], [0, 1]);
  const leftOpacity = useTransform(x, [-100, 0], [1, 0]);

  const [exitDirection, setExitDirection] = useState<"left" | "right">("right");
  const didDrag = useRef(false);

  const handleDragStart = () => {
    didDrag.current = false;
  };

  const handleDrag = () => {
    didDrag.current = true;
  };

  const handleDragEnd = (_: any, info: PanInfo) => {
    const absX = Math.abs(info.offset.x);
    if (absX > 120) {
      const dir = info.offset.x > 0 ? "right" : "left";
      setExitDirection(dir);
      onSwipe(dir);
    }
  };

  const handleTap = () => {
    // Only open details if no drag occurred
    if (!didDrag.current && onTap) onTap();
  };

  const hasSalary = job.salary && job.salary.trim().length > 0;
  const workMode = job.type === "Remote" || job.location.toLowerCase().includes("zdaln") ? "Zdalnie" : job.type === "Contract" ? "Hybrydowo" : "Stacjonarnie";

  return (
    <motion.div
      className="absolute inset-x-0 top-0 cursor-grab active:cursor-grabbing"
      style={{ x, rotate, zIndex: isTop ? 10 : 0 }}
      drag={isTop ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.9}
      onDragStart={handleDragStart}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
      onTap={handleTap}
      initial={{ scale: isTop ? 1 : 0.95, y: isTop ? 0 : 10 }}
      animate={{ scale: isTop ? 1 : 0.95, y: isTop ? 0 : 10 }}
      exit={{
        x: exitDirection === "right" ? 300 : -300,
        opacity: 0,
        transition: { duration: 0.3 },
      }}
    >
      <div className="card-gradient rounded-2xl shadow-card overflow-hidden border border-border">
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

        {/* Company header */}
        <div className="p-4 pb-3">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center text-2xl shrink-0">
              {job.logo}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-display text-sm text-muted-foreground truncate">{job.company}</h3>
              <p className="text-xs text-muted-foreground">{formatPosted(job.posted)}</p>
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

          <h2 className="font-display text-lg font-bold text-foreground mb-0.5 leading-tight">{job.title}</h2>

          {/* Salary */}
          <div className="mb-1.5">
            {hasSalary ? (
              <span className="text-sm font-bold text-accent">{job.salary}</span>
            ) : (
              <span className="text-xs text-muted-foreground italic">Wynagrodzenie nie podane</span>
            )}
          </div>

          <p className="text-muted-foreground text-xs leading-relaxed mb-2 line-clamp-2">{job.description}</p>

          {/* Match explainability */}
          {matchResult && (
            <div className="mb-2 p-2 rounded-xl bg-secondary/50 border border-border">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">
                Dlaczego to pasuje
              </p>
              <MatchBadge result={matchResult} />
            </div>
          )}

          {/* Details */}
          <div className="grid grid-cols-2 gap-1.5 mb-2">
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
              {formatPosted(job.posted)}
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
