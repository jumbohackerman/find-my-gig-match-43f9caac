import * as Sentry from "@sentry/react";

const dsn = import.meta.env.VITE_SENTRY_DSN;

// Derive environment: explicit env var > hostname detection
const deriveEnvironment = (): string => {
  if (import.meta.env.VITE_APP_ENV) return import.meta.env.VITE_APP_ENV;
  if (typeof window === "undefined") return "development";
  const h = window.location.hostname;
  if (h === "localhost" || h === "127.0.0.1") return "development";
  return "production";
};
const environment = deriveEnvironment();
const isProduction = environment === "production";

Sentry.init({
  dsn,
  enabled: Boolean(dsn),
  environment,
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
  tracesSampleRate: isProduction ? 0.2 : 1.0,
  replaysSessionSampleRate: isProduction ? 0.05 : 0.2,
  replaysOnErrorSampleRate: 1.0,
});
