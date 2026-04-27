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

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);

// Load error tracking after the app is mounted so monitoring can never block rendering.
void import("./instrument").catch(() => {
  // Keep the application usable even when the optional tracking bundle fails.
});
