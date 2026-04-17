"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, ShieldCheck } from "lucide-react";
import axios from "axios";

import { authApi } from "@/lib/api";

interface SetPasswordModalProps {
  /** Called after the password has been successfully saved, before redirect. */
  onSuccess?: () => void;
}

/**
 * Full-screen, non-dismissible modal shown immediately after Google sign-in
 * when the account has no password set (password_hash IS NULL).
 *
 * This lets the user sign in with email + password in the future, and is
 * mandatory — there is no skip or dismiss option.
 */
export function SetPasswordModal({ onSuccess }: SetPasswordModalProps) {
  const router = useRouter();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Client-side validation ─────────────────────────────────────────────────

  function validate(): string | null {
    if (newPassword.length < 8) return "Password must be at least 8 characters.";
    if (newPassword !== confirmPassword) return "Passwords do not match.";
    return null;
  }

  // ── Submit ─────────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    setIsSubmitting(true);
    try {
      await authApi.setPassword(newPassword);
      onSuccess?.();
      router.push("/dashboard");
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const detail: string = err.response?.data?.detail ?? "";
        if (detail.includes("already has a password")) {
          // Edge case: password was set in another tab/window — just continue
          onSuccess?.();
          router.push("/dashboard");
        } else {
          setError(detail || "Failed to set password. Please try again.");
        }
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    /* Backdrop — z-[90] puts it above sidebar (z-[70]) and onboarding (z-[80]) */
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl p-8 space-y-6">
        {/* Icon + heading */}
        <div className="flex flex-col items-center text-center gap-3">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
            <ShieldCheck className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h2 className="font-heading text-xl font-bold text-foreground">
              One last step — set your password
            </h2>
            <p className="text-sm text-muted-foreground mt-1.5 max-w-sm mx-auto leading-relaxed">
              This lets you sign in with email and password in the future, even
              without Google.
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* New password */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground" htmlFor="sp-new">
              New password
            </label>
            <div className="relative flex items-center">
              <Lock className="absolute left-3 w-4 h-4 text-muted-foreground" />
              <input
                id="sp-new"
                type={showNew ? "text" : "password"}
                autoComplete="new-password"
                placeholder="At least 8 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full h-10 pl-9 pr-10 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition"
              />
              <button
                type="button"
                onClick={() => setShowNew((v) => !v)}
                className="absolute right-3 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showNew ? <Eye size={16} /> : <EyeOff size={16} />}
              </button>
            </div>
          </div>

          {/* Confirm password */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground" htmlFor="sp-confirm">
              Confirm password
            </label>
            <div className="relative flex items-center">
              <Lock className="absolute left-3 w-4 h-4 text-muted-foreground" />
              <input
                id="sp-confirm"
                type={showConfirm ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Repeat password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full h-10 pl-9 pr-10 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-3 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showConfirm ? <Eye size={16} /> : <EyeOff size={16} />}
              </button>
            </div>
          </div>

          {/* Inline error */}
          {error && (
            <p className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-10 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-primary-foreground/70 border-t-transparent rounded-full animate-spin" />
            ) : (
              "Set Password & Continue"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
