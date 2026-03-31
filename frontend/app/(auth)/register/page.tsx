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

// ── Component ───────────────────────────────────────────────────────────────

export default function RegisterPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

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
      router.push("/dashboard");
      router.refresh();
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
      router.push("/dashboard");
      router.refresh();
    } catch {
      setServerError("Google sign-up failed. Please try again.");
    } finally {
      setGoogleLoading(false);
    }
  }

  const isLoading = isSubmitting || googleLoading;

  // ── Render ───────────────────────────────────────────────────────────────

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
          <Image src="/Project Logo.png" alt="BahasaBot" width={56} height={56} priority className="object-contain" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-white/80"
        >
          Create Account
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-white/55 text-xs"
        >
          Start learning Bahasa Melayu today
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
          <div className="relative overflow-hidden bg-[#4a7c59] hover:bg-[#3d6b4a] text-white font-medium h-10 rounded-lg transition-all duration-300 flex items-center justify-center">
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
          <div className="flex-1 border-t border-white/8" />
        </div>

        {/* Google sign-up */}
        <div className="flex justify-center">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setServerError("Google sign-up failed. Please try again.")}
            useOneTap={false}
            text="signup_with"
            shape="rectangular"
            theme="filled_black"
          />
        </div>

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
