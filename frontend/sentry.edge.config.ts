// Sentry — edge runtime configuration
// This file is loaded automatically by @sentry/nextjs for edge routes
// (middleware.ts, edge API routes).

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
});
