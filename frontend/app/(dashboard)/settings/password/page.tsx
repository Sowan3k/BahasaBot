"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Eye, EyeOff, Lock, Save } from "lucide-react";
import axios from "axios";
import { useSession } from "next-auth/react";

import { profileApi } from "@/lib/api";

// ── Zod schema ──────────────────────────────────────────────────────────────

const passwordSchema = z
  .object({
    current_password: z.string().min(1, "Current password is required"),
    new_password: z.string().min(8, "New password must be at least 8 characters"),
    confirm_password: z.string(),
  })
  .refine((d) => d.new_password === d.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

type PasswordForm = z.infer<typeof passwordSchema>;

// ── Page ─────────────────────────────────────────────────────────────────────

export default function PasswordSettingsPage() {
  const { data: session, status } = useSession();
  const provider = (session?.user as { provider?: string } | undefined)?.provider;

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) });

  async function onSubmit(data: PasswordForm) {
    setSaveError(null);
    setSaveSuccess(false);
    try {
      await profileApi.changePassword({
        current_password: data.current_password,
        new_password: data.new_password,
      });
      reset();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const detail: string = err.response?.data?.detail ?? "";
        if (detail === "Current password is incorrect") {
          setSaveError("The current password you entered is incorrect.");
        } else if (detail === "google_account_no_password") {
          setSaveError("Google accounts do not have a password. Sign in via Google to manage your password.");
        } else {
          setSaveError(detail || "Failed to update password. Please try again.");
        }
      } else {
        setSaveError("Something went wrong. Please try again.");
      }
    }
  }

  // ── Session loading ───────────────────────────────────────────────────────

  if (status === "loading") {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-muted animate-pulse" />
          <div className="space-y-1.5">
            <div className="h-5 bg-muted rounded w-24 animate-pulse" />
            <div className="h-3 bg-muted rounded w-40 animate-pulse" />
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 space-y-4 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-1.5">
              <div className="h-3 bg-muted rounded w-24" />
              <div className="h-10 bg-muted rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Google account guard ──────────────────────────────────────────────────

  if (provider === "google") {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4 space-y-6">
        <div className="flex items-center gap-3">
          <Link
            href="/settings"
            className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="font-heading text-2xl font-bold text-foreground">Password</h1>
            <p className="text-sm text-muted-foreground">Change your account password</p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto">
            <Lock size={22} className="text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground">Google account</p>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            Your account was created with Google Sign-In. Password management is handled by Google.
          </p>
          <a
            href="https://myaccount.google.com/security"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-xs text-primary hover:underline"
          >
            Manage Google account security →
          </a>
        </div>
      </div>
    );
  }

  // ── Email/password form ───────────────────────────────────────────────────

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/settings"
          className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Password</h1>
          <p className="text-sm text-muted-foreground">Change your account password</p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="rounded-xl border border-border bg-card p-5 space-y-5"
      >
        {/* Current password */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground" htmlFor="current_password">
            Current password
          </label>
          <div className="relative flex items-center">
            <input
              id="current_password"
              type={showCurrent ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              className="w-full h-10 pl-3 pr-10 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition"
              {...register("current_password")}
            />
            <button
              type="button"
              onClick={() => setShowCurrent((v) => !v)}
              className="absolute right-3 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showCurrent ? <Eye size={16} /> : <EyeOff size={16} />}
            </button>
          </div>
          {errors.current_password && (
            <p className="text-xs text-destructive">{errors.current_password.message}</p>
          )}
        </div>

        {/* New password */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground" htmlFor="new_password">
            New password
          </label>
          <div className="relative flex items-center">
            <input
              id="new_password"
              type={showNew ? "text" : "password"}
              autoComplete="new-password"
              placeholder="At least 8 characters"
              className="w-full h-10 pl-3 pr-10 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition"
              {...register("new_password")}
            />
            <button
              type="button"
              onClick={() => setShowNew((v) => !v)}
              className="absolute right-3 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showNew ? <Eye size={16} /> : <EyeOff size={16} />}
            </button>
          </div>
          {errors.new_password && (
            <p className="text-xs text-destructive">{errors.new_password.message}</p>
          )}
        </div>

        {/* Confirm new password */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground" htmlFor="confirm_password">
            Confirm new password
          </label>
          <div className="relative flex items-center">
            <input
              id="confirm_password"
              type={showConfirm ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Repeat new password"
              className="w-full h-10 pl-3 pr-10 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition"
              {...register("confirm_password")}
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute right-3 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showConfirm ? <Eye size={16} /> : <EyeOff size={16} />}
            </button>
          </div>
          {errors.confirm_password && (
            <p className="text-xs text-destructive">{errors.confirm_password.message}</p>
          )}
        </div>

        {/* Feedback messages */}
        {saveError && (
          <p className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2">
            {saveError}
          </p>
        )}
        {saveSuccess && (
          <p className="text-xs text-green-600 dark:text-green-400 bg-green-500/10 rounded-lg px-3 py-2">
            Password updated successfully.
          </p>
        )}

        {/* Forgot password link */}
        <p className="text-xs text-muted-foreground">
          Forgot your current password?{" "}
          <Link href="/forgot-password" className="text-primary hover:underline">
            Reset via email →
          </Link>
        </p>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save size={16} />
          {isSubmitting ? "Updating…" : "Update password"}
        </button>
      </form>
    </div>
  );
}
