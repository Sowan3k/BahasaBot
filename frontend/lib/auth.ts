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
      // `user` is populated from authorize() on the initial sign-in only
      if (user) {
        token.accessToken = (user as any).accessToken;
        token.refreshToken = (user as any).refreshToken;
        token.proficiency_level = (user as any).proficiency_level;
        token.provider = (user as any).provider;
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

  session: { strategy: "jwt" },

  // Required for NextAuth v5 on non-HTTPS (localhost) environments
  trustHost: true,
});
