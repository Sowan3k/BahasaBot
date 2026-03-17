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

const registerSchema = z
  .object({
    name: z.string().min(1, "Name is required").max(100),
    email: z.string().email("Enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterForm = z.infer<typeof registerSchema>;

// ── Component ──────────────────────────────────────────────────────────────

export default function RegisterPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  // ── Email / password submit ──────────────────────────────────────────────

  async function onSubmit(data: RegisterForm) {
    setServerError(null);

    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/api/auth/register`,
        {
          name: data.name,
          email: data.email,
          password: data.password,
        }
      );

      // Registration successful — redirect to login with a success indicator
      router.push("/login?registered=1");
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        setServerError("An account with this email already exists.");
      } else {
        setServerError("Something went wrong. Please try again.");
      }
    }
  }

  // ── Google sign-up ───────────────────────────────────────────────────────

  async function handleGoogleSuccess(credentialResponse: { credential?: string }) {
    if (!credentialResponse.credential) {
      setServerError("Google sign-up failed. Please try again.");
      return;
    }

    setServerError(null);
    setGoogleLoading(true);

    try {
      // Exchange Google ID token for our own JWT tokens (creates account if needed)
      const { data } = await axios.post<TokenResponse>(
        `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/api/auth/google`,
        { id_token: credentialResponse.credential }
      );

      // Store tokens in the NextAuth httpOnly session cookie
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
        setServerError("Google sign-up failed. Please try again.");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setServerError("Google sign-up failed. Please try again.");
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
          <p className="text-sm text-muted-foreground">Start learning Bahasa Melayu today</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Full name</Label>
            <Input
              id="name"
              type="text"
              placeholder="Your name"
              autoComplete="name"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

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
              placeholder="Min. 8 characters"
              autoComplete="new-password"
              {...register("password")}
            />
            {errors.password && (
              <p className="text-xs text-destructive">{errors.password.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Re-enter your password"
              autoComplete="new-password"
              {...register("confirmPassword")}
            />
            {errors.confirmPassword && (
              <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
            )}
          </div>

          {/* Server error */}
          {serverError && (
            <p className="text-sm text-destructive text-center">{serverError}</p>
          )}

          <Button type="submit" className="w-full" disabled={isSubmitting || googleLoading}>
            {isSubmitting ? "Creating account…" : "Create account"}
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

        {/* Google sign-up */}
        <div className="flex justify-center">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setServerError("Google sign-up failed. Please try again.")}
            useOneTap={false}
            text="signup_with"
            shape="rectangular"
            theme="outline"
          />
        </div>

        {/* Login link */}
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="underline underline-offset-4 hover:text-foreground">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
