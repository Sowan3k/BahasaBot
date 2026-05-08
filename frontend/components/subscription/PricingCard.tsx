"use client";

import { Check, X, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { type SubscriptionPlan } from "@/lib/subscription-plans";
import { GlassCard } from "@/components/ui/animated-glassy-pricing";
import { RippleButton } from "@/components/ui/multi-type-ripple-buttons";

interface PricingCardProps {
  plan: SubscriptionPlan;
  featured?: boolean;
  ctaLabel: string;
  onCtaClick: () => void;
}

function FeatureRow({ label, value }: { label: string; value: boolean | string | number }) {
  const isBool = typeof value === "boolean";
  return (
    <div className="flex items-center justify-between py-2 border-b border-black/10 dark:border-white/8 last:border-0">
      <span className="text-xs text-foreground/60">{label}</span>
      {isBool ? (
        value ? (
          <Check size={14} className="text-primary shrink-0" />
        ) : (
          <X size={14} className="text-foreground/30 shrink-0" />
        )
      ) : (
        <span className="text-xs font-semibold text-foreground tabular-nums">{value}</span>
      )}
    </div>
  );
}

export function PricingCard({ plan, featured, ctaLabel, onCtaClick }: PricingCardProps) {
  return (
    <GlassCard
      featured={featured}
      className={cn(
        "relative flex flex-col h-full",
        featured && "scale-[1.02]"
      )}
    >
      <div className="flex flex-col h-full px-6 pt-6 pb-5 space-y-4">

        {/* Badge row */}
        <div className="min-h-[24px] flex items-start">
          {plan.featuredLabel && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-primary/15 text-primary uppercase tracking-wide">
              <Sparkles size={10} />
              {plan.featuredLabel}
            </span>
          )}
        </div>

        {/* Plan name */}
        <div>
          <h3 className={cn("font-heading text-[28px] font-extralight tracking-[-0.02em]", plan.accentClass)}>
            {plan.name}
          </h3>
          <p className="text-xs text-foreground/60 mt-1 leading-relaxed">{plan.tagline}</p>
        </div>

        {/* Price */}
        <div className="flex items-end gap-1.5 pb-1">
          {plan.priceRM === 0 ? (
            <span className="font-heading text-4xl font-extralight text-foreground tracking-tight">Free</span>
          ) : (
            <>
              <span className="text-sm font-medium text-foreground/50 self-start mt-2">RM</span>
              <span className="font-heading text-4xl font-extralight text-foreground tracking-tight">{plan.priceRM}</span>
            </>
          )}
          <span className="text-xs text-foreground/50 mb-1.5">/ {plan.period}</span>
        </div>

        {/* Divider */}
        <div className="w-full h-px bg-gradient-to-r from-transparent via-black/10 to-transparent dark:via-white/15" />

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
        <RippleButton
          onClick={onCtaClick}
          className={cn(
            "w-full py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 border-0",
            featured
              ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md"
              : "bg-black/8 text-foreground hover:bg-black/15 border border-black/12 dark:bg-white/8 dark:hover:bg-white/15 dark:border-white/12"
          )}
        >
          {ctaLabel}
        </RippleButton>
      </div>
    </GlassCard>
  );
}
