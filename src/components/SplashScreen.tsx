import { useEffect, useState } from "react";

const SPLASH_DURATION = 2400;
const EXIT_DURATION = 500;

const SplashScreen = ({ onFinish }: { onFinish: () => void }) => {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const exitTimer = setTimeout(() => setExiting(true), SPLASH_DURATION);
    const finishTimer = setTimeout(onFinish, SPLASH_DURATION + EXIT_DURATION);
    return () => {
      clearTimeout(exitTimer);
      clearTimeout(finishTimer);
    };
  }, [onFinish]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap');

        :root {
          --c-bg:        #090909;
          --c-brand:     #FF5B35;
          --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
          --ease-out:    cubic-bezier(0.22, 1, 0.36, 1);
          --ease-in:     cubic-bezier(0.4, 0, 1, 1);
        }

        .sp-root {
          position: fixed;
          inset: 0;
          z-index: 9999;
          background: var(--c-bg);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          font-family: 'Inter', system-ui, sans-serif;
          overflow: hidden;
          contain: layout style;
        }

        .sp-root.exiting {
          will-change: transform, opacity;
          animation: spExit 500ms var(--ease-in) forwards;
        }
        @keyframes spExit {
          0%   { opacity: 1; transform: scale(1);    }
          100% { opacity: 0; transform: scale(1.06); }
        }

        .sp-glow {
          position: absolute;
          top: 50%; left: 50%;
          width: 560px; height: 420px;
          margin-left: -280px; margin-top: -210px;
          background: radial-gradient(
            ellipse at center,
            rgba(255,91,53,0.20) 0%,
            rgba(255,91,53,0.08) 42%,
            transparent 100%
          );
          pointer-events: none;
          will-change: transform, opacity;
          backface-visibility: hidden;
          transform: translateZ(0);
          animation: glowDrift 7s ease-in-out 1.1s infinite;
        }
        @keyframes glowDrift {
          0%,100% { transform: translateZ(0) translate(  0px,  0px) scale(1.00); opacity: 0.80; }
          30%     { transform: translateZ(0) translate(  8px,-10px) scale(1.06); opacity: 1.00; }
          65%     { transform: translateZ(0) translate( -7px,  7px) scale(0.96); opacity: 0.85; }
        }

        .sp-glow2 {
          position: absolute;
          bottom: 20%; left: 30%;
          width: 300px; height: 200px;
          background: radial-gradient(ellipse at center, rgba(79,110,247,0.07) 0%, transparent 70%);
          pointer-events: none;
          will-change: transform, opacity;
          backface-visibility: hidden;
          transform: translateZ(0);
          animation: glow2Enter 1s ease 1.2s both, glowDrift2 9s ease-in-out 2.2s infinite;
        }
        @keyframes glow2Enter { from { opacity: 0; } to { opacity: 1; } }
        @keyframes glowDrift2 {
          0%,100% { transform: translateZ(0) translate(  0px,  0px) scale(1.0); }
          50%     { transform: translateZ(0) translate( 12px,-15px) scale(1.1); }
        }

        .sp-pulse-ring {
          position: absolute;
          top: 50%; left: 50%;
          width: 80px; height: 80px;
          margin-left: -40px; margin-top: -40px;
          border-radius: 50%;
          pointer-events: none;
          will-change: transform, opacity;
          backface-visibility: hidden;
          background: radial-gradient(
            circle at center,
            rgba(255,91,53,0.14) 0%,
            rgba(255,91,53,0.05) 45%,
            transparent 75%
          );
          opacity: 0;
          animation: pulseRing 3.6s ease-out infinite;
        }
        .sp-pulse-ring:nth-child(1) { animation-delay: 1.0s; }
        .sp-pulse-ring:nth-child(2) { animation-delay: 2.2s; }
        .sp-pulse-ring:nth-child(3) { animation-delay: 3.4s; }

        @keyframes pulseRing {
          0%   { transform: translateZ(0) scale( 1); opacity: 0; }
          6%   { transform: translateZ(0) scale( 1); opacity: 1; }
          100% { transform: translateZ(0) scale(40); opacity: 0; }
        }

        .sp-icon-wrap {
          position: relative;
          will-change: transform;
          backface-visibility: hidden;
          animation: iconFloat 4.2s ease-in-out 950ms infinite;
        }
        @keyframes iconFloat {
          0%,100% { transform: translateZ(0) translateY( 0px); }
          50%     { transform: translateZ(0) translateY(-8px); }
        }

        .sp-icon-wrap::before {
          content: '';
          position: absolute;
          top: 50%; left: 50%;
          width: 180px; height: 180px;
          margin: -90px 0 0 -90px;
          border-radius: 50%;
          background: radial-gradient(
            circle at center,
            rgba(255,91,53,0.70)  0%,
            rgba(255,91,53,0.28) 38%,
            rgba(255,91,53,0.08) 60%,
            transparent 78%
          );
          pointer-events: none;
          will-change: opacity, transform;
          backface-visibility: hidden;
          opacity: 0;
          z-index: -1;
          animation:
            glowEnter   400ms ease-out      600ms both,
            glowBreathe 3.4s  ease-in-out  1050ms infinite;
        }
        @keyframes glowEnter  { from { opacity: 0; } to { opacity: 1; } }
        @keyframes glowBreathe {
          0%,100% { opacity: 0.75; transform: translateZ(0) scale(1.00); }
          50%     { opacity: 1.00; transform: translateZ(0) scale(1.40); }
        }

        .sp-icon {
          width: 92px; height: 92px;
          border-radius: 24px;
          background: linear-gradient(145deg, #FF6B45 0%, #FF3D1A 55%, #E83010 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          will-change: transform, opacity;
          backface-visibility: hidden;
          transform: translateZ(0);
          animation: iconEnter 900ms var(--ease-spring) 0ms both;
        }
        @keyframes iconEnter {
          0%  { opacity: 0; transform: translateZ(0) scale(0.70) translateY(14px); }
          58% { opacity: 1; transform: translateZ(0) scale(1.05) translateY(-3px); }
          78% {              transform: translateZ(0) scale(0.97) translateY( 2px); }
          100%{ opacity: 1; transform: translateZ(0) scale(1.00) translateY( 0px); }
        }

        .sp-check {
          width: 46px; height: 46px;
          stroke: #fff;
          stroke-width: 2.6;
          stroke-linecap: round;
          stroke-linejoin: round;
          fill: none;
          overflow: visible;
        }
        .sp-check path {
          stroke-dasharray: 28;
          stroke-dashoffset: 28;
          animation: drawCheck 600ms var(--ease-out) 650ms forwards;
        }
        @keyframes drawCheck { to { stroke-dashoffset: 0; } }

        .sp-logo {
          margin-top: 22px;
          font-size: 34px; font-weight: 700;
          letter-spacing: -0.025em;
          line-height: 1;
          display: flex;
          align-items: baseline;
          opacity: 0;
          will-change: transform, opacity;
          backface-visibility: hidden;
          transform: translateZ(0);
          animation:
            rise     700ms var(--ease-out) 300ms both,
            logoGlow 1400ms ease-in-out   950ms 1 forwards;
        }
        @keyframes rise {
          0%  { opacity: 0; transform: translateZ(0) translateY(18px); }
          100%{ opacity: 1; transform: translateZ(0) translateY( 0px); }
        }
        @keyframes logoGlow {
          0%   { text-shadow: none; }
          35%  { text-shadow: 0 0 18px rgba(255,130,90,0.75), 0 0 38px rgba(255,91,53,0.45); }
          100% { text-shadow: none; }
        }

        .sp-job   { color: #ffffff; }
        .sp-swipe { color: var(--c-brand); }
        .sp-tld   { color: rgba(255,255,255,0.28); font-weight: 400; font-size: 28px; }

        .sp-tagline {
          margin-top: 14px;
          font-size: 12px; font-weight: 400;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.3);
          opacity: 0;
          will-change: transform, opacity;
          backface-visibility: hidden;
          transform: translateZ(0);
          animation: rise 700ms var(--ease-out) 490ms both;
        }

        .sp-dots {
          position: absolute;
          bottom: 44px; left: 50%;
          display: flex; gap: 7px;
          align-items: center;
          opacity: 0;
          will-change: transform, opacity;
          animation: dotsEnter 500ms var(--ease-out) 720ms both;
        }
        @keyframes dotsEnter {
          0%  { opacity: 0; transform: translateX(-50%) translateY(12px); }
          100%{ opacity: 1; transform: translateX(-50%) translateY( 0px); }
        }

        .sp-dot {
          width: 5px; height: 5px;
          border-radius: 50%;
          background: var(--c-brand);
          will-change: transform, opacity;
          backface-visibility: hidden;
          transform: translateZ(0);
          animation: dotWave 1600ms ease-in-out infinite;
        }
        .sp-dot:nth-child(1) { animation-delay:   0ms; }
        .sp-dot:nth-child(2) { animation-delay: 200ms; }
        .sp-dot:nth-child(3) { animation-delay: 400ms; }
        .sp-dot:nth-child(4) { animation-delay: 600ms; }
        .sp-dot:nth-child(5) { animation-delay: 800ms; }

        @keyframes dotWave {
          0%,100%{ transform: translateZ(0) scale(1.0); opacity: 0.18; }
          50%    { transform: translateZ(0) scale(1.6); opacity: 1.00; }
        }

        @media (prefers-reduced-motion: reduce) {
          .sp-glow, .sp-glow2, .sp-pulse-ring,
          .sp-icon-wrap, .sp-icon-wrap::before, .sp-icon,
          .sp-check path, .sp-logo, .sp-tagline,
          .sp-dots, .sp-dot, .sp-root.exiting {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            animation-delay: 0ms !important;
          }
          .sp-icon, .sp-icon-wrap::before,
          .sp-logo, .sp-tagline, .sp-dots { opacity: 1 !important; }
          .sp-check path { stroke-dashoffset: 0 !important; }
        }
      `}</style>

      <div className={`sp-root${exiting ? " exiting" : ""}`}>
        <div className="sp-glow" aria-hidden="true" />
        <div className="sp-glow2" aria-hidden="true" />

        <span className="sp-pulse-ring" aria-hidden="true" />
        <span className="sp-pulse-ring" aria-hidden="true" />
        <span className="sp-pulse-ring" aria-hidden="true" />

        <div className="sp-icon-wrap">
          <div className="sp-icon" aria-hidden="true">
            <svg className="sp-check" viewBox="0 0 24 24">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </div>
        </div>

        <h1 className="sp-logo">
          <span className="sp-job">Job</span>
          <span className="sp-swipe">Swipe</span>
          <span className="sp-tld">.pl</span>
        </h1>

        <p className="sp-tagline">Znajdź pracę, jednym gestem.</p>

        <div className="sp-dots" aria-hidden="true">
          <span className="sp-dot" />
          <span className="sp-dot" />
          <span className="sp-dot" />
          <span className="sp-dot" />
          <span className="sp-dot" />
        </div>
      </div>
    </>
  );
};

export default SplashScreen;
