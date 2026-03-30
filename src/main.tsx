import "./instrument";
import { createRoot } from "react-dom/client";
import ErrorBoundary from "./components/ErrorBoundary";
import App from "./App.tsx";
import "./index.css";

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
