import * as Sentry from "@sentry/react";

const dsn = "https://c9406722e09a44e817ed81441395274a@o4511134892687360.ingest.de.sentry.io/4511135499550800";
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
