// Adaptive quiz results are shown inline on the quiz page after submission.
// This route redirects back there so deep-linked /results URLs still work.
import { redirect } from "next/navigation";

export default function AdaptiveQuizResultsRedirect() {
  redirect("/quiz/adaptive");
}
