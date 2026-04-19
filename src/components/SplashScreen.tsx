import { useEffect, useState } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// JobSwipe.pl — Splash Screen v4
// Premium physics-based motion. Pure CSS keyframes. GPU-composited.
// ─────────────────────────────────────────────────────────────────────────────

const SPLASH_DURATION = 2200;
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
        :root {
          --splash-bg: #0A0A0A;
          --splash-brand: #FF5B35;
          --splash-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
          --splash-out: cubic-bezier(0.22, 1, 0.36, 1);
          --splash-in: cubic-bezier(0.4, 0, 1, 1);
        }

        .splash-root {
          position: fixed;
          inset: 0;
          z-index: 9999;
          background: var(--splash-bg);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          will-change: transform, opacity, filter;
        }
        .splash-root.is-exiting {
          animation: splashExit 500ms var(--splash-in) forwards;
        }
        @keyframes splashExit {
          0%   { opacity: 1; transform: scale(1); filter: blur(0px); }
          100% { opacity: 0; transform: scale(1.08); filter: blur(6px); }
        }

        /* Contained radial glow — drifts subtly, never reaches edges */
        .splash-glow {
          position: absolute;
          top: 45%;
          left: 50%;
          width: 400px;
          height: 300px;
          margin-left: -200px;
          margin-top: -150px;
          background: radial-gradient(
            ellipse at center,
            rgba(255, 91, 53, 0.18) 0%,
            rgba(255, 91, 53, 0.06) 50%,
            transparent 100%
          );
          pointer-events: none;
          will-change: transform, opacity;
          animation: glowDrift 6000ms ease-in-out 1000ms infinite;
        }
        @keyframes glowDrift {
          0%, 100% { transform: translate(0px, 0px) scale(1.0); opacity: 0.7; }
          33%      { transform: translate(6px, -8px) scale(1.05); opacity: 0.85; }
          66%      { transform: translate(-5px, 5px) scale(0.97); opacity: 0.75; }
        }

        .splash-stack {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        /* ── Icon group: float wrapper (idle) + icon (entrance + breathe) ── */
        .splash-icon-wrap {
          will-change: transform;
          animation: iconFloat 4000ms ease-in-out 900ms infinite;
        }
        @keyframes iconFloat {
          0%, 100% { transform: translateY(0px); }
          50%      { transform: translateY(-6px); }
        }

        .splash-icon {
          width: 88px;
          height: 88px;
          border-radius: 22px;
          background: linear-gradient(135deg, #FF6B45 0%, #FF4520 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          will-change: transform, opacity, filter, box-shadow;
          animation:
            iconEnter 900ms var(--splash-spring) both,
            glowBreathe 3200ms ease-in-out 1000ms infinite;
        }
        .splash-icon svg {
          width: 44px;
          height: 44px;
          stroke: #fff;
          stroke-width: 2.8;
          stroke-linecap: round;
          stroke-linejoin: round;
          fill: none;
        }
        @keyframes iconEnter {
          0%   { opacity: 0; transform: scale(0.72) translateY(12px); filter: blur(8px); }
          60%  { opacity: 1; transform: scale(1.04) translateY(-3px); filter: blur(0px); }
          80%  {              transform: scale(0.98) translateY(1px); }
          100% { opacity: 1; transform: scale(1.0) translateY(0px); filter: blur(0px); }
        }
        @keyframes glowBreathe {
          0%, 100% {
            box-shadow:
              0 0 30px rgba(255, 91, 53, 0.25),
              0 0 60px rgba(255, 91, 53, 0.10),
              0 0 100px rgba(255, 91, 53, 0.04);
          }
          50% {
            box-shadow:
              0 0 50px rgba(255, 91, 53, 0.45),
              0 0 90px rgba(255, 91, 53, 0.20),
              0 0 140px rgba(255, 91, 53, 0.08);
          }
        }

        /* ── Logo wordmark ── */
        .splash-logo {
          margin-top: 20px;
          font-size: 32px;
          font-weight: 700;
          letter-spacing: -0.02em;
          line-height: 1;
          opacity: 0;
          will-change: transform, opacity, filter;
          animation: textRise 700ms var(--splash-out) 280ms both;
        }
        @keyframes textRise {
          0%   { opacity: 0; transform: translateY(18px); filter: blur(4px); }
          100% { opacity: 1; transform: translateY(0);    filter: blur(0); }
        }

        /* Shimmer sweep — single pass after entrance */
        .splash-logo .lg-job,
        .splash-logo .lg-swipe,
        .splash-logo .lg-tld {
          background-clip: text;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-size: 300% auto;
          background-position: -200% center;
        }
        .splash-logo .lg-job {
          background-image: linear-gradient(
            105deg,
            #ffffff 40%,
            rgba(255, 255, 255, 0.9) 45%,
            rgba(255, 220, 200, 1) 50%,
            rgba(255, 255, 255, 0.9) 55%,
            #ffffff 60%
          );
          animation: textShimmer 1200ms ease-in-out 900ms 1 forwards;
        }
        .splash-logo .lg-swipe {
          background-image: linear-gradient(
            105deg,
            #FF5B35 40%,
            #FF8060 50%,
            #FF5B35 60%
          );
          animation: textShimmer 1200ms ease-in-out 900ms 1 forwards;
        }
        .splash-logo .lg-tld {
          background-image: linear-gradient(
            105deg,
            rgba(255, 255, 255, 0.35) 40%,
            rgba(255, 255, 255, 0.55) 50%,
            rgba(255, 255, 255, 0.35) 60%
          );
          font-weight: 400;
          animation: textShimmer 1200ms ease-in-out 900ms 1 forwards;
        }
        @keyframes textShimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }

        /* ── Tagline ── */
        .splash-tagline {
          margin-top: 12px;
          font-size: 13px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.28);
          opacity: 0;
          will-change: transform, opacity, filter;
          animation: textRise 700ms var(--splash-out) 480ms both;
        }

        /* ── Loading dots ── */
        .splash-dots {
          position: absolute;
          bottom: 40px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 6px;
          opacity: 0;
          will-change: transform, opacity;
          animation: dotsEnter 500ms var(--splash-out) 700ms both;
        }
        @keyframes dotsEnter {
          0%   { opacity: 0; transform: translateX(-50%) translateY(10px); }
          100% { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        .splash-dot {
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.2);
          will-change: transform, opacity, background-color;
          animation: dotPulse 1500ms ease-in-out infinite;
        }
        .splash-dot:nth-child(1) { animation-delay: 0ms; }
        .splash-dot:nth-child(2) { animation-delay: 200ms; }
        .splash-dot:nth-child(3) { animation-delay: 400ms; }
        .splash-dot:nth-child(4) { animation-delay: 600ms; }
        .splash-dot:nth-child(5) { animation-delay: 800ms; }
        @keyframes dotPulse {
          0%, 100% {
            opacity: 0.15;
            transform: scale(1);
            background-color: rgba(255, 255, 255, 0.2);
          }
          50% {
            opacity: 1;
            transform: scale(1.4);
            background-color: #FF5B35;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .splash-glow,
          .splash-icon-wrap,
          .splash-icon,
          .splash-logo,
          .splash-logo .lg-job,
          .splash-logo .lg-swipe,
          .splash-logo .lg-tld,
          .splash-tagline,
          .splash-dots,
          .splash-dot,
          .splash-root.is-exiting {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            animation-delay: 0ms !important;
          }
          .splash-icon, .splash-logo, .splash-tagline, .splash-dots {
            opacity: 1 !important;
            transform: none !important;
            filter: none !important;
          }
        }
      `}</style>

      <div className={`splash-root${exiting ? " is-exiting" : ""}`}>
        <div className="splash-glow" aria-hidden="true" />

        <div className="splash-stack">
          <div className="splash-icon-wrap">
            <div className="splash-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </div>
          </div>

          <h1 className="splash-logo">
            <span className="lg-job">Job</span>
            <span className="lg-swipe">Swipe</span>
            <span className="lg-tld">.pl</span>
          </h1>

          <p className="splash-tagline">Znajdź pracę, jednym gestem.</p>
        </div>

        <div className="splash-dots" aria-hidden="true">
          <span className="splash-dot" />
          <span className="splash-dot" />
          <span className="splash-dot" />
          <span className="splash-dot" />
          <span className="splash-dot" />
        </div>
      </div>
    </>
  );
};

export default SplashScreen;
