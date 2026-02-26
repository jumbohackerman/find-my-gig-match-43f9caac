import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { MapPin, Clock, Briefcase, DollarSign } from "lucide-react";
import type { Job } from "@/data/jobs";

interface SwipeCardProps {
  job: Job;
  onSwipe: (direction: "left" | "right") => void;
  isTop: boolean;
}

const SwipeCard = ({ job, onSwipe, isTop }: SwipeCardProps) => {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const rightOpacity = useTransform(x, [0, 100], [0, 1]);
  const leftOpacity = useTransform(x, [-100, 0], [1, 0]);

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.x > 120) {
      onSwipe("right");
    } else if (info.offset.x < -120) {
      onSwipe("left");
    }
  };

  return (
    <motion.div
      className="absolute w-full cursor-grab active:cursor-grabbing"
      style={{ x, rotate, zIndex: isTop ? 10 : 0 }}
      drag={isTop ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.9}
      onDragEnd={handleDragEnd}
      initial={{ scale: isTop ? 1 : 0.95, y: isTop ? 0 : 10 }}
      animate={{ scale: isTop ? 1 : 0.95, y: isTop ? 0 : 10 }}
      exit={{
        x: 300,
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
              APPLY ✓
            </motion.div>
            <motion.div
              className="absolute top-6 left-6 z-20 swipe-indicator-left rotate-[15deg]"
              style={{ opacity: leftOpacity }}
            >
              SKIP ✗
            </motion.div>
          </>
        )}

        {/* Company header */}
        <div className="p-6 pb-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-xl bg-secondary flex items-center justify-center text-3xl">
              {job.logo}
            </div>
            <div>
              <h3 className="font-display text-sm text-muted-foreground">{job.company}</h3>
              <p className="text-xs text-muted-foreground">{job.posted}</p>
            </div>
            <span className="ml-auto px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-medium">
              {job.type}
            </span>
          </div>

          <h2 className="font-display text-2xl font-bold text-foreground mb-3">{job.title}</h2>
          <p className="text-muted-foreground text-sm leading-relaxed mb-4">{job.description}</p>

          {/* Details */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4 text-primary" />
              {job.location}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <DollarSign className="w-4 h-4 text-accent" />
              {job.salary}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Briefcase className="w-4 h-4 text-primary" />
              {job.type}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4 text-accent" />
              {job.posted}
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {job.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1.5 rounded-lg bg-muted text-muted-foreground text-xs font-medium"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default SwipeCard;
