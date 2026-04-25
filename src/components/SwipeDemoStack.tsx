import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Check, X, ArrowRight, ArrowLeft } from "lucide-react";

interface DemoJob {
  id: number;
  title: string;
  company: string;
  logo: string;
  location: string;
  workMode: string;
  salary: string;
  match: number;
  tags: string[];
}

const JOBS: DemoJob[] = [
  {
    id: 1,
    title: "Senior Frontend Developer",
    company: "SGH Tech",
    logo: "🚀",
    location: "Warszawa",
    workMode: "Hybrydowo",
    salary: "18 000 – 25 000 zł",
    match: 95,
    tags: ["React", "TypeScript"],
  },
  {
    id: 2,
    title: "Product Designer",
    company: "Allegro",
    logo: "🎨",
    location: "Remote",
    workMode: "Zdalnie",
    salary: "15 000 – 20 000 zł",
    match: 78,
    tags: ["Figma", "UX Research"],
  },
  {
    id: 3,
    title: "Backend Engineer",
    company: "Bolt",
    logo: "⚙️",
    location: "Warszawa/Remote",
    workMode: "Hybrydowo",
    salary: "20 000 – 28 000 zł",
    match: 88,
    tags: ["Node.js", "PostgreSQL"],
  },
  {
    id: 4,
    title: "Data Analyst",
    company: "mBank",
    logo: "📊",
    location: "Warszawa",
    workMode: "Stacjonarnie",
    salary: "12 000 – 17 000 zł",
    match: 71,
    tags: ["Python", "SQL", "Power BI"],
  },
];

function matchColor(score: number) {
  if (score >= 85) return "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
  if (score >= 70) return "bg-yellow-500/20 text-yellow-300 border-yellow-500/40";
  return "bg-orange-500/20 text-orange-300 border-orange-500/40";
}

interface CardProps {
  job: DemoJob;
  direction: "left" | "right";
  isTop: boolean;
  depth: number; // 0 = top, 1, 2
  exiting: boolean;
}

const Card = ({ job, direction, isTop, depth, exiting }: CardProps) => {
  const baseScale = depth === 0 ? 1 : depth === 1 ? 0.95 : 0.9;
  const baseY = depth === 0 ? 0 : depth === 1 ? 8 : 16;
  const baseOpacity = depth === 0 ? 1 : depth === 1 ? 0.7 : 0.4;
  const zIndex = 10 - depth;

  const animate = exiting && isTop
    ? {
        x: direction === "right" ? "110%" : "-110%",
        rotate: direction === "right" ? 18 : -18,
        opacity: 0,
        scale: 1,
        y: 0,
      }
    : { x: 0, scale: baseScale, y: baseY, opacity: baseOpacity, rotate: 0 };

  const interactive = isTop && !exiting;

  return (
    <motion.div
      style={{ zIndex }}
      initial={
        depth === 2
          ? { scale: 0.85, y: 28, opacity: 0 }
          : { scale: baseScale, y: baseY, opacity: baseOpacity }
      }
      animate={animate}
      transition={{
        duration: exiting && isTop ? 0.45 : 0.35,
        ease: "easeOut",
      }}
      className="absolute inset-0"
    >
      <div
        className="relative h-full rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
        style={{
          background: "linear-gradient(145deg, #1a1a2e 0%, #16213e 100%)",
          padding: "20px",
          minHeight: "200px",
          pointerEvents: interactive ? "auto" : "none",
          userSelect: "none",
        }}
      >
        {/* Tint overlay during exit */}
        {isTop && exiting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 rounded-2xl pointer-events-none"
            style={{
              background:
                direction === "right"
                  ? "rgba(34, 197, 94, 0.18)"
                  : "rgba(239, 68, 68, 0.18)",
              border:
                direction === "right"
                  ? "2px solid rgba(34,197,94,0.6)"
                  : "2px solid rgba(239,68,68,0.6)",
            }}
          />
        )}

        {/* Stamp label */}
        {isTop && exiting && direction === "right" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            className="absolute top-4 right-4 -rotate-12 px-2.5 py-1 rounded-md border-2 border-emerald-400 text-emerald-300 font-bold text-xs tracking-wider flex items-center gap-1 bg-emerald-500/10 z-20"
          >
            <Check className="w-3 h-3" /> APLIKUJ
          </motion.div>
        )}
        {isTop && exiting && direction === "left" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            className="absolute top-4 left-4 rotate-12 px-2.5 py-1 rounded-md border-2 border-red-400 text-red-300 font-bold text-xs tracking-wider flex items-center gap-1 bg-red-500/10 z-20"
          >
            <X className="w-3 h-3" /> POMIŃ
          </motion.div>
        )}

        {/* Direction arrow with trail */}
        {isTop && exiting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 1, 0] }}
            transition={{ duration: 0.4, delay: 0.1, times: [0, 0.2, 0.7, 1] }}
            className="absolute top-1/2 -translate-y-1/2 z-30 pointer-events-none"
            style={{
              [direction === "right" ? "right" : "left"]: "12px",
            } as React.CSSProperties}
          >
            {/* Trail */}
            <div
              className="absolute top-1/2 -translate-y-1/2 h-[2px] w-16 rounded-full"
              style={{
                [direction === "right" ? "right" : "left"]: "20px",
                background:
                  direction === "right"
                    ? "linear-gradient(to left, rgba(34,197,94,0.7), transparent)"
                    : "linear-gradient(to right, rgba(239,68,68,0.7), transparent)",
              } as React.CSSProperties}
            />
            <div
              className="relative w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md"
              style={{
                background: "rgba(255,255,255,0.15)",
                boxShadow:
                  direction === "right"
                    ? "0 0 20px rgba(34,197,94,0.6)"
                    : "0 0 20px rgba(239,68,68,0.6)",
              }}
            >
              {direction === "right" ? (
                <ArrowRight className="w-5 h-5" style={{ color: "#22c55e" }} strokeWidth={3} />
              ) : (
                <ArrowLeft className="w-5 h-5" style={{ color: "#ef4444" }} strokeWidth={3} />
              )}
            </div>
          </motion.div>
        )}

        {/* Content */}
        <div className="relative h-full flex flex-col">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-xl shrink-0">
              {job.logo}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white/60">{job.company}</p>
              <h3 className="font-bold text-white leading-tight text-[15px] line-clamp-2">
                {job.title}
              </h3>
            </div>
            <span
              className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-bold border ${matchColor(job.match)}`}
            >
              {job.match}%
            </span>
          </div>

          <div className="flex flex-wrap gap-2 text-xs text-white/60 mb-3">
            <span className="inline-flex items-center gap-1">
              <MapPin className="w-3 h-3" /> {job.location}
            </span>
            <span>· {job.workMode}</span>
          </div>

          <div className="flex flex-wrap gap-1.5 mb-4">
            {job.tags.map((t) => (
              <span
                key={t}
                className="px-2 py-0.5 rounded-md bg-orange-500/10 border border-orange-500/30 text-orange-300 text-[11px] font-medium"
              >
                {t}
              </span>
            ))}
          </div>

          <div className="mt-auto flex items-center justify-between text-sm pt-3 border-t border-white/10">
            <span className="font-semibold text-white text-[13px]">{job.salary}</span>
            <span className="text-[10px] text-white/40 uppercase tracking-wider">dopasowanie</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const HandHint = () => (
  <motion.div
    initial={{ opacity: 0, x: -40, y: 20 }}
    animate={{ opacity: [0, 1, 1, 0], x: [-40, 60, 120, 160], y: [20, 10, 0, -10] }}
    transition={{ duration: 1.5, times: [0, 0.2, 0.7, 1], ease: "easeOut" }}
    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none"
    aria-hidden
  >
    <svg width="48" height="48" viewBox="0 0 56 56" fill="none">
      <path
        d="M22 14c0-1.7 1.3-3 3-3s3 1.3 3 3v14h2V18c0-1.7 1.3-3 3-3s3 1.3 3 3v12h2v-8c0-1.7 1.3-3 3-3s3 1.3 3 3v18c0 6-4 10-10 10h-6c-3 0-5-1-7-3l-7-9c-1-1.5-1-3 .5-4s3-.5 4 .5l4 4V14z"
        fill="#fff"
        stroke="#1a1a2e"
        strokeWidth="1.5"
      />
    </svg>
  </motion.div>
);

const SwipeDemoStack = () => {
  const [index, setIndex] = useState(0);
  const [cycle, setCycle] = useState(0);
  const [exiting, setExiting] = useState(false);
  const [showHint, setShowHint] = useState(true);

  const direction: "left" | "right" = cycle % 2 === 0 ? "right" : "left";

  useEffect(() => {
    const t = setTimeout(() => setShowHint(false), 1600);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setExiting(true);
      setTimeout(() => {
        setIndex((i) => (i + 1) % JOBS.length);
        setCycle((c) => c + 1);
        setExiting(false);
      }, 470);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  const visible = [0, 1, 2].map((d) => ({
    job: JOBS[(index + d) % JOBS.length],
    depth: d,
  }));

  return (
    <div className="relative mx-auto w-full flex flex-col items-center" style={{ maxWidth: 320 }}>
      <div
        className="absolute -inset-6 bg-gradient-to-br from-primary/20 via-accent/10 to-transparent rounded-3xl blur-2xl pointer-events-none"
        aria-hidden
      />

      {/* Strict container — cards never render outside */}
      <div
        className="relative"
        style={{
          width: 320,
          height: 420,
          overflow: "hidden",
        }}
      >
        <AnimatePresence>{showHint && <HandHint key="hint" />}</AnimatePresence>

        {visible
          .slice()
          .reverse()
          .map(({ job, depth }) => (
            <Card
              key={`${job.id}-${depth}-${cycle}`}
              job={job}
              depth={depth}
              isTop={depth === 0}
              direction={direction}
              exiting={exiting}
            />
          ))}
      </div>

      {/* Indicator pills */}
      <div className="flex items-center justify-center gap-4 mt-6">
        <motion.div
          animate={{
            opacity: exiting && direction === "left" ? 1 : 0.4,
            scale: exiting && direction === "left" ? 1.15 : 1,
          }}
          transition={{ duration: 0.3 }}
          className="w-12 h-12 rounded-full bg-red-500/20 border-2 border-red-500/50 flex items-center justify-center text-red-400"
        >
          <X className="w-5 h-5" strokeWidth={3} />
        </motion.div>
        <motion.div
          animate={{
            opacity: exiting && direction === "right" ? 1 : 0.4,
            scale: exiting && direction === "right" ? 1.15 : 1,
          }}
          transition={{ duration: 0.3 }}
          className="w-12 h-12 rounded-full bg-emerald-500/20 border-2 border-emerald-500/50 flex items-center justify-center text-emerald-400"
        >
          <Check className="w-5 h-5" strokeWidth={3} />
        </motion.div>
      </div>
    </div>
  );
};

export default SwipeDemoStack;
