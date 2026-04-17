"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Eye, EyeOff, Lock, Save, ShieldCheck } from "lucide-react";
import axios from "axios";

import { profileApi, authApi } from "@/lib/api";
import { GlowCard } from "@/components/ui/glow-card";

// ── Change-password schema (existing password required) ───────────────────────

const changeSchema = z
  .object({
    current_password: z.string().min(1, "Current password is required"),
    new_password: z.string().min(8, "New password must be at least 8 characters"),
    confirm_password: z.string(),
  })
  .refine((d) => d.new_password === d.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

type ChangeForm = z.infer<typeof changeSchema>;

// ── Set-password schema (no current password — first time only) ───────────────

const setSchema = z
  .object({
    new_password: z.string().min(8, "Password must be at least 8 characters"),
    confirm_password: z.string(),
  })
  .refine((d) => d.new_password === d.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

type SetForm = z.infer<typeof setSchema>;

// ── Header ────────────────────────────────────────────────────────────────────

function PageHeader() {
  return (
    <div className="flex items-center gap-3">
      <Link
        href="/settings"
        className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft size={18} />
      </Link>
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Password</h1>
        <p className="text-sm text-muted-foreground">Manage your account password</p>
      </div>
    </div>
  );
}

// ── Set-password form (Google users with no password yet) ─────────────────────

function SetPasswordForm() {
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SetForm>({ resolver: zodResolver(setSchema) });

  async function onSubmit(data: SetForm) {
    setSaveError(null);
    setSaveSuccess(false);
    try {
      await authApi.setPassword(data.new_password);
      reset();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const detail: string = err.response?.data?.detail ?? "";
        setSaveError(detail || "Failed to set password. Please try again.");
      } else {
        setSaveError("Something went wrong. Please try again.");
      }
    }
  }

  return (
    <GlowCard className="bg-card p-6 space-y-5">
      {/* Informational banner */}
      <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/5 border border-primary/15">
        <ShieldCheck size={18} className="text-primary mt-0.5 shrink-0" />
        <p className="text-sm text-muted-foreground leading-relaxed">
          Your account was created with Google Sign-In and has no password yet.
          Setting one lets you sign in with email and password in the future.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* New password */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground" htmlFor="sp-new">
            New password
          </label>
          <div className="relative flex items-center">
            <input
              id="sp-new"
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

        {/* Confirm password */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground" htmlFor="sp-confirm">
            Confirm password
          </label>
          <div className="relative flex items-center">
            <input
              id="sp-confirm"
              type={showConfirm ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Repeat password"
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

        {/* Feedback */}
        {saveError && (
          <p className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2">{saveError}</p>
        )}
        {saveSuccess && (
          <p className="text-xs text-green-600 dark:text-green-400 bg-green-500/10 rounded-lg px-3 py-2">
            Password set successfully. You can now sign in with email and password.
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save size={16} />
          {isSubmitting ? "Setting…" : "Set password"}
        </button>
      </form>
    </GlowCard>
  );
}

// ── Change-password form (users who already have a password) ──────────────────

function ChangePasswordForm() {
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
  } = useForm<ChangeForm>({ resolver: zodResolver(changeSchema) });

  async function onSubmit(data: ChangeForm) {
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
        } else {
          setSaveError(detail || "Failed to update password. Please try again.");
        }
      } else {
        setSaveError("Something went wrong. Please try again.");
      }
    }
  }

  return (
    <GlowCard className="bg-card p-5">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save size={16} />
          {isSubmitting ? "Updating…" : "Update password"}
        </button>
      </form>
    </GlowCard>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function PasswordSettingsPage() {
  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: () => profileApi.getProfile().then((r) => r.data),
    staleTime: 30_000,
  });

  // ── Loading skeleton ──────────────────────────────────────────────────────

  if (isLoading || !profile) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-muted animate-pulse" />
          <div className="space-y-1.5">
            <div className="h-5 bg-muted rounded w-24 animate-pulse" />
            <div className="h-3 bg-muted rounded w-40 animate-pulse" />
          </div>
        </div>
        <GlowCard className="bg-card p-5 space-y-4 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-1.5">
              <div className="h-3 bg-muted rounded w-24" />
              <div className="h-10 bg-muted rounded" />
            </div>
          ))}
        </GlowCard>
      </div>
    );
  }

  // ── Route to the right form based on has_password ─────────────────────────

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-6">
      <PageHeader />
      {profile.has_password ? <ChangePasswordForm /> : <SetPasswordForm />}
    </div>
  );
}
