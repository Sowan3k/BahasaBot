"use client";

// Course generation modal — non-blocking (Phase 9)
// Submits the topic, receives a job_id immediately (HTTP 202), stores it in
// CourseGenerationContext, then closes. The floating CourseGenerationProgress
// card takes over tracking in the background.

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { coursesApi } from "@/lib/api";
import { useCourseGeneration } from "@/lib/course-generation-context";
import axios from "axios";

interface CourseGenerationModalProps {
  onClose: () => void;
}

export function CourseGenerationModal({ onClose }: CourseGenerationModalProps) {
  const { setActiveJobId } = useCourseGeneration();
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    if (!topic.trim() || topic.trim().length < 3) {
      setError("Please enter a topic with at least 3 characters.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const { data } = await coursesApi.generate(topic.trim());
      // Store the job_id — CourseGenerationProgress will poll from here
      setActiveJobId(data.job_id);
      onClose();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const detail: string = err.response?.data?.detail ?? "";
        const status = err.response?.status;
        if (status === 422) {
          setError(detail || "Topic rejected. Please choose an appropriate educational topic.");
        } else if (status === 429) {
          setError("You've reached the course generation limit (5 per hour). Please try again later.");
        } else {
          setError(detail || "Failed to start course generation. Please try again.");
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

        {/* Error */}
        {error && !loading && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        {/* Info: generation runs in background */}
        <p className="text-xs text-muted-foreground rounded-md bg-muted px-3 py-2">
          Generation runs in the background — you can freely navigate while it works.
          A progress card will appear in the bottom-right corner.
        </p>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleGenerate} disabled={loading || topic.trim().length < 3}>
            {loading ? "Starting…" : "Generate Course"}
          </Button>
        </div>
      </div>
    </div>
  );
}
