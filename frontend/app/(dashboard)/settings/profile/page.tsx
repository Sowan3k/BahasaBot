"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Save, User } from "lucide-react";
import Link from "next/link";
import axios from "axios";

import { profileApi } from "@/lib/api";
import type { UserProfile } from "@/lib/types";

// ── Zod schema ──────────────────────────────────────────────────────────────

const profileSchema = z.object({
  name: z.string().min(1, "Name cannot be empty").max(255).trim(),
  native_language: z.string().max(100).optional().or(z.literal("")),
  learning_goal: z.string().max(500).optional().or(z.literal("")),
});

type ProfileForm = z.infer<typeof profileSchema>;

// ── Native language options ─────────────────────────────────────────────────

const LANGUAGE_OPTIONS = [
  "English", "Mandarin Chinese", "Arabic", "Hindi", "Spanish",
  "French", "Bengali", "Portuguese", "Russian", "Japanese",
  "German", "Korean", "Indonesian", "Thai", "Vietnamese",
  "Tamil", "Urdu", "Turkish", "Italian", "Polish",
  "Other",
];

const GOAL_OPTIONS = [
  "Survival Malay (basic daily communication)",
  "Conversational Malay (confident everyday use)",
  "Academic Malay (university / formal settings)",
  "Business Malay (professional environment)",
  "Just curious / exploring",
];

// ── Page ─────────────────────────────────────────────────────────────────────

export default function ProfileSettingsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileForm>({ resolver: zodResolver(profileSchema) });

  // Load profile on mount
  useEffect(() => {
    profileApi
      .getProfile()
      .then((res) => {
        setProfile(res.data);
        reset({
          name: res.data.name,
          native_language: res.data.native_language ?? "",
          learning_goal: res.data.learning_goal ?? "",
        });
      })
      .catch(() => setSaveError("Failed to load profile. Please refresh."))
      .finally(() => setLoading(false));
  }, [reset]);

  async function onSubmit(data: ProfileForm) {
    setSaveError(null);
    setSaveSuccess(false);
    try {
      const res = await profileApi.updateProfile({
        name: data.name,
        native_language: data.native_language || null,
        learning_goal: data.learning_goal || null,
      });
      setProfile(res.data);
      reset({
        name: res.data.name,
        native_language: res.data.native_language ?? "",
        learning_goal: res.data.learning_goal ?? "",
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setSaveError(err.response?.data?.detail ?? "Failed to save changes.");
      } else {
        setSaveError("Something went wrong. Please try again.");
      }
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/settings"
          className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Profile</h1>
          <p className="text-sm text-muted-foreground">Update your personal information</p>
        </div>
      </div>

      {/* Read-only info card */}
      {profile && (
        <div className="rounded-xl border border-border bg-card p-5 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
            {profile.profile_picture_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.profile_picture_url}
                alt={profile.name}
                className="w-14 h-14 rounded-full object-cover"
              />
            ) : (
              <User size={28} className="text-primary" />
            )}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-foreground truncate">{profile.name}</p>
            <p className="text-sm text-muted-foreground truncate">{profile.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                {profile.proficiency_level}
              </span>
              <span className="text-xs text-muted-foreground capitalize">{profile.provider}</span>
            </div>
          </div>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-3 animate-pulse">
          <div className="h-4 bg-muted rounded w-1/3" />
          <div className="h-4 bg-muted rounded w-1/2" />
        </div>
      )}

      {/* Edit form */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="rounded-xl border border-border bg-card p-5 space-y-5"
      >
        {/* Display name */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground" htmlFor="name">
            Display name
          </label>
          <input
            id="name"
            type="text"
            placeholder="Your name"
            className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
            {...register("name")}
          />
          {errors.name && (
            <p className="text-xs text-destructive">{errors.name.message}</p>
          )}
        </div>

        {/* Email (read-only) */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">
            Email address <span className="text-muted-foreground font-normal">(read-only)</span>
          </label>
          <input
            type="email"
            value={profile?.email ?? ""}
            readOnly
            disabled
            className="w-full h-10 px-3 rounded-lg border border-input bg-muted text-sm text-muted-foreground cursor-not-allowed"
          />
        </div>

        {/* Native language */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground" htmlFor="native_language">
            Native language
          </label>
          <select
            id="native_language"
            className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition"
            {...register("native_language")}
          >
            <option value="">— Select your native language —</option>
            {LANGUAGE_OPTIONS.map((lang) => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </select>
          {errors.native_language && (
            <p className="text-xs text-destructive">{errors.native_language.message}</p>
          )}
        </div>

        {/* Learning goal */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground" htmlFor="learning_goal">
            Why are you learning Malay?
          </label>
          <select
            id="learning_goal"
            className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition"
            {...register("learning_goal")}
          >
            <option value="">— Select your goal —</option>
            {GOAL_OPTIONS.map((goal) => (
              <option key={goal} value={goal}>
                {goal}
              </option>
            ))}
          </select>
          {errors.learning_goal && (
            <p className="text-xs text-destructive">{errors.learning_goal.message}</p>
          )}
        </div>

        {/* Feedback messages */}
        {saveError && (
          <p className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2">
            {saveError}
          </p>
        )}
        {saveSuccess && (
          <p className="text-xs text-green-600 dark:text-green-400 bg-green-500/10 rounded-lg px-3 py-2">
            Profile saved successfully.
          </p>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting || !isDirty}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save size={16} />
          {isSubmitting ? "Saving…" : "Save changes"}
        </button>
      </form>
    </div>
  );
}
