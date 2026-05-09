"use client";

/**
 * Games Hub — /games
 *
 * Landing page showing two game cards. Clicking one renders the game
 * inline (no full-page navigation) so the sidebar stays visible and a
 * "← Back" button returns to the card selector instantly.
 */

import dynamic from "next/dynamic";
import { useState } from "react";
import { Keyboard, Shuffle, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

// Lazy-load both games so neither blocks the initial hub render.
const SpellingGame = dynamic(
  () => import("@/components/games/SpellingGame").then((m) => ({ default: m.SpellingGame })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    ),
  }
);

const WordMatchGame = dynamic(
  () => import("@/components/games/WordMatchGame").then((m) => ({ default: m.WordMatchGame })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    ),
  }
);

type ActiveGame = "spelling" | "word-match" | null;

interface GameCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  hint: string;
  onPlay: () => void;
}

function GameCard({ icon, title, description, hint, onPlay }: GameCardProps) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border bg-card p-6 shadow-sm hover:border-primary/30 transition-colors">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          {icon}
        </div>
        <div className="min-w-0">
          <h3 className="font-semibold text-base">{title}</h3>
          <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">{description}</p>
        </div>
      </div>
      <p className="text-xs text-muted-foreground italic border-l-2 border-primary/20 pl-3">{hint}</p>
      <Button onClick={onPlay} className="w-full mt-auto">
        Play
      </Button>
    </div>
  );
}

export default function GamesPage() {
  const [activeGame, setActiveGame] = useState<ActiveGame>(null);

  if (activeGame === "spelling") {
    return (
      <div className="h-full flex flex-col">
        <div className="flex-shrink-0 px-4 pt-3">
          <button
            onClick={() => setActiveGame(null)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-lg hover:bg-muted"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Games
          </button>
        </div>
        <div className="flex-1 min-h-0">
          <SpellingGame />
        </div>
      </div>
    );
  }

  if (activeGame === "word-match") {
    return (
      <div className="h-full flex flex-col">
        <div className="flex-shrink-0 px-4 pt-3">
          <button
            onClick={() => setActiveGame(null)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-lg hover:bg-muted"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Games
          </button>
        </div>
        <div className="flex-1 min-h-0">
          <WordMatchGame />
        </div>
      </div>
    );
  }

  // ── Hub — game selector ────────────────────────────────────────────────────
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Games</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Practice your Malay vocabulary through interactive games. Choose a game to start.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <GameCard
          icon={<Keyboard className="w-6 h-6 text-primary" />}
          title="Spelling Challenge"
          description="Hear a Malay word and type its correct spelling. Tests recall and production."
          hint="Easy: 20s · Medium: 10s · Hard: 5s per word"
          onPlay={() => setActiveGame("spelling")}
        />
        <GameCard
          icon={<Shuffle className="w-6 h-6 text-primary" />}
          title="Word Match"
          description="See a Malay word and pick its English meaning from 4 choices. Tests recognition."
          hint="Easy: 20s · Medium: 10s · Hard: 5s per question"
          onPlay={() => setActiveGame("word-match")}
        />
      </div>
    </div>
  );
}
