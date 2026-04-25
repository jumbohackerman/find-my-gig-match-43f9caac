import { useEffect, useState } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { MapPin, Check, X } from "lucide-react";

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
  if (score > 85) return "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
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
  // For top exiting card use motion value to fade overlays
  const x = useMotionValue(0);
  const greenOpacity = useTransform(x, [0, 200], [0, 1]);
  const redOpacity = useTransform(x, [-200, 0], [1, 0]);

  const baseScale = depth === 0 ? 1 : depth === 1 ? 0.95 : 0.9;
  const baseY = depth === 0 ? 0 : depth === 1 ? 8 : 16;
  const baseOpacity = depth === 0 ? 1 : depth === 1 ? 0.85 : 0.6;
  const zIndex = 10 - depth;

  // animate exit when isTop && exiting
  const animate = exiting && isTop
    ? {
        x: direction === "right" ? "140%" : "-140%",
        rotate: direction === "right" ? 18 : -18,
        opacity: 0,
      }
    : { x: 0, scale: baseScale, y: baseY, opacity: baseOpacity, rotate: 0 };

  return (
    <motion.div
      style={{ zIndex, x: isTop ? x : 0 }}
      initial={
        depth === 2
          ? { scale: 0.85, y: 28, opacity: 0 }
          : { scale: baseScale, y: baseY, opacity: baseOpacity }
      }
      animate={animate}
      transition={{ duration: exiting && isTop ? 0.5 : 0.4, ease: "easeOut" }}
      className="absolute inset-0"
    >
      <div className="relative h-full rounded-3xl border border-white/10 shadow-2xl p-6 overflow-hidden"
        style={{ background: "linear-gradient(145deg, #1a1a2e 0%, #16213e 100%)" }}
      >
        {/* Overlays — only on top card while exiting */}
        {isTop && exiting && direction === "right" && (
          <motion.div
            style={{ opacity: 1 }}
            className="absolute inset-0 rounded-3xl pointer-events-none flex items-start justify-end p-5"
          >
            <div className="absolute inset-0 rounded-3xl"
              style={{ background: "rgba(34, 197, 94, 0.18)", border: "2px solid rgba(34,197,94,0.6)" }}
            />
            <div className="relative -rotate-12 px-3 py-1.5 rounded-lg border-2 border-emerald-400 text-emerald-300 font-bold text-sm tracking-wider flex items-center gap-1.5 bg-emerald-500/10">
              <Check className="w-4 h-4" /> APLIKUJ
            </div>
          </motion.div>
        )}
        {isTop && exiting && direction === "left" && (
          <motion.div
            className="absolute inset-0 rounded-3xl pointer-events-none flex items-start justify-start p-5"
          >
            <div className="absolute inset-0 rounded-3xl"
              style={{ background: "rgba(239, 68, 68, 0.18)", border: "2px solid rgba(239,68,68,0.6)" }}
            />
            <div className="relative rotate-12 px-3 py-1.5 rounded-lg border-2 border-red-400 text-red-300 font-bold text-sm tracking-wider flex items-center gap-1.5 bg-red-500/10">
              <X className="w-4 h-4" /> POMIŃ
            </div>
          </motion.div>
        )}

        <div className="relative">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl shrink-0">
              {job.logo}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-white leading-tight">{job.title}</h3>
              <p className="text-sm text-white/60">{job.company}</p>
            </div>
            <span className={`shrink-0 px-2 py-1 rounded-full text-[11px] font-bold border ${matchColor(job.match)}`}>
              {job.match}%
            </span>
          </div>

          <div className="flex flex-wrap gap-2 text-xs text-white/60 mb-4">
            <span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3" /> {job.location}</span>
            <span>· {job.workMode}</span>
          </div>

          <div className="flex flex-wrap gap-2 mb-5">
            {job.tags.map((t) => (
              <span key={t} className="px-2 py-1 rounded-md bg-orange-500/10 border border-orange-500/30 text-orange-300 text-xs font-medium">
                {t}
              </span>
            ))}
          </div>

          <div className="flex items-center justify-between text-sm pt-3 border-t border-white/10">
            <span className="font-semibold text-white">{job.salary}</span>
            <span className="text-xs text-white/50">dopasowanie</span>
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
    <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
      <g filter="url(#glow)">
        <path
          d="M22 14c0-1.7 1.3-3 3-3s3 1.3 3 3v14h2V18c0-1.7 1.3-3 3-3s3 1.3 3 3v12h2v-8c0-1.7 1.3-3 3-3s3 1.3 3 3v18c0 6-4 10-10 10h-6c-3 0-5-1-7-3l-7-9c-1-1.5-1-3 .5-4s3-.5 4 .5l4 4V14z"
          fill="#fff"
          stroke="#1a1a2e"
          strokeWidth="1.5"
        />
      </g>
      <defs>
        <filter id="glow" x="-10" y="-10" width="80" height="80">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
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
      // After exit animation completes, advance the deck
      setTimeout(() => {
        setIndex((i) => (i + 1) % JOBS.length);
        setCycle((c) => c + 1);
        setExiting(false);
      }, 520);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  // Build the 3 visible cards
  const visible = [0, 1, 2].map((d) => ({
    job: JOBS[(index + d) % JOBS.length],
    depth: d,
  }));

  return (
    <div className="relative max-w-sm mx-auto w-full scale-[0.85] sm:scale-100 origin-top">
      <div
        className="absolute -inset-6 bg-gradient-to-br from-primary/20 via-accent/10 to-transparent rounded-3xl blur-2xl"
        aria-hidden
      />

      {/* Card stack — fixed aspect for stability */}
      <div className="relative h-[420px]">
        <AnimatePresence>
          {showHint && <HandHint key="hint" />}
        </AnimatePresence>

        {/* Render bottom-up so top card is last in DOM */}
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
