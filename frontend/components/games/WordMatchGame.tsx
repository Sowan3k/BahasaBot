"use client";

/**
 * WordMatchGame
 *
 * State machine:
 *   start → countdown → loading → ready → submitted → (next | summary)
 *                                        ↘ timeout  ↗
 *
 * Shows a Malay word; the user picks its English meaning from 4 MCQ buttons.
 * Tests vocabulary recognition (vs. Spelling which tests recall/production).
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Volume2, Zap, Trophy, RotateCcw, CheckCircle2, XCircle,
  BookOpen, Clock, Play, ChevronRight, X, Shuffle,
} from "lucide-react";
import { gamesApi } from "@/lib/api";
import type { GameDifficulty, WordMatchQuestion, WordMatchSubmitResponse, WordMatchPersonalBest } from "@/lib/types";
import { usePronunciation } from "@/lib/hooks/usePronunciation";
import { Button } from "@/components/ui/button";
import { DifficultySelector, DIFFICULTY_TIMER } from "@/components/games/DifficultySelector";

const SESSION_SIZE = 10;

const WORD_MATCH_XP: Record<GameDifficulty, number> = { easy: 1, medium: 1, hard: 2 };

function timerBarColor(secs: number, limit: number): string {
  const pct = secs / limit;
  if (pct > 0.5) return "bg-emerald-500";
  if (pct > 0.25) return "bg-yellow-500";
  return "bg-red-500";
}

// ── Session Summary ───────────────────────────────────────────────────────────

function SessionSummary({
  wordsCorrect, wordsAttempted, xpEarned, difficulty,
  masteredWords, reviewWords, personalBest, onPlayAgain,
}: {
  wordsCorrect: number; wordsAttempted: number; xpEarned: number;
  difficulty: GameDifficulty; masteredWords: string[]; reviewWords: string[];
  personalBest: WordMatchPersonalBest | null; onPlayAgain: () => void;
}) {
  const accuracy = wordsAttempted > 0 ? Math.round((wordsCorrect / wordsAttempted) * 100) : 0;
  const isPersonalBest = personalBest !== null && wordsCorrect > personalBest.best_correct;
  const diffLabel = { easy: "🌱 Easy", medium: "⚡ Medium", hard: "🔥 Hard" }[difficulty];

  return (
    <div className="flex flex-col items-center gap-5 py-6 px-4 w-full max-w-md mx-auto animate-in fade-in slide-in-from-bottom-4 duration-400">
      <div className="text-center">
        <div className="text-5xl mb-2">{accuracy >= 80 ? "🎉" : accuracy >= 60 ? "👍" : "💪"}</div>
        <h2 className="text-2xl font-bold">Session Complete!</h2>
        <div className="flex items-center justify-center gap-2 mt-1 flex-wrap">
          <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs font-medium">
            {diffLabel}
          </span>
          {isPersonalBest && (
            <span className="px-2 py-0.5 rounded-full bg-yellow-500 text-yellow-950 text-xs font-semibold">
              🏆 New Personal Best!
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 w-full">
        <div className="bg-card border rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-primary">{accuracy}%</div>
          <div className="text-xs text-muted-foreground mt-0.5">Accuracy</div>
        </div>
        <div className="bg-card border rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-emerald-500">+{xpEarned}</div>
          <div className="text-xs text-muted-foreground mt-0.5">XP Earned</div>
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

// ── Main component ────────────────────────────────────────────────────────────

export function WordMatchGame() {
  type Phase =
    | "start"
    | "countdown"
    | "loading"
    | "ready"
    | "submitted"
    | "timeout"
    | "summary"
    | "empty";

  // option button visual state
  type OptionState = "idle" | "correct" | "wrong" | "reveal";

  const [phase, setPhase] = useState<Phase>("start");
  const [difficulty, setDifficulty] = useState<GameDifficulty>("medium");
  const [question, setQuestion] = useState<WordMatchQuestion | null>(null);
  const [result, setResult] = useState<WordMatchSubmitResponse | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [optionStates, setOptionStates] = useState<OptionState[]>(["idle", "idle", "idle", "idle"]);

  const [countdownNum, setCountdownNum] = useState(3);
  const [timeLeft, setTimeLeft] = useState(DIFFICULTY_TIMER["medium"]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const difficultyRef = useRef<GameDifficulty>("medium");

  const [wordsAttempted, setWordsAttempted] = useState(0);
  const [wordsCorrect, setWordsCorrect]     = useState(0);
  const [xpEarned, setXpEarned]             = useState(0);
  const [masteredWords, setMasteredWords]   = useState<string[]>([]);
  const [reviewWords, setReviewWords]       = useState<string[]>([]);
  const [personalBest, setPersonalBest]     = useState<WordMatchPersonalBest | null>(null);
  const [isSubmitting, setIsSubmitting]     = useState(false);

  const { speak, isSupported } = usePronunciation();
  const timeLimit = DIFFICULTY_TIMER[difficulty];

  // ── Timer ─────────────────────────────────────────────────────────────────

  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  const startTimer = useCallback(() => {
    stopTimer();
    const limit = DIFFICULTY_TIMER[difficultyRef.current];
    setTimeLeft(limit);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) { clearInterval(timerRef.current!); timerRef.current = null; return 0; }
        return prev - 1;
      });
    }, 1000);
  }, [stopTimer]);

  useEffect(() => {
    if (timeLeft === 0 && phase === "ready") handleTimeout();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, phase]);

  useEffect(() => () => stopTimer(), [stopTimer]);

  useEffect(() => {
    gamesApi.getWordMatchBest().then((r) => setPersonalBest(r.data)).catch(() => {});
  }, []);

  // Auto-play audio when question is ready
  useEffect(() => {
    if (phase === "ready" && question && isSupported) {
      const t = setTimeout(() => speak(question.word), 200);
      return () => clearTimeout(t);
    }
  }, [phase, question, isSupported, speak]);

  // ── Countdown ────────────────────────────────────────────────────────────

  const startCountdown = useCallback(() => {
    difficultyRef.current = difficulty;
    setPhase("countdown");
    setCountdownNum(3);
    let count = 3;
    const tick = () => {
      count -= 1;
      if (count > 0) { setCountdownNum(count); setTimeout(tick, 700); }
      else { setPhase("loading"); fetchNextQuestion(); }
    };
    setTimeout(tick, 700);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [difficulty]);

  // ── Fetch question ────────────────────────────────────────────────────────

  const fetchNextQuestion = useCallback(async () => {
    setPhase("loading");
    setQuestion(null);
    setResult(null);
    setSelectedIndex(null);
    setOptionStates(["idle", "idle", "idle", "idle"]);
    stopTimer();

    try {
      const res = await gamesApi.getWordMatchQuestion();
      setQuestion(res.data);
      setPhase("ready");
      startTimer();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number } };
      if (axiosErr?.response?.status === 404) {
        setPhase("empty");
      } else {
        setTimeout(fetchNextQuestion, 2000);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startTimer, stopTimer]);

  // ── Timeout ───────────────────────────────────────────────────────────────

  const handleTimeout = useCallback(() => {
    stopTimer();
    setPhase("timeout");

    const newAttempted = wordsAttempted + 1;
    setWordsAttempted(newAttempted);

    if (question) {
      // Reveal correct answer in option buttons
      setOptionStates((prev) =>
        prev.map((_, i) => (i === question.correct_index ? "reveal" : "idle"))
      );
      setReviewWords((prev) =>
        prev.includes(question.word) ? prev : [...prev, question.word]
      );
    }

    if (newAttempted >= SESSION_SIZE) {
      gamesApi.endWordMatchSession(wordsCorrect, newAttempted).catch(() => {});
      setTimeout(() => setPhase("summary"), 1800);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stopTimer, wordsAttempted, wordsCorrect, question]);

  // ── Option selection (submits immediately) ────────────────────────────────

  const handleSelect = useCallback(async (idx: number) => {
    if (!question || isSubmitting || phase !== "ready") return;
    stopTimer();
    setIsSubmitting(true);
    setSelectedIndex(idx);

    try {
      const selectedMeaning = question.options[idx];
      const res = await gamesApi.submitWordMatchAnswer(
        question.id, selectedMeaning, difficultyRef.current
      );
      const evalResult = res.data;
      setResult(evalResult);
      setPhase("submitted");

      // Colour the buttons
      setOptionStates(question.options.map((_, i) => {
        if (i === question.correct_index) return "correct";
        if (i === idx && !evalResult.correct) return "wrong";
        return "idle";
      }));

      const newAttempted = wordsAttempted + 1;
      setWordsAttempted(newAttempted);

      if (evalResult.correct) {
        const newCorrect = wordsCorrect + 1;
        setWordsCorrect(newCorrect);
        setXpEarned((prev) => prev + evalResult.xp_awarded);
        setMasteredWords((prev) =>
          prev.includes(question.word) ? prev : [...prev, question.word]
        );
        // Play audio on correct
        if (isSupported) speak(question.word);
      } else {
        setReviewWords((prev) =>
          prev.includes(question.word) ? prev : [...prev, question.word]
        );
      }

      if (newAttempted >= SESSION_SIZE) {
        try {
          await gamesApi.endWordMatchSession(
            evalResult.correct ? wordsCorrect + 1 : wordsCorrect,
            newAttempted
          );
        } catch { /* non-blocking */ }
        setTimeout(() => setPhase("summary"), 1800);
      }
    } catch { /* allow retry */ } finally {
      setIsSubmitting(false);
    }
  }, [question, isSubmitting, phase, stopTimer, wordsAttempted, wordsCorrect, isSupported, speak]);

  // ── Reset ─────────────────────────────────────────────────────────────────

  const resetSession = useCallback(() => {
    stopTimer();
    setWordsAttempted(0);
    setWordsCorrect(0);
    setXpEarned(0);
    setMasteredWords([]);
    setReviewWords([]);
    setQuestion(null);
    setResult(null);
    setSelectedIndex(null);
    setOptionStates(["idle", "idle", "idle", "idle"]);
    setPhase("start");
  }, [stopTimer]);

  // ── Keyboard shortcut (Escape to exit) ───────────────────────────────────

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (phase === "start" && e.code === "Enter") { e.preventDefault(); startCountdown(); }
      if (e.code === "Escape") { resetSession(); }
      if ((phase === "submitted" || phase === "timeout") && e.code === "Enter") {
        e.preventDefault();
        if (wordsAttempted < SESSION_SIZE) fetchNextQuestion();
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [phase, startCountdown, resetSession, wordsAttempted, fetchNextQuestion]);

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER BRANCHES
  // ═══════════════════════════════════════════════════════════════════════════

  if (phase === "summary") {
    return (
      <SessionSummary
        wordsCorrect={wordsCorrect} wordsAttempted={wordsAttempted}
        xpEarned={xpEarned} difficulty={difficulty}
        masteredWords={masteredWords} reviewWords={reviewWords}
        personalBest={personalBest} onPlayAgain={resetSession}
      />
    );
  }

  if (phase === "empty") {
    return (
      <div className="flex flex-col items-center justify-center min-h-full gap-4 py-8 px-4 text-center max-w-sm mx-auto">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <BookOpen className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-lg font-semibold">Need more vocabulary</h3>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Word Match needs at least 4 vocabulary words to create a question with
          3 unique answer choices. Complete a course class or chat with the AI Tutor first!
        </p>
        <Button variant="outline" onClick={resetSession}>Check Again</Button>
      </div>
    );
  }

  // ── Start screen ──────────────────────────────────────────────────────────
  if (phase === "start") {
    return (
      <div className="min-h-full flex flex-col animate-in fade-in duration-300">
        <div className="flex-shrink-0 flex items-center gap-2 px-6 py-4">
          <Shuffle className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold">Word Match</span>
          <span className="text-muted-foreground text-sm hidden sm:inline">
            · Match the Malay word to its English meaning
          </span>
        </div>

        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-sm space-y-6">

            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/15 flex items-center justify-center ring-1 ring-primary/20">
                <Shuffle className="w-8 h-8 text-primary" />
              </div>
            </div>

            <div className="text-center">
              <h1 className="text-2xl font-bold mb-1">Match the meaning!</h1>
              <p className="text-sm text-muted-foreground">
                A Malay word is shown. Tap the correct English meaning before time runs out.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                { value: SESSION_SIZE,                       label: "words / round", color: "text-foreground" },
                { value: `${DIFFICULTY_TIMER[difficulty]}s`, label: "per word",      color: "text-yellow-500" },
                { value: "4",                                label: "options",        color: "text-primary" },
              ].map(({ value, label, color }) => (
                <div key={label} className="rounded-xl border bg-card py-3">
                  <div className={`text-xl font-bold ${color}`}>{value}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{label}</div>
                </div>
              ))}
            </div>

            <div>
              <p className="text-xs text-muted-foreground mb-2 font-medium">Select difficulty</p>
              <DifficultySelector
                value={difficulty}
                onChange={setDifficulty}
                xpTable={WORD_MATCH_XP}
              />
            </div>

            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2.5">
                <Volume2 className="w-4 h-4 text-primary flex-shrink-0" />
                <span>Audio plays on correct answers to reinforce pronunciation</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Zap className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                <span>Wrong answers get higher selection weight next round</span>
              </div>
            </div>

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

            <Button onClick={startCountdown} size="lg" className="w-full gap-2 text-base">
              <Play className="w-5 h-5" />
              Let&apos;s Go!
            </Button>

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
        <div className="w-full flex justify-start -mb-1">
          <button
            onClick={resetSession}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors px-2 py-1 rounded-lg hover:bg-muted"
          >
            <X className="w-3.5 h-3.5" /> Exit game
          </button>
        </div>
        <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
          <div className="h-full w-0 rounded-full bg-red-500" />
        </div>

        <div className="w-full bg-card border border-red-200 dark:border-red-800 rounded-2xl p-6 text-center shadow-sm">
          <Clock className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <h3 className="text-xl font-bold text-red-600 dark:text-red-400 mb-1">Time&apos;s Up!</h3>
          {question && (
            <>
              <p className="text-sm text-muted-foreground mb-1">The correct meaning of</p>
              <p className="text-2xl font-bold mb-1">{question.word}</p>
              <p className="text-sm text-muted-foreground">was:</p>
              <p className="mt-1 font-semibold text-foreground">{question.options[question.correct_index]}</p>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{wordsAttempted}/{SESSION_SIZE} words</span>
          <span>·</span>
          <span className="text-emerald-500 font-medium">{wordsCorrect} correct</span>
        </div>

        {wordsAttempted < SESSION_SIZE ? (
          <div className="w-full flex gap-3">
            <Button variant="outline" onClick={resetSession} className="flex-1">
              <RotateCcw className="w-4 h-4 mr-1.5" /> Start Over
            </Button>
            <Button onClick={fetchNextQuestion} className="flex-1">
              Next Word <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        ) : null}
        <p className="text-xs text-muted-foreground">Press Enter for next · Escape to start over</p>
      </div>
    );
  }

  // ── Main game (loading / ready / submitted) ────────────────────────────────
  const timerPct = (timeLeft / timeLimit) * 100;
  const isUrgent = timeLeft <= Math.ceil(timeLimit * 0.25);

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-md mx-auto px-4 py-4 md:py-6">

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

      <div className="w-full flex items-center justify-between text-sm">
        <div className="text-muted-foreground">
          <span className="font-semibold text-foreground">{wordsAttempted}/{SESSION_SIZE}</span> words
        </div>
        <div className="flex items-center gap-1">
          <Zap className="w-3.5 h-3.5 text-yellow-500" />
          <span className="font-medium">+{xpEarned} XP</span>
        </div>
      </div>

      <div className="w-full h-2.5 rounded-full bg-muted overflow-hidden">
        {phase === "ready" && (
          <div
            className={`h-full rounded-full transition-all duration-1000 ${timerBarColor(timeLeft, timeLimit)} ${isUrgent ? "animate-pulse" : ""}`}
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

      {phase === "ready" && (
        <div className={`-mt-3 text-right w-full pr-1 text-xs font-mono font-bold transition-colors ${
          isUrgent ? "text-red-500 animate-pulse" : timeLeft <= Math.ceil(timeLimit * 0.5) ? "text-yellow-500" : "text-muted-foreground"
        }`}>
          {timeLeft}s
        </div>
      )}

      {/* Word card */}
      <div className="w-full bg-card border rounded-2xl p-6 shadow-sm">
        {phase === "loading" ? (
          <div className="flex flex-col items-center gap-3 py-4 animate-pulse">
            <div className="h-10 w-40 bg-muted rounded-lg" />
            <div className="h-4 w-24 bg-muted rounded" />
          </div>
        ) : (
          <div className="text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-3">
              What does this mean?
            </p>
            <p className="text-4xl font-bold mb-1">{question?.word}</p>
            {question?.ipa && (
              <p className="text-sm font-mono text-muted-foreground">{question.ipa}</p>
            )}
            {question && isSupported && (
              <button
                onClick={() => speak(question.word)}
                className="mt-3 inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <Volume2 className="w-3.5 h-3.5" /> Hear pronunciation
              </button>
            )}
          </div>
        )}
      </div>

      {/* 4 option buttons — 2×2 grid */}
      {phase !== "loading" && question && (
        <div className="w-full grid grid-cols-2 gap-2.5">
          {question.options.map((opt, idx) => {
            const state = optionStates[idx];
            let cls =
              "w-full text-left px-4 py-3.5 rounded-xl border text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ";

            if (state === "correct") {
              cls += "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-400";
            } else if (state === "wrong") {
              cls += "bg-red-50 dark:bg-red-950/40 border-red-400 text-red-700 dark:text-red-300 ring-1 ring-red-400";
            } else if (state === "reveal") {
              cls += "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-400";
            } else if (phase === "submitted") {
              cls += "bg-muted/50 border-border text-muted-foreground opacity-60 cursor-default";
            } else {
              cls += "bg-card border-border hover:border-primary/50 hover:bg-primary/5 cursor-pointer active:scale-[0.98]";
            }

            return (
              <button
                key={idx}
                className={cls}
                onClick={() => phase === "ready" && handleSelect(idx)}
                disabled={phase !== "ready" || isSubmitting}
                aria-label={`Option ${idx + 1}: ${opt}`}
              >
                <span className="flex items-start gap-2">
                  <span className="shrink-0 mt-0.5">
                    {state === "correct" || state === "reveal"
                      ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      : state === "wrong"
                      ? <XCircle className="w-4 h-4 text-red-500" />
                      : <span className="inline-flex w-4 h-4 rounded-full border border-border items-center justify-center text-[10px] text-muted-foreground font-mono">{idx + 1}</span>}
                  </span>
                  <span className="leading-snug">{opt}</span>
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Post-answer navigation */}
      {phase === "submitted" && result && (
        <div className="w-full space-y-2">
          <div className={`text-sm font-medium text-center ${result.correct ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
            {result.correct
              ? `Correct! +${result.xp_awarded} XP`
              : `Incorrect — correct: "${result.correct_meaning}"`}
          </div>
          {wordsAttempted < SESSION_SIZE && (
            <Button onClick={fetchNextQuestion} className="w-full" variant="outline">
              Next Word <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          )}
          <p className="text-center text-xs text-muted-foreground">Press Enter for next · Escape to start over</p>
        </div>
      )}

      {personalBest && personalBest.best_correct > 0 && phase === "ready" && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Trophy className="w-3.5 h-3.5 text-yellow-500" />
          Personal best: {personalBest.best_correct}/{personalBest.best_attempted}
        </div>
      )}
    </div>
  );
}
