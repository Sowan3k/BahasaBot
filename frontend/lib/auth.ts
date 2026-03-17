// NextAuth v5 configuration
//
// Two credentials providers:
//   "credentials"  — email/password → calls FastAPI /api/auth/login
//   "google-jwt"   — receives our own JWT tokens after the frontend has already
//                    called FastAPI /api/auth/google and obtained tokens
//
// Both providers funnel into the same jwt() / session() callbacks so the
// session cookie structure is identical regardless of sign-in method.

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

import type { TokenResponse, User } from "@/lib/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    // ── Email / password ──────────────────────────────────────────────────
    Credentials({
      id: "credentials",
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          const res = await fetch(`${API_URL}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          if (!res.ok) return null;

          const data: TokenResponse = await res.json();

          return {
            id: data.user.id,
            name: data.user.name,
            email: data.user.email,
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            proficiency_level: data.user.proficiency_level,
            created_at: data.user.created_at,
          };
        } catch {
          return null;
        }
      },
    }),

    // ── Google OAuth (token passthrough) ─────────────────────────────────
    // The frontend calls FastAPI /api/auth/google with the Google ID token
    // and receives our own JWT tokens. Those tokens are passed here so
    // NextAuth can store them in its encrypted httpOnly session cookie.
    Credentials({
      id: "google-jwt",
      name: "google-jwt",
      credentials: {
        accessToken: {},
        refreshToken: {},
        userId: {},
        name: {},
        email: {},
        proficiencyLevel: {},
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
          created_at: credentials.createdAt as string,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      // `user` is populated from authorize() on the initial sign-in only
      if (user) {
        token.accessToken = (user as any).accessToken;
        token.refreshToken = (user as any).refreshToken;
        token.proficiency_level = (user as any).proficiency_level;
        token.created_at = (user as any).created_at;
      }
      return token;
    },

    async session({ session, token }) {
      (session as any).accessToken = token.accessToken;
      (session as any).refreshToken = token.refreshToken;
      session.user = {
        ...session.user,
        id: token.sub ?? "",
        proficiency_level: token.proficiency_level,
        created_at: token.created_at,
      } as User & typeof session.user;
      return session;
    },
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  session: { strategy: "jwt" },
});
