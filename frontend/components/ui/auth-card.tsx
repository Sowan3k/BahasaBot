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

import Image from "next/image";
import { ShaderAnimation } from "@/components/ui/shader-animation";

const FEATURES = [
  "Chat freely with an AI Malay tutor",
  "Generate custom courses on any topic",
  "Adaptive quizzes targeting your weak areas",
  "Track vocabulary, streaks & XP over time",
];

export function AuthCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-screen relative overflow-hidden flex">

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

          {/* Feature list */}
          <ul className="flex flex-col gap-4">
            {FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-3.5 text-white/55 text-[15px]">
                <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 shadow-[0_0_6px_1px_rgba(138,159,123,0.7)]" />
                {f}
              </li>
            ))}
          </ul>

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
