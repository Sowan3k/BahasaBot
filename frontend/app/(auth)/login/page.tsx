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
import { ShaderAnimation } from "@/components/ui/shader-animation";
import type { TokenResponse } from "@/lib/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// ── Zod schema ─────────────────────────────────────────────────────────────

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

// ── Shared helper: store tokens in NextAuth session ─────────────────────────

async function storeSession(data: TokenResponse): Promise<boolean> {
  const result = await signIn("jwt", {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    userId: data.user.id,
    name: data.user.name,
    email: data.user.email,
    proficiencyLevel: data.user.proficiency_level,
    provider: data.user.provider,
    createdAt: String(data.user.created_at),
    redirect: false,
  });
  return !result?.error;
}

// ── Component ──────────────────────────────────────────────────────────────

export default function LoginPage() {
  const router = useRouter();
  const [authError, setAuthError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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

    try {
      const { data: tokenData } = await axios.post<TokenResponse>(
        `${API_URL}/api/auth/login`,
        { email: data.email, password: data.password }
      );

      const ok = await storeSession(tokenData);
      if (!ok) {
        setAuthError("Sign in failed. Please try again.");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const detail: string = err.response?.data?.detail ?? "";
        if (detail === "google_signin_required") {
          setAuthError(
            "This account was created with Google. Please use Sign in with Google below."
          );
        } else if (err.response?.status === 401) {
          setAuthError("Invalid email or password. Please try again.");
        } else {
          setAuthError("Something went wrong. Please try again.");
        }
      } else {
        setAuthError("Something went wrong. Please try again.");
      }
    }
  }

  // ── Google sign-in ───────────────────────────────────────────────────────

  async function handleGoogleSuccess(credentialResponse: { credential?: string }) {
    if (!credentialResponse.credential) {
      setAuthError("Google sign-in failed. Please try again.");
      return;
    }

    setAuthError(null);
    setLoading(true);

    try {
      const { data } = await axios.post<TokenResponse>(
        `${API_URL}/api/auth/google`,
        { id_token: credentialResponse.credential }
      );

      const ok = await storeSession(data);
      if (!ok) {
        setAuthError("Google sign-in failed. Please try again.");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setAuthError("Google sign-in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Full-screen shader background */}
      <div className="absolute inset-0 z-0">
        <ShaderAnimation />
      </div>

      {/* Centered glass card */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-sm space-y-6 rounded-2xl border border-[#4a7c59]/30 bg-[#f5f3ed]/85 p-8 shadow-2xl backdrop-blur-md">
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
              <Label htmlFor="email" className="text-foreground">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                className="border-[#4a7c59]/30 bg-white/60 text-foreground placeholder:text-muted-foreground focus-visible:ring-[#4a7c59]/50"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-foreground">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                className="border-[#4a7c59]/30 bg-white/60 text-foreground placeholder:text-muted-foreground focus-visible:ring-[#4a7c59]/50"
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

            <Button
              type="submit"
              className="w-full bg-[#4a7c59] text-[#f5f3ed] hover:bg-[#4a7c59]/90"
              disabled={isSubmitting || loading}
            >
              {isSubmitting ? "Signing in…" : "Sign in"}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-[#4a7c59]/20" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#f5f3ed]/85 px-2 text-muted-foreground">or</span>
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
            <Link href="/register" className="text-[#4a7c59] underline underline-offset-4 hover:text-[#4a7c59]/80">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
