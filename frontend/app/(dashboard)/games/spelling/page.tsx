import { Metadata } from "next";
import dynamic from "next/dynamic";
import SpellingGameLoading from "./loading";

export const metadata: Metadata = {
  title: "Spelling Practice | BahasaBot",
  description: "Practice spelling your learned Malay vocabulary words.",
};

// Code-split SpellingGame — it's a large client component with Three.js-level
// dependencies (lucide icons, speech API hooks, react-query). Lazy loading it
// prevents blocking the sidebar navigation and lets loading.tsx show first.
const SpellingGame = dynamic(
  () => import("@/components/games/SpellingGame").then((m) => ({ default: m.SpellingGame })),
  { ssr: false, loading: () => <SpellingGameLoading /> }
);

export default function SpellingGamePage() {
  return (
    <div className="h-full">
      <SpellingGame />
    </div>
  );
}
