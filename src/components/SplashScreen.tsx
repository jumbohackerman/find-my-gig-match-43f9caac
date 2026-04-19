import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// Particle splash: canvas-based for smooth 60fps. Particles fly from random
// off-screen positions, form the checkmark logo, then morph into the wordmark
// "JobSwipe.pl", and finally burst outward as the app reveals.
// ─────────────────────────────────────────────────────────────────────────────

const STAGE_W = 720;
const STAGE_H = 360;
const PARTICLE_COUNT = 220;

type Phase = "logo" | "wordmark" | "reveal" | "burst" | "out";

interface Particle {
  ox: number; oy: number;        // origin (off-screen)
  lx: number; ly: number;        // logo target
  wx: number; wy: number;        // wordmark target
  bx: number; by: number;        // burst target
  size: number;
  color: string;
  delay: number;                  // 0..1 stagger
}

// Sample evenly along a polyline (checkmark shape)
function samplePolyline(pts: { x: number; y: number }[], count: number) {
  const segs: { dx: number; dy: number; len: number; sx: number; sy: number }[] = [];
  let total = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const dx = pts[i + 1].x - pts[i].x;
    const dy = pts[i + 1].y - pts[i].y;
    const len = Math.hypot(dx, dy);
    segs.push({ dx, dy, len, sx: pts[i].x, sy: pts[i].y });
    total += len;
  }
  const out: { x: number; y: number }[] = [];
  for (let i = 0; i < count; i++) {
    const t = (i + 0.5) / count;
    let target = t * total;
    for (const s of segs) {
      if (target <= s.len) {
        const k = target / s.len;
        out.push({ x: s.sx + s.dx * k, y: s.sy + s.dy * k });
        break;
      }
      target -= s.len;
    }
  }
  return out;
}

// Rasterize text and sample evenly distributed bright pixels
function sampleText(text: string, font: string, count: number, w: number, h: number): { x: number; y: number }[] {
  if (typeof document === "undefined") return [];
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const ctx = c.getContext("2d");
  if (!ctx) return [];
  ctx.fillStyle = "#fff";
  ctx.font = font;
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  ctx.fillText(text, w / 2, h / 2);
  const data = ctx.getImageData(0, 0, w, h).data;
  const pts: { x: number; y: number }[] = [];
  const step = 3;
  for (let y = 0; y < h; y += step) {
    for (let x = 0; x < w; x += step) {
      if (data[(y * w + x) * 4 + 3] > 128) pts.push({ x, y });
    }
  }
  // Stratified pick: take every Nth so particles spread evenly across letters
  if (pts.length <= count) return pts;
  const stride = pts.length / count;
  const picked: { x: number; y: number }[] = [];
  for (let i = 0; i < count; i++) picked.push(pts[Math.floor(i * stride)]);
  return picked;
}

// Easing
const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

const SplashScreen = ({ onFinish }: { onFinish: () => void }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<Phase>("logo");
  const phaseRef = useRef<Phase>("logo");
  const phaseStartRef = useRef<number>(performance.now());
  const rafRef = useRef<number>();

  // Resolved theme colors (read once from CSS vars)
  const colors = useMemo(() => {
    if (typeof window === "undefined") return { primary: "#f97316", accent: "#10b981", white: "#fff" };
    const root = getComputedStyle(document.documentElement);
    const primary = `hsl(${root.getPropertyValue("--primary").trim()})`;
    const accent = `hsl(${root.getPropertyValue("--accent").trim()})`;
    return { primary, accent, white: "hsl(210 40% 100%)" };
  }, []);

  const particles = useMemo<Particle[]>(() => {
    const cx = STAGE_W / 2;
    const cy = 130;
    const checkPts = [
      { x: cx - 50, y: cy + 6 },
      { x: cx - 14, y: cy + 42 },
      { x: cx + 56, y: cy - 36 },
    ];
    const logo = samplePolyline(checkPts, PARTICLE_COUNT);
    const wordRaw = sampleText(
      "JobSwipe.pl",
      "bold 92px 'Space Grotesk', system-ui, sans-serif",
      PARTICLE_COUNT,
      STAGE_W,
      150,
    );
    // Pad if rasterizing returned fewer
    const word = wordRaw.length >= PARTICLE_COUNT
      ? wordRaw
      : Array.from({ length: PARTICLE_COUNT }, (_, i) => wordRaw[i % wordRaw.length] ?? { x: cx, y: 75 });
    const wordYOffset = 200;

    return Array.from({ length: PARTICLE_COUNT }, (_, i) => {
      const ang = Math.random() * Math.PI * 2;
      const r = 480 + Math.random() * 280;
      const burstAng = Math.random() * Math.PI * 2;
      const burstR = 380 + Math.random() * 200;
      const colorRoll = Math.random();
      return {
        ox: cx + Math.cos(ang) * r,
        oy: cy + Math.sin(ang) * r,
        lx: logo[i].x,
        ly: logo[i].y,
        wx: word[i].x,
        wy: word[i].y + wordYOffset,
        bx: STAGE_W / 2 + Math.cos(burstAng) * burstR,
        by: STAGE_H / 2 + Math.sin(burstAng) * burstR,
        size: 1.2 + Math.random() * 2.2,
        color: colorRoll < 0.75 ? colors.primary : colorRoll < 0.93 ? colors.accent : colors.white,
        delay: Math.random() * 0.4,
      };
    });
  }, [colors]);

  // Phase scheduler
  useEffect(() => {
    const setP = (p: Phase) => {
      phaseRef.current = p;
      phaseStartRef.current = performance.now();
      setPhase(p);
    };
    const t1 = setTimeout(() => setP("wordmark"), 1700);
    const t2 = setTimeout(() => setP("burst"), 3300);
    const t3 = setTimeout(() => setP("out"), 3800);
    const t4 = setTimeout(onFinish, 4400);
    return () => [t1, t2, t3, t4].forEach(clearTimeout);
  }, [onFinish]);

  // Render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = STAGE_W * dpr;
    canvas.height = STAGE_H * dpr;
    ctx.scale(dpr, dpr);

    let prevPhase: Phase = "logo";
    let prevX: Float32Array = new Float32Array(PARTICLE_COUNT);
    let prevY: Float32Array = new Float32Array(PARTICLE_COUNT);
    // Initialize prev positions to origin
    particles.forEach((p, i) => { prevX[i] = p.ox; prevY[i] = p.oy; });

    const PHASE_DUR: Record<Phase, number> = {
      logo: 1500,
      wordmark: 1500,
      burst: 600,
      out: 600,
    };

    const draw = () => {
      const now = performance.now();
      const phase = phaseRef.current;

      // On phase change: snapshot current positions as the new "from"
      if (phase !== prevPhase) {
        // capture current rendered positions by re-sampling from the previous animation
        prevPhase = phase;
      }

      ctx.clearRect(0, 0, STAGE_W, STAGE_H);
      ctx.globalCompositeOperation = "lighter";

      const elapsed = now - phaseStartRef.current;
      const dur = PHASE_DUR[phase];

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        // Per-particle delay (0..0.4 of duration)
        const delayMs = p.delay * dur * 0.5;
        const localT = Math.max(0, Math.min(1, (elapsed - delayMs) / (dur - delayMs)));

        // Determine from/to per phase
        let fx: number, fy: number, tx: number, ty: number, eased: number, alpha: number;
        if (phase === "logo") {
          fx = p.ox; fy = p.oy; tx = p.lx; ty = p.ly;
          eased = easeOut(localT);
          alpha = Math.min(1, localT * 2);
        } else if (phase === "wordmark") {
          fx = p.lx; fy = p.ly; tx = p.wx; ty = p.wy;
          eased = easeInOut(localT);
          alpha = 1;
        } else if (phase === "burst") {
          fx = p.wx; fy = p.wy; tx = p.bx; ty = p.by;
          eased = easeOut(localT);
          alpha = 1 - localT;
        } else {
          fx = p.bx; fy = p.by; tx = p.bx; ty = p.by;
          eased = 1;
          alpha = 0;
        }

        const x = fx + (tx - fx) * eased;
        const y = fy + (ty - fy) * eased;

        if (alpha <= 0.01) continue;

        // Draw with soft glow via radial gradient
        const r = p.size;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();

        // Subtle halo
        ctx.globalAlpha = alpha * 0.25;
        ctx.beginPath();
        ctx.arc(x, y, r * 2.6, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [particles]);

  return (
    <AnimatePresence>
      <motion.div
        key="splash"
        initial={{ opacity: 1 }}
        animate={{ opacity: phase === "out" ? 0 : 1 }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-background overflow-hidden"
      >
        {/* Grid backdrop */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.04]"
          style={{
            backgroundImage: `linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)`,
            backgroundSize: "64px 64px",
          }}
        />

        {/* Aurora glows */}
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{
            scale: phase === "burst" || phase === "out" ? 1.5 : 1,
            opacity: phase === "burst" ? 0.4 : 0.22,
          }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[760px] h-[760px] rounded-full blur-[160px] pointer-events-none"
          style={{ background: "hsl(var(--primary))" }}
        />
        <motion.div
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.13 }}
          transition={{ duration: 2.2, ease: "easeOut" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[320px] rounded-full blur-[120px] pointer-events-none"
          style={{ background: "hsl(var(--accent))" }}
        />

        {/* Canvas particle stage */}
        <div className="relative pointer-events-none" style={{ width: STAGE_W, height: STAGE_H }}>
          <canvas
            ref={canvasRef}
            style={{ width: STAGE_W, height: STAGE_H, display: "block" }}
          />

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{
              opacity: phase === "wordmark" ? 1 : 0,
              y: phase === "wordmark" ? 0 : 8,
            }}
            transition={{ duration: 0.6, delay: phase === "wordmark" ? 0.9 : 0 }}
            className="absolute left-0 right-0 text-center text-xs tracking-[0.4em] uppercase text-muted-foreground"
            style={{ top: 320 }}
          >
            Znajdź swoją idealną pracę
          </motion.p>
        </div>

        {/* Burst ring */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{
            scale: phase === "burst" ? 5 : 0,
            opacity: phase === "burst" ? [0, 0.5, 0] : 0,
          }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full border-2 pointer-events-none"
          style={{ borderColor: "hsl(var(--primary) / 0.5)" }}
        />

        {/* Loading bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: phase === "out" || phase === "burst" ? 0 : 1 }}
          transition={{ duration: 0.4 }}
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
