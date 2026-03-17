"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signIn } from "next-auth/react";
import { GoogleLogin } from "@react-oauth/google";
import axios from "axios";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { TokenResponse } from "@/lib/types";

// ── Zod schema ─────────────────────────────────────────────────────────────

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

// ── Component ──────────────────────────────────────────────────────────────

export default function LoginPage() {
  const router = useRouter();
  const [authError, setAuthError] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  // ── Email / password submit ──────────────────────────────────────────────

  async function onSubmit(data: LoginForm) {
    setAuthError(null);

    const result = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });

    if (result?.error) {
      setAuthError("Invalid email or password. Please try again.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  // ── Google sign-in ───────────────────────────────────────────────────────

  async function handleGoogleSuccess(credentialResponse: { credential?: string }) {
    if (!credentialResponse.credential) {
      setAuthError("Google sign-in failed. Please try again.");
      return;
    }

    setAuthError(null);
    setGoogleLoading(true);

    try {
      // Exchange Google ID token for our own JWT tokens
      const { data } = await axios.post<TokenResponse>(
        `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/api/auth/google`,
        { id_token: credentialResponse.credential }
      );

      // Hand the JWT tokens to NextAuth so they're stored in the httpOnly session cookie
      const result = await signIn("google-jwt", {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        userId: data.user.id,
        name: data.user.name,
        email: data.user.email,
        proficiencyLevel: data.user.proficiency_level,
        createdAt: String(data.user.created_at),
        redirect: false,
      });

      if (result?.error) {
        setAuthError("Google sign-in failed. Please try again.");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setAuthError("Google sign-in failed. Please try again.");
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Header */}
        <div className="flex flex-col items-center space-y-3">
          <Image
            src="/Project Logo.png"
            alt="BahasaBot"
            width={160}
            height={80}
            priority
          />
          <p className="text-sm text-muted-foreground">Sign in to your account</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              {...register("password")}
            />
            {errors.password && (
              <p className="text-xs text-destructive">{errors.password.message}</p>
            )}
          </div>

          {/* Auth error */}
          {authError && (
            <p className="text-sm text-destructive text-center">{authError}</p>
          )}

          <Button type="submit" className="w-full" disabled={isSubmitting || googleLoading}>
            {isSubmitting ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">or</span>
          </div>
        </div>

        {/* Google sign-in */}
        <div className="flex justify-center">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setAuthError("Google sign-in failed. Please try again.")}
            useOneTap={false}
            text="signin_with"
            shape="rectangular"
            theme="outline"
          />
        </div>

        {/* Register link */}
        <p className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="underline underline-offset-4 hover:text-foreground">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
