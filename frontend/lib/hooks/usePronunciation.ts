"use client";

/**
 * usePronunciation
 *
 * Web Speech API hook for pronouncing Malay vocabulary words.
 * Uses the browser-native SpeechSynthesis API — zero cost, no external API.
 *
 * Voice selection fallback chain:
 *   1. ms-MY  (Malaysian Malay — preferred)
 *   2. ms     (generic Malay)
 *   3. default system voice (always available)
 *
 * Returns a `speak(word)` function and an `isSpeaking` boolean.
 */

import { useCallback, useEffect, useRef, useState } from "react";

interface UsePronunciationReturn {
  speak: (word: string) => void;
  isSpeaking: boolean;
  isSupported: boolean;
}

export function usePronunciation(): UsePronunciationReturn {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);

  // Detect browser support and pre-select the best available voice.
  // Voice list may load asynchronously on some browsers (Chrome), so we
  // listen for voiceschanged and re-run selection if needed.
  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    setIsSupported(true);

    function selectVoice() {
      const voices = window.speechSynthesis.getVoices();
      if (!voices.length) return; // not loaded yet — wait for voiceschanged

      // Priority 1: ms-MY (Malaysian Malay)
      const msMY = voices.find((v) => v.lang === "ms-MY");
      if (msMY) { voiceRef.current = msMY; return; }

      // Priority 2: any voice starting with "ms"
      const ms = voices.find((v) => v.lang.startsWith("ms"));
      if (ms) { voiceRef.current = ms; return; }

      // Priority 3: leave null → browser default (still works, just no Malay accent)
      voiceRef.current = null;
    }

    selectVoice();

    // Chrome loads voices asynchronously
    window.speechSynthesis.addEventListener("voiceschanged", selectVoice);
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", selectVoice);
    };
  }, []);

  const speak = useCallback((word: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis || !word.trim()) return;

    // Cancel any current utterance so clicking rapidly doesn't queue up
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(word.trim());

    // Apply the pre-selected voice if available
    if (voiceRef.current) {
      utterance.voice = voiceRef.current;
      utterance.lang = voiceRef.current.lang;
    } else {
      // Fallback: set lang hint even without a specific voice object
      utterance.lang = "ms-MY";
    }

    utterance.rate = 0.85;   // slightly slower than default — better for learners
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, []);

  return { speak, isSpeaking, isSupported };
}
