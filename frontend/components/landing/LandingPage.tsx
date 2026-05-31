"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { MessageCircle, ArrowRight } from "lucide-react";
import { AetherFlowHero } from "@/components/ui/aether-flow-hero";

// ── Chat card mockup ──────────────────────────────────────────────────────────
function ChatCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.55, delay: 0.35, ease: "easeOut" }}
      className="bg-white rounded-2xl shadow-2xl shadow-black/40 p-5 w-full max-w-[340px]"
    >
      {/* Card header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg bg-[#8a9f7b]/15 flex items-center justify-center flex-shrink-0">
          <MessageCircle className="w-4 h-4 text-[#8a9f7b]" />
        </div>
        <span className="font-semibold text-gray-800 text-sm">Chat tutor</span>
      </div>

      {/* User message */}
      <div className="flex justify-start mb-3">
        <div className="bg-gray-100 rounded-xl rounded-tl-sm px-3 py-2 text-sm text-gray-600 max-w-[90%]">
          How do I say &ldquo;where is the library?&rdquo;
        </div>
      </div>

      {/* Bot response */}
      <div className="flex justify-start">
        <div className="bg-gray-50 border border-gray-100 rounded-xl rounded-tl-sm px-3 py-2.5 text-sm text-gray-700 max-w-[95%] leading-relaxed">
          <span className="font-semibold text-[#5e7a4e]">&ldquo;Di mana perpustakaan?&rdquo;</span>
          {" · "}
          <span className="text-[#8a9f7b] font-medium">di mana</span>
          {" means “where”, "}
          <span className="text-[#8a9f7b] font-medium">perpustakaan</span>
          {" means “library”."}
        </div>
      </div>
    </motion.div>
  );
}

// ── Navbar ────────────────────────────────────────────────────────────────────
function Navbar() {
  return (
    <nav className="relative z-20 flex items-center justify-between px-6 md:px-12 py-4">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-3 flex-shrink-0">
        <div className="relative w-8 h-8 flex-shrink-0">
          <Image
            src="/Logo new only box (1).svg"
            alt="BahasaBot"
            fill
            sizes="32px"
            priority
            className="object-contain"
          />
        </div>
        <span className="font-bold text-white text-lg tracking-tight">BahasaBot</span>
      </Link>

      {/* Links — desktop */}
      <div className="hidden md:flex items-center gap-8">
        <Link
          href="/pricing"
          className="text-white/55 hover:text-white/90 text-sm transition-colors duration-200"
        >
          Pricing
        </Link>
        <Link
          href="/login"
          className="text-white/80 hover:text-white font-medium text-sm transition-colors duration-200"
        >
          Sign in
        </Link>
      </div>

      {/* CTA */}
      <Link
        href="/register"
        className="bg-[#8a9f7b] hover:bg-[#7d9170] text-white text-sm font-semibold
                   px-4 py-2 rounded-lg transition-colors duration-200 flex-shrink-0"
      >
        Get started
      </Link>
    </nav>
  );
}

// ── LandingPage ───────────────────────────────────────────────────────────────
export function LandingPage() {
  return (
    <div className="min-h-screen w-screen overflow-hidden relative flex flex-col dark">

      {/* Full-screen particle background */}
      <div className="absolute inset-0 z-0">
        <AetherFlowHero />
      </div>

      {/* Dark overlay for readability */}
      <div className="absolute inset-0 z-[1] bg-gradient-to-br from-black/50 via-black/30 to-black/20 pointer-events-none" />

      {/* Content layer */}
      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar />

        {/* Hero */}
        <main className="flex-1 flex items-center px-6 md:px-12 lg:px-20 pb-8">
          <div className="w-full flex flex-col lg:flex-row items-center gap-10 lg:gap-16 max-w-6xl mx-auto">

            {/* Left — text content */}
            <div className="flex-1 flex flex-col items-start">

              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.05 }}
                className="inline-flex items-center border border-[#8a9f7b]/50 bg-[#8a9f7b]/10
                           rounded-full px-3.5 py-1 mb-6"
              >
                <span className="text-[#8a9f7b] text-xs font-medium tracking-wide">
                  Built for international students at USM
                </span>
              </motion.div>

              {/* Heading */}
              <motion.h1
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.12 }}
                className="text-4xl sm:text-5xl lg:text-[3.25rem] font-bold text-white leading-[1.12] tracking-tight mb-5"
              >
                Learn Bahasa Melayu
                <br />
                with your own AI tutor
              </motion.h1>

              {/* Subtitle */}
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="text-white/55 text-base leading-relaxed max-w-md mb-8"
              >
                Generate a full course on any topic, chat with a tutor that explains
                in plain English, and lock it in with quizzes.
              </motion.p>

              {/* CTAs */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.28 }}
                className="flex flex-wrap items-center gap-3"
              >
                <Link
                  href="/register"
                  className="flex items-center gap-2 bg-[#8a9f7b] hover:bg-[#7d9170]
                             text-white font-semibold px-5 py-3 rounded-lg
                             transition-colors duration-200 text-sm"
                >
                  Start learning free
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/login"
                  className="text-white/70 hover:text-white font-medium px-5 py-3 rounded-lg
                             border border-white/15 hover:border-white/35
                             transition-colors duration-200 text-sm"
                >
                  Sign in
                </Link>
              </motion.div>
            </div>

            {/* Right — chat card */}
            <div className="flex-shrink-0 w-full lg:w-auto flex justify-center lg:justify-end">
              <ChatCard />
            </div>

          </div>
        </main>

        {/* Footer hint — mobile sign-in shortcut */}
        <div className="relative z-10 lg:hidden flex justify-center pb-6">
          <Link
            href="/pricing"
            className="text-white/30 hover:text-white/60 text-xs transition-colors duration-200 tracking-wide"
          >
            View pricing
          </Link>
        </div>
      </div>
    </div>
  );
}
