// Sentry — server-side (Node.js) configuration
// This file is loaded automatically by @sentry/nextjs for the server bundle.

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Trace 10% of server requests
  tracesSampleRate: 0.1,

  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
});
