"use client";

/**
 * SpeakerButton
 *
 * Reusable button that pronounces a Malay word using the Web Speech API.
 * Uses the usePronunciation hook — no external API, fully browser-native.
 *
 * Props:
 *   word      — the Malay word to pronounce
 *   size      — "sm" (default) | "xs" — controls icon size
 *   className — optional extra classes
 */

import { Volume2 } from "lucide-react";
import { usePronunciation } from "@/lib/hooks/usePronunciation";

interface SpeakerButtonProps {
  word: string;
  size?: "xs" | "sm";
  className?: string;
}

export function SpeakerButton({ word, size = "sm", className = "" }: SpeakerButtonProps) {
  const { speak, isSupported } = usePronunciation();

  // Don't render anything if the browser has no speech support
  if (!isSupported) return null;

  const iconSize = size === "xs" ? 12 : 14;

  return (
    <button
      type="button"
      title={`Pronounce "${word}"`}
      aria-label={`Pronounce ${word}`}
      onClick={(e) => {
        e.stopPropagation(); // don't trigger parent card/row clicks
        speak(word);
      }}
      className={`inline-flex items-center justify-center flex-shrink-0
        rounded p-0.5 transition-colors
        text-muted-foreground/60 hover:text-primary hover:bg-primary/10
        active:scale-95 ${className}`}
    >
      <Volume2 size={iconSize} />
    </button>
  );
}
