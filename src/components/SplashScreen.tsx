import { useEffect, useRef, useState } from "react";

const SPLASH_DURATION = 4200;
const EXIT_DURATION = 500;

const SplashScreen = ({ onFinish }: { onFinish: () => void }) => {
  const [exiting, setExiting] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const exitTimer = setTimeout(() => setExiting(true), SPLASH_DURATION);
    const finishTimer = setTimeout(onFinish, SPLASH_DURATION + EXIT_DURATION);
    return () => {
      clearTimeout(exitTimer);
      clearTimeout(finishTimer);
    };
  }, [onFinish]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const root = rootRef.current;
    if (!canvas || !root) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let W = 0, H = 0, cx = 0, cy = 0, raf = 0, t = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = root.offsetWidth;
      H = root.offsetHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cx = W * 0.5;
      cy = H * 0.5;
    };
    resize();
    window.addEventListener("resize", resize);

    const nodeTypes = [
      "person","person","person","person","person",
      "job","job","job","job",
      "company","company","company",
    ] as const;
    type NodeType = typeof nodeTypes[number];

    interface Node {
      baseAngle: number;
      r: number;
      type: NodeType;
      orbitSpeed: number;
      floatAmp: number;
      floatFreq: number;
      floatPhase: number;
      size: number;
      opacity: number;
      pulse: number;
    }

    const NODE_COUNT = 22;
    const nodes: Node[] = Array.from({ length: NODE_COUNT }, (_, i) => {
      const angle = (i / NODE_COUNT) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
      const ring = Math.random() < 0.4 ? 1 : 2;
      const r = ring === 1 ? 110 + Math.random() * 40 : 200 + Math.random() * 60;
      const type = nodeTypes[i % nodeTypes.length];
      return {
        baseAngle: angle,
        r,
        type,
        orbitSpeed: (Math.random() - 0.5) * 0.0008,
        floatAmp: Math.random() * 12 + 4,
        floatFreq: Math.random() * 0.015 + 0.008,
        floatPhase: Math.random() * Math.PI * 2,
        size: type === "company" ? 18 : type === "job" ? 13 : 11,
        opacity: Math.random() * 0.4 + 0.5,
        pulse: Math.random() * Math.PI * 2,
      };
    });

    interface Edge {
      from: number;
      to: number;
      phase: number;
      speed: number;
      activateAt: number;
      pulsePos: number;
      color: [number, number, number];
    }
    const edges: Edge[] = [];
    for (let i = 0; i < NODE_COUNT; i++) {
      if (nodes[i].type === "person") {
        const jobs = nodes.map((n, j) => ({ n, j })).filter((x) => x.n.type === "job");
        const picks = jobs.sort(() => Math.random() - 0.5).slice(0, 1 + Math.floor(Math.random() * 2));
        picks.forEach((p) => {
          edges.push({
            from: i, to: p.j,
            phase: Math.random() * Math.PI * 2,
            speed: Math.random() * 0.008 + 0.004,
            activateAt: Math.random() * 400 + 80,
            pulsePos: 0,
            color: [245, 130, 70],
          });
        });
        if (Math.random() < 0.3) {
          const cos = nodes.map((n, j) => ({ n, j })).filter((x) => x.n.type === "company");
          const co = cos[Math.floor(Math.random() * cos.length)];
          if (co) edges.push({ from: i, to: co.j, phase: Math.random() * Math.PI * 2, speed: 0.005, activateAt: Math.random() * 500 + 120, pulsePos: 0, color: [255, 170, 100] });
        }
      }
    }

    const floaters = Array.from({ length: 55 }, () => ({
      x: Math.random(), y: Math.random() + 0.1,
      vx: (Math.random() - 0.5) * 0.0002,
      vy: -(Math.random() * 0.0003 + 0.0001),
      r: Math.random() * 1.3 + 0.3,
      op: Math.random() * 0.4 + 0.1,
      ph: Math.random() * Math.PI * 2,
      hue: 210 + Math.random() * 40,
    }));

    const auroraBlobs = [
      { bx: 0.2, by: 0.3, r: 0.35, hue: 220, speed: 0.00015, ph: 0 },
      { bx: 0.8, by: 0.65, r: 0.3, hue: 250, speed: 0.00012, ph: 2 },
      { bx: 0.5, by: 0.1, r: 0.28, hue: 200, speed: 0.0002, ph: 4 },
    ];

    const getNodePos = (node: Node) => {
      const angle = node.baseAngle + t * node.orbitSpeed;
      const fy = Math.sin(t * node.floatFreq + node.floatPhase) * node.floatAmp;
      return {
        x: cx + Math.cos(angle) * node.r,
        y: cy + Math.sin(angle) * node.r * 0.55 + fy,
      };
    };

    const drawPersonIcon = (x: number, y: number, size: number, alpha: number) => {
      ctx.strokeStyle = `rgba(147,197,253,${alpha})`;
      ctx.fillStyle = `rgba(30,58,120,${alpha * 0.7})`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(x, y - size * 0.35, size * 0.3, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();
      ctx.beginPath();
      ctx.arc(x, y + size * 0.35, size * 0.55, Math.PI, 0, false);
      ctx.stroke();
    };

    const drawBriefcase = (x: number, y: number, size: number, alpha: number) => {
      ctx.strokeStyle = `rgba(134,239,172,${alpha})`;
      ctx.fillStyle = `rgba(20,60,40,${alpha * 0.7})`;
      ctx.lineWidth = 1.2;
      const w = size * 1.1, h = size * 0.8;
      ctx.beginPath();
      // @ts-ignore roundRect
      ctx.roundRect(x - w / 2, y - h / 2 + 2, w, h, 2);
      ctx.fill(); ctx.stroke();
      const hw = w * 0.45, hh = size * 0.3;
      ctx.beginPath();
      // @ts-ignore
      ctx.roundRect(x - hw / 2, y - h / 2 - hh + 2, hw, hh, 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x - w / 2, y + 1); ctx.lineTo(x + w / 2, y + 1);
      ctx.stroke();
    };

    const drawBuilding = (x: number, y: number, size: number, alpha: number) => {
      ctx.strokeStyle = `rgba(216,180,254,${alpha})`;
      ctx.fillStyle = `rgba(60,20,100,${alpha * 0.6})`;
      ctx.lineWidth = 1.2;
      const w = size * 0.9, h = size * 1.1;
      ctx.beginPath();
      ctx.rect(x - w / 2, y - h / 2, w, h);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = `rgba(216,180,254,${alpha * 0.5})`;
      for (let r = 0; r < 2; r++) for (let col = 0; col < 2; col++) {
        ctx.fillRect(x - w * 0.28 + col * w * 0.38, y - h * 0.25 + r * h * 0.35, w * 0.18, h * 0.2);
      }
    };

    const draw = () => {
      raf = requestAnimationFrame(draw);
      t++;
      ctx.clearRect(0, 0, W, H);

      ctx.fillStyle = "#06080F"; ctx.fillRect(0, 0, W, H);

      auroraBlobs.forEach((b) => {
        const bx = (b.bx + Math.sin(t * b.speed * Math.PI * 2 + b.ph) * 0.07) * W;
        const by = (b.by + Math.cos(t * b.speed * Math.PI * 2 + b.ph) * 0.05) * H;
        const g = ctx.createRadialGradient(bx, by, 0, bx, by, b.r * W);
        g.addColorStop(0, `hsla(${b.hue},80%,55%,${0.09 + 0.03 * Math.sin(t * 0.003 + b.ph)})`);
        g.addColorStop(1, "transparent");
        ctx.beginPath(); ctx.arc(bx, by, b.r * W, 0, Math.PI * 2);
        ctx.fillStyle = g; ctx.fill();
      });

      const gs = 52, ox = (t * 0.15) % gs, oy = (t * 0.15) % gs;
      ctx.strokeStyle = "rgba(59,130,246,0.035)"; ctx.lineWidth = 0.5;
      for (let x = -gs + ox; x < W + gs; x += gs) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (let y = -oy; y < H + gs; y += gs) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

      const vig = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(W, H) * 0.65);
      vig.addColorStop(0, "transparent"); vig.addColorStop(1, "rgba(6,8,15,.9)");
      ctx.fillStyle = vig; ctx.fillRect(0, 0, W, H);

      floaters.forEach((p) => {
        p.x += p.vx; p.y += p.vy; p.ph += 0.01;
        if (p.y < -0.02) { p.y = 1.02; p.x = Math.random(); }
        if (p.x < 0) p.x = 1; if (p.x > 1) p.x = 0;
        const a = p.op * (0.5 + 0.5 * Math.sin(p.ph));
        ctx.beginPath(); ctx.arc(p.x * W, p.y * H, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue},70%,72%,${a})`; ctx.fill();
      });

      const positions = nodes.map(getNodePos);

      edges.forEach((e) => {
        if (t < e.activateAt) return;
        e.pulsePos = ((t - e.activateAt) * e.speed) % 1;
        const p0 = positions[e.from], p1 = positions[e.to];
        const dx = p1.x - p0.x, dy = p1.y - p0.y;
        const alpha = 0.12 + 0.06 * Math.sin(t * 0.008 + e.phase);
        const g = ctx.createLinearGradient(p0.x, p0.y, p1.x, p1.y);
        g.addColorStop(0, `rgba(${e.color[0]},${e.color[1]},${e.color[2]},.05)`);
        g.addColorStop(0.5, `rgba(${e.color[0]},${e.color[1]},${e.color[2]},${alpha})`);
        g.addColorStop(1, `rgba(${e.color[0]},${e.color[1]},${e.color[2]},.05)`);
        ctx.beginPath(); ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y);
        ctx.strokeStyle = g; ctx.lineWidth = 0.8; ctx.stroke();

        const pp = e.pulsePos;
        const px = p0.x + dx * pp, py = p0.y + dy * pp;
        const pg = ctx.createRadialGradient(px, py, 0, px, py, 6);
        pg.addColorStop(0, `rgba(${e.color[0]},${e.color[1]},${e.color[2]},1)`);
        pg.addColorStop(1, "transparent");
        ctx.beginPath(); ctx.arc(px, py, 6, 0, Math.PI * 2);
        ctx.fillStyle = pg; ctx.fill();

        if (pp > 0.85) {
          const fl = (pp - 0.85) / 0.15;
          const r2 = ctx.createRadialGradient(p1.x, p1.y, 0, p1.x, p1.y, 22 * (1 - fl));
          r2.addColorStop(0, `rgba(${e.color[0]},${e.color[1]},${e.color[2]},${0.5 * fl})`);
          r2.addColorStop(1, "transparent");
          ctx.beginPath(); ctx.arc(p1.x, p1.y, 22 * (1 - fl), 0, Math.PI * 2);
          ctx.fillStyle = r2; ctx.fill();
        }
      });

      nodes.forEach((node, i) => {
        const { x, y } = positions[i];
        const sz = node.size;
        node.pulse += 0.022;
        const pf = 0.6 + 0.4 * Math.sin(node.pulse);
        const alpha = node.opacity * pf;

        const glowR = sz * 2.2;
        const glowCol =
          node.type === "person" ? "59,130,246" :
          node.type === "job" ? "34,197,94" :
          "168,85,247";
        const gl = ctx.createRadialGradient(x, y, 0, x, y, glowR);
        gl.addColorStop(0, `rgba(${glowCol},${0.18 * pf})`);
        gl.addColorStop(1, "transparent");
        ctx.beginPath(); ctx.arc(x, y, glowR, 0, Math.PI * 2);
        ctx.fillStyle = gl; ctx.fill();

        if (node.type === "person") drawPersonIcon(x, y, sz, alpha);
        else if (node.type === "job") drawBriefcase(x, y, sz, alpha);
        else drawBuilding(x, y, sz, alpha);
      });

      const cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, 80);
      cg.addColorStop(0, `rgba(37,99,235,${0.08 + 0.04 * Math.sin(t * 0.018)})`);
      cg.addColorStop(1, "transparent");
      ctx.beginPath(); ctx.arc(cx, cy, 80, 0, Math.PI * 2);
      ctx.fillStyle = cg; ctx.fill();

      const cw = 120, ch = 160, cr = 12;
      const cardY = cy - 70 + 5 * Math.sin(t * 0.016);
      const cardAlpha = 0.04 + 0.02 * Math.sin(t * 0.02);
      ctx.beginPath();
      // @ts-ignore
      ctx.roundRect(cx - cw / 2, cardY - ch / 2, cw, ch, cr);
      ctx.fillStyle = `rgba(37,99,235,${cardAlpha})`;
      ctx.fill();
      ctx.strokeStyle = `rgba(93,173,255,${cardAlpha * 3})`;
      ctx.lineWidth = 0.8; ctx.stroke();
    };

    if (!reduce) draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,300;0,400;0,600;0,800;1,300&display=swap');

        .sp-root {
          position: fixed; inset: 0; z-index: 9999;
          background: #06080F;
          font-family: 'Inter', system-ui, sans-serif;
          overflow: hidden;
          display: flex; align-items: center; justify-content: center;
        }
        .sp-root.exiting {
          animation: spExit 500ms cubic-bezier(0.4,0,1,1) forwards;
        }
        @keyframes spExit {
          0%   { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(1.04); }
        }

        .sp-canvas { position: absolute; inset: 0; width: 100%; height: 100%; }

        .sp-ui {
          position: relative; z-index: 20;
          display: flex; flex-direction: column; align-items: center;
          pointer-events: none;
        }

        .sp-icon-wrap {
          width: 86px; height: 86px; position: relative;
          margin-bottom: 26px;
          animation:
            spIconIn 1s cubic-bezier(0.34,1.56,0.64,1) 0.4s both,
            spIconFloat 5s ease-in-out 1.6s infinite;
        }
        @keyframes spIconIn {
          from { opacity: 0; transform: scale(0.4) translateY(24px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes spIconFloat {
          0%,100% { transform: translateY(0px); }
          50%     { transform: translateY(-7px); }
        }

        .sp-icon-bg {
          width: 86px; height: 86px; border-radius: 24px;
          background: linear-gradient(145deg, #4F8EF7 0%, #2563EB 50%, #1340C0 100%);
          display: flex; align-items: center; justify-content: center;
          position: relative; overflow: hidden;
          box-shadow:
            0 0 0 1px rgba(79,142,247,0.35),
            0 8px 28px rgba(37,99,235,0.55),
            0 20px 60px rgba(19,64,192,0.3);
        }
        .sp-icon-bg::before {
          content: '';
          position: absolute; top: -40%; left: -20%;
          width: 55%; height: 80%;
          background: rgba(255,255,255,0.2);
          transform: rotate(-25deg); border-radius: 6px;
          animation: spSheen 4.5s ease-in-out 1.8s infinite;
        }
        @keyframes spSheen {
          0%,100% { opacity: 0; left: -20%; }
          25%     { opacity: 1; }
          55%     { opacity: 0; left: 110%; }
        }
        .sp-icon-bg svg {
          width: 42px; height: 42px;
          stroke: rgba(255,255,255,0.95); fill: none;
          stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round;
          position: relative; z-index: 1;
          filter: drop-shadow(0 2px 8px rgba(0,0,0,0.3));
        }
        .sp-icon-bg svg .draw {
          stroke-dasharray: 60; stroke-dashoffset: 60;
          animation: spDraw 900ms cubic-bezier(0.22,1,0.36,1) 850ms forwards;
        }
        @keyframes spDraw { to { stroke-dashoffset: 0; } }

        .sp-halo {
          position: absolute; inset: -14px; border-radius: 50%;
          border: 1.5px solid rgba(79,142,247,0.22);
          animation: spHaloSpin 9s linear infinite;
        }
        .sp-halo::before {
          content: ''; position: absolute;
          top: -3px; left: 50%;
          width: 6px; height: 6px; border-radius: 50%;
          background: #4F8EF7;
          box-shadow: 0 0 10px 3px rgba(79,142,247,0.8);
          transform: translateX(-50%);
        }
        @keyframes spHaloSpin { to { transform: rotate(360deg); } }

        .sp-wordmark {
          display: flex; align-items: baseline;
          animation: spWordIn 0.8s cubic-bezier(0.22,1,0.36,1) 0.5s both;
        }
        @keyframes spWordIn {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .sp-w-job {
          font-size: 44px; font-weight: 800;
          letter-spacing: -0.04em; color: #EEF2FF; line-height: 1;
        }
        .sp-w-swipe {
          font-size: 44px; font-weight: 800; letter-spacing: -0.04em; line-height: 1;
          background: linear-gradient(130deg, #93C5FD 0%, #3B82F6 45%, #2563EB 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
          background-size: 200% 200%;
          animation: spGradShift 5s ease infinite;
        }
        @keyframes spGradShift {
          0%,100% { background-position: 0% 50%; }
          50%     { background-position: 100% 50%; }
        }
        .sp-w-tld {
          font-size: 30px; font-weight: 300; font-style: italic;
          color: rgba(200,215,255,0.18); letter-spacing: -0.02em;
        }

        .sp-tagline {
          margin-top: 11px;
          font-size: 11px; font-weight: 300;
          letter-spacing: 0.28em; text-transform: uppercase;
          color: rgba(180,200,255,0.28);
          animation: spWordIn 0.7s ease 0.65s both;
        }

        .sp-progress-wrap {
          margin-top: 50px;
          width: 150px;
          animation: spWordIn 0.5s ease 0.85s both;
        }
        .sp-progress-track {
          height: 2px; background: rgba(255,255,255,0.07);
          border-radius: 999px; overflow: hidden; margin-bottom: 10px;
        }
        .sp-progress-fill {
          height: 100%; width: 0%; border-radius: 999px;
          background: linear-gradient(90deg, #1D4ED8, #3B82F6, #93C5FD);
          background-size: 200% 100%;
          animation:
            spProgGrow 2.6s cubic-bezier(0.4,0,0.2,1) 1s forwards,
            spProgShimmer 1.6s linear 1s infinite;
        }
        @keyframes spProgGrow {
          0% { width: 0%; } 45% { width: 55%; } 75% { width: 82%; } 100% { width: 100%; }
        }
        @keyframes spProgShimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        .sp-dots { display: flex; gap: 6px; justify-content: center; }
        .sp-dot {
          width: 5px; height: 5px; border-radius: 50%;
          background: rgba(59,130,246,0.6);
          animation: spDotP 1.6s ease-in-out infinite;
        }
        .sp-dot:nth-child(2) { animation-delay: .18s; }
        .sp-dot:nth-child(3) { animation-delay: .36s; }
        .sp-dot:nth-child(4) { animation-delay: .54s; }
        .sp-dot:nth-child(5) { animation-delay: .72s; }
        @keyframes spDotP {
          0%,100% { transform: scaleY(1); opacity: 0.22; }
          45%     { transform: scaleY(1.9); opacity: 1; border-radius: 3px; }
        }

        .sp-badge {
          position: absolute; z-index: 25;
          background: rgba(16,24,48,0.75);
          border: 1px solid rgba(59,130,246,0.35);
          backdrop-filter: blur(10px);
          border-radius: 999px;
          padding: 6px 14px 6px 10px;
          display: flex; align-items: center; gap: 8px;
          animation: spBadgeIn 0.6s cubic-bezier(0.34,1.3,0.64,1) both;
          pointer-events: none;
        }
        .sp-badge-dot {
          width: 8px; height: 8px; border-radius: 50%;
          background: #22C55E;
          box-shadow: 0 0 8px 2px rgba(34,197,94,0.6);
          animation: spBadgeDotPulse 2s ease-in-out infinite;
        }
        @keyframes spBadgeDotPulse {
          0%,100% { transform: scale(1); }
          50%     { transform: scale(1.3); }
        }
        .sp-badge-text { font-size: 11px; font-weight: 600; color: rgba(200,220,255,0.85); letter-spacing: 0.02em; }
        .sp-badge-pct  { font-size: 12px; font-weight: 800; color: #22C55E; }

        .sp-badge-1 { bottom: 30%; left: calc(50% - 240px); animation-delay: 2.2s; }
        .sp-badge-2 { bottom: 34%; right: calc(50% - 240px); animation-delay: 3.1s; }
        .sp-badge-3 { top: 28%;    left: calc(50% - 200px); animation-delay: 4s; }

        @keyframes spBadgeIn {
          from { opacity: 0; transform: scale(0.7) translateY(10px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }

        @media (max-width: 640px) {
          .sp-badge-1 { left: 8px; bottom: 26%; }
          .sp-badge-2 { right: 8px; bottom: 32%; }
          .sp-badge-3 { left: 8px; top: 18%; }
          .sp-w-job, .sp-w-swipe { font-size: 36px; }
          .sp-w-tld { font-size: 24px; }
        }

        @media (prefers-reduced-motion: reduce) {
          .sp-icon-wrap, .sp-icon-bg::before, .sp-icon-bg svg .draw,
          .sp-halo, .sp-wordmark, .sp-w-swipe, .sp-tagline,
          .sp-progress-wrap, .sp-progress-fill, .sp-dot,
          .sp-badge, .sp-badge-dot, .sp-root.exiting {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            animation-delay: 0ms !important;
          }
          .sp-icon-bg svg .draw { stroke-dashoffset: 0 !important; }
          .sp-progress-fill { width: 100% !important; }
        }
      `}</style>

      <div ref={rootRef} className={`sp-root${exiting ? " exiting" : ""}`}>
        <canvas ref={canvasRef} className="sp-canvas" />

        <div className="sp-badge sp-badge-1">
          <div className="sp-badge-dot" />
          <span className="sp-badge-text">UX Designer · Warszawa</span>
          <span className="sp-badge-pct">94%</span>
        </div>
        <div className="sp-badge sp-badge-2">
          <div className="sp-badge-dot" />
          <span className="sp-badge-text">Frontend Dev · Remote</span>
          <span className="sp-badge-pct">89%</span>
        </div>
        <div className="sp-badge sp-badge-3">
          <div className="sp-badge-dot" />
          <span className="sp-badge-text">Product Manager · Kraków</span>
          <span className="sp-badge-pct">97%</span>
        </div>

        <div className="sp-ui">
          <div className="sp-icon-wrap">
            <div className="sp-halo" />
            <div className="sp-icon-bg">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <rect className="draw" x="2" y="7" width="20" height="14" rx="2" />
                <path className="draw" d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
                <path className="draw" d="M2 12h20" />
              </svg>
            </div>
          </div>

          <div className="sp-wordmark">
            <span className="sp-w-job">Job</span>
            <span className="sp-w-swipe">Swipe</span>
            <span className="sp-w-tld">.pl</span>
          </div>
          <p className="sp-tagline">Znajdź pracę, jednym gestem</p>

          <div className="sp-progress-wrap">
            <div className="sp-progress-track">
              <div className="sp-progress-fill" />
            </div>
            <div className="sp-dots">
              <div className="sp-dot" /><div className="sp-dot" />
              <div className="sp-dot" /><div className="sp-dot" />
              <div className="sp-dot" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SplashScreen;
