"use client";

/**
 * SpellingGame — v2
 *
 * Redesigned for challenge and engagement.
 *
 * State machine:
 *   start → countdown → loading → ready → submitted → (next | summary)
 *                                        ↘ timeout  ↗
 *
 * New in v2:
 *   - Start screen with personal best and "Let's Go!" CTA
 *   - 3-2-1 animated countdown before the game begins
 *   - 10-second per-word timer with shrinking progress bar
 *     (green → yellow → red as urgency increases)
 *   - Auto-submit as wrong on timeout → shows "Time's up!" with
 *     "Next Word →" and "Start Over" options
 *   - Keyboard: Enter = submit/advance, Space = replay audio, Escape = start over
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Volume2, Zap, Trophy, RotateCcw, CheckCircle2, XCircle,
  AlertCircle, Flame, BookOpen, Clock, Play, ChevronRight, X,
} from "lucide-react";
import { gamesApi } from "@/lib/api";
import type { SpellingWord, SpellingSubmitResponse, SpellingPersonalBest } from "@/lib/types";
import { usePronunciation } from "@/lib/hooks/usePronunciation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const SESSION_SIZE = 10;
const WORD_TIME_LIMIT = 10; // seconds per word

// ── Helpers ───────────────────────────────────────────────────────────────────

function getComboLabel(combo: number): string {
  if (combo >= 5) return "×2";
  if (combo >= 3) return "×1.5";
  return "×1";
}
function getComboColor(combo: number): string {
  if (combo >= 5) return "text-orange-500";
  if (combo >= 3) return "text-yellow-500";
  return "text-muted-foreground";
}

/** Bar colour based on remaining seconds */
function timerBarColor(secs: number): string {
  if (secs > 6) return "bg-emerald-500";
  if (secs > 3) return "bg-yellow-500";
  return "bg-red-500";
}

// ── Session Summary ───────────────────────────────────────────────────────────

function SessionSummary({
  wordsCorrect, wordsAttempted, xpEarned, peakCombo,
  masteredWords, reviewWords, personalBest, onPlayAgain,
}: {
  wordsCorrect: number; wordsAttempted: number; xpEarned: number;
  peakCombo: number; masteredWords: string[]; reviewWords: string[];
  personalBest: SpellingPersonalBest | null; onPlayAgain: () => void;
}) {
  const accuracy = wordsAttempted > 0 ? Math.round((wordsCorrect / wordsAttempted) * 100) : 0;
  const isPersonalBest = personalBest !== null && wordsCorrect > personalBest.best_correct;

  return (
    <div className="flex flex-col items-center gap-5 py-6 px-4 w-full max-w-md mx-auto animate-in fade-in slide-in-from-bottom-4 duration-400">
      <div className="text-center">
        <div className="text-5xl mb-2">{accuracy >= 80 ? "🎉" : accuracy >= 60 ? "👍" : "💪"}</div>
        <h2 className="text-2xl font-bold">Session Complete!</h2>
        {isPersonalBest && (
          <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-yellow-500 text-yellow-950 text-xs font-semibold">
            🏆 New Personal Best!
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3 w-full">
        <div className="bg-card border rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-primary">{accuracy}%</div>
          <div className="text-xs text-muted-foreground mt-0.5">Accuracy</div>
        </div>
        <div className="bg-card border rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-emerald-500">+{xpEarned}</div>
          <div className="text-xs text-muted-foreground mt-0.5">XP Earned</div>
        </div>
        <div className="bg-card border rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-orange-500">{peakCombo}</div>
          <div className="text-xs text-muted-foreground mt-0.5">Peak Combo</div>
        </div>
      </div>

      <div className="w-full">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-emerald-500 font-medium">{wordsCorrect} correct</span>
          <span className="text-muted-foreground">{wordsAttempted - wordsCorrect} incorrect / timed out</span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div className="h-full rounded-full bg-emerald-500 transition-all duration-700"
               style={{ width: `${accuracy}%` }} />
        </div>
      </div>

      {masteredWords.length > 0 && (
        <div className="w-full">
          <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-1.5">✓ Nailed it</p>
          <div className="flex flex-wrap gap-1.5">
            {masteredWords.map((w) => (
              <span key={w} className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded-md text-sm font-medium">{w}</span>
            ))}
          </div>
        </div>
      )}
      {reviewWords.length > 0 && (
        <div className="w-full">
          <p className="text-xs font-semibold text-orange-600 uppercase tracking-wide mb-1.5">↩ Needs more practice</p>
          <div className="flex flex-wrap gap-1.5">
            {reviewWords.map((w) => (
              <span key={w} className="px-2 py-0.5 bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-800 rounded-md text-sm font-medium">{w}</span>
            ))}
          </div>
        </div>
      )}

      {personalBest && personalBest.best_correct > 0 && (
        <p className="text-xs text-muted-foreground">
          All-time best: {personalBest.best_correct}/{personalBest.best_attempted} words
        </p>
      )}

      <Button onClick={onPlayAgain} className="w-full mt-2" size="lg">
        <RotateCcw className="w-4 h-4 mr-2" />Play Again
      </Button>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function SpellingGame() {
  type Phase =
    | "start"       // welcome screen
    | "countdown"   // 3-2-1 animation
    | "loading"     // fetching word from API
    | "ready"       // word shown, timer ticking
    | "submitted"   // answer evaluated, brief result shown
    | "timeout"     // timer hit 0 before user answered
    | "summary"     // session complete
    | "empty";      // no vocab in DB

  const [phase, setPhase] = useState<Phase>("start");
  const [currentWord, setCurrentWord] = useState<SpellingWord | null>(null);
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState<SpellingSubmitResponse | null>(null);

  // Countdown state (3 → 2 → 1 → Go!)
  const [countdownNum, setCountdownNum] = useState(3);

  // Per-word timer
  const [timeLeft, setTimeLeft] = useState(WORD_TIME_LIMIT);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Session stats
  const [wordsAttempted, setWordsAttempted] = useState(0);
  const [wordsCorrect, setWordsCorrect]     = useState(0);
  const [xpEarned, setXpEarned]             = useState(0);
  const [combo, setCombo]                   = useState(0);
  const [peakCombo, setPeakCombo]           = useState(0);
  const [masteredWords, setMasteredWords]   = useState<string[]>([]);
  const [reviewWords, setReviewWords]       = useState<string[]>([]);

  const [personalBest, setPersonalBest] = useState<SpellingPersonalBest | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const { speak, isSupported } = usePronunciation();

  // ── Timer control ─────────────────────────────────────────────────────────

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    stopTimer();
    setTimeLeft(WORD_TIME_LIMIT);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          timerRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [stopTimer]);

  // When timer hits 0 while in "ready" phase → auto-timeout
  useEffect(() => {
    if (timeLeft === 0 && phase === "ready") {
      handleTimeout();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, phase]);

  // Cleanup on unmount
  useEffect(() => () => stopTimer(), [stopTimer]);

  // ── Fetch personal best on mount ──────────────────────────────────────────

  useEffect(() => {
    gamesApi.getPersonalBest().then((r) => setPersonalBest(r.data)).catch(() => {});
  }, []);

  // ── Auto-play audio when word is ready ────────────────────────────────────

  useEffect(() => {
    if (phase === "ready" && currentWord && isSupported) {
      const t = setTimeout(() => speak(currentWord.word), 200);
      return () => clearTimeout(t);
    }
  }, [phase, currentWord, isSupported, speak]);

  // Auto-focus input when ready
  useEffect(() => {
    if (phase === "ready") {
      const t = setTimeout(() => inputRef.current?.focus(), 250);
      return () => clearTimeout(t);
    }
  }, [phase]);

  // ── Countdown ────────────────────────────────────────────────────────────

  const startCountdown = useCallback(() => {
    setPhase("countdown");
    setCountdownNum(3);

    let count = 3;
    const tick = () => {
      count -= 1;
      if (count > 0) {
        setCountdownNum(count);
        setTimeout(tick, 700);
      } else {
        // Countdown done — fetch first word
        setPhase("loading");
        fetchNextWord();
      }
    };
    setTimeout(tick, 700);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Fetch next word ──────────────────────────────────────────────────────

  const fetchNextWord = useCallback(async () => {
    setPhase("loading");
    setAnswer("");
    setResult(null);
    stopTimer();

    try {
      const res = await gamesApi.getSpellingWord();
      setCurrentWord(res.data);
      setPhase("ready");
      startTimer();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number } };
      if (axiosErr?.response?.status === 404) {
        setPhase("empty");
      } else {
        setTimeout(fetchNextWord, 2000);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startTimer, stopTimer]);

  // ── Timeout handler ──────────────────────────────────────────────────────

  const handleTimeout = useCallback(() => {
    stopTimer();
    setPhase("timeout");

    const newAttempted = wordsAttempted + 1;
    setWordsAttempted(newAttempted);
    setCombo(0);

    if (currentWord) {
      setReviewWords((prev) =>
        prev.includes(currentWord.word) ? prev : [...prev, currentWord.word]
      );
    }

    // Save session if this was the last word
    if (newAttempted >= SESSION_SIZE) {
      gamesApi.endSession(wordsCorrect, newAttempted).catch(() => {});
      setTimeout(() => setPhase("summary"), 1500);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stopTimer, wordsAttempted, wordsCorrect, currentWord]);

  // ── Submit handler ───────────────────────────────────────────────────────

  const handleSubmit = useCallback(async () => {
    if (!currentWord || !answer.trim() || isSubmitting || phase !== "ready") return;

    stopTimer();
    setIsSubmitting(true);

    try {
      const res = await gamesApi.submitSpellingAnswer(currentWord.id, answer.trim());
      const evalResult = res.data;

      setResult(evalResult);
      setPhase("submitted");

      const newAttempted = wordsAttempted + 1;
      setWordsAttempted(newAttempted);

      if (evalResult.correct) {
        const newCorrect = wordsCorrect + 1;
        setWordsCorrect(newCorrect);
        setXpEarned((prev) => prev + evalResult.xp_awarded);
        const newCombo = combo + 1;
        setCombo(newCombo);
        setPeakCombo((prev) => Math.max(prev, newCombo));
        setMasteredWords((prev) =>
          prev.includes(currentWord.word) ? prev : [...prev, currentWord.word]
        );
      } else {
        setCombo(0);
        if (!evalResult.almost) {
          setReviewWords((prev) =>
            prev.includes(currentWord.word) ? prev : [...prev, currentWord.word]
          );
        }
      }

      if (newAttempted >= SESSION_SIZE) {
        try {
          await gamesApi.endSession(
            evalResult.correct ? wordsCorrect + 1 : wordsCorrect,
            newAttempted
          );
        } catch { /* non-blocking */ }
        setTimeout(() => setPhase("summary"), 1800);
      }
    } catch { /* allow retry */ } finally {
      setIsSubmitting(false);
    }
  }, [currentWord, answer, isSubmitting, phase, stopTimer, wordsAttempted, wordsCorrect, combo]);

  // ── Reset / play again ───────────────────────────────────────────────────

  const resetSession = useCallback(() => {
    stopTimer();
    setWordsAttempted(0);
    setWordsCorrect(0);
    setXpEarned(0);
    setCombo(0);
    setPeakCombo(0);
    setMasteredWords([]);
    setReviewWords([]);
    setAnswer("");
    setResult(null);
    setCurrentWord(null);
    setPhase("start");
  }, [stopTimer]);

  // ── Keyboard shortcuts ───────────────────────────────────────────────────

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (phase === "start" && e.code === "Enter") {
        e.preventDefault();
        startCountdown();
      }
      if (phase === "ready") {
        if (e.code === "Space" && document.activeElement !== inputRef.current) {
          e.preventDefault();
          if (currentWord) speak(currentWord.word);
        }
        if (e.code === "Enter" && answer.trim()) {
          e.preventDefault();
          handleSubmit();
        }
      }
      if (e.code === "Escape") {
        resetSession();
      }
      if ((phase === "submitted" || phase === "timeout") && e.code === "Enter") {
        e.preventDefault();
        if (wordsAttempted < SESSION_SIZE) fetchNextWord();
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [phase, currentWord, answer, handleSubmit, fetchNextWord, speak, startCountdown, resetSession, wordsAttempted]);

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER BRANCHES
  // ═══════════════════════════════════════════════════════════════════════════

  // ── Summary ──────────────────────────────────────────────────────────────
  if (phase === "summary") {
    return (
      <SessionSummary
        wordsCorrect={wordsCorrect} wordsAttempted={wordsAttempted}
        xpEarned={xpEarned} peakCombo={peakCombo}
        masteredWords={masteredWords} reviewWords={reviewWords}
        personalBest={personalBest} onPlayAgain={resetSession}
      />
    );
  }

  // ── Empty vocab ───────────────────────────────────────────────────────────
  if (phase === "empty") {
    return (
      <div className="flex flex-col items-center justify-center min-h-full gap-4 py-8 px-4 text-center max-w-sm mx-auto">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <BookOpen className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-lg font-semibold">No vocabulary yet</h3>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Complete a course class or chat with the AI Tutor to build your
          vocabulary. Come back once you have learned your first word!
        </p>
        <Button variant="outline" onClick={resetSession}>Check Again</Button>
      </div>
    );
  }

  // ── Start screen — full-height game lobby ─────────────────────────────────
  if (phase === "start") {
    return (
      <div className="min-h-full flex flex-col animate-in fade-in duration-300">

        {/* ── Minimal page title ── */}
        <div className="flex-shrink-0 flex items-center gap-2 px-6 py-4">
          <BookOpen className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold">Spelling Practice</span>
          <span className="text-muted-foreground text-sm hidden sm:inline">
            · Test yourself on vocabulary you have already learned
          </span>
        </div>

        {/* ── Centred lobby content ── */}
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-sm space-y-6">

            {/* Icon */}
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/15 flex items-center justify-center ring-1 ring-primary/20">
                <Zap className="w-8 h-8 text-primary" />
              </div>
            </div>

            {/* Heading */}
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-1">Ready to be tested?</h1>
              <p className="text-sm text-muted-foreground">
                Listen to the word and type its correct Malay spelling.
              </p>
            </div>

            {/* Quick stats grid */}
            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                { value: SESSION_SIZE, label: "words / round",  color: "text-foreground" },
                { value: "10s",        label: "per word",        color: "text-yellow-500" },
                { value: "×2",         label: "max combo",       color: "text-orange-500" },
              ].map(({ value, label, color }) => (
                <div key={label} className="rounded-xl border bg-card py-3">
                  <div className={`text-xl font-bold ${color}`}>{value}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{label}</div>
                </div>
              ))}
            </div>

            {/* Rules — two compact rows */}
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2.5">
                <Volume2 className="w-4 h-4 text-primary flex-shrink-0" />
                <span>
                  Audio plays automatically —{" "}
                  <kbd className="px-1.5 py-0.5 rounded border bg-muted font-mono text-[11px] text-foreground">Space</kbd>{" "}
                  to replay
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <Flame className="w-4 h-4 text-orange-500 flex-shrink-0" />
                <span>Consecutive correct answers build your combo multiplier</span>
              </div>
            </div>

            {/* Personal best */}
            {personalBest && personalBest.best_correct > 0 ? (
              <div className="flex items-center justify-center gap-2 py-2 rounded-xl bg-yellow-500/8 border border-yellow-500/20">
                <Trophy className="w-4 h-4 text-yellow-500" />
                <span className="text-sm text-muted-foreground">
                  Personal best:{" "}
                  <span className="font-semibold text-foreground">
                    {personalBest.best_correct}/{personalBest.best_attempted}
                  </span>{" "}
                  correct
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2 py-2 rounded-xl bg-muted/50 border border-border">
                <Trophy className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">No record yet — set your first score!</span>
              </div>
            )}

            {/* CTA */}
            <Button onClick={startCountdown} size="lg" className="w-full gap-2 text-base">
              <Play className="w-5 h-5" />
              Let&apos;s Go!
            </Button>

            {/* Keyboard hints */}
            <p className="text-center text-xs text-muted-foreground">
              <kbd className="px-1.5 py-0.5 rounded border bg-muted font-mono text-[11px] text-foreground">Enter</kbd> to start ·{" "}
              <kbd className="px-1.5 py-0.5 rounded border bg-muted font-mono text-[11px] text-foreground">Esc</kbd> to return here anytime
            </p>

          </div>
        </div>
      </div>
    );
  }

  // ── 3-2-1 Countdown ──────────────────────────────────────────────────────
  if (phase === "countdown") {
    return (
      <div className="flex flex-col min-h-full animate-in fade-in duration-200">
        <div className="flex justify-start px-4 pt-3">
          <button
            onClick={resetSession}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors px-2 py-1 rounded-lg hover:bg-muted"
          >
            <X className="w-3.5 h-3.5" /> Exit
          </button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-4 py-8">
          <p className="text-muted-foreground text-sm uppercase tracking-widest">Get ready…</p>
          <div
            key={countdownNum}
            className="text-8xl font-black text-primary animate-in zoom-in-50 duration-200"
          >
            {countdownNum}
          </div>
        </div>
      </div>
    );
  }

  // ── Timeout screen ────────────────────────────────────────────────────────
  if (phase === "timeout") {
    return (
      <div className="flex flex-col items-center gap-4 w-full max-w-md mx-auto px-4 py-4 animate-in fade-in duration-200">
        {/* Exit button */}
        <div className="w-full flex justify-start -mb-1">
          <button
            onClick={resetSession}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors px-2 py-1 rounded-lg hover:bg-muted"
          >
            <X className="w-3.5 h-3.5" /> Exit game
          </button>
        </div>
        {/* Timer bar — fully depleted */}
        <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
          <div className="h-full w-0 rounded-full bg-red-500" />
        </div>

        <div className="w-full bg-card border border-red-200 dark:border-red-800 rounded-2xl p-6 text-center shadow-sm">
          <Clock className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <h3 className="text-xl font-bold text-red-600 dark:text-red-400 mb-1">Time&apos;s Up!</h3>
          {currentWord && (
            <>
              <p className="text-sm text-muted-foreground mb-2">The correct spelling was:</p>
              <p className="text-2xl font-bold mb-1">{currentWord.word}</p>
              {currentWord.ipa && (
                <p className="text-sm font-mono text-muted-foreground">{currentWord.ipa}</p>
              )}
              <button
                onClick={() => speak(currentWord.word)}
                className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <Volume2 className="w-3.5 h-3.5" /> Hear pronunciation
              </button>
            </>
          )}
        </div>

        {/* Progress reminder */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{wordsAttempted}/{SESSION_SIZE} words</span>
          <span>·</span>
          <span className="text-emerald-500 font-medium">{wordsCorrect} correct</span>
        </div>

        {/* Actions */}
        {wordsAttempted < SESSION_SIZE ? (
          <div className="w-full flex gap-3">
            <Button variant="outline" onClick={resetSession} className="flex-1">
              <RotateCcw className="w-4 h-4 mr-1.5" /> Start Over
            </Button>
            <Button onClick={fetchNextWord} className="flex-1">
              Next Word <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        ) : null}
        <p className="text-xs text-muted-foreground">Press Enter for next · Escape to start over</p>
      </div>
    );
  }

  // ── Main game (loading / ready / submitted) ────────────────────────────────
  const timerPct = (timeLeft / WORD_TIME_LIMIT) * 100;
  const isUrgent = timeLeft <= 3;

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-md mx-auto px-4 py-4 md:py-6">

      {/* Exit bar */}
      <div className="w-full flex items-center justify-between">
        <button
          onClick={resetSession}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors px-2 py-1 rounded-lg hover:bg-muted"
          title="Exit game — stats will not be saved"
        >
          <X className="w-3.5 h-3.5" /> Exit game
        </button>
        <span className="text-[10px] text-muted-foreground/60">stats saved only on completion</span>
      </div>

      {/* Session header */}
      <div className="w-full flex items-center justify-between text-sm">
        <div className="text-muted-foreground">
          <span className="font-semibold text-foreground">{wordsAttempted}/{SESSION_SIZE}</span> words
        </div>
        <div className={`flex items-center gap-1 font-semibold ${getComboColor(combo)}`}>
          <Flame className="w-4 h-4" />
          {combo > 0
            ? <span>{combo} combo {getComboLabel(combo)}</span>
            : <span className="font-normal text-muted-foreground">No combo</span>}
        </div>
        <div className="flex items-center gap-1">
          <Zap className="w-3.5 h-3.5 text-yellow-500" />
          <span className="font-medium">+{xpEarned} XP</span>
        </div>
      </div>

      {/* Timer bar */}
      <div className="w-full h-2.5 rounded-full bg-muted overflow-hidden">
        {phase === "ready" && (
          <div
            className={`h-full rounded-full transition-all duration-1000 ${timerBarColor(timeLeft)} ${isUrgent ? "animate-pulse" : ""}`}
            style={{ width: `${timerPct}%` }}
          />
        )}
        {phase === "submitted" && (
          <div className="h-full rounded-full bg-primary w-full opacity-30" />
        )}
        {phase === "loading" && (
          <div className="h-full w-1/2 rounded-full bg-muted-foreground/30 animate-pulse" />
        )}
      </div>

      {/* Timer countdown number */}
      {phase === "ready" && (
        <div className={`-mt-3 text-right w-full pr-1 text-xs font-mono font-bold transition-colors ${
          isUrgent ? "text-red-500 animate-pulse" : timeLeft <= 6 ? "text-yellow-500" : "text-muted-foreground"
        }`}>
          {timeLeft}s
        </div>
      )}

      {/* Word card */}
      <div className="w-full bg-card border rounded-2xl p-6 shadow-sm">
        {phase === "loading" ? (
          <div className="flex flex-col items-center gap-3 py-6 animate-pulse">
            <div className="h-8 w-32 bg-muted rounded-lg" />
            <div className="h-4 w-48 bg-muted rounded" />
          </div>
        ) : (
          <>
            <p className="text-xs text-muted-foreground uppercase tracking-widest text-center mb-4">
              Spell this word
            </p>

            {/* Replay button */}
            <div className="flex justify-center mb-4">
              <button
                onClick={() => currentWord && speak(currentWord.word)}
                disabled={!isSupported}
                className="group flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors disabled:opacity-40"
                title="Replay (Space)"
              >
                <Volume2 className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
                <span className="text-sm text-primary font-medium">Hear the word</span>
              </button>
            </div>

            {/* IPA */}
            {currentWord?.ipa && (
              <p className="text-center text-sm text-muted-foreground mb-4 font-mono">
                {currentWord.ipa}
              </p>
            )}

            {/* Result feedback */}
            {phase === "submitted" && result && (
              <div className={`flex items-start gap-3 p-3 rounded-xl mb-2 border ${
                result.correct
                  ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800"
                  : result.almost
                  ? "bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800"
                  : "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800"
              }`}>
                {result.correct
                  ? <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  : result.almost
                  ? <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                  : <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />}
                <div className="min-w-0">
                  {result.correct ? (
                    <p className="text-emerald-700 dark:text-emerald-400 font-semibold text-sm">
                      Correct! +{result.xp_awarded} XP
                      {combo >= 3 && <span className="ml-1 text-orange-500">🔥 {combo} combo!</span>}
                    </p>
                  ) : result.almost ? (
                    <>
                      <p className="text-yellow-700 dark:text-yellow-400 font-semibold text-sm">Almost! Correct spelling:</p>
                      <p className="text-yellow-800 dark:text-yellow-300 font-bold mt-0.5">
                        {result.correct_word}
                        {result.ipa && <span className="font-normal font-mono text-xs ml-1 opacity-70">{result.ipa}</span>}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-red-700 dark:text-red-400 font-semibold text-sm">Incorrect — correct spelling:</p>
                      <p className="text-red-800 dark:text-red-300 font-bold mt-0.5">
                        {result.correct_word}
                        {result.ipa && <span className="font-normal font-mono text-xs ml-1 opacity-70">{result.ipa}</span>}
                      </p>
                      <p className="text-xs text-red-600 dark:text-red-400 mt-1 opacity-80 line-clamp-2">{result.meaning}</p>
                    </>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Input + buttons */}
      {phase !== "loading" && (
        <div className="w-full flex flex-col gap-2">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder={phase === "submitted" ? "" : "Type the Malay word…"}
              disabled={phase === "submitted" || isSubmitting}
              className="flex-1 text-base h-11"
              autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false}
            />
            {phase === "ready" ? (
              <Button onClick={handleSubmit} disabled={!answer.trim() || isSubmitting} className="h-11 px-5">
                Check
              </Button>
            ) : (
              wordsAttempted < SESSION_SIZE && (
                <Button onClick={fetchNextWord} variant="outline" className="h-11 px-4">
                  Next <ChevronRight className="w-4 h-4 ml-0.5" />
                </Button>
              )
            )}
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{phase === "ready" ? "Enter to submit · Space to replay" : "Enter for next · Escape to start over"}</span>
            {phase === "ready" && (
              <button onClick={resetSession} className="hover:text-foreground transition-colors">
                Start Over
              </button>
            )}
          </div>
        </div>
      )}

      {/* Personal best footer */}
      {personalBest && personalBest.best_correct > 0 && phase === "ready" && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Trophy className="w-3.5 h-3.5 text-yellow-500" />
          Personal best: {personalBest.best_correct}/{personalBest.best_attempted}
        </div>
      )}
    </div>
  );
}
