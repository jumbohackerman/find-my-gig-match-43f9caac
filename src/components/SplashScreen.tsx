import { useEffect, useState } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// JobSwipe.pl — Splash Screen v3
// Apple-level craftsmanship. Pure CSS animations. Zero JS-driven visuals.
// ─────────────────────────────────────────────────────────────────────────────

const SPLASH_DURATION = 2200;
const EXIT_DURATION = 400;

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
          --splash-ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
          --splash-ease-out: cubic-bezier(0.22, 1, 0.36, 1);
          --splash-ease-in: cubic-bezier(0.4, 0, 1, 1);
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
          transition: opacity 400ms var(--splash-ease-in), transform 400ms var(--splash-ease-in);
        }
        .splash-root.is-exiting {
          opacity: 0;
          transform: scale(1.05);
        }

        /* Contained radial glow behind the icon — does not bleed to edges */
        .splash-glow {
          position: absolute;
          top: 45%;
          left: 50%;
          width: 400px;
          height: 300px;
          transform: translate(-50%, -50%);
          background: radial-gradient(
            ellipse at center,
            rgba(255, 91, 53, 0.18) 0%,
            rgba(255, 91, 53, 0.06) 50%,
            transparent 100%
          );
          pointer-events: none;
        }

        .splash-stack {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        /* ── Icon ── */
        .splash-icon {
          width: 88px;
          height: 88px;
          border-radius: 22px;
          background: linear-gradient(135deg, #FF6B45 0%, #FF4520 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transform: scale(0.85);
          animation:
            splash-icon-in 600ms var(--splash-ease-spring) forwards,
            splash-icon-breathe 2400ms ease-in-out 1100ms infinite;
          box-shadow:
            0 0 60px rgba(255, 91, 53, 0.35),
            0 0 120px rgba(255, 91, 53, 0.12);
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

        @keyframes splash-icon-in {
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes splash-icon-breathe {
          0%, 100% {
            box-shadow:
              0 0 40px rgba(255, 91, 53, 0.30),
              0 0 90px rgba(255, 91, 53, 0.10);
          }
          50% {
            box-shadow:
              0 0 70px rgba(255, 91, 53, 0.50),
              0 0 130px rgba(255, 91, 53, 0.18);
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
          transform: translateY(8px);
          animation: splash-rise 500ms var(--splash-ease-out) 300ms forwards;
        }
        .splash-logo .lg-job { color: #FFFFFF; font-weight: 700; }
        .splash-logo .lg-swipe { color: var(--splash-brand); font-weight: 700; }
        .splash-logo .lg-tld { color: rgba(255, 255, 255, 0.35); font-weight: 400; }

        /* ── Tagline ── */
        .splash-tagline {
          margin-top: 12px;
          font-size: 13px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.28);
          opacity: 0;
          transform: translateY(6px);
          animation: splash-rise 400ms var(--splash-ease-out) 550ms forwards;
        }

        @keyframes splash-rise {
          to {
            opacity: 1;
            transform: translateY(0);
          }
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
          animation: splash-fade-in 400ms var(--splash-ease-out) 700ms forwards;
        }
        .splash-dot {
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.15);
          transition: background-color 150ms ease;
          animation: splash-dot-cycle 1500ms steps(1, end) infinite;
        }
        .splash-dot:nth-child(1) { animation-delay: 0ms; }
        .splash-dot:nth-child(2) { animation-delay: 300ms; }
        .splash-dot:nth-child(3) { animation-delay: 600ms; }
        .splash-dot:nth-child(4) { animation-delay: 900ms; }
        .splash-dot:nth-child(5) { animation-delay: 1200ms; }

        @keyframes splash-dot-cycle {
          0%, 20% { background: var(--splash-brand); }
          20.01%, 100% { background: rgba(255, 255, 255, 0.15); }
        }
        @keyframes splash-fade-in {
          to { opacity: 1; }
        }

        @media (prefers-reduced-motion: reduce) {
          .splash-icon,
          .splash-logo,
          .splash-tagline,
          .splash-dots,
          .splash-dot {
            animation: none !important;
            opacity: 1 !important;
            transform: none !important;
          }
          .splash-icon {
            box-shadow:
              0 0 60px rgba(255, 91, 53, 0.35),
              0 0 120px rgba(255, 91, 53, 0.12);
          }
        }
      `}</style>

      <div className={`splash-root${exiting ? " is-exiting" : ""}`}>
        <div className="splash-glow" aria-hidden="true" />

        <div className="splash-stack">
          <div className="splash-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="M20 6 9 17l-5-5" />
            </svg>
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
