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
import { motion, AnimatePresence } from "framer-motion";
import { User, Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";

import { AuthCard } from "@/components/ui/auth-card";
import { SetPasswordModal } from "@/components/auth/SetPasswordModal";
import type { TokenResponse } from "@/lib/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// ── Zod schema ──────────────────────────────────────────────────────────────

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

// ── Shared helper ───────────────────────────────────────────────────────────

async function storeSession(data: TokenResponse): Promise<boolean> {
  const credentials = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    userId: data.user.id,
    name: data.user.name,
    email: data.user.email,
    proficiencyLevel: data.user.proficiency_level,
    provider: data.user.provider,
    createdAt: String(data.user.created_at),
  };
  // Retry once — first attempt can fail if CSRF token is still loading
  let result = await signIn("jwt", { ...credentials, redirect: false as false });
  if (result?.error) {
    await new Promise((r) => setTimeout(r, 600));
    result = await signIn("jwt", { ...credentials, redirect: false as false });
  }
  return !result?.error;
}

// ── Component ───────────────────────────────────────────────────────────────

export default function RegisterPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [showSetPassword, setShowSetPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) });

  // ── Email / password submit ──────────────────────────────────────────────

  async function onSubmit(data: RegisterForm) {
    setServerError(null);
    try {
      const { data: tokenData } = await axios.post<TokenResponse>(
        `${API_URL}/api/auth/register`,
        { name: data.name, email: data.email, password: data.password }
      );
      const ok = await storeSession(tokenData);
      if (!ok) { setServerError("Account created but sign-in failed. Please go to Login."); return; }
      sessionStorage.removeItem("chatbot_messages");
      sessionStorage.removeItem("chatbot_session_id");
      sessionStorage.removeItem("tip_dismissed");
      router.push("/dashboard");
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
      const { data } = await axios.post<TokenResponse>(
        `${API_URL}/api/auth/google`,
        { id_token: credentialResponse.credential }
      );
      const ok = await storeSession(data);
      if (!ok) { setServerError("Google sign-up failed. Please try again."); return; }
      sessionStorage.removeItem("chatbot_messages");
      sessionStorage.removeItem("chatbot_session_id");
      sessionStorage.removeItem("tip_dismissed");
      if (data.requires_password_setup) {
        // New Google account — show mandatory set-password modal before dashboard
        setShowSetPassword(true);
      } else {
        router.push("/dashboard");
      }
    } catch {
      setServerError("Google sign-up failed. Please try again.");
    } finally {
      setGoogleLoading(false);
    }
  }

  const isLoading = isSubmitting || googleLoading;

  // ── Render ───────────────────────────────────────────────────────────────

  // Mandatory set-password step for new Google sign-ups with no password
  if (showSetPassword) {
    return <SetPasswordModal />;
  }

  return (
    <AuthCard>
      {/* Header */}
      <div className="mb-7">
        {/* Logo + wordmark — mobile only (desktop shows branding in the left panel) */}
        <div className="lg:hidden flex items-center justify-center gap-3 mb-6">
          <div className="relative w-12 h-12 flex-shrink-0">
            <Image src="/Logo new only box (1).svg" alt="BahasaBot" fill sizes="48px" className="object-contain" />
          </div>
          <span className="text-white font-bold text-2xl tracking-tight">BahasaBot</span>
        </div>
        <motion.h2
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl font-bold text-white tracking-tight"
        >
          Create account
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-white/45 text-sm mt-1.5"
        >
          Start your Bahasa Melayu learning journey
        </motion.p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        {/* Full name */}
        {(() => {
          const { onBlur: nameOnBlur, ...nameRest } = register("name");
          return (
            <motion.div className="relative" whileHover={{ scale: 1.01 }} transition={{ type: "spring", stiffness: 400, damping: 25 }}>
              <div className="relative flex items-center rounded-lg overflow-hidden">
                <User className={`absolute left-3 w-4 h-4 transition-colors duration-300 ${focusedInput === "name" ? "text-white" : "text-white/40"}`} />
                <input
                  type="text"
                  placeholder="Full name"
                  autoComplete="name"
                  onFocus={() => setFocusedInput("name")}
                  onBlur={(e) => { nameOnBlur(e); setFocusedInput(null); }}
                  className="w-full bg-white/5 border border-white/10 focus:border-white/25 focus:bg-white/10 text-white placeholder:text-white/30 h-10 rounded-lg pl-10 pr-3 text-sm outline-none transition-all duration-300"
                  {...nameRest}
                />
              </div>
              {errors.name && <p className="text-xs text-red-400 mt-1 ml-1">{errors.name.message}</p>}
            </motion.div>
          );
        })()}

        {/* Email */}
        {(() => {
          const { onBlur: emailOnBlur, ...emailRest } = register("email");
          return (
            <motion.div className="relative" whileHover={{ scale: 1.01 }} transition={{ type: "spring", stiffness: 400, damping: 25 }}>
              <div className="relative flex items-center rounded-lg overflow-hidden">
                <Mail className={`absolute left-3 w-4 h-4 transition-colors duration-300 ${focusedInput === "email" ? "text-white" : "text-white/40"}`} />
                <input
                  type="email"
                  placeholder="Email address"
                  autoComplete="email"
                  onFocus={() => setFocusedInput("email")}
                  onBlur={(e) => { emailOnBlur(e); setFocusedInput(null); }}
                  className="w-full bg-white/5 border border-white/10 focus:border-white/25 focus:bg-white/10 text-white placeholder:text-white/30 h-10 rounded-lg pl-10 pr-3 text-sm outline-none transition-all duration-300"
                  {...emailRest}
                />
              </div>
              {errors.email && <p className="text-xs text-red-400 mt-1 ml-1">{errors.email.message}</p>}
            </motion.div>
          );
        })()}

        {/* Password */}
        {(() => {
          const { onBlur: passwordOnBlur, ...passwordRest } = register("password");
          return (
            <motion.div className="relative" whileHover={{ scale: 1.01 }} transition={{ type: "spring", stiffness: 400, damping: 25 }}>
              <div className="relative flex items-center rounded-lg overflow-hidden">
                <Lock className={`absolute left-3 w-4 h-4 transition-colors duration-300 ${focusedInput === "password" ? "text-white" : "text-white/40"}`} />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password (min. 8 characters)"
                  autoComplete="new-password"
                  onFocus={() => setFocusedInput("password")}
                  onBlur={(e) => { passwordOnBlur(e); setFocusedInput(null); }}
                  className="w-full bg-white/5 border border-white/10 focus:border-white/25 focus:bg-white/10 text-white placeholder:text-white/30 h-10 rounded-lg pl-10 pr-10 text-sm outline-none transition-all duration-300"
                  {...passwordRest}
                />
                <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 text-white/40 hover:text-white transition-colors duration-300">
                  {showPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-400 mt-1 ml-1">{errors.password.message}</p>}
            </motion.div>
          );
        })()}

        {/* Confirm password */}
        {(() => {
          const { onBlur: confirmOnBlur, ...confirmRest } = register("confirmPassword");
          return (
            <motion.div className="relative" whileHover={{ scale: 1.01 }} transition={{ type: "spring", stiffness: 400, damping: 25 }}>
              <div className="relative flex items-center rounded-lg overflow-hidden">
                <Lock className={`absolute left-3 w-4 h-4 transition-colors duration-300 ${focusedInput === "confirmPassword" ? "text-white" : "text-white/40"}`} />
                <input
                  type={showConfirm ? "text" : "password"}
                  placeholder="Confirm password"
                  autoComplete="new-password"
                  onFocus={() => setFocusedInput("confirmPassword")}
                  onBlur={(e) => { confirmOnBlur(e); setFocusedInput(null); }}
                  className="w-full bg-white/5 border border-white/10 focus:border-white/25 focus:bg-white/10 text-white placeholder:text-white/30 h-10 rounded-lg pl-10 pr-10 text-sm outline-none transition-all duration-300"
                  {...confirmRest}
                />
                <button type="button" onClick={() => setShowConfirm((v) => !v)} className="absolute right-3 text-white/40 hover:text-white transition-colors duration-300">
                  {showConfirm ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-xs text-red-400 mt-1 ml-1">{errors.confirmPassword.message}</p>}
            </motion.div>
          );
        })()}

        {/* Server error */}
        {serverError && (
          <p className="text-xs text-red-400 text-center bg-red-500/10 rounded-lg px-3 py-2">{serverError}</p>
        )}

        {/* Create account button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={isLoading}
          className="w-full relative group/button mt-1"
        >
          <div className="absolute inset-0 bg-white/10 rounded-lg blur-lg opacity-0 group-hover/button:opacity-60 transition-opacity duration-300" />
          <div className="relative overflow-hidden bg-primary hover:opacity-90 text-primary-foreground font-medium h-10 rounded-lg transition-all duration-300 flex items-center justify-center">
            <AnimatePresence mode="wait">
              {isLoading ? (
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
                  Create Account
                  <ArrowRight className="w-3.5 h-3.5 group-hover/button:translate-x-0.5 transition-transform duration-300" />
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </motion.button>

        {/* Divider */}
        <div className="flex items-center gap-3 my-1">
          <div className="flex-1 border-t border-white/8" />
          <motion.span
            className="text-xs text-white/35"
            animate={{ opacity: [0.7, 0.9, 0.7] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            or
          </motion.span>
          <div className="flex-1 border-t border-white/[0.08]" />
        </div>

        {/* Google sign-up */}
        <div className="relative h-10">
          <button
            type="button"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 h-10 rounded-lg
                       border border-white/15 bg-white/[0.06] hover:bg-white/10
                       text-white/75 hover:text-white text-sm font-medium
                       transition-all duration-200 disabled:opacity-40"
          >
            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          {/* Transparent GIS overlay — same pattern as login page */}
          {!isLoading && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                opacity: 0.001,
                overflow: "hidden",
                borderRadius: "8px",
                cursor: "pointer",
              }}
            >
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setServerError("Google sign-up failed. Please try again.")}
                useOneTap={false}
                text="signup_with"
                shape="rectangular"
                theme="filled_black"
                size="large"
                width="460"
              />
            </div>
          )}
        </div>

        {/* Free plan nudge */}
        <p className="text-center text-[11px] text-white/30 -mt-1">
          Free plan available &middot;{" "}
          <Link href="/pricing" className="text-white/50 hover:text-white/80 transition-colors duration-200 underline underline-offset-2 decoration-white/25 hover:decoration-white/60">
            See all plans →
          </Link>
        </p>

        {/* Login link */}
        <motion.p
          className="text-center text-xs text-white/50 mt-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          Already have an account?{" "}
          <Link href="/login" className="relative inline-block group/login">
            <span className="relative z-10 text-white group-hover/login:text-white/70 transition-colors duration-300 font-medium">
              Sign in
            </span>
            <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-white group-hover/login:w-full transition-all duration-300" />
          </Link>
        </motion.p>
      </form>
    </AuthCard>
  );
}
