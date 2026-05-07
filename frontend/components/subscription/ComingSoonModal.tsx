"use client";

import { X, Rocket } from "lucide-react";
import { useEffect } from "react";

interface ComingSoonModalProps {
  open: boolean;
  onClose: () => void;
}

export function ComingSoonModal({ open, onClose }: ComingSoonModalProps) {
  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Card */}
      <div className="relative z-10 bg-card border border-border rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-5">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="Close"
        >
          <X size={16} />
        </button>

        {/* Icon */}
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Rocket size={28} className="text-primary" />
          </div>
        </div>

        {/* Heading */}
        <div className="text-center space-y-2">
          <h2 className="font-heading text-xl font-bold text-foreground">
            Payment integration launching soon!
          </h2>
        </div>

        {/* Body */}
        <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
          <p>
            We&apos;re currently finalizing our payment gateway setup with Stripe. The pricing
            model and features above are locked and ready — payment processing will be live
            shortly after launch.
          </p>
          <p>
            Until then, <strong className="text-foreground">all BahasaBot features are available
            free of charge</strong>. Thank you for your patience!
          </p>
        </div>

        {/* What's coming */}
        <div className="bg-muted/40 rounded-xl p-4 space-y-2">
          <p className="text-xs font-semibold text-foreground uppercase tracking-wide">Coming soon</p>
          <ul className="space-y-1.5 text-xs text-muted-foreground">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
              Stripe card-on-file checkout
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
              7-day free trial with auto-charge
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
              FPX (Malaysian bank transfer) via ToyyibPay
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
              Cancel anytime — no hidden fees
            </li>
          </ul>
        </div>

        {/* Dismiss */}
        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Got it, thanks!
        </button>
      </div>
    </div>
  );
}
