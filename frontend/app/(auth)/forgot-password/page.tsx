"use client";

/**
 * Forgot Password — 4-step flow (all on one page, no URL change)
 *
 * Step 1 — Email:   user enters their email → POST /api/auth/forgot-password
 * Step 2 — Code:    user enters 6-digit code → POST /api/auth/verify-reset-code
 * Step 3 — Password: user sets new password  → POST /api/auth/reset-password
 * Step 4 — Success:  confirmation + link to sign-in
 */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import axios from "axios";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, ArrowRight, ArrowLeft, CheckCircle, Lock, Eye, EyeOff, KeyRound } from "lucide-react";

import { AuthCard } from "@/components/ui/auth-card";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// ── Zod schemas ─────────────────────────────────────────────────────────────

const emailSchema = z.object({
  email: z.string().email("Enter a valid email address"),
});

const passwordSchema = z
  .object({
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type EmailForm = z.infer<typeof emailSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

type Step = "email" | "code" | "password" | "success";

// ── Step 1 — Email entry ────────────────────────────────────────────────────

function EmailStep({
  onNext,
}: {
  onNext: (email: string) => void;
}) {
  const [focused, setFocused] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isGoogleAccount, setIsGoogleAccount] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EmailForm>({ resolver: zodResolver(emailSchema) });

  async function onSubmit(data: EmailForm) {
    setApiError(null);
    setIsGoogleAccount(false);
    try {
      await axios.post(`${API_URL}/api/auth/forgot-password`, { email: data.email });
      onNext(data.email);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const detail: string = err.response?.data?.detail ?? "";
        if (detail === "google_account_no_password") {
          setIsGoogleAccount(true);
          return;
        }
      }
      setApiError("Something went wrong. Please try again.");
    }
  }

  if (isGoogleAccount) {
    return (
      <motion.div
        key="google"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <div className="bg-white/5 border border-white/15 rounded-lg px-4 py-3 text-sm text-white/80 text-center leading-relaxed">
          This account uses <strong>Sign in with Google</strong>.
          To change your password, visit your Google account settings at{" "}
          <span className="underline">myaccount.google.com</span>.
        </div>
        <button
          onClick={() => setIsGoogleAccount(false)}
          className="flex items-center gap-1 text-xs text-white/50 hover:text-white transition-colors duration-200 mx-auto"
        >
          <ArrowLeft className="w-3 h-3" />
          Try a different email
        </button>
      </motion.div>
    );
  }

  const { onBlur: emailOnBlur, ...emailRest } = register("email");

  return (
    <motion.form
      key="email-form"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4"
    >
      <motion.div
        className="relative"
        whileHover={{ scale: 1.01 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        <div className="relative flex items-center rounded-lg overflow-hidden">
          <Mail
            className={`absolute left-3 w-4 h-4 transition-colors duration-300 ${
              focused ? "text-white" : "text-white/40"
            }`}
          />
          <input
            type="email"
            placeholder="Email address"
            autoComplete="email"
            onFocus={() => setFocused(true)}
            onBlur={(e) => { emailOnBlur(e); setFocused(false); }}
            className="w-full bg-white/5 border border-white/10 focus:border-white/25 focus:bg-white/10 text-white placeholder:text-white/30 h-10 rounded-lg pl-10 pr-3 text-sm outline-none transition-all duration-300"
            {...emailRest}
          />
        </div>
        {errors.email && (
          <p className="text-xs text-red-400 mt-1 ml-1">{errors.email.message}</p>
        )}
      </motion.div>

      {apiError && (
        <p className="text-xs text-red-400 text-center bg-red-500/10 rounded-lg px-3 py-2">
          {apiError}
        </p>
      )}

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        type="submit"
        disabled={isSubmitting}
        className="w-full relative group/button"
      >
        <div className="absolute inset-0 bg-white/10 rounded-lg blur-lg opacity-0 group-hover/button:opacity-60 transition-opacity duration-300" />
        <div className="relative overflow-hidden bg-primary hover:opacity-90 text-primary-foreground font-medium h-10 rounded-lg transition-all duration-300 flex items-center justify-center">
          <AnimatePresence mode="wait">
            {isSubmitting ? (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
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
                Send Code
                <ArrowRight className="w-3.5 h-3.5 group-hover/button:translate-x-0.5 transition-transform duration-300" />
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </motion.button>

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
  );
}

// ── Step 2 — 6-digit code entry ─────────────────────────────────────────────

function CodeStep({
  email,
  onNext,
  onBack,
}: {
  email: string;
  onNext: (code: string) => void;
  onBack: () => void;
}) {
  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Start cooldown on mount so user can't immediately re-send
  useEffect(() => {
    setResendCooldown(60);
    const interval = setInterval(() => {
      setResendCooldown((c) => {
        if (c <= 1) { clearInterval(interval); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  function handleDigitChange(index: number, value: string) {
    // Accept only digits; handle paste of full 6-digit code
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length > 1) {
      // Paste — fill from this index
      const pasted = cleaned.slice(0, 6);
      const next = [...digits];
      for (let i = 0; i < pasted.length && index + i < 6; i++) {
        next[index + i] = pasted[i];
      }
      setDigits(next);
      const lastFilled = Math.min(index + pasted.length, 5);
      inputRefs.current[lastFilled]?.focus();
      return;
    }
    const next = [...digits];
    next[index] = cleaned;
    setDigits(next);
    if (cleaned && index < 5) inputRefs.current[index + 1]?.focus();
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  async function handleVerify() {
    const code = digits.join("");
    if (code.length < 6) {
      setApiError("Please enter all 6 digits.");
      return;
    }
    setApiError(null);
    setIsVerifying(true);
    try {
      await axios.post(`${API_URL}/api/auth/verify-reset-code`, { email, code });
      onNext(code);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const detail: string = err.response?.data?.detail ?? "";
        setApiError(detail || "Invalid or expired code. Please try again.");
      } else {
        setApiError("Something went wrong. Please try again.");
      }
    } finally {
      setIsVerifying(false);
    }
  }

  async function handleResend() {
    if (resendCooldown > 0) return;
    setApiError(null);
    setResendMessage(null);
    try {
      await axios.post(`${API_URL}/api/auth/forgot-password`, { email });
      setResendMessage("New code sent! Check your inbox.");
      setDigits(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
      setResendCooldown(60);
      const interval = setInterval(() => {
        setResendCooldown((c) => {
          if (c <= 1) { clearInterval(interval); return 0; }
          return c - 1;
        });
      }, 1000);
    } catch {
      setApiError("Could not resend code. Please try again.");
    }
  }

  const code = digits.join("");

  return (
    <motion.div
      key="code-step"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-5"
    >
      <p className="text-white/60 text-sm text-center">
        We sent a 6-digit code to{" "}
        <span className="text-white font-medium">{email}</span>.
        Enter it below within 10 minutes.
      </p>

      {/* OTP boxes */}
      <div className="flex justify-center gap-2">
        {digits.map((digit, i) => (
          <input
            key={i}
            ref={(el) => { inputRefs.current[i] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={digit}
            onChange={(e) => handleDigitChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onFocus={(e) => e.target.select()}
            className={`w-11 h-13 text-center text-xl font-bold rounded-xl border
                        bg-white/5 text-white outline-none transition-all duration-200
                        ${digit
                          ? "border-primary/70 bg-primary/10"
                          : "border-white/15 focus:border-white/40"
                        }`}
            style={{ height: "52px" }}
            aria-label={`Digit ${i + 1}`}
          />
        ))}
      </div>

      {apiError && (
        <p className="text-xs text-red-400 text-center bg-red-500/10 rounded-lg px-3 py-2">
          {apiError}
        </p>
      )}
      {resendMessage && !apiError && (
        <p className="text-xs text-primary text-center">{resendMessage}</p>
      )}

      <motion.button
        whileHover={{ scale: code.length < 6 ? 1 : 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleVerify}
        disabled={isVerifying || code.length < 6}
        className="w-full relative group/button"
      >
        <div className="absolute inset-0 bg-white/10 rounded-lg blur-lg opacity-0 group-hover/button:opacity-60 transition-opacity duration-300" />
        <div className="relative overflow-hidden bg-primary hover:opacity-90 disabled:opacity-50 text-primary-foreground font-medium h-10 rounded-lg transition-all duration-300 flex items-center justify-center">
          <AnimatePresence mode="wait">
            {isVerifying ? (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
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
                Verify Code
                <ArrowRight className="w-3.5 h-3.5 group-hover/button:translate-x-0.5 transition-transform duration-300" />
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </motion.button>

      <div className="flex items-center justify-between text-xs text-white/40">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1 hover:text-white transition-colors duration-200"
        >
          <ArrowLeft className="w-3 h-3" />
          Change email
        </button>
        <button
          onClick={handleResend}
          disabled={resendCooldown > 0}
          className="hover:text-white transition-colors duration-200 disabled:opacity-40 disabled:cursor-default"
        >
          {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
        </button>
      </div>
    </motion.div>
  );
}

// ── Step 3 — New password ────────────────────────────────────────────────────

function PasswordStep({
  email,
  code,
  onNext,
  onBack,
}: {
  email: string;
  code: string;
  onNext: () => void;
  onBack: () => void;
}) {
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) });

  async function onSubmit(data: PasswordForm) {
    setApiError(null);
    try {
      await axios.post(`${API_URL}/api/auth/reset-password`, {
        email,
        code,
        new_password: data.newPassword,
      });
      onNext();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const detail: string = err.response?.data?.detail ?? "";
        setApiError(detail || "Something went wrong. Please request a new code.");
      } else {
        setApiError("Something went wrong. Please try again.");
      }
    }
  }

  const { onBlur: newBlur, ...newRest } = register("newPassword");
  const { onBlur: confirmBlur, ...confirmRest } = register("confirmPassword");

  return (
    <motion.form
      key="password-step"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-3"
    >
      {/* New password */}
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
            placeholder="New password (min. 8 characters)"
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

      {/* Confirm password */}
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

      {apiError && (
        <p className="text-xs text-red-400 text-center bg-red-500/10 rounded-lg px-3 py-2">
          {apiError}
        </p>
      )}

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
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
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

      <p className="text-center text-xs text-white/40 mt-1">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1 hover:text-white transition-colors duration-200"
        >
          <ArrowLeft className="w-3 h-3" />
          Back to code entry
        </button>
      </p>
    </motion.form>
  );
}

// ── Step 4 — Success ─────────────────────────────────────────────────────────

function SuccessStep() {
  const router = useRouter();

  useEffect(() => {
    const t = setTimeout(() => router.push("/login"), 4000);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <motion.div
      key="success"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center space-y-4"
    >
      <div className="flex justify-center">
        <CheckCircle className="w-12 h-12 text-primary" />
      </div>
      <div>
        <p className="text-white font-semibold text-base">Password updated!</p>
        <p className="text-white/60 text-sm mt-1 leading-relaxed">
          Redirecting you to sign in…
        </p>
      </div>
      <Link
        href="/login"
        className="text-xs text-white/50 hover:text-white transition-colors duration-200"
      >
        Go to Sign In →
      </Link>
    </motion.div>
  );
}

// ── Step indicator ───────────────────────────────────────────────────────────

const STEP_LABELS: Record<Step, string> = {
  email: "Enter email",
  code: "Enter code",
  password: "New password",
  success: "Done",
};

const STEP_ICONS: Record<Step, React.ReactNode> = {
  email: <Mail className="w-5 h-5" />,
  code: <KeyRound className="w-5 h-5" />,
  password: <Lock className="w-5 h-5" />,
  success: <CheckCircle className="w-5 h-5" />,
};

const STEP_ORDER: Step[] = ["email", "code", "password", "success"];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [verifiedCode, setVerifiedCode] = useState("");

  const currentIdx = STEP_ORDER.indexOf(step);

  return (
    <AuthCard>
      {/* Logo */}
      <div className="flex justify-center mb-5">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", duration: 0.8 }}
        >
          <Image
            src="/Logo new only box (1).svg"
            alt="BahasaBot"
            width={52}
            height={52}
            priority
            className="object-contain"
          />
        </motion.div>
      </div>

      {/* Title */}
      <div className="text-center mb-5">
        <motion.h1
          key={step}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xl font-bold text-white"
        >
          {step === "email" && "Forgot Password"}
          {step === "code" && "Check Your Email"}
          {step === "password" && "Set New Password"}
          {step === "success" && "All Done!"}
        </motion.h1>
        <motion.p
          key={`sub-${step}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-white/50 text-xs mt-1"
        >
          {step === "email" && "Enter your email and we'll send you a verification code"}
          {step === "code" && "Enter the 6-digit code from your email"}
          {step === "password" && "Choose a strong new password"}
          {step === "success" && "Your password has been updated successfully"}
        </motion.p>
      </div>

      {/* Progress bar */}
      {step !== "success" && (
        <div className="flex gap-1.5 mb-6">
          {STEP_ORDER.filter((s) => s !== "success").map((s, i) => (
            <div
              key={s}
              className={`flex-1 h-1 rounded-full transition-all duration-300 ${
                i <= currentIdx ? "bg-primary" : "bg-white/10"
              }`}
            />
          ))}
        </div>
      )}

      {/* Step content */}
      <AnimatePresence mode="wait">
        {step === "email" && (
          <EmailStep
            onNext={(em) => {
              setEmail(em);
              setStep("code");
            }}
          />
        )}
        {step === "code" && (
          <CodeStep
            email={email}
            onNext={(code) => { setVerifiedCode(code); setStep("password"); }}
            onBack={() => setStep("email")}
          />
        )}
        {step === "password" && (
          <PasswordStep
            email={email}
            code={verifiedCode}
            onNext={() => setStep("success")}
            onBack={() => setStep("code")}
          />
        )}
        {step === "success" && <SuccessStep />}
      </AnimatePresence>
    </AuthCard>
  );
}
