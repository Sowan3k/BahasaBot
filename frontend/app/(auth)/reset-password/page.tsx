"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import axios from "axios";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Eye, EyeOff, ArrowRight, CheckCircle } from "lucide-react";

import { AuthCard } from "@/components/ui/auth-card";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// ── Zod schema ──────────────────────────────────────────────────────────────

const resetSchema = z
  .object({
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ResetForm = z.infer<typeof resetSchema>;

// ── Inner component (uses useSearchParams — must be inside Suspense) ─────────

function ResetPasswordInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [success, setSuccess] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetForm>({ resolver: zodResolver(resetSchema) });

  // If no token in URL, show an error immediately
  if (!token) {
    return (
      <div className="text-center space-y-4">
        <p className="text-red-400 text-sm">
          Invalid reset link. Please request a new password reset.
        </p>
        <Link
          href="/forgot-password"
          className="text-xs text-white/50 hover:text-white transition-colors duration-200"
        >
          Request new link →
        </Link>
      </div>
    );
  }

  async function onSubmit(data: ResetForm) {
    setApiError(null);
    try {
      await axios.post(`${API_URL}/api/auth/reset-password`, {
        token,
        new_password: data.newPassword,
      });
      setSuccess(true);
      // Auto-redirect to login after 3 seconds
      setTimeout(() => router.push("/login"), 3000);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const detail: string = err.response?.data?.detail ?? "";
        setApiError(detail || "Something went wrong. Please request a new reset link.");
      } else {
        setApiError("Something went wrong. Please try again.");
      }
    }
  }

  return (
    <AnimatePresence mode="wait">
      {success ? (
        /* ── Success state ─────────────────────────────────────────────── */
        <motion.div
          key="success"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <div className="flex justify-center">
            <CheckCircle className="w-12 h-12 text-primary" />
          </div>
          <p className="text-white/80 text-sm leading-relaxed">
            Password updated successfully!
            <br />
            Redirecting you to the sign-in page…
          </p>
          <Link
            href="/login"
            className="text-xs text-white/50 hover:text-white transition-colors duration-200"
          >
            Go to Sign In →
          </Link>
        </motion.div>
      ) : (
        /* ── Form ─────────────────────────────────────────────────────── */
        <motion.form
          key="form"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-3"
        >
          {/* New password */}
          {(() => {
            const { onBlur: newBlur, ...newRest } = register("newPassword");
            return (
              <motion.div
                className="relative"
                whileHover={{ scale: 1.01 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                <div className="relative flex items-center rounded-lg overflow-hidden">
                  <Lock
                    className={`absolute left-3 w-4 h-4 transition-colors duration-300 ${
                      focused === "new" ? "text-white" : "text-white/40"
                    }`}
                  />
                  <input
                    type={showNew ? "text" : "password"}
                    placeholder="New password"
                    autoComplete="new-password"
                    onFocus={() => setFocused("new")}
                    onBlur={(e) => { newBlur(e); setFocused(null); }}
                    className="w-full bg-white/5 border border-white/10 focus:border-white/25 focus:bg-white/10 text-white placeholder:text-white/30 h-10 rounded-lg pl-10 pr-10 text-sm outline-none transition-all duration-300"
                    {...newRest}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew((v) => !v)}
                    className="absolute right-3 text-white/40 hover:text-white transition-colors duration-300"
                  >
                    {showNew ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                </div>
                {errors.newPassword && (
                  <p className="text-xs text-red-400 mt-1 ml-1">{errors.newPassword.message}</p>
                )}
              </motion.div>
            );
          })()}

          {/* Confirm password */}
          {(() => {
            const { onBlur: confirmBlur, ...confirmRest } = register("confirmPassword");
            return (
              <motion.div
                className="relative"
                whileHover={{ scale: 1.01 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                <div className="relative flex items-center rounded-lg overflow-hidden">
                  <Lock
                    className={`absolute left-3 w-4 h-4 transition-colors duration-300 ${
                      focused === "confirm" ? "text-white" : "text-white/40"
                    }`}
                  />
                  <input
                    type={showConfirm ? "text" : "password"}
                    placeholder="Confirm new password"
                    autoComplete="new-password"
                    onFocus={() => setFocused("confirm")}
                    onBlur={(e) => { confirmBlur(e); setFocused(null); }}
                    className="w-full bg-white/5 border border-white/10 focus:border-white/25 focus:bg-white/10 text-white placeholder:text-white/30 h-10 rounded-lg pl-10 pr-10 text-sm outline-none transition-all duration-300"
                    {...confirmRest}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-3 text-white/40 hover:text-white transition-colors duration-300"
                  >
                    {showConfirm ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-xs text-red-400 mt-1 ml-1">{errors.confirmPassword.message}</p>
                )}
              </motion.div>
            );
          })()}

          {/* API error */}
          {apiError && (
            <p className="text-xs text-red-400 text-center bg-red-500/10 rounded-lg px-3 py-2">
              {apiError}
            </p>
          )}

          {/* Submit */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isSubmitting}
            className="w-full relative group/button mt-1"
          >
            <div className="absolute inset-0 bg-white/10 rounded-lg blur-lg opacity-0 group-hover/button:opacity-60 transition-opacity duration-300" />
            <div className="relative overflow-hidden bg-primary hover:opacity-90 text-primary-foreground font-medium h-10 rounded-lg transition-all duration-300 flex items-center justify-center">
              <AnimatePresence mode="wait">
                {isSubmitting ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <div className="w-4 h-4 border-2 border-white/70 border-t-transparent rounded-full animate-spin" />
                  </motion.div>
                ) : (
                  <motion.span
                    key="text"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-1.5 text-sm font-medium"
                  >
                    Set New Password
                    <ArrowRight className="w-3.5 h-3.5 group-hover/button:translate-x-0.5 transition-transform duration-300" />
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </motion.button>

          <p className="text-center text-xs text-white/50 mt-1">
            Remember your password?{" "}
            <Link
              href="/login"
              className="text-white hover:text-white/70 font-medium transition-colors duration-200"
            >
              Sign In
            </Link>
          </p>
        </motion.form>
      )}
    </AnimatePresence>
  );
}

// ── Page (wraps inner component in Suspense for useSearchParams) ─────────────

export default function ResetPasswordPage() {
  return (
    <AuthCard>
      {/* Header */}
      <div className="text-center space-y-1 mb-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", duration: 0.8 }}
          className="mx-auto flex justify-center"
        >
          <Image
            src="/Logo new only box (1).svg"
            alt="BahasaBot"
            width={56}
            height={56}
            priority
            className="object-contain"
          />
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-white/80"
        >
          Set New Password
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-white/55 text-xs"
        >
          Choose a strong password (at least 8 characters)
        </motion.p>
      </div>

      <Suspense
        fallback={
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
        }
      >
        <ResetPasswordInner />
      </Suspense>
    </AuthCard>
  );
}
