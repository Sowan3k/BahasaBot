"use client";

/**
 * AuthCard — split-screen auth layout
 *
 * Desktop (lg+):
 *   LEFT  — transparent branding panel over particle background
 *           → 3 illustrated feature mini-cards (FeaturesSection style)
 *   RIGHT — fixed-width glass form panel (460px)
 *
 * Mobile / tablet:
 *   Full-width glass panel + compact 2×2 feature pill grid at top
 */

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle,
  BookOpen,
  Target,
  Map,
  BrainCircuit,
  Flame,
  Award,
  Brain,
  Gamepad2,
  Volume2,
  CheckCircle2,
  Circle,
  Lock,
} from "lucide-react";
import { AetherFlowHero } from "@/components/ui/aether-flow-hero";
import { CourseShowcase } from "@/components/ui/course-showcase";


// ── Chat tutor illustration — rich multi-turn chat UI ────────────────────────
function ChatIllustration() {
  return (
    <div className="flex flex-col gap-2 h-full">
      {/* Chat thread — justify-end pins messages to bottom like a real chat */}
      <div className="flex-1 min-h-0 bg-black/25 rounded-xl p-3 flex flex-col justify-end gap-2 overflow-hidden">
        {/* User bubble */}
        <div className="flex justify-end">
          <div className="bg-white/10 rounded-2xl rounded-tr-sm px-3 py-1.5 text-[11px] text-white/65 max-w-[80%]">
            How do I say &ldquo;I&apos;m hungry&rdquo;?
          </div>
        </div>

        {/* AI response bubble */}
        <div className="flex items-end gap-2">
          <div className="w-5 h-5 rounded-full bg-primary/30 flex-shrink-0 flex items-center justify-center">
            <MessageCircle className="w-3 h-3 text-primary" />
          </div>
          <div className="bg-primary/10 border border-primary/20 rounded-2xl rounded-tl-sm px-3 py-2 text-[11px] text-white/60 max-w-[82%]">
            <p>Say <span className="text-primary font-semibold">Saya lapar</span>! Let&apos;s break it down:</p>
            {/* Vocab pill */}
            <div className="mt-1.5 flex items-center gap-1.5">
              <div className="flex items-center gap-1 bg-primary/15 border border-primary/25 rounded-full px-2 py-0.5">
                <span className="text-primary text-[10px] font-semibold">lapar</span>
                <span className="text-white/35 text-[10px]">= hungry</span>
                <Volume2 className="w-2.5 h-2.5 text-primary/60 ml-0.5" />
              </div>
            </div>
          </div>
        </div>

        {/* User follow-up */}
        <div className="flex justify-end">
          <div className="bg-white/10 rounded-2xl rounded-tr-sm px-3 py-1.5 text-[11px] text-white/65 max-w-[80%]">
            Saya lapar. Is that right?
          </div>
        </div>

        {/* AI grammar tip */}
        <div className="flex items-end gap-2">
          <div className="w-5 h-5 rounded-full bg-primary/30 flex-shrink-0 flex items-center justify-center">
            <MessageCircle className="w-3 h-3 text-primary" />
          </div>
          <div className="bg-primary/10 border border-primary/20 rounded-2xl rounded-tl-sm px-3 py-1.5 text-[11px] text-white/60 max-w-[82%]">
            <CheckCircle2 className="w-3 h-3 text-primary inline mr-1" />
            <span className="text-primary/80">Perfect!</span> Saya = I, lapar = hungry.
          </div>
        </div>
      </div>

      {/* Grammar tip bar */}
      <div className="flex-shrink-0 bg-accent/10 border border-accent/20 rounded-lg px-3 py-2.5 flex items-center gap-2">
        <div className="w-1 h-5 bg-accent/50 rounded-full flex-shrink-0" />
        <p className="text-[10px] text-white/50 leading-snug">
          <span className="text-accent/80 font-medium">Grammar tip:</span> Malay has no verb conjugation — Saya lapar works for any tense.
        </p>
      </div>
    </div>
  );
}

// ── Course module illustration — course card with progress ────────────────────
function CourseIllustration() {
  const modules = [
    { label: "Greetings & Introductions", classes: 3, done: true, progress: 100 },
    { label: "At the Market",             classes: 3, done: false, progress: 60 },
    { label: "Giving Directions",         classes: 3, done: false, progress: 0, locked: true },
  ];
  return (
    <div className="flex flex-col gap-2 h-full">
      {/* Course header card */}
      <div className="flex-shrink-0 bg-black/30 border border-white/[0.08] rounded-xl p-3 flex items-center gap-3">
        {/* Tiny SVG cover placeholder */}
        <div className="w-10 h-10 rounded-lg bg-accent/15 border border-accent/20 flex-shrink-0 flex items-center justify-center">
          <BookOpen className="w-5 h-5 text-accent/70" />
        </div>
        <div className="min-w-0">
          <p className="text-[12px] font-semibold text-white/85 truncate">Everyday Conversations</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[9px] text-accent/70 font-medium bg-accent/10 border border-accent/20 px-1.5 py-px rounded-full">BPS-2</span>
            <span className="text-[9px] text-white/35">9 classes · AI generated</span>
          </div>
        </div>
      </div>

      {/* Module list — flex-1 with justify-between spreads modules + footer */}
      <div className="flex-1 min-h-0 flex flex-col justify-between overflow-hidden">
        <div className="flex flex-col gap-1.5">
          {modules.map((m, i) => (
            <div key={i} className={`bg-black/20 border rounded-lg px-3 py-2 flex flex-col gap-1 ${m.locked ? "border-white/[0.05] opacity-50" : "border-white/[0.08]"}`}>
              <div className="flex items-center gap-2">
                {m.done
                  ? <CheckCircle2 className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                  : m.locked
                    ? <Lock className="w-3 h-3 text-white/25 flex-shrink-0" />
                    : <Circle className="w-3.5 h-3.5 text-white/25 flex-shrink-0" />
                }
                <span className={`text-[11px] truncate ${m.done ? "text-white/70" : m.locked ? "text-white/30" : "text-white/60"}`}>
                  Module {i + 1}: {m.label}
                </span>
              </div>
              {/* Progress bar */}
              {!m.locked && (
                <div className="flex items-center gap-2 pl-5">
                  <div className="flex-1 h-0.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${m.progress}%` }}
                    />
                  </div>
                  <span className="text-[9px] text-white/30 tabular-nums">{m.classes} cls</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Course stats footer */}
        <div className="flex items-center gap-3 bg-black/20 border border-white/[0.06] rounded-lg px-3 py-2 mt-1.5">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-primary/60" />
            <span className="text-[10px] text-white/40">12 vocab words</span>
          </div>
          <div className="w-px h-3 bg-white/10" />
          <div className="flex items-center gap-1.5">
            <BrainCircuit className="w-3 h-3 text-accent/50" />
            <span className="text-[10px] text-white/40">AI generated</span>
          </div>
          <div className="w-px h-3 bg-white/10" />
          <span className="text-[10px] text-primary/60 font-medium ml-auto">+30 XP</span>
        </div>
      </div>
    </div>
  );
}

// ── Progress / Quiz illustration — MCQ card with answer + score ───────────────
function ProgressIllustration() {
  const options = [
    { label: "Good morning", correct: false },
    { label: "How are you?", correct: true },
    { label: "Thank you",    correct: false },
    { label: "Goodbye",      correct: false },
  ];
  return (
    <div className="flex flex-col gap-2 h-full">
      {/* Question card */}
      <div className="flex-shrink-0 bg-black/25 border border-white/[0.08] rounded-xl p-3">
        <div className="flex items-center gap-1.5 mb-2">
          <span className="text-[9px] font-medium text-white/30 bg-white/5 px-1.5 py-0.5 rounded-full">Q3 of 10</span>
          <span className="text-[9px] text-white/25">· Adaptive Quiz</span>
        </div>
        <p className="text-[12px] font-medium text-white/80 leading-snug">
          What does <span className="text-primary font-semibold">&ldquo;Apa khabar?&rdquo;</span> mean?
        </p>
      </div>

      {/* Answer options — each option is flex-1 so they grow to fill the height evenly */}
      <div className="flex-1 min-h-0 flex flex-col gap-1.5 overflow-hidden">
        {options.map((opt, i) => (
          <div
            key={i}
            className={`flex-1 flex items-center gap-2.5 rounded-lg px-3 border text-[11px] ${
              opt.correct
                ? "bg-primary/15 border-primary/40 text-primary/90"
                : "bg-white/[0.03] border-white/[0.07] text-white/35"
            }`}
          >
            <div className={`w-4 h-4 rounded-full border flex-shrink-0 flex items-center justify-center ${
              opt.correct ? "border-primary bg-primary/25" : "border-white/20"
            }`}>
              {opt.correct && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
            </div>
            {opt.label}
            {opt.correct && <CheckCircle2 className="w-3 h-3 text-primary ml-auto flex-shrink-0" />}
          </div>
        ))}
      </div>

      {/* Score + XP row */}
      <div className="flex-shrink-0 flex items-center gap-2">
        <div className="flex items-center gap-1.5 bg-black/30 border border-white/[0.08] rounded-lg px-2.5 py-1.5 flex-1">
          <Flame className="w-3 h-3 text-orange-400 flex-shrink-0" />
          <span className="text-[10px] text-white/50">Score</span>
          <span className="text-[12px] font-bold text-white/80 tabular-nums ml-auto">85%</span>
        </div>
        <div className="flex items-center gap-1.5 bg-black/30 border border-white/[0.08] rounded-lg px-2.5 py-1.5">
          <span className="text-[10px] text-white/35">Level</span>
          <span className="text-[11px] font-bold text-accent tabular-nums">BPS-2</span>
        </div>
        <div className="bg-primary/15 border border-primary/30 rounded-lg px-2.5 py-1.5">
          <span className="text-[10px] font-semibold text-primary">+25 XP</span>
        </div>
      </div>
    </div>
  );
}

// ── Desktop feature cards data ────────────────────────────────────────────────
const FEATURE_CARDS = [
  {
    icon: MessageCircle,
    accent: "primary" as const,
    title: "AI Malay Tutor",
    description: "Chat in English or Bahasa Melayu and get instant vocabulary feedback, grammar tips, and natural conversation practice with your personal AI tutor.",
    Illustration: ChatIllustration,
  },
  {
    icon: BookOpen,
    accent: "accent" as const,
    title: "Course Generator",
    description: "Type any topic and get a full structured course: modules, classes, and vocabulary, generated in seconds and personalized to your BPS level.",
    Illustration: CourseIllustration,
  },
  {
    icon: Target,
    accent: "primary" as const,
    title: "Quizzes & Progress",
    description: "Adaptive quizzes target your weak points and track your BPS proficiency level as you improve through every session.",
    Illustration: ProgressIllustration,
  },
];

// ── Feature carousel — one card that cycles through all features ───────────────
function FeatureCarousel() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const t = setInterval(
      () => setCurrent((p) => (p + 1) % FEATURE_CARDS.length),
      3800,
    );
    return () => clearInterval(t);
  }, []);

  const card = FEATURE_CARDS[current];

  return (
    <div
      className="w-full h-full flex flex-col rounded-2xl p-6
                 bg-black/40 backdrop-blur-sm
                 border border-white/[0.12]
                 shadow-[0_0_50px_-10px_rgba(138,159,123,0.18),inset_0_1px_0_rgba(255,255,255,0.07)]"
    >
      {/* Flexible content area — fills remaining height, transitions don't shift layout */}
      <div className="flex-1 min-h-0 relative overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.32, ease: "easeOut" }}
            className="absolute inset-0 flex flex-col"
          >
            {/* Icon + title row */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  card.accent === "primary" ? "bg-primary/20" : "bg-accent/15"
                }`}
              >
                <card.icon
                  className={`w-5 h-5 ${
                    card.accent === "primary" ? "text-primary" : "text-accent"
                  }`}
                />
              </div>
              <p className="text-white/95 font-semibold text-[15px] leading-tight tracking-tight min-w-0">
                {card.title}
              </p>
            </div>

            {/* Description */}
            <p className="text-white/50 text-[12.5px] leading-relaxed mt-3 flex-shrink-0 line-clamp-3">
              {card.description}
            </p>

            {/* Illustration — grows to fill remaining space */}
            <div className="flex-1 min-h-0 mt-4 overflow-hidden">
              <card.Illustration />
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Dot navigation */}
      <div className="flex items-center justify-center gap-2.5 mt-5 flex-shrink-0">
        {FEATURE_CARDS.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`rounded-full transition-all duration-300 ${
              i === current
                ? "w-6 h-1.5 bg-primary shadow-[0_0_8px_rgba(138,159,123,0.6)]"
                : "w-1.5 h-1.5 bg-white/20 hover:bg-white/40"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

// ── AuthCard ──────────────────────────────────────────────────────────────────

export function AuthCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-[100dvh] w-screen relative overflow-hidden
                    flex items-center justify-center
                    lg:flex lg:items-stretch lg:justify-start lg:flex-row">

      {/* ── Pricing link ── */}
      <Link
        href="/pricing"
        className="absolute top-4 right-5 z-20 text-xs text-white/45 hover:text-white/80 transition-colors duration-200 tracking-wide"
      >
        Pricing
      </Link>

      {/* ── Full-screen particle background ── */}
      <div className="absolute inset-0">
        <AetherFlowHero />
      </div>

      {/* ── LEFT: Branding panel — desktop only ── */}
      <div className="hidden lg:flex flex-1 relative z-10 pl-10 pr-6 py-10 xl:pl-14 xl:pr-8 xl:py-14 select-none overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-black/10 pointer-events-none" />

        <div className="relative flex flex-row gap-6 xl:gap-10 w-full h-full">

          <div className="flex flex-col flex-1 min-w-0 h-full">

            <div className="flex items-center gap-5 flex-shrink-0">
              <div className="relative w-20 h-20 flex-shrink-0">
                <Image src="/Logo new only box (1).svg" alt="BahasaBot" fill sizes="80px" priority className="object-contain" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white leading-none">BahasaBot</h1>
                <p className="text-white/60 text-sm leading-snug mt-1.5">Your personal Bahasa Melayu tutor</p>
              </div>
            </div>

            <div className="mt-4 flex-shrink-0">
              <p className="text-white/85 text-[15px] font-medium leading-snug">
                Master Bahasa Melayu, one conversation at a time.
              </p>
              <p className="text-white/40 text-[12px] mt-1 leading-relaxed max-w-xs">
                AI chatbot, structured courses &amp; adaptive quizzes built for international students at USM.
              </p>
              <div className="flex items-center gap-6 mt-3">
                <div>
                  <div className="flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-primary opacity-80" />
                    <p className="text-primary font-bold text-base leading-none">4</p>
                  </div>
                  <p className="text-white/30 text-[10px] mt-0.5">BPS Levels</p>
                </div>
                <div className="w-px h-6 bg-white/10" />
                <div>
                  <div className="flex items-center gap-1.5">
                    <Brain className="w-3.5 h-3.5 text-primary opacity-80" />
                    <p className="text-primary font-bold text-base leading-none">2</p>
                  </div>
                  <p className="text-white/30 text-[10px] mt-0.5">Quiz Modes</p>
                </div>
                <div className="w-px h-6 bg-white/10" />
                <div>
                  <div className="flex items-center gap-1.5">
                    <Gamepad2 className="w-3.5 h-3.5 text-primary opacity-80" />
                    <p className="text-primary font-bold text-base leading-none">2</p>
                  </div>
                  <p className="text-white/30 text-[10px] mt-0.5">Mini-Games</p>
                </div>
              </div>
            </div>

            <div className="flex-1 mt-4 min-h-0 overflow-hidden">
              <CourseShowcase />
            </div>

            <p className="mt-3 flex-shrink-0 text-white/20 text-[10px] tracking-widest uppercase">
              BahasaBot · Final Year Project · USM
            </p>
          </div>

          <div className="w-[340px] flex-shrink-0 h-full">
            <FeatureCarousel />
          </div>

        </div>
      </div>

      {/* ── Glass form panel ──────────────────────────────────────────────────────
          Mobile:  centered floating card — particles visible all around it
          Desktop: full-height right sidebar — border-l divides from left panel    */}
      <div
        className="relative z-10
                   w-[calc(100%-2.5rem)] max-w-[380px] max-h-[90dvh]
                   lg:max-w-none lg:w-[460px] lg:max-h-none lg:h-full lg:flex-none
                   flex flex-col overflow-y-auto
                   bg-black/60 backdrop-blur-xl
                   rounded-2xl lg:rounded-none
                   border border-white/[0.09] lg:border-0 lg:border-l lg:border-white/[0.07]
                   shadow-[0_8px_40px_rgba(0,0,0,0.5)] lg:shadow-none"
      >
        <div className="flex-1 flex flex-col justify-center px-6 sm:px-8 py-8 lg:py-10">
          <div className="w-full max-w-[340px] mx-auto">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
