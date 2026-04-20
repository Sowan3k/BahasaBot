"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { ArrowLeft, Save, Trash2, User, AlertTriangle, Loader2 } from "lucide-react";
import Link from "next/link";
import axios from "axios";

import { profileApi } from "@/lib/api";
import type { UserProfile } from "@/lib/types";
import { GlowCard } from "@/components/ui/glow-card";

// ── Native language suggestions (datalist) ────────────────────────────────────
// Using a free-text input + datalist so ANY value from the DB is shown correctly,
// regardless of whether it matches a predefined option.

const LANGUAGE_SUGGESTIONS = [
  "English", "Mandarin Chinese", "Arabic", "Hindi", "Spanish",
  "French", "Bengali", "Portuguese", "Russian", "Japanese",
  "German", "Korean", "Indonesian", "Thai", "Vietnamese",
  "Tamil", "Urdu", "Turkish", "Italian", "Polish", "Other",
];

// ── Delete account modal ──────────────────────────────────────────────────────

function DeleteAccountModal({
  profile,
  onClose,
  onDeleted,
}: {
  profile: UserProfile;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const isGoogleOnly = !profile.has_password;
  const [password, setPassword] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  async function handleDelete() {
    setError(null);
    setLoading(true);
    try {
      await profileApi.deleteAccount(
        isGoogleOnly ? { confirm_email: confirmEmail } : { password }
      );
      onDeleted();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.detail ?? "Failed to delete account. Please try again.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  const canSubmit = isGoogleOnly
    ? confirmEmail.trim().toLowerCase() === profile.email.toLowerCase()
    : password.length >= 1;

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-destructive/30 bg-card shadow-2xl p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
            <Trash2 size={20} className="text-destructive" />
          </div>
          <div>
            <h2 className="font-heading text-lg font-bold text-foreground">Delete Account</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              This is permanent and cannot be undone.
            </p>
          </div>
        </div>

        {/* Warning */}
        <div className="rounded-xl border border-destructive/20 bg-destructive/8 p-4 space-y-1.5">
          <p className="text-sm font-medium text-destructive flex items-center gap-2">
            <AlertTriangle size={14} /> This will permanently delete:
          </p>
          <ul className="text-xs text-muted-foreground space-y-0.5 pl-5 list-disc">
            <li>All your courses, modules, and classes</li>
            <li>Your quiz history and progress</li>
            <li>Your vocabulary and grammar records</li>
            <li>Your learning roadmap and notifications</li>
            <li>Your account profile and login access</li>
          </ul>
        </div>

        {/* Verification field */}
        {isGoogleOnly ? (
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              Type your email to confirm
            </label>
            <input
              ref={inputRef}
              type="email"
              placeholder={profile.email}
              value={confirmEmail}
              onChange={(e) => setConfirmEmail(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-destructive/40 transition"
            />
          </div>
        ) : (
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              Enter your password to confirm
            </label>
            <input
              ref={inputRef}
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && canSubmit) handleDelete(); }}
              className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-destructive/40 transition"
            />
          </div>
        )}

        {error && (
          <p className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-2.5 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={!canSubmit || loading}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-destructive text-destructive-foreground text-sm font-semibold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <><Loader2 size={14} className="animate-spin" /> Deleting…</>
            ) : (
              <><Trash2 size={14} /> Delete Account</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ProfileSettingsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [nativeLang, setNativeLang] = useState("");
  const [learningGoal, setLearningGoal] = useState("");
  const [isDirty, setIsDirty] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  // Delete modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Track original values to compute isDirty
  const origRef = useRef({ name: "", nativeLang: "", learningGoal: "" });

  // ── Fetch profile ───────────────────────────────────────────────────────────

  useEffect(() => {
    profileApi
      .getProfile()
      .then((res) => {
        const p = res.data;
        setProfile(p);
        const orig = {
          name: p.name ?? "",
          nativeLang: p.native_language ?? "",
          learningGoal: p.learning_goal ?? "",
        };
        origRef.current = orig;
        setName(orig.name);
        setNativeLang(orig.nativeLang);
        setLearningGoal(orig.learningGoal);
      })
      .catch(() => setLoadError("Failed to load profile. Please refresh."))
      .finally(() => setLoading(false));
  }, []);

  // Recompute isDirty whenever controlled fields change
  useEffect(() => {
    const o = origRef.current;
    setIsDirty(
      name !== o.name ||
      nativeLang !== o.nativeLang ||
      learningGoal !== o.learningGoal
    );
  }, [name, nativeLang, learningGoal]);

  // ── Submit ──────────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaveError(null);
    setSaveSuccess(false);
    setSaving(true);
    try {
      const res = await profileApi.updateProfile({
        name: name.trim(),
        native_language: nativeLang.trim() || null,
        learning_goal: learningGoal.trim() || null,
      });
      const p = res.data;
      setProfile(p);
      const updated = {
        name: p.name ?? "",
        nativeLang: p.native_language ?? "",
        learningGoal: p.learning_goal ?? "",
      };
      origRef.current = updated;
      setName(updated.name);
      setNativeLang(updated.nativeLang);
      setLearningGoal(updated.learningGoal);
      setIsDirty(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setSaveError(err.response?.data?.detail ?? "Failed to save changes.");
      } else {
        setSaveError("Something went wrong. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  }

  // ── After account deleted ───────────────────────────────────────────────────

  async function handleDeleted() {
    setShowDeleteModal(false);
    await signOut({ redirect: false });
    router.replace("/login");
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <>
      {showDeleteModal && profile && (
        <DeleteAccountModal
          profile={profile}
          onClose={() => setShowDeleteModal(false)}
          onDeleted={handleDeleted}
        />
      )}

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

        {/* Error loading */}
        {loadError && (
          <div className="flex items-center gap-3 p-4 rounded-xl border border-destructive/30 bg-destructive/10">
            <AlertTriangle size={16} className="text-destructive shrink-0" />
            <p className="text-sm text-destructive">{loadError}</p>
          </div>
        )}

        {/* Profile summary card */}
        {loading ? (
          <GlowCard className="bg-card p-5 flex items-center gap-4 animate-pulse">
            <div className="w-14 h-14 rounded-full bg-muted shrink-0" />
            <div className="space-y-2 flex-1">
              <div className="h-4 bg-muted rounded w-1/3" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </div>
          </GlowCard>
        ) : profile ? (
          <GlowCard className="bg-card p-5 flex items-center gap-4">
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
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                  {profile.proficiency_level}
                </span>
                <span className="text-xs text-muted-foreground capitalize">{profile.provider} account</span>
              </div>
            </div>
          </GlowCard>
        ) : null}

        {/* Edit form */}
        <GlowCard className="bg-card p-5">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Display name */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground" htmlFor="name">
                Display name
              </label>
              <input
                id="name"
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
                className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition disabled:opacity-60"
              />
              {!name.trim() && (
                <p className="text-xs text-destructive">Name cannot be empty</p>
              )}
            </div>

            {/* Email (read-only) */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                Email address{" "}
                <span className="text-muted-foreground font-normal">(read-only)</span>
              </label>
              <input
                type="email"
                value={profile?.email ?? ""}
                readOnly
                disabled
                className="w-full h-10 px-3 rounded-lg border border-input bg-muted text-sm text-muted-foreground cursor-not-allowed"
              />
            </div>

            {/* Native language — free-text with datalist suggestions */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground" htmlFor="native_language">
                Native language
              </label>
              <input
                id="native_language"
                type="text"
                list="lang-suggestions"
                placeholder="e.g. English, Arabic, Mandarin Chinese…"
                value={nativeLang}
                onChange={(e) => setNativeLang(e.target.value)}
                disabled={loading}
                autoComplete="off"
                className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition disabled:opacity-60"
              />
              <datalist id="lang-suggestions">
                {LANGUAGE_SUGGESTIONS.map((lang) => (
                  <option key={lang} value={lang} />
                ))}
              </datalist>
              <p className="text-xs text-muted-foreground">
                Used by the AI tutor to draw comparisons between your language and Malay.
              </p>
            </div>

            {/* Learning goal — free text textarea */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground" htmlFor="learning_goal">
                Why are you learning Malay?
              </label>
              <textarea
                id="learning_goal"
                rows={3}
                placeholder="e.g. I want to communicate with colleagues in Malaysia…"
                value={learningGoal}
                onChange={(e) => setLearningGoal(e.target.value)}
                disabled={loading}
                maxLength={500}
                className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition resize-none disabled:opacity-60"
              />
              <p className="text-xs text-muted-foreground flex justify-between">
                <span>Personalizes your AI tutor's tone and Journey roadmap.</span>
                <span className={learningGoal.length > 450 ? "text-amber-500" : ""}>
                  {learningGoal.length}/500
                </span>
              </p>
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
              disabled={saving || !isDirty || !name.trim() || loading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <><Loader2 size={16} className="animate-spin" /> Saving…</>
              ) : (
                <><Save size={16} /> Save changes</>
              )}
            </button>
          </form>
        </GlowCard>

        {/* Danger zone — Delete account */}
        <GlowCard className="bg-card overflow-hidden">
          <div className="px-5 py-4 border-b border-destructive/20 bg-destructive/5">
            <h2 className="text-sm font-semibold text-destructive">Danger Zone</h2>
          </div>
          <div className="p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">Delete my account</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Permanently removes your profile, courses, quiz history, roadmap, and all
                associated data. This action cannot be reversed.
              </p>
            </div>
            <button
              onClick={() => setShowDeleteModal(true)}
              disabled={loading || !profile}
              className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg border border-destructive/40 text-destructive text-sm font-medium hover:bg-destructive hover:text-destructive-foreground transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 size={15} />
              Delete account
            </button>
          </div>
        </GlowCard>
      </div>
    </>
  );
}
