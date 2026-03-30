import * as Sentry from "@sentry/react";

const dsn = import.meta.env.VITE_SENTRY_DSN;
const environment = import.meta.env.VITE_APP_ENV || "development";
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
