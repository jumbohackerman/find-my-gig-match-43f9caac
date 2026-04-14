import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

const particles = Array.from({ length: 12 }, (_, i) => ({
  id: i,
  x: Math.cos((i / 12) * Math.PI * 2) * 120,
  y: Math.sin((i / 12) * Math.PI * 2) * 120,
  delay: i * 0.08,
  size: 3 + Math.random() * 4,
}));

const SplashScreen = ({ onFinish }: { onFinish: () => void }) => {
  const [phase, setPhase] = useState<"enter" | "hold" | "out">("enter");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("hold"), 600);
    const t2 = setTimeout(() => setPhase("out"), 2200);
    const t3 = setTimeout(onFinish, 2900);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onFinish]);

  return (
    <AnimatePresence>
      {phase === "out" && (
        <motion.div
          key="flash"
          initial={{ opacity: 0.6 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[10000] pointer-events-none"
          style={{ background: "hsl(var(--primary))" }}
        />
      )}
      <motion.div
        key="splash"
        initial={{ opacity: 1 }}
        animate={phase === "out" ? { opacity: 0 } : { opacity: 1 }}
        transition={{ duration: 0.7, ease: "easeInOut" }}
        className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background overflow-hidden"
      >
        {/* Animated background grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.03 }}
          transition={{ duration: 1.5 }}
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />

        {/* Ambient glow 1 */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.25 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full blur-[140px] pointer-events-none"
          style={{ background: "hsl(var(--primary))" }}
        />

        {/* Ambient glow 2 – rotating */}
        <motion.div
          initial={{ scale: 0.3, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.12, rotate: 180 }}
          transition={{ duration: 3, ease: "easeOut" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] rounded-full blur-[100px] pointer-events-none"
          style={{ background: "hsl(var(--accent))" }}
        />

        {/* Orbiting particles */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          {particles.map((p) => (
            <motion.div
              key={p.id}
              initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
              animate={{
                x: p.x,
                y: p.y,
                opacity: [0, 0.8, 0.4],
                scale: [0, 1.2, 0.8],
              }}
              transition={{
                duration: 1.2,
                delay: 0.4 + p.delay,
                ease: "easeOut",
              }}
              className="absolute rounded-full"
              style={{
                width: p.size,
                height: p.size,
                background: "hsl(var(--primary))",
                boxShadow: "0 0 8px hsl(var(--primary) / 0.6)",
              }}
            />
          ))}
        </div>

        {/* Ring burst */}
        <motion.div
          initial={{ scale: 0, opacity: 0.6 }}
          animate={{ scale: 3, opacity: 0 }}
          transition={{ duration: 1.8, delay: 0.3, ease: "easeOut" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full border-2 pointer-events-none"
          style={{ borderColor: "hsl(var(--primary) / 0.4)" }}
        />

        {/* Logo / Brand */}
        <motion.div className="relative flex flex-col items-center gap-5">
          {/* Icon container with shimmer */}
          <motion.div
            initial={{ opacity: 0, scale: 0, rotate: -180 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{
              duration: 0.8,
              ease: [0.16, 1, 0.3, 1],
              delay: 0.1,
            }}
            className="relative"
          >
            {/* Pulsing ring behind icon */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0, 0.3] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-[-12px] rounded-2xl"
              style={{ border: "2px solid hsl(var(--primary) / 0.3)" }}
            />

            <div
              className="w-22 h-22 rounded-2xl flex items-center justify-center shadow-glow relative overflow-hidden"
              style={{
                width: 88,
                height: 88,
                background: "var(--gradient-primary)",
              }}
            >
              {/* Shimmer effect */}
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: "200%" }}
                transition={{ duration: 1.5, delay: 0.8, ease: "easeInOut" }}
                className="absolute inset-0 opacity-30"
                style={{
                  background: "linear-gradient(90deg, transparent, white, transparent)",
                  width: "50%",
                }}
              />
              <svg
                width="42"
                height="42"
                viewBox="0 0 24 24"
                fill="none"
                stroke="hsl(var(--primary-foreground))"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <motion.path
                  d="M20 6 9 17l-5-5"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.6, delay: 0.5, ease: "easeOut" }}
                />
              </svg>
            </div>
          </motion.div>

          {/* Title with letter stagger */}
          <motion.div className="overflow-hidden">
            <motion.h1
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="text-4xl font-bold font-display tracking-tight text-foreground"
            >
              {"JobSwipe.pl".split("").map((char, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.6 + i * 0.05 }}
                  className="inline-block"
                >
                  {char}
                </motion.span>
              ))}
            </motion.h1>
          </motion.div>

          {/* Subtitle with typewriter feel */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1.1 }}
            className="text-sm text-muted-foreground tracking-widest uppercase"
          >
            Znajdź swoją idealną pracę
          </motion.p>

          {/* Decorative line */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.8, delay: 1.3, ease: "easeOut" }}
            className="w-16 h-px origin-center"
            style={{ background: "hsl(var(--primary) / 0.5)" }}
          />
        </motion.div>

        {/* Loading bar – premium style */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.5 }}
          className="absolute bottom-20 flex flex-col items-center gap-3"
        >
          <div className="w-48 h-[2px] rounded-full bg-secondary/50 overflow-hidden relative">
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: "100%" }}
              transition={{ duration: 1, ease: "easeInOut", repeat: Infinity }}
              className="h-full w-1/2 rounded-full"
              style={{ background: "var(--gradient-primary)" }}
            />
          </div>
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.5, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-xs text-muted-foreground tracking-wider"
          >
            ŁADOWANIE
          </motion.span>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SplashScreen;
