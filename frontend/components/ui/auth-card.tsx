"use client";

/**
 * AuthCard — split-screen auth layout
 *
 * Desktop (lg+):
 *   LEFT  — transparent branding panel over ShaderAnimation background
 *   RIGHT — fixed-width glass form panel (460px)
 *
 * Mobile:
 *   Full-width glass panel + compact brand bar at top
 */

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, BookOpen, BrainCircuit, Map } from "lucide-react";
import { ShaderAnimation } from "@/components/ui/shader-animation";

const FEATURE_SLIDES = [
  {
    icon: MessageCircle,
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
    title: "AI Malay Tutor",
    description: "Chat freely in English or Malay — your tutor adapts to your proficiency level.",
  },
  {
    icon: BookOpen,
    color: "text-amber-400",
    bg: "bg-amber-400/10",
    title: "Custom Courses",
    description: "Type any topic and get a full structured course generated in seconds.",
  },
  {
    icon: BrainCircuit,
    color: "text-violet-400",
    bg: "bg-violet-400/10",
    title: "Adaptive Quizzes",
    description: "Quizzes that target your exact weak points and track your improvement over time.",
  },
  {
    icon: Map,
    color: "text-sky-400",
    bg: "bg-sky-400/10",
    title: "Learning Roadmap",
    description: "Set a deadline and get a personalised journey built around your goals.",
  },
];

export function AuthCard({ children }: { children: React.ReactNode }) {
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setSlide((i) => (i + 1) % FEATURE_SLIDES.length), 3500);
    return () => clearInterval(t);
  }, []);

  const current = FEATURE_SLIDES[slide];

  return (
    <div className="min-h-screen w-screen relative overflow-hidden flex">

      {/* ── Pricing link — top-right corner, visible on all auth pages ── */}
      <Link
        href="/pricing"
        className="absolute top-4 right-5 z-20 text-xs text-white/45 hover:text-white/80 transition-colors duration-200 tracking-wide"
      >
        Pricing
      </Link>

      {/* ── Full-screen shader background ── */}
      <div className="absolute inset-0">
        <ShaderAnimation />
      </div>

      {/* ── LEFT: Branding panel — desktop only ── */}
      <div className="hidden lg:flex flex-1 items-center justify-center relative z-10 p-16 select-none">
        {/* Subtle dark gradient so content stays readable against the shader */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-black/20 to-transparent pointer-events-none" />

        <div className="relative flex flex-col items-start gap-10 max-w-xs">

          {/* Icon + wordmark */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <div className="relative w-14 h-14 flex-shrink-0">
                <Image
                  src="/Logo new only box (1).svg"
                  alt="BahasaBot"
                  fill
                  sizes="56px"
                  priority
                  className="object-contain"
                />
              </div>
              <h1 className="text-5xl font-bold text-white tracking-tight leading-none">
                BahasaBot
              </h1>
            </div>
            <p className="text-white/40 text-lg leading-snug">
              Your personal Bahasa Melayu tutor
            </p>
          </div>

          {/* Feature slideshow */}
          <div className="flex flex-col gap-5 w-full">
            {/* Fixed-height container prevents layout shift between slides */}
            <div className="relative h-[110px] w-full">
              <AnimatePresence mode="wait">
                <motion.div
                  key={slide}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.32, ease: "easeOut" }}
                  className="absolute inset-0 flex flex-col gap-3"
                >
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${current.bg}`}>
                    <current.icon className={`w-5 h-5 ${current.color}`} />
                  </div>
                  <p className="text-white/85 font-semibold text-[17px] leading-snug">
                    {current.title}
                  </p>
                  <p className="text-white/40 text-sm leading-relaxed">
                    {current.description}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Dot indicator — clickable */}
            <div className="flex items-center gap-2">
              {FEATURE_SLIDES.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setSlide(i)}
                  aria-label={`Go to slide ${i + 1}`}
                  className={`h-1 rounded-full transition-all duration-300 ${
                    i === slide ? "w-6 bg-primary" : "w-1.5 bg-white/20 hover:bg-white/35"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Subtle tagline */}
          <p className="text-white/20 text-xs tracking-widest uppercase">
            BahasaBot · Final Year Project · USM
          </p>
        </div>
      </div>

      {/* ── RIGHT: Glass form panel ── */}
      <div
        className="relative z-10 w-full lg:w-[460px] flex-shrink-0 flex flex-col
                   lg:min-h-screen min-h-[100dvh] bg-black/60 backdrop-blur-xl
                   border-l border-white/[0.07] overflow-y-auto
                   lg:rounded-none sm:rounded-none"
      >
        {/* Mobile/tablet feature hint — hidden on desktop where the left panel shows */}
        <div className="lg:hidden px-6 sm:px-8 pt-6 pb-0">
          <div className="w-full max-w-[340px] mx-auto">
            <div className="flex items-center gap-2 h-8 overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={slide}
                  initial={{ opacity: 0, x: 14 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -14 }}
                  transition={{ duration: 0.28, ease: "easeOut" }}
                  className="flex items-center gap-2 min-w-0"
                >
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${current.bg}`}>
                    <current.icon className={`w-3.5 h-3.5 ${current.color}`} />
                  </div>
                  <span className="text-white/50 text-xs font-medium tracking-wide truncate">
                    {current.title}
                  </span>
                </motion.div>
              </AnimatePresence>
              {/* Compact dots */}
              <div className="flex items-center gap-1 ml-auto flex-shrink-0">
                {FEATURE_SLIDES.map((_, i) => (
                  <span
                    key={i}
                    className={`block h-1 rounded-full transition-all duration-300 ${
                      i === slide ? "w-4 bg-primary/70" : "w-1 bg-white/15"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Form — vertically centered in remaining space */}
        <div className="flex-1 flex flex-col justify-center px-6 sm:px-8 py-6 sm:py-10">
          <div className="w-full max-w-[340px] mx-auto">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
