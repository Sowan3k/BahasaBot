"use client";

import { useRef, useState } from "react";
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
import { Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";

import { AuthCard } from "@/components/ui/auth-card";
import { useTheme } from "@/lib/use-theme";
import type { TokenResponse } from "@/lib/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// ── Zod schema ──────────────────────────────────────────────────────────────

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

// ── Shared helper: store tokens in NextAuth session ─────────────────────────

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
  // redirect: false as a literal type satisfies NextAuth's SignInOptions<false> overload
  // Retry once — first attempt can fail if CSRF token is still loading
  let result = await signIn("jwt", { ...credentials, redirect: false as false });
  if (result?.error) {
    await new Promise((r) => setTimeout(r, 600));
    result = await signIn("jwt", { ...credentials, redirect: false as false });
  }
  return !result?.error;
}

// ── Component ───────────────────────────────────────────────────────────────

export default function LoginPage() {
  const router = useRouter();
  const { setTheme } = useTheme();
  const [authError, setAuthError] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  // ── Email / password submit ──────────────────────────────────────────────

  async function onSubmit(data: LoginForm) {
    setAuthError(null);
    try {
      const { data: tokenData } = await axios.post<TokenResponse>(
        `${API_URL}/api/auth/login`,
        { email: data.email, password: data.password }
      );
      const ok = await storeSession(tokenData);
      if (!ok) { setAuthError("Sign in failed. Please try again."); return; }
      // Force light mode on every sign-in — updates React context + localStorage + DOM in one call
      setTheme("light");
      setRedirecting(true);
      router.push("/dashboard");
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const detail: string = err.response?.data?.detail ?? "";
        if (detail === "google_signin_required") {
          setAuthError("This account was created with Google. Please use Sign in with Google below.");
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
    setGoogleLoading(true);
    try {
      const { data } = await axios.post<TokenResponse>(
        `${API_URL}/api/auth/google`,
        { id_token: credentialResponse.credential }
      );
      const ok = await storeSession(data);
      if (!ok) { setAuthError("Google sign-in failed. Please try again."); return; }
      // Force light mode on every sign-in — updates React context + localStorage + DOM in one call
      setTheme("light");
      setRedirecting(true);
      router.push("/dashboard");
    } catch {
      setAuthError("Google sign-in failed. Please try again.");
    } finally {
      setGoogleLoading(false);
    }
  }

  const googleBtnRef = useRef<HTMLDivElement>(null);

  const isLoading = isSubmitting || googleLoading;

  // ── Render ───────────────────────────────────────────────────────────────

  // Full-screen loading overlay shown while navigating to dashboard after sign-in
  if (redirecting) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-background">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="relative w-14 h-14 rounded-2xl shadow-lg"
        >
          <Image src="/Logo new only box (1).svg" alt="BahasaBot" fill sizes="56px" className="object-contain" />
        </motion.div>
        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">Signing you in…</p>
      </div>
    );
  }

  return (
    <AuthCard>
      {/* Header */}
      <div className="mb-8">
        <motion.h2
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl font-bold text-white tracking-tight"
        >
          Welcome back
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-white/45 text-sm mt-1.5"
        >
          Sign in to continue your Malay journey
        </motion.p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-2.5">
        {/* Email */}
        {(() => {
          const { onBlur: emailOnBlur, ...emailRest } = register("email");
          return (
            <motion.div
              className="relative"
              whileHover={{ scale: 1.01 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
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
            <motion.div
              className="relative"
              whileHover={{ scale: 1.01 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              <div className="relative flex items-center rounded-lg overflow-hidden">
                <Lock className={`absolute left-3 w-4 h-4 transition-colors duration-300 ${focusedInput === "password" ? "text-white" : "text-white/40"}`} />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  autoComplete="current-password"
                  onFocus={() => setFocusedInput("password")}
                  onBlur={(e) => { passwordOnBlur(e); setFocusedInput(null); }}
                  className="w-full bg-white/5 border border-white/10 focus:border-white/25 focus:bg-white/10 text-white placeholder:text-white/30 h-10 rounded-lg pl-10 pr-10 text-sm outline-none transition-all duration-300"
                  {...passwordRest}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 text-white/40 hover:text-white transition-colors duration-300"
                >
                  {showPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-400 mt-1 ml-1">{errors.password.message}</p>}
            </motion.div>
          );
        })()}

        {/* Forgot password */}
        <div className="flex justify-end">
          <Link href="/forgot-password" className="text-xs text-white/50 hover:text-white transition-colors duration-200">
            Forgot password?
          </Link>
        </div>

        {/* Auth error */}
        {authError && (
          <p className="text-xs text-red-400 text-center bg-red-500/10 rounded-lg px-3 py-2">{authError}</p>
        )}

        {/* Sign in button */}
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
                  Sign In
                  <ArrowRight className="w-3.5 h-3.5 group-hover/button:translate-x-0.5 transition-transform duration-300" />
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </motion.button>

        {/* Divider */}
        <div className="flex items-center gap-3 pt-0.5">
          <div className="flex-1 border-t border-white/[0.08]" />
          <span className="text-[11px] text-white/30 tracking-wide uppercase">or</span>
          <div className="flex-1 border-t border-white/[0.08]" />
        </div>

        {/* Google sign-in — hidden real button + custom themed overlay */}
        <div className="relative">
          {/* Hidden GoogleLogin — handles actual OAuth credential flow */}
          <div
            ref={googleBtnRef}
            className="absolute opacity-0 pointer-events-none"
            style={{ width: 1, height: 1, overflow: "hidden" }}
          >
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setAuthError("Google sign-in failed. Please try again.")}
              useOneTap={false}
              text="signin_with"
              shape="rectangular"
              theme="filled_black"
              size="large"
              width="340"
            />
          </div>

          {/* Visible themed button */}
          <button
            type="button"
            disabled={isLoading}
            onClick={() => googleBtnRef.current?.querySelector<HTMLElement>("div[role=button], iframe")?.click()}
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
        </div>

        {/* Register link */}
        <p className="text-center text-xs text-white/40 pt-1">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-white/70 hover:text-white transition-colors duration-200 font-medium underline underline-offset-2 decoration-white/30 hover:decoration-white/70">
            Create one
          </Link>
        </p>
      </form>
    </AuthCard>
  );
}
