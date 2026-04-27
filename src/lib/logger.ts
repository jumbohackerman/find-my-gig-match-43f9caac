/**
 * Dev-only logger. In production builds these calls are silent so we don't
 * leak details of sensitive flows (CV parsing, auth, applications) into the
 * browser console. Errors should still go through `console.error` (kept
 * in production for ops debugging) or through `sentryErrorTracking`.
 */
const isDev = import.meta.env.DEV;

export const devLog = (...args: unknown[]) => {
  if (isDev) console.log(...args);
};

export const devInfo = (...args: unknown[]) => {
  if (isDev) console.info(...args);
};

export const devWarn = (...args: unknown[]) => {
  if (isDev) console.warn(...args);
};
