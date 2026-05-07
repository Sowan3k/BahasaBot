"use client";

import { Check, X, Sparkles } from "lucide-react";
import { GlowCard } from "@/components/ui/glow-card";
import { type SubscriptionPlan } from "@/lib/subscription-plans";
import { cn } from "@/lib/utils";

interface PricingCardProps {
  plan: SubscriptionPlan;
  featured?: boolean;
  ctaLabel: string;
  onCtaClick: () => void;
}

function FeatureRow({ label, value }: { label: string; value: boolean | string | number }) {
  const isBool = typeof value === "boolean";
  return (
    <div className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      {isBool ? (
        value ? (
          <Check size={14} className="text-green-500 shrink-0" />
        ) : (
          <X size={14} className="text-muted-foreground/50 shrink-0" />
        )
      ) : (
        <span className="text-xs font-semibold text-foreground tabular-nums">{value}</span>
      )}
    </div>
  );
}

export function PricingCard({ plan, featured, ctaLabel, onCtaClick }: PricingCardProps) {
  return (
    <GlowCard
      outerClassName={cn(featured && "ring-2 ring-primary/40")}
      className={cn("bg-card flex flex-col h-full", featured && "bg-card")}
      spread={featured ? 60 : 40}
      proximity={featured ? 80 : 64}
    >
      <div className="flex flex-col h-full p-5 space-y-4">
        {/* Badge */}
        <div className="min-h-[24px] flex items-start">
          {plan.featuredLabel && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-primary/15 text-primary uppercase tracking-wide">
              <Sparkles size={10} />
              {plan.featuredLabel}
            </span>
          )}
        </div>

        {/* Plan name & tagline */}
        <div>
          <h3 className={cn("font-heading text-lg font-bold", plan.accentClass)}>{plan.name}</h3>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{plan.tagline}</p>
        </div>

        {/* Price */}
        <div className="flex items-end gap-1.5">
          {plan.priceRM === 0 ? (
            <span className="font-heading text-3xl font-bold text-foreground">Free</span>
          ) : (
            <>
              <span className="text-sm font-medium text-muted-foreground self-start mt-1.5">RM</span>
              <span className="font-heading text-3xl font-bold text-foreground">{plan.priceRM}</span>
            </>
          )}
          <span className="text-xs text-muted-foreground mb-1">/ {plan.period}</span>
        </div>

        {/* Features */}
        <div className="flex-1 space-y-0">
          <FeatureRow label="Chat messages" value={`${plan.chatLimitDaily}/day`} />
          <FeatureRow label="Course generation" value={`${plan.courseGenLimitDaily}/day`} />
          <FeatureRow label="Quiz attempts" value={plan.quizAttempts} />
          <FeatureRow label="Adaptive quiz" value={plan.adaptiveQuiz} />
          <FeatureRow label="Pronunciation audio" value={plan.pronunciationAudio} />
          <FeatureRow label="Chat history" value={plan.chatHistory} />
          <FeatureRow label="Learning roadmap" value={plan.learningRoadmap} />
        </div>

        {/* CTA */}
        <button
          onClick={onCtaClick}
          className={cn(
            "w-full py-2.5 rounded-xl text-sm font-semibold transition-all duration-200",
            featured
              ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md hover:shadow-lg"
              : "bg-muted text-foreground hover:bg-muted/80 border border-border"
          )}
        >
          {ctaLabel}
        </button>
      </div>
    </GlowCard>
  );
}
