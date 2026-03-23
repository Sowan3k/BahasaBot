"use client";

// Course generation modal
// Shows a topic input field with multi-step loading feedback during generation.
// Calls POST /api/courses/generate and redirects to the new course on success.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { coursesApi } from "@/lib/api";
import axios from "axios";

interface CourseGenerationModalProps {
  onClose: () => void;
}

// Steps shown to the user during generation so it doesn't feel like a black box
const GENERATION_STEPS = [
  "Validating your topic…",
  "Designing course structure…",
  "Generating lesson content…",
  "Saving your course…",
];

export function CourseGenerationModal({ onClose }: CourseGenerationModalProps) {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    if (!topic.trim() || topic.trim().length < 3) {
      setError("Please enter a topic with at least 3 characters.");
      return;
    }

    setError(null);
    setLoading(true);
    setStepIndex(0);

    // Cycle through visual steps while waiting for the API
    const stepInterval = setInterval(() => {
      setStepIndex((prev) => Math.min(prev + 1, GENERATION_STEPS.length - 1));
    }, 4000);

    try {
      const { data } = await coursesApi.generate(topic.trim());
      clearInterval(stepInterval);
      router.push(`/courses/${data.course_id}`);
      onClose();
    } catch (err: unknown) {
      clearInterval(stepInterval);
      if (axios.isAxiosError(err)) {
        const detail: string = err.response?.data?.detail ?? "";
        const status = err.response?.status;
        if (status === 422) {
          setError(detail || "Topic rejected. Please choose an appropriate educational topic.");
        } else if (status === 429) {
          setError("You've reached the course generation limit (5 per hour). Please try again later.");
        } else {
          // Shows the real error in development (backend returns it when APP_ENV=development)
          setError(detail || "Course generation failed. Please try again.");
        }
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !loading) {
      handleGenerate();
    }
  }

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-lg bg-background p-6 shadow-xl space-y-5">
        {/* Header */}
        <div>
          <h2 className="text-lg font-semibold">Generate New Course</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Enter any topic you want to learn to discuss in Bahasa Melayu.
          </p>
        </div>

        {/* Topic input */}
        <div className="space-y-1.5">
          <Label htmlFor="topic">Topic</Label>
          <Input
            id="topic"
            placeholder="e.g. ordering food at a restaurant"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            autoFocus
          />
          <p className="text-xs text-muted-foreground">
            Topics must be educational and appropriate for a language learning platform.
          </p>
        </div>

        {/* Loading steps */}
        {loading && (
          <div className="flex items-center gap-3 rounded-md bg-muted px-4 py-3 text-sm">
            <span className="animate-spin text-base">⏳</span>
            <span>{GENERATION_STEPS[stepIndex]}</span>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleGenerate} disabled={loading || topic.trim().length < 3}>
            {loading ? "Generating…" : "Generate Course"}
          </Button>
        </div>
      </div>
    </div>
  );
}
