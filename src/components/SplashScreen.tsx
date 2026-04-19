import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// JobSwipe.pl — premium splash screen (v2)
// World-class minimal: a luminous tile lands with depth, the mark draws itself,
// the wordmark resolves from blur with kinetic letter-spacing, an accent line
// snaps in, and the entire scene exhales before an iris-flash hand-off.
// ─────────────────────────────────────────────────────────────────────────────

type Phase = "intro" | "mark" | "wordmark" | "settle" | "out";

// Per-letter wordmark for staggered reveal
const LETTERS = [
  { ch: "J", tone: "fg" as const },
  { ch: "o", tone: "fg" as const },
  { ch: "b", tone: "fg" as const },
  { ch: "S", tone: "grad" as const },
  { ch: "w", tone: "grad" as const },
  { ch: "i", tone: "grad" as const },
  { ch: "p", tone: "grad" as const },
  { ch: "e", tone: "grad" as const },
  { ch: ".", tone: "muted" as const },
  { ch: "p", tone: "muted" as const },
  { ch: "l", tone: "muted" as const },
];

const SplashScreen = ({ onFinish }: { onFinish: () => void }) => {
  const [phase, setPhase] = useState<Phase>("intro");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("mark"), 100);
    const t2 = setTimeout(() => setPhase("wordmark"), 1050);
    const t3 = setTimeout(() => setPhase("settle"), 2050);
    const t4 = setTimeout(() => setPhase("out"), 2850);
    const t5 = setTimeout(onFinish, 4300);
    return () => [t1, t2, t3, t4, t5].forEach(clearTimeout);
  }, [onFinish]);

  const showMark = phase !== "intro";
  const showWord = phase === "wordmark" || phase === "settle" || phase === "out";
  const showAccent = phase === "settle" || phase === "out";
  const showTagline = phase === "settle" || phase === "out";

  return (
    <AnimatePresence>
      <motion.div
        key="splash"
        initial={{ opacity: 1 }}
        animate={{ opacity: phase === "out" ? 0 : 1 }}
        transition={{ duration: 1.1, delay: phase === "out" ? 0.3 : 0, ease: [0.16, 1, 0.3, 1] }}
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-background overflow-hidden"
      >
        {/* ── Atmosphere ── */}
        {/* Vignette */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at center, transparent 0%, hsl(var(--background)) 78%)",
          }}
        />
        {/* Primary aurora glow */}
        <motion.div
          initial={{ opacity: 0, scale: 0.55 }}
          animate={{
            opacity: phase === "out" ? 0 : 0.4,
            scale: phase === "settle" || phase === "out" ? 1.05 : 1,
          }}
          transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[860px] h-[860px] rounded-full blur-[170px] pointer-events-none"
          style={{ background: "hsl(var(--primary) / 0.55)" }}
        />
        {/* Accent glow offset */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: phase === "out" ? 0 : 0.2 }}
          transition={{ duration: 2.2, delay: 0.2 }}
          className="absolute top-[58%] left-[58%] -translate-x-1/2 -translate-y-1/2 w-[540px] h-[340px] rounded-full blur-[140px] pointer-events-none"
          style={{ background: "hsl(var(--accent))" }}
        />
        {/* Top light beam */}
        <motion.div
          initial={{ opacity: 0, scaleY: 0.3 }}
          animate={{ opacity: showMark ? 0.18 : 0, scaleY: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[420px] h-[55%] pointer-events-none origin-top"
          style={{
            background:
              "radial-gradient(ellipse at top, hsl(var(--primary) / 0.6) 0%, transparent 70%)",
            filter: "blur(40px)",
          }}
        />
        {/* Subtle grid */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)",
            backgroundSize: "76px 76px",
            maskImage:
              "radial-gradient(ellipse at center, black 28%, transparent 72%)",
            WebkitMaskImage:
              "radial-gradient(ellipse at center, black 28%, transparent 72%)",
          }}
        />

        {/* ── Composition with subtle "breathing" lift in settle ── */}
        <motion.div
          animate={{
            y: phase === "settle" ? -4 : phase === "out" ? -10 : 0,
            scale: phase === "out" ? 1.04 : 1,
          }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="relative flex flex-col items-center gap-12"
        >
          {/* ── Mark ── */}
          <div className="relative">
            {/* Pulsing halo ring */}
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{
                scale: showMark ? [1, 1.22, 1] : 0.6,
                opacity: showMark ? [0.55, 0, 0.55] : 0,
              }}
              transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-[-22px] rounded-[32px] pointer-events-none"
              style={{ border: "1.5px solid hsl(var(--primary) / 0.4)" }}
            />

            {/* Outer soft glow */}
            <motion.div
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: showMark ? 0.7 : 0, scale: showMark ? 1.4 : 0.7 }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-0 rounded-[26px] pointer-events-none blur-2xl"
              style={{ background: "var(--gradient-primary)" }}
            />

            {/* Tile */}
            <motion.div
              initial={{ opacity: 0, scale: 0.65, rotateX: -28, y: 16 }}
              animate={{
                opacity: showMark ? 1 : 0,
                scale: showMark ? 1 : 0.65,
                rotateX: showMark ? 0 : -28,
                y: 0,
              }}
              transition={{ duration: 0.95, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-[120px] h-[120px] rounded-[28px] flex items-center justify-center overflow-hidden"
              style={{
                background: "var(--gradient-primary)",
                boxShadow:
                  "0 30px 70px -16px hsl(16 92% 62% / 0.6), 0 0 90px -20px hsl(355 88% 58% / 0.45), inset 0 1.5px 0 0 hsl(0 0% 100% / 0.22), inset 0 -2px 6px 0 hsl(0 0% 0% / 0.22)",
                transformPerspective: 900,
              }}
            >
              {/* Specular sweep — soft diagonal shimmer, clipped inside tile */}
              <motion.div
                initial={{ x: "-120%", opacity: 0 }}
                animate={{
                  x: showMark ? "120%" : "-120%",
                  opacity: showMark ? [0, 0.7, 0] : 0,
                }}
                transition={{
                  x: { duration: 1.8, delay: 0.55, ease: [0.16, 1, 0.3, 1] },
                  opacity: { duration: 1.8, delay: 0.55, ease: "easeInOut", times: [0, 0.5, 1] },
                }}
                className="absolute inset-y-0 left-0 w-full pointer-events-none"
                style={{
                  background:
                    "linear-gradient(110deg, transparent 44%, hsl(0 0% 100% / 0.22) 50%, transparent 56%)",
                  mixBlendMode: "screen",
                  filter: "blur(3px)",
                }}
              />

              {/* Self-drawing checkmark */}
              <svg
                width="60"
                height="60"
                viewBox="0 0 24 24"
                fill="none"
                stroke="hsl(0 0% 100%)"
                strokeWidth="2.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="relative z-10"
                style={{ filter: "drop-shadow(0 2px 8px hsl(0 0% 0% / 0.3))" }}
              >
                <motion.path
                  d="M20 6 9 17l-5-5"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{
                    pathLength: showMark ? 1 : 0,
                    opacity: showMark ? 1 : 0,
                  }}
                  transition={{
                    pathLength: { duration: 0.65, delay: 0.4, ease: [0.65, 0, 0.35, 1] },
                    opacity: { duration: 0.15, delay: 0.4 },
                  }}
                />
              </svg>

              {/* Pop flash on completion */}
              <motion.div
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{
                  opacity: showMark ? [0, 0.7, 0] : 0,
                  scale: showMark ? [0.6, 1.4, 1.6] : 0.6,
                }}
                transition={{ duration: 0.6, delay: 1.0, ease: "easeOut" }}
                className="absolute inset-0 rounded-[28px] pointer-events-none"
                style={{
                  background:
                    "radial-gradient(circle, hsl(0 0% 100% / 0.45) 0%, transparent 65%)",
                }}
              />
            </motion.div>

            {/* Ground reflection */}
            <motion.div
              initial={{ opacity: 0, scaleY: 0 }}
              animate={{ opacity: showMark ? 0.4 : 0, scaleY: showMark ? 1 : 0 }}
              transition={{ duration: 0.9, delay: 0.55, ease: [0.16, 1, 0.3, 1] }}
              className="absolute left-1/2 -translate-x-1/2 top-full mt-3 w-[150px] h-[40px] rounded-[50%] pointer-events-none origin-top"
              style={{
                background:
                  "radial-gradient(ellipse at center, hsl(16 92% 62% / 0.5) 0%, transparent 70%)",
                filter: "blur(10px)",
              }}
            />
          </div>

          {/* ── Wordmark ── */}
          <div className="relative flex flex-col items-center gap-5 min-h-[110px]">
            <h1
              className="font-display text-5xl md:text-6xl font-bold tracking-tight relative flex items-baseline"
              style={{ letterSpacing: "-0.02em" }}
            >
              {LETTERS.map((l, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, y: 22, filter: "blur(10px)" }}
                  animate={{
                    opacity: showWord ? 1 : 0,
                    y: showWord ? 0 : 22,
                    filter: showWord ? "blur(0px)" : "blur(10px)",
                  }}
                  transition={{
                    duration: 0.7,
                    delay: showWord ? i * 0.045 : 0,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className={
                    l.tone === "grad"
                      ? "text-gradient-primary"
                      : l.tone === "muted"
                        ? "text-muted-foreground/70"
                        : "text-foreground"
                  }
                  style={
                    l.tone === "grad"
                      ? { filter: "drop-shadow(0 0 18px hsl(var(--primary) / 0.45))" }
                      : undefined
                  }
                >
                  {l.ch}
                </motion.span>
              ))}
            </h1>

            {/* Underline accent */}
            <motion.div
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{
                scaleX: showAccent ? 1 : 0,
                opacity: showAccent ? 1 : 0,
              }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="h-[2px] w-28 rounded-full origin-center"
              style={{
                background:
                  "linear-gradient(90deg, transparent, hsl(var(--primary)), transparent)",
                boxShadow: "0 0 14px hsl(var(--primary) / 0.7)",
              }}
            />

            {/* Tagline */}
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{
                opacity: showTagline ? 1 : 0,
                y: showTagline ? 0 : 8,
              }}
              transition={{ duration: 0.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="text-xs text-muted-foreground tracking-[0.45em] uppercase"
            >
              Znajdź swoją idealną pracę
            </motion.p>
          </div>
        </motion.div>

        {/* ── Bottom progress indicator ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{
            opacity: phase === "out" ? 0 : 1,
            y: phase === "out" ? 8 : 0,
          }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="absolute bottom-12 flex items-center gap-3"
        >
          <span className="text-[10px] tracking-[0.4em] uppercase text-muted-foreground/70">
            Loading
          </span>
          <div className="w-24 h-[1.5px] rounded-full bg-foreground/10 overflow-hidden">
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: "100%" }}
              transition={{ duration: 1.4, ease: "easeInOut", repeat: Infinity }}
              className="h-full w-1/2 rounded-full"
              style={{ background: "var(--gradient-primary)" }}
            />
          </div>
        </motion.div>

        {/* Expanding shockwave rings on exit — radiate from icon to corners */}
        {phase === "out" && (
          <>
            {[0, 0.18, 0.36, 0.54].map((delay, i) => (
              <motion.div
                key={`ring-${i}`}
                initial={{ scale: 0.05, opacity: 0.9 }}
                animate={{ scale: 40, opacity: 0 }}
                transition={{ duration: 1.6, delay, ease: [0.22, 1, 0.36, 1] }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full pointer-events-none"
                style={{
                  border: "2px solid hsl(var(--primary) / 0.75)",
                  boxShadow:
                    "0 0 60px hsl(var(--primary) / 0.6), 0 0 120px hsl(var(--primary) / 0.35), inset 0 0 40px hsl(var(--primary) / 0.3)",
                }}
              />
            ))}
            {/* Soft radial wash that follows the rings */}
            <motion.div
              initial={{ scale: 0, opacity: 0.7 }}
              animate={{ scale: 22, opacity: 0 }}
              transition={{ duration: 1.4, ease: [0.65, 0, 0.35, 1] }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full pointer-events-none"
              style={{
                background:
                  "radial-gradient(circle, hsl(var(--primary) / 0.7) 0%, hsl(var(--accent) / 0.35) 30%, transparent 70%)",
                filter: "blur(8px)",
              }}
            />
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default SplashScreen;
