import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

const SplashScreen = ({ onFinish }: { onFinish: () => void }) => {
  const [phase, setPhase] = useState<"logo" | "out">("logo");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("out"), 1800);
    const t2 = setTimeout(onFinish, 2400);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onFinish]);

  return (
    <AnimatePresence>
      {phase !== "out" ? null : undefined}
      <motion.div
        key="splash"
        initial={{ opacity: 1 }}
        animate={phase === "out" ? { opacity: 0, scale: 1.05 } : { opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
        className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background"
      >
        {/* Ambient glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-20 blur-[120px]"
            style={{ background: "hsl(var(--primary))" }}
          />
          <div
            className="absolute top-1/3 left-1/3 w-[300px] h-[300px] rounded-full opacity-10 blur-[80px]"
            style={{ background: "hsl(var(--accent))" }}
          />
        </div>

        {/* Logo / Brand */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, ease: "easeOut", delay: 0.15 }}
          className="relative flex flex-col items-center gap-4"
        >
          {/* Icon */}
          <motion.div
            initial={{ rotate: -10 }}
            animate={{ rotate: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
            className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-glow"
            style={{ background: "var(--gradient-primary)" }}
          >
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--primary-foreground))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="text-3xl font-bold font-display tracking-tight text-foreground"
          >
            JulyAPP
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="text-sm text-muted-foreground tracking-wide"
          >
            Znajdź swoją idealną pracę
          </motion.p>
        </motion.div>

        {/* Loading bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute bottom-24 w-40"
        >
          <div className="h-0.5 w-full rounded-full bg-secondary overflow-hidden">
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: "100%" }}
              transition={{ duration: 1.2, ease: "easeInOut", repeat: Infinity }}
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
