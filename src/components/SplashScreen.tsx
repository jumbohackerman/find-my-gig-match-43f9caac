import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useMemo } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// Particle splash screen — particles fly in from random positions and form:
//   1) The checkmark icon (logo)
//   2) The wordmark "JobSwipe.pl"
// Then dissolve in a soft burst before the app appears.
// ─────────────────────────────────────────────────────────────────────────────

const STAGE_DIMS = { width: 720, height: 360 };

// ── Helpers ──────────────────────────────────────────────────────────────────
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// Sample points along a polyline (logo checkmark)
function samplePolyline(points: { x: number; y: number }[], count: number) {
  const segments: { x: number; y: number; len: number }[] = [];
  let total = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const dx = points[i + 1].x - points[i].x;
    const dy = points[i + 1].y - points[i].y;
    const len = Math.hypot(dx, dy);
    segments.push({ x: dx, y: dy, len });
    total += len;
  }
  const step = total / count;
  const out: { x: number; y: number }[] = [];
  let segIdx = 0;
  let acc = 0;
  for (let i = 0; i < count; i++) {
    const target = i * step;
    while (segIdx < segments.length - 1 && acc + segments[segIdx].len < target) {
      acc += segments[segIdx].len;
      segIdx++;
    }
    const local = (target - acc) / segments[segIdx].len;
    out.push({
      x: points[segIdx].x + segments[segIdx].x * local,
      y: points[segIdx].y + segments[segIdx].y * local,
    });
  }
  return out;
}

// Sample points by rasterizing text onto an offscreen canvas
function sampleText(
  text: string,
  font: string,
  count: number,
  width: number,
  height: number,
  density = 4,
): { x: number; y: number }[] {
  if (typeof document === "undefined") return [];
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return [];
  ctx.fillStyle = "white";
  ctx.font = font;
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  ctx.fillText(text, width / 2, height / 2);
  const data = ctx.getImageData(0, 0, width, height).data;
  const candidates: { x: number; y: number }[] = [];
  for (let y = 0; y < height; y += density) {
    for (let x = 0; x < width; x += density) {
      const idx = (y * width + x) * 4 + 3;
      if (data[idx] > 128) candidates.push({ x, y });
    }
  }
  // Shuffle then trim to count
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }
  return candidates.slice(0, count);
}

interface Particle {
  id: number;
  // Random origin (off-screen burst)
  ox: number;
  oy: number;
  // Logo target (formation 1)
  lx: number;
  ly: number;
  // Wordmark target (formation 2)
  wx: number;
  wy: number;
  size: number;
  hue: "primary" | "accent" | "white";
  delay: number;
}

const SplashScreen = ({ onFinish }: { onFinish: () => void }) => {
  const [phase, setPhase] = useState<
    "incoming" | "logo" | "morph" | "wordmark" | "burst" | "out"
  >("incoming");

  // Build particles once
  const particles = useMemo<Particle[]>(() => {
    const COUNT = 320;

    // Logo target: a checkmark scaled to a 140x140 box, centered at (cx, 130)
    const cx = STAGE_DIMS.width / 2;
    const cy = 130;
    const checkPts = [
      { x: cx - 50, y: cy + 6 },
      { x: cx - 14, y: cy + 42 },
      { x: cx + 56, y: cy - 36 },
    ];
    const logoSamples = samplePolyline(checkPts, COUNT);

    // Wordmark target: "JobSwipe.pl"
    const wordSamples = sampleText(
      "JobSwipe.pl",
      "bold 96px 'Space Grotesk', sans-serif",
      COUNT,
      STAGE_DIMS.width,
      160,
      3,
    );
    // Offset to lower half of stage
    const wordOffsetY = 200;

    // Build particle list
    const arr: Particle[] = [];
    for (let i = 0; i < COUNT; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 500 + Math.random() * 300;
      const word = wordSamples[i] ?? wordSamples[i % wordSamples.length] ?? { x: cx, y: wordOffsetY };
      arr.push({
        id: i,
        ox: cx + Math.cos(angle) * radius,
        oy: cy + Math.sin(angle) * radius,
        lx: logoSamples[i].x,
        ly: logoSamples[i].y,
        wx: word.x,
        wy: word.y + wordOffsetY,
        size: 1.4 + Math.random() * 2.6,
        hue:
          Math.random() < 0.78
            ? "primary"
            : Math.random() < 0.6
              ? "accent"
              : "white",
        delay: Math.random() * 0.45,
      });
    }
    return arr;
  }, []);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("logo"), 50);
    const t2 = setTimeout(() => setPhase("morph"), 1500);
    const t3 = setTimeout(() => setPhase("wordmark"), 1700);
    const t4 = setTimeout(() => setPhase("burst"), 3100);
    const t5 = setTimeout(() => setPhase("out"), 3400);
    const t6 = setTimeout(onFinish, 4000);
    return () => {
      [t1, t2, t3, t4, t5, t6].forEach(clearTimeout);
    };
  }, [onFinish]);

  const colorFor = (h: Particle["hue"]) =>
    h === "primary"
      ? "hsl(var(--primary))"
      : h === "accent"
        ? "hsl(var(--accent))"
        : "hsl(210 40% 100%)";

  return (
    <AnimatePresence>
      <motion.div
        key="splash"
        initial={{ opacity: 1 }}
        animate={{ opacity: phase === "out" ? 0 : 1 }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-background overflow-hidden"
      >
        {/* Subtle grid backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.04 }}
          transition={{ duration: 1.2 }}
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)`,
            backgroundSize: "64px 64px",
          }}
        />

        {/* Ambient aurora glow */}
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{
            scale: phase === "burst" ? 1.6 : 1,
            opacity: phase === "burst" ? 0.45 : 0.22,
          }}
          transition={{ duration: 1.4, ease: "easeOut" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-[160px] pointer-events-none"
          style={{ background: "hsl(var(--primary))" }}
        />
        <motion.div
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.14, rotate: 90 }}
          transition={{ duration: 2.6, ease: "easeOut" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[560px] h-[340px] rounded-full blur-[120px] pointer-events-none"
          style={{ background: "hsl(var(--accent))" }}
        />

        {/* Particle stage */}
        <div
          className="relative pointer-events-none"
          style={{ width: STAGE_DIMS.width, height: STAGE_DIMS.height }}
        >
          {/* Logo backdrop card (revealed once particles form) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{
              opacity: phase === "logo" ? 0.95 : phase === "morph" ? 0 : 0,
              scale: phase === "logo" ? 1 : 0.7,
            }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="absolute rounded-2xl shadow-glow"
            style={{
              left: STAGE_DIMS.width / 2 - 56,
              top: 130 - 56,
              width: 112,
              height: 112,
              background: "var(--gradient-primary)",
            }}
          />

          {/* Particles */}
          {particles.map((p) => {
            // Determine target based on phase
            let tx = p.ox;
            let ty = p.oy;
            let opacity = 0;
            let scale = 0;
            if (phase === "logo") {
              tx = p.lx;
              ty = p.ly;
              opacity = 1;
              scale = 1;
            } else if (phase === "morph") {
              // Midpoint expansion for swirl effect
              tx = lerp(p.lx, p.wx, 0.5) + (Math.random() - 0.5) * 80;
              ty = lerp(p.ly, p.wy, 0.5) + (Math.random() - 0.5) * 60;
              opacity = 0.9;
              scale = 1.2;
            } else if (phase === "wordmark") {
              tx = p.wx;
              ty = p.wy;
              opacity = 1;
              scale = 1;
            } else if (phase === "burst") {
              const ang = Math.atan2(p.wy - STAGE_DIMS.height / 2, p.wx - STAGE_DIMS.width / 2);
              tx = p.wx + Math.cos(ang) * 200;
              ty = p.wy + Math.sin(ang) * 160;
              opacity = 0;
              scale = 0.4;
            } else if (phase === "out") {
              opacity = 0;
            }

            return (
              <motion.div
                key={p.id}
                initial={{ x: p.ox, y: p.oy, opacity: 0, scale: 0 }}
                animate={{ x: tx, y: ty, opacity, scale }}
                transition={{
                  type: "spring",
                  stiffness: phase === "burst" ? 60 : 110,
                  damping: phase === "burst" ? 14 : 18,
                  mass: 0.6,
                  delay: phase === "logo" ? p.delay : phase === "wordmark" ? p.delay * 0.5 : 0,
                }}
                className="absolute rounded-full"
                style={{
                  width: p.size,
                  height: p.size,
                  background: colorFor(p.hue),
                  boxShadow: `0 0 ${4 + p.size * 1.4}px ${colorFor(p.hue)}`,
                  willChange: "transform, opacity",
                }}
              />
            );
          })}

          {/* Tagline reveal once wordmark settles */}
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{
              opacity: phase === "wordmark" ? 1 : 0,
              y: phase === "wordmark" ? 0 : 8,
            }}
            transition={{ duration: 0.5, delay: phase === "wordmark" ? 0.6 : 0 }}
            className="absolute left-0 right-0 text-center text-xs tracking-[0.4em] uppercase text-muted-foreground"
            style={{ top: 320 }}
          >
            Znajdź swoją idealną pracę
          </motion.p>
        </div>

        {/* Ring burst on transition */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{
            scale: phase === "burst" ? 5 : 0,
            opacity: phase === "burst" ? [0, 0.6, 0] : 0,
          }}
          transition={{ duration: 0.9, ease: "easeOut" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full border-2 pointer-events-none"
          style={{ borderColor: "hsl(var(--primary) / 0.5)" }}
        />

        {/* Bottom progress hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: phase === "out" ? 0 : 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="absolute bottom-16 flex flex-col items-center gap-3"
        >
          <div className="w-40 h-[2px] rounded-full bg-secondary/40 overflow-hidden">
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: "100%" }}
              transition={{ duration: 1.4, ease: "easeInOut", repeat: Infinity }}
              className="h-full w-1/2 rounded-full"
              style={{ background: "var(--gradient-primary)" }}
            />
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SplashScreen;
