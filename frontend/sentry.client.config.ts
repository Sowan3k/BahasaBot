// Sentry — client-side (browser) configuration
// This file is loaded automatically by @sentry/nextjs for the browser bundle.

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Trace 10% of pageloads + navigations to measure performance
  tracesSampleRate: 0.1,

  // Replay 1% of sessions; 100% of sessions with errors
  replaysSessionSampleRate: 0.01,
  replaysOnErrorSampleRate: 1.0,

  integrations: [
    Sentry.replayIntegration(),
  ],

  // Only active when DSN is provided
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
});
