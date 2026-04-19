import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// JobSwipe.pl — premium splash screen
// Cinematic minimal: mark draws itself with a luminous stroke, then the
// wordmark resolves from blur to sharp with a subtle parallax and shimmer.
// No noisy particles. Confident, brand-forward, world-class.
// ─────────────────────────────────────────────────────────────────────────────

type Phase = "intro" | "mark" | "wordmark" | "settle" | "out";

const SplashScreen = ({ onFinish }: { onFinish: () => void }) => {
  const [phase, setPhase] = useState<Phase>("intro");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("mark"), 120);
    const t2 = setTimeout(() => setPhase("wordmark"), 1100);
    const t3 = setTimeout(() => setPhase("settle"), 2100);
    const t4 = setTimeout(() => setPhase("out"), 2800);
    const t5 = setTimeout(onFinish, 3500);
    return () => [t1, t2, t3, t4, t5].forEach(clearTimeout);
  }, [onFinish]);

  const showMark = phase !== "intro";
  const showWord = phase === "wordmark" || phase === "settle" || phase === "out";
  const showTagline = phase === "settle" || phase === "out";

  return (
    <AnimatePresence>
      <motion.div
        key="splash"
        initial={{ opacity: 1 }}
        animate={{ opacity: phase === "out" ? 0 : 1 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-background overflow-hidden"
      >
        {/* ── Atmosphere: vignette + soft aurora ── */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at center, transparent 0%, hsl(var(--background)) 75%)",
          }}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: phase === "out" ? 0 : 0.35, scale: 1 }}
          transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[820px] h-[820px] rounded-full blur-[160px] pointer-events-none"
          style={{ background: "hsl(var(--primary) / 0.55)" }}
        />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: phase === "out" ? 0 : 0.18 }}
          transition={{ duration: 2, delay: 0.3 }}
          className="absolute top-[55%] left-[55%] -translate-x-1/2 -translate-y-1/2 w-[520px] h-[320px] rounded-full blur-[140px] pointer-events-none"
          style={{ background: "hsl(var(--accent))" }}
        />

        {/* Subtle grid */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.035]"
          style={{
            backgroundImage:
              "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)",
            backgroundSize: "72px 72px",
            maskImage:
              "radial-gradient(ellipse at center, black 30%, transparent 75%)",
            WebkitMaskImage:
              "radial-gradient(ellipse at center, black 30%, transparent 75%)",
          }}
        />

        {/* ── Composition ── */}
        <div className="relative flex flex-col items-center gap-10">
          {/* Mark: luminous self-drawing checkmark inside a gradient tile */}
          <div className="relative">
            {/* Pulsing halo ring */}
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{
                scale: showMark ? [1, 1.18, 1] : 0.6,
                opacity: showMark ? [0.6, 0, 0.6] : 0,
              }}
              transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-[-18px] rounded-[28px] pointer-events-none"
              style={{ border: "1.5px solid hsl(var(--primary) / 0.35)" }}
            />

            {/* Tile */}
            <motion.div
              initial={{ opacity: 0, scale: 0.7, rotateX: -25, y: 12 }}
              animate={{
                opacity: showMark ? 1 : 0,
                scale: showMark ? (phase === "settle" || phase === "out" ? 1 : 1) : 0.7,
                rotateX: 0,
                y: 0,
              }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-[112px] h-[112px] rounded-[26px] flex items-center justify-center"
              style={{
                background: "var(--gradient-primary)",
                boxShadow:
                  "0 24px 60px -16px hsl(16 92% 62% / 0.55), 0 0 80px -20px hsl(355 88% 58% / 0.4), inset 0 1px 0 0 hsl(0 0% 100% / 0.18), inset 0 -2px 4px 0 hsl(0 0% 0% / 0.18)",
                transformPerspective: 800,
              }}
            >
              {/* Specular highlight sweep */}
              <motion.div
                initial={{ x: "-120%" }}
                animate={{ x: showMark ? "140%" : "-120%" }}
                transition={{ duration: 1.4, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="absolute inset-0 rounded-[26px] overflow-hidden"
                style={{
                  background:
                    "linear-gradient(115deg, transparent 35%, hsl(0 0% 100% / 0.35) 50%, transparent 65%)",
                  mixBlendMode: "screen",
                  width: "60%",
                }}
              />

              {/* Self-drawing checkmark */}
              <svg
                width="56"
                height="56"
                viewBox="0 0 24 24"
                fill="none"
                stroke="hsl(0 0% 100%)"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="relative z-10"
                style={{ filter: "drop-shadow(0 2px 6px hsl(0 0% 0% / 0.25))" }}
              >
                <motion.path
                  d="M20 6 9 17l-5-5"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{
                    pathLength: showMark ? 1 : 0,
                    opacity: showMark ? 1 : 0,
                  }}
                  transition={{
                    pathLength: { duration: 0.7, delay: 0.35, ease: [0.65, 0, 0.35, 1] },
                    opacity: { duration: 0.2, delay: 0.35 },
                  }}
                />
              </svg>
            </motion.div>

            {/* Ground reflection */}
            <motion.div
              initial={{ opacity: 0, scaleY: 0 }}
              animate={{ opacity: showMark ? 0.35 : 0, scaleY: showMark ? 1 : 0 }}
              transition={{ duration: 0.9, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-[140px] h-[36px] rounded-[50%] pointer-events-none origin-top"
              style={{
                background:
                  "radial-gradient(ellipse at center, hsl(16 92% 62% / 0.45) 0%, transparent 70%)",
                filter: "blur(8px)",
              }}
            />
          </div>

          {/* Wordmark */}
          <div className="relative flex flex-col items-center gap-4 min-h-[90px]">
            <motion.h1
              initial={{ opacity: 0, y: 14, filter: "blur(14px)", letterSpacing: "0.18em" }}
              animate={{
                opacity: showWord ? 1 : 0,
                y: showWord ? 0 : 14,
                filter: showWord ? "blur(0px)" : "blur(14px)",
                letterSpacing: showWord ? "-0.025em" : "0.18em",
              }}
              transition={{ duration: 0.95, ease: [0.16, 1, 0.3, 1] }}
              className="font-display text-5xl md:text-6xl font-bold tracking-tight relative"
            >
              <span className="text-foreground">Job</span>
              <span className="text-gradient-primary relative">
                Swipe
                {/* Wordmark shimmer */}
                <motion.span
                  initial={{ x: "-120%", opacity: 0 }}
                  animate={{
                    x: showWord ? "140%" : "-120%",
                    opacity: showWord ? [0, 1, 0] : 0,
                  }}
                  transition={{ duration: 1.6, delay: 1.2, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background:
                      "linear-gradient(115deg, transparent 35%, hsl(0 0% 100% / 0.6) 50%, transparent 65%)",
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    color: "transparent",
                    mixBlendMode: "screen",
                  }}
                >
                  Swipe
                </motion.span>
              </span>
              <span className="text-muted-foreground/80">.pl</span>
            </motion.h1>

            {/* Underline accent */}
            <motion.div
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{
                scaleX: showWord ? 1 : 0,
                opacity: showWord ? 1 : 0,
              }}
              transition={{ duration: 0.7, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="h-[2px] w-24 rounded-full origin-center"
              style={{
                background:
                  "linear-gradient(90deg, transparent, hsl(var(--primary)), transparent)",
                boxShadow: "0 0 12px hsl(var(--primary) / 0.6)",
              }}
            />

            {/* Tagline */}
            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={{
                opacity: showTagline ? 1 : 0,
                y: showTagline ? 0 : 6,
              }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="text-[11px] text-muted-foreground tracking-[0.42em] uppercase"
            >
              Znajdź swoją idealną pracę
            </motion.p>
          </div>
        </div>

        {/* ── Bottom: refined progress indicator ── */}
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

        {/* Final reveal: subtle iris flash on exit */}
        {phase === "out" && (
          <motion.div
            initial={{ scale: 0, opacity: 0.5 }}
            animate={{ scale: 8, opacity: 0 }}
            transition={{ duration: 0.7, ease: [0.65, 0, 0.35, 1] }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full pointer-events-none"
            style={{
              background:
                "radial-gradient(circle, hsl(var(--primary) / 0.5) 0%, transparent 70%)",
            }}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default SplashScreen;
