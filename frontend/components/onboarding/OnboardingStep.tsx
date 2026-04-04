/**
 * OnboardingStep
 *
 * Generic wrapper for one step inside the onboarding modal.
 * Renders a progress indicator, title, subtitle, body content,
 * and action buttons (Next / Skip / Get Started).
 */

interface OnboardingStepProps {
  /** 1-indexed current step number */
  currentStep: number;
  totalSteps: number;
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  /** Label on the primary action button (defaults to "Next") */
  nextLabel?: string;
  onNext: () => void;
  /** If provided, renders a "Skip" button to the left of the primary action */
  onSkip?: () => void;
  /** Disables the primary button (e.g., while saving) */
  loading?: boolean;
  /** Inline error displayed above buttons */
  error?: string | null;
}

export function OnboardingStep({
  currentStep,
  totalSteps,
  title,
  subtitle,
  children,
  nextLabel = "Next",
  onNext,
  onSkip,
  loading = false,
  error,
}: OnboardingStepProps) {
  return (
    <div className="flex flex-col gap-6">
      {/* Step dots */}
      <div className="flex items-center justify-center gap-2">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <span
            key={i}
            className={`block h-2 rounded-full transition-all duration-300 ${
              i < currentStep
                ? "w-6 bg-primary"
                : "w-2 bg-muted-foreground/30"
            }`}
          />
        ))}
      </div>

      {/* Title + subtitle */}
      <div className="text-center space-y-1">
        <h2 className="font-heading text-xl font-bold text-foreground">{title}</h2>
        {subtitle && (
          <p className="text-sm text-muted-foreground leading-relaxed">{subtitle}</p>
        )}
      </div>

      {/* Step body */}
      {children && <div className="w-full">{children}</div>}

      {/* Error */}
      {error && (
        <p className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2 text-center">
          {error}
        </p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3">
        {onSkip && (
          <button
            type="button"
            onClick={onSkip}
            disabled={loading}
            className="flex-1 h-10 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:bg-muted transition disabled:opacity-50"
          >
            Skip
          </button>
        )}
        <button
          type="button"
          onClick={onNext}
          disabled={loading}
          className="flex-1 h-10 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Saving…" : nextLabel}
        </button>
      </div>
    </div>
  );
}
