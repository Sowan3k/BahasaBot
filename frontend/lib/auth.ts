// NextAuth v5 configuration
//
// Single "jwt" credentials provider:
//   The frontend calls the FastAPI backend directly (register / login / google),
//   receives our JWT tokens, then passes them here so NextAuth stores them in
//   its encrypted httpOnly session cookie.
//
// This pattern gives the frontend full control over error messages from the
// backend, rather than routing everything through NextAuth's opaque authorize().

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

import type { User } from "@/lib/types";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// Access token TTL mirrors ACCESS_TOKEN_EXPIRE_MINUTES in backend/.env (30 min).
// We refresh 60 s before expiry so there's always a valid token in flight.
const ACCESS_TOKEN_TTL_MS = (30 * 60 - 60) * 1000; // 29 minutes

async function refreshAccessToken(
  refreshToken: string,
): Promise<{ accessToken: string; accessTokenExpires: number } | null> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (!res.ok) return null;
    const data: { access_token: string } = await res.json();
    return {
      accessToken: data.access_token,
      accessTokenExpires: Date.now() + ACCESS_TOKEN_TTL_MS,
    };
  } catch {
    return null;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    // ── JWT passthrough ───────────────────────────────────────────────────
    // Accepts pre-validated tokens from the FastAPI backend.
    // Used by: email/password login, email registration, Google OAuth.
    Credentials({
      id: "jwt",
      name: "jwt",
      credentials: {
        accessToken: {},
        refreshToken: {},
        userId: {},
        name: {},
        email: {},
        proficiencyLevel: {},
        provider: {},
        createdAt: {},
      },

      async authorize(credentials) {
        if (!credentials?.accessToken) return null;

        return {
          id: credentials.userId as string,
          name: credentials.name as string,
          email: credentials.email as string,
          accessToken: credentials.accessToken as string,
          refreshToken: credentials.refreshToken as string,
          proficiency_level: credentials.proficiencyLevel as string,
          provider: credentials.provider as string,
          created_at: credentials.createdAt as string,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      // ── Initial sign-in: user is populated from authorize() ──────────────
      if (user) {
        token.accessToken = (user as any).accessToken;
        token.refreshToken = (user as any).refreshToken;
        token.accessTokenExpires = Date.now() + ACCESS_TOKEN_TTL_MS;
        token.proficiency_level = (user as any).proficiency_level;
        token.provider = (user as any).provider;
        token.created_at = (user as any).created_at;
        return token;
      }

      // ── Access token still valid ─────────────────────────────────────────
      if (
        token.accessTokenExpires &&
        Date.now() < (token.accessTokenExpires as number)
      ) {
        return token;
      }

      // ── Access token expired: attempt silent refresh ─────────────────────
      if (token.refreshToken) {
        const refreshed = await refreshAccessToken(
          token.refreshToken as string,
        );
        if (refreshed) {
          token.accessToken = refreshed.accessToken;
          token.accessTokenExpires = refreshed.accessTokenExpires;
          delete (token as any).error;
          return token;
        }
      }

      // ── Refresh failed: signal client to sign out ────────────────────────
      return { ...token, error: "RefreshTokenExpired" as const };
    },

    async session({ session, token }) {
      // If refresh failed, expose the error but omit the stale access token
      // so the api.ts 401 handler fires and signs the user out cleanly.
      if ((token as any).error === "RefreshTokenExpired") {
        (session as any).error = "RefreshTokenExpired";
        return session;
      }

      (session as any).accessToken = token.accessToken;
      (session as any).refreshToken = token.refreshToken;
      session.user = {
        ...session.user,
        id: token.sub ?? "",
        proficiency_level: token.proficiency_level,
        provider: token.provider,
        created_at: token.created_at,
      } as User & typeof session.user;
      return session;
    },
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  // Session lives for 30 minutes.
  session: { strategy: "jwt", maxAge: 30 * 60 },

  // Required for NextAuth v5 on non-HTTPS (localhost) environments
  trustHost: true,
});
