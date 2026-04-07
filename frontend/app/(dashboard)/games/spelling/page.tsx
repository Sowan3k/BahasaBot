import { Metadata } from "next";
import { SpellingGame } from "@/components/games/SpellingGame";

export const metadata: Metadata = {
  title: "Spelling Practice | BahasaBot",
  description: "Practice spelling your learned Malay vocabulary words.",
};

// The SpellingGame component owns all its own visual states (start, countdown,
// game, summary). The page is a transparent full-height shell so the game
// can centre itself properly without a disconnected header strip.
export default function SpellingGamePage() {
  return (
    <div className="h-full">
      <SpellingGame />
    </div>
  );
}
