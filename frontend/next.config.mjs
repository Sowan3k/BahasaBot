import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable the instrumentation hook so Sentry loads on the server/edge
  experimental: {
    instrumentationHook: true,
  },
  images: {
    remotePatterns: [],
  },
};

export default withSentryConfig(nextConfig, {
  // Suppresses source-map upload logs during build
  silent: true,
  // Disable Sentry's automatic route instrumentation; we handle it manually
  autoInstrumentServerFunctions: false,
});
