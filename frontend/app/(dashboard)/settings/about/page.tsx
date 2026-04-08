"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { GlowCard } from "@/components/ui/glow-card";

const APP_VERSION = "1.0.0";
const FYP_YEAR = "2025 / 2026";

export default function AboutPage() {
  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/settings"
          className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">About BahasaBot</h1>
          <p className="text-sm text-muted-foreground">Project information and credits</p>
        </div>
      </div>

      {/* App identity card */}
      <GlowCard className="bg-card p-6 flex flex-col items-center text-center gap-3">
        <Image
          src="/Logo new (1).svg"
          alt="BahasaBot"
          width={252}
          height={80}
          priority
          className="object-contain"
        />
        <div>
          <h2 className="font-heading text-xl font-bold text-foreground">BahasaBot</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Version {APP_VERSION}</p>
        </div>
        <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
          An AI-powered Bahasa Melayu learning platform for international students,
          featuring an adaptive chatbot tutor, dynamic course generation, and
          personalised quiz feedback.
        </p>
      </GlowCard>

      {/* Academic details */}
      <GlowCard className="bg-card divide-y divide-border overflow-hidden !rounded-xl">
        <Row label="Institution" value="Universiti Sains Malaysia (USM)" />
        <Row label="Programme" value="Final Year Project (FYP)" />
        <Row label="Academic Year" value={FYP_YEAR} />
        <Row label="Developer" value="Sowan" />
        <Row label="Supervisor" value="Dr. Tan Tien Ping" />
      </GlowCard>

      {/* Tech stack highlights */}
      <GlowCard className="bg-card p-5 space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Built with</h3>
        <div className="flex flex-wrap gap-2">
          {[
            "Next.js", "FastAPI", "LangChain", "Google Gemini",
            "PostgreSQL + pgvector", "Redis", "NextAuth.js",
            "Resend", "Tailwind CSS", "shadcn/ui",
          ].map((tech) => (
            <span
              key={tech}
              className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground"
            >
              {tech}
            </span>
          ))}
        </div>
      </GlowCard>

      {/* Footer note */}
      <p className="text-center text-xs text-muted-foreground">
        BahasaBot &copy; {new Date().getFullYear()} — FYP submission
      </p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-5 py-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground text-right">{value}</span>
    </div>
  );
}
