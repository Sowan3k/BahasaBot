"use client";

// Client-side providers wrapper
// QueryClientProvider requires 'use client' so it lives here, not in the server-rendered layout.

import { GoogleOAuthProvider } from "@react-oauth/google";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "next-auth/react";
import { useState } from "react";
import { Toaster } from "sonner";
import { ThemeContext, useThemeState } from "@/lib/use-theme";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

// Fail loudly in development if the env var is missing so it is caught before
// deploying.  In production a missing value causes a silent "invalid_request:
// missing client_id" from Google — much harder to debug than this message.
if (!GOOGLE_CLIENT_ID && process.env.NODE_ENV !== "test") {
  console.error(
    "[BahasaBot] NEXT_PUBLIC_GOOGLE_CLIENT_ID is not set. " +
    "Google sign-in will fail with 'invalid_request: missing client_id'. " +
    "Add the variable to .env.local (dev) or Vercel environment variables (prod)."
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  // Create QueryClient once per mount — stable across re-renders
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            retry: 1,
          },
        },
      })
  );

  const themeValue = useThemeState();

  return (
    <ThemeContext.Provider value={themeValue}>
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        {/* refetchInterval: poll session every 60 s so expiry is detected proactively.
            refetchOnWindowFocus: re-check immediately when the tab regains focus. */}
        <SessionProvider refetchInterval={60} refetchOnWindowFocus={true}>
          <QueryClientProvider client={queryClient}>
            {children}
            {/* Sonner toast container — theme-aware, positioned top-right */}
            <Toaster position="top-right" richColors closeButton />
          </QueryClientProvider>
        </SessionProvider>
      </GoogleOAuthProvider>
    </ThemeContext.Provider>
  );
}
