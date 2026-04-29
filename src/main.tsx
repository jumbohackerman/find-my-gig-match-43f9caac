import { createRoot } from "react-dom/client";
import ErrorBoundary from "./components/ErrorBoundary";
import App from "./App.tsx";
import "./index.css";
import { initPostHog } from "./services/posthog";
import "./hooks/useTheme"; // applies persisted theme synchronously to avoid FOUC

// Initialize PostHog (no-op if VITE_POSTHOG_KEY not set)
initPostHog();

// ── Staging SEO: inject noindex for non-production environments ─────────────
const isProduction = import.meta.env.VITE_APP_ENV === "production";
if (!isProduction) {
  const meta = document.createElement("meta");
  meta.name = "robots";
  meta.content = "noindex, nofollow";
  document.head.appendChild(meta);
}

// ── Compact layout flag (viewport-driven, NOT DPR-driven) ───────────────────
// Triggered when width<=1200 OR height<=850. Drives `html[data-compact="true"]`
// CSS in index.css to scale down navbar/toolbar/swipe-card/footer real layout
// (no zoom/transform hacks). Also exposes `data-shortvh` for very low heights.
const applyViewportFlags = () => {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const root = document.documentElement;
  const compact = w <= 1200 || h <= 850;
  root.dataset.compact = compact ? "true" : "false";
  root.dataset.shortvh = h <= 760 ? "true" : "false";
};
applyViewportFlags();
window.addEventListener("resize", applyViewportFlags, { passive: true });
window.addEventListener("orientationchange", applyViewportFlags, { passive: true });

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);

// Load error tracking after the app is mounted so monitoring can never block rendering.
void import("./instrument").catch(() => {
  // Keep the application usable even when the optional tracking bundle fails.
});
