"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import axios from "axios";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, ArrowRight, ArrowLeft, CheckCircle } from "lucide-react";

import { AuthCard } from "@/components/ui/auth-card";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// ── Zod schema ──────────────────────────────────────────────────────────────

const forgotSchema = z.object({
  email: z.string().email("Enter a valid email address"),
});

type ForgotForm = z.infer<typeof forgotSchema>;

// ── Component ───────────────────────────────────────────────────────────────

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);
  const [isGoogleAccount, setIsGoogleAccount] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [focusedInput, setFocusedInput] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotForm>({ resolver: zodResolver(forgotSchema) });

  async function onSubmit(data: ForgotForm) {
    setApiError(null);
    setIsGoogleAccount(false);
    try {
      await axios.post(`${API_URL}/api/auth/forgot-password`, { email: data.email });
      setSubmitted(true);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const detail: string = err.response?.data?.detail ?? "";
        if (detail === "google_account_no_password") {
          setIsGoogleAccount(true);
          return;
        }
      }
      // Surface a generic error only for non-200 unexpected failures
      setApiError("Something went wrong. Please try again.");
    }
  }

  return (
    <AuthCard>
      {/* Header */}
      <div className="text-center space-y-1 mb-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", duration: 0.8 }}
          className="mx-auto w-14 h-14 flex items-center justify-center"
        >
          <Image
            src="/Project Logo.png"
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
          Forgot Password
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-white/55 text-xs"
        >
          Enter your email and we&apos;ll send you a reset link
        </motion.p>
      </div>

      <AnimatePresence mode="wait">
        {/* ── Success state ──────────────────────────────────────────────── */}
        {submitted ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-4"
          >
            <div className="flex justify-center">
              <CheckCircle className="w-12 h-12 text-[#4a7c59]" />
            </div>
            <p className="text-white/80 text-sm leading-relaxed">
              If that email is registered, you&apos;ll receive a reset link shortly.
              Check your inbox (and spam folder) within a few minutes.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-xs text-white/50 hover:text-white transition-colors duration-200 mt-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Sign In
            </Link>
          </motion.div>
        ) : isGoogleAccount ? (
          /* ── Google account message ──────────────────────────────────────── */
          <motion.div
            key="google"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg px-4 py-3 text-sm text-blue-300 text-center leading-relaxed">
              This account uses <strong>Sign in with Google</strong>.
              To change your password, visit your Google account settings at{" "}
              <span className="underline">myaccount.google.com</span>.
            </div>
            <Link
              href="/login"
              className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white transition-colors duration-200 justify-center"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Sign In
            </Link>
          </motion.div>
        ) : (
          /* ── Form ────────────────────────────────────────────────────────── */
          <motion.form
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4"
          >
            {/* Email input */}
            {(() => {
              const { onBlur: emailOnBlur, ...emailRest } = register("email");
              return (
                <motion.div
                  className="relative"
                  whileHover={{ scale: 1.01 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                  <div className="relative flex items-center rounded-lg overflow-hidden">
                    <Mail
                      className={`absolute left-3 w-4 h-4 transition-colors duration-300 ${
                        focusedInput ? "text-white" : "text-white/40"
                      }`}
                    />
                    <input
                      type="email"
                      placeholder="Email address"
                      autoComplete="email"
                      onFocus={() => setFocusedInput(true)}
                      onBlur={(e) => {
                        emailOnBlur(e);
                        setFocusedInput(false);
                      }}
                      className="w-full bg-white/5 border border-white/10 focus:border-white/25 focus:bg-white/10 text-white placeholder:text-white/30 h-10 rounded-lg pl-10 pr-3 text-sm outline-none transition-all duration-300"
                      {...emailRest}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-xs text-red-400 mt-1 ml-1">{errors.email.message}</p>
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
              className="w-full relative group/button"
            >
              <div className="absolute inset-0 bg-white/10 rounded-lg blur-lg opacity-0 group-hover/button:opacity-60 transition-opacity duration-300" />
              <div className="relative overflow-hidden bg-[#4a7c59] hover:bg-[#3d6b4a] text-white font-medium h-10 rounded-lg transition-all duration-300 flex items-center justify-center">
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
                      Send Reset Link
                      <ArrowRight className="w-3.5 h-3.5 group-hover/button:translate-x-0.5 transition-transform duration-300" />
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </motion.button>

            {/* Back link */}
            <p className="text-center text-xs text-white/50 mt-1">
              <Link
                href="/login"
                className="inline-flex items-center gap-1 hover:text-white transition-colors duration-200"
              >
                <ArrowLeft className="w-3 h-3" />
                Back to Sign In
              </Link>
            </p>
          </motion.form>
        )}
      </AnimatePresence>
    </AuthCard>
  );
}
