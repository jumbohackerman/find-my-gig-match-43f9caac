import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Check, X, ArrowRight, ArrowLeft, Briefcase, Sparkles, Users, Clock, GraduationCap, Building2 } from "lucide-react";

interface DemoJob {
  id: number;
  title: string;
  company: string;
  logo: string;
  location: string;
  workMode: string;
  seniority: string;
  salary: string;
  match: number;
  tags: string[];
  summary: string;
  perks: string[];
  experience: string;
  applicants: number;
  posted: string;
  teamSize: string;
  contract: string;
}

const JOBS: DemoJob[] = [
  {
    id: 1,
    title: "Senior Frontend Developer",
    company: "SGH Tech",
    logo: "🚀",
    location: "Warszawa",
    workMode: "Hybrydowo",
    seniority: "Senior",
    salary: "18 000 – 25 000 zł",
    match: 95,
    tags: ["React", "TypeScript", "Next.js"],
    summary: "Buduj nowoczesną platformę edukacyjną dla 200k uczniów. Zespół 12 osób, code review, czas na refaktor.",
    perks: ["Prywatna opieka", "Budżet na sprzęt", "4 dni w biurze/mc"],
  },
  {
    id: 2,
    title: "Product Designer",
    company: "Allegro",
    logo: "🎨",
    location: "Remote",
    workMode: "Zdalnie",
    seniority: "Mid",
    salary: "15 000 – 20 000 zł",
    match: 78,
    tags: ["Figma", "UX Research", "Design Systems"],
    summary: "Projektuj checkout obsługujący 14 mln użytkowników. Od research po wdrożenie, blisko z PM i frontem.",
    perks: ["100% zdalnie", "MultiSport", "Konferencje"],
  },
  {
    id: 3,
    title: "Backend Engineer",
    company: "Bolt",
    logo: "⚙️",
    location: "Warszawa / Remote",
    workMode: "Hybrydowo",
    seniority: "Senior",
    salary: "20 000 – 28 000 zł",
    match: 88,
    tags: ["Node.js", "PostgreSQL", "Kafka"],
    summary: "Skaluj backend obsługujący miliony przejazdów dziennie. Systemy rozproszone, event sourcing, ownership.",
    perks: ["Stock options", "Karta lunch", "Bolt credits"],
  },
  {
    id: 4,
    title: "Data Analyst",
    company: "mBank",
    logo: "📊",
    location: "Warszawa",
    workMode: "Hybrydowo",
    seniority: "Mid",
    salary: "12 000 – 17 000 zł",
    match: 71,
    tags: ["Python", "SQL", "Power BI"],
    summary: "Analizuj zachowania 5 mln klientów. Współpraca z zespołem ryzyka i marketingu, realny wpływ na produkty.",
    perks: ["Premia roczna", "Szkolenia", "Opieka medyczna"],
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
          background: "linear-gradient(160deg, #0d0d1a 0%, #11111f 55%, #0a0a14 100%)",
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




        {/* Top accent line */}
        <div
          className="absolute top-0 left-0 right-0 h-[2px] rounded-t-2xl"
          style={{
            background: "linear-gradient(90deg, transparent, rgba(251,146,60,0.6), transparent)",
          }}
        />

        {/* Content */}
        <div className="relative h-full flex flex-col">
          <div className="flex items-start gap-3 mb-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 border border-white/10"
              style={{
                background: "linear-gradient(135deg, rgba(251,146,60,0.15), rgba(255,255,255,0.04))",
              }}
            >
              {job.logo}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-white/50 uppercase tracking-wider font-medium">
                {job.company}
              </p>
              <h3 className="font-bold text-white leading-tight text-[16px] line-clamp-2 mt-0.5">
                {job.title}
              </h3>
            </div>
            <span
              className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-bold border ${matchColor(job.match)}`}
            >
              {job.match}%
            </span>
          </div>

          {/* Meta chips */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[11px] text-white/70">
              <MapPin className="w-3 h-3" /> {job.location}
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[11px] text-white/70">
              {job.workMode}
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[11px] text-white/70">
              <Briefcase className="w-3 h-3" /> {job.seniority}
            </span>
          </div>

          {/* Summary */}
          <p className="text-[12px] text-white/70 leading-relaxed mb-3 line-clamp-3">
            {job.summary}
          </p>

          {/* Tech tags */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {job.tags.map((t) => (
              <span
                key={t}
                className="px-2 py-0.5 rounded-md bg-orange-500/10 border border-orange-500/30 text-orange-300 text-[11px] font-medium"
              >
                {t}
              </span>
            ))}
          </div>

          {/* Perks */}
          <div className="flex items-center gap-1.5 text-[10.5px] text-white/50 mb-3">
            <Sparkles className="w-3 h-3 text-orange-300/70 shrink-0" />
            <span className="truncate">{job.perks.join(" · ")}</span>
          </div>

          <div className="mt-auto flex items-center justify-between pt-3 border-t border-white/10">
            <div>
              <p className="text-[10px] text-white/40 uppercase tracking-wider mb-0.5">
                Wynagrodzenie
              </p>
              <span className="font-semibold text-white text-[13px]">{job.salary}</span>
            </div>
            <span className="text-[10px] text-white/40 uppercase tracking-wider">
              dopasowanie
            </span>
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
          height: 480,
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

        {/* Flying directional arrow — follows the swipe across the stack */}
        <AnimatePresence>
          {exiting && (
            <motion.div
              key={`arrow-${cycle}`}
              initial={{
                x: direction === "right" ? -40 : 360,
                opacity: 0,
                scale: 0.6,
              }}
              animate={{
                x: direction === "right" ? 360 : -40,
                opacity: [0, 1, 1, 0],
                scale: [0.6, 1, 1, 0.8],
              }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 0.55,
                ease: "easeOut",
                times: [0, 0.2, 0.75, 1],
              }}
              className="absolute top-1/2 -translate-y-1/2 z-40 pointer-events-none"
              style={{ left: 0 }}
            >
              <div className="relative flex items-center">
                {/* Trail behind arrow */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 h-[3px] w-24 rounded-full blur-[1px]"
                  style={{
                    [direction === "right" ? "right" : "left"]: "32px",
                    background:
                      direction === "right"
                        ? "linear-gradient(to left, rgba(34,197,94,0.9), transparent)"
                        : "linear-gradient(to right, rgba(239,68,68,0.9), transparent)",
                  } as React.CSSProperties}
                />
                {/* Arrow head */}
                <div
                  className="relative w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-md border"
                  style={{
                    background: "rgba(255,255,255,0.12)",
                    borderColor:
                      direction === "right"
                        ? "rgba(34,197,94,0.5)"
                        : "rgba(239,68,68,0.5)",
                    boxShadow:
                      direction === "right"
                        ? "0 0 24px rgba(34,197,94,0.7), inset 0 0 12px rgba(34,197,94,0.2)"
                        : "0 0 24px rgba(239,68,68,0.7), inset 0 0 12px rgba(239,68,68,0.2)",
                  }}
                >
                  {direction === "right" ? (
                    <ArrowRight className="w-6 h-6" style={{ color: "#22c55e" }} strokeWidth={3} />
                  ) : (
                    <ArrowLeft className="w-6 h-6" style={{ color: "#ef4444" }} strokeWidth={3} />
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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
