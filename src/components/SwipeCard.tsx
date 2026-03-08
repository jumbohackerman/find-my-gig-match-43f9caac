import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { MapPin, Briefcase } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { pl } from "date-fns/locale";
import MatchBadge from "@/components/MatchBadge";
import type { Job } from "@/domain/models";
import type { MatchResult } from "@/lib/matchScoring";

function formatPosted(raw: string): string {
  if (!raw) return "";
  const date = new Date(raw);
  if (isNaN(date.getTime())) return raw;
  return formatDistanceToNow(date, { addSuffix: true, locale: pl });
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

  const dragStartPos = { x: 0, y: 0 };

  const handleDragStart = (_: any, info: PanInfo) => {
    dragStartPos.x = info.point.x;
    dragStartPos.y = info.point.y;
  };

  const handleDragEnd = (_: any, info: PanInfo) => {
    const absX = Math.abs(info.offset.x);
    if (absX > 120) {
      onSwipe(info.offset.x > 0 ? "right" : "left");
    }
  };

  const handleTap = () => {
    if (onTap) onTap();
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
      onDragEnd={handleDragEnd}
      onTap={handleTap}
      initial={{ scale: isTop ? 1 : 0.95, y: isTop ? 0 : 10 }}
      animate={{ scale: isTop ? 1 : 0.95, y: isTop ? 0 : 10 }}
      exit={{
        x: 300,
        opacity: 0,
        transition: { duration: 0.3 },
      }}
    >
      <div className="card-gradient rounded-2xl shadow-card overflow-hidden border border-border" style={{ maxHeight: 'clamp(260px, 42vh, 380px)' }}>
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
        <div className="p-5 pb-3">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-14 h-14 rounded-xl bg-secondary flex items-center justify-center text-3xl">
              {job.logo}
            </div>
            <div className="flex-1">
              <h3 className="font-display text-sm text-muted-foreground">{job.company}</h3>
              <p className="text-xs text-muted-foreground">{formatPosted(job.posted)}</p>
            </div>
            <div className="flex items-center gap-2">
              {isSaved && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-400/15 text-yellow-400 font-medium border border-yellow-400/30">
                  ⭐ Zapisano
                </span>
              )}
              {matchResult && <MatchBadge result={matchResult} compact />}
            </div>
          </div>

          <h2 className="font-display text-xl font-bold text-foreground mb-1">{job.title}</h2>

          {/* Salary - prominent */}
          <div className="mb-2">
            {hasSalary ? (
              <span className="text-base font-bold text-accent">{job.salary}</span>
            ) : (
              <span className="text-sm text-muted-foreground italic">Wynagrodzenie nie podane</span>
            )}
          </div>

          <p className="text-muted-foreground text-xs leading-relaxed mb-3 line-clamp-2">{job.description}</p>

          {/* Details */}
          <div className="flex items-center gap-4 mb-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="w-3.5 h-3.5 text-primary" />
              {job.location}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Briefcase className="w-3.5 h-3.5 text-primary" />
              {job.type}
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {job.tags.slice(0, 4).map((tag) => {
              const isMatched = matchResult?.matchedSkills.includes(tag);
              const isMissing = matchResult?.missingSkills.includes(tag);
              return (
                <span
                  key={tag}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
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
