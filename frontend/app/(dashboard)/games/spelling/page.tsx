import { Metadata } from "next";
import { SpellingGame } from "@/components/games/SpellingGame";
import { BookOpen, Keyboard, Volume2, Zap } from "lucide-react";

export const metadata: Metadata = {
  title: "Spelling Practice | BahasaBot",
  description: "Practice spelling your learned Malay vocabulary words.",
};

export default function SpellingGamePage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Page header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-xl bg-primary/10">
            <BookOpen className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Spelling Practice</h1>
            <p className="text-muted-foreground text-sm">
              Test yourself on vocabulary you have already learned
            </p>
          </div>
        </div>

        {/* How-to guide (collapsed by default on mobile, always visible on desktop) */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 text-xs">
            <Volume2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
            <span>
              <span className="font-semibold block">Listen</span>
              Audio plays automatically. Press{" "}
              <kbd className="bg-background border rounded px-1 font-mono">Space</kbd> to
              replay.
            </span>
          </div>
          <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 text-xs">
            <Keyboard className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
            <span>
              <span className="font-semibold block">Type &amp; Submit</span>
              Type the Malay word and press{" "}
              <kbd className="bg-background border rounded px-1 font-mono">Enter</kbd> to
              check.
            </span>
          </div>
          <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 text-xs">
            <Zap className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
            <span>
              <span className="font-semibold block">Build Combos</span>
              Consecutive correct answers boost your combo multiplier up
              to ×2.
            </span>
          </div>
        </div>
      </div>

      {/* Game */}
      <SpellingGame />
    </div>
  );
}
