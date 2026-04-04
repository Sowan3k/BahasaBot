"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  UserX,
  CheckCircle,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { adminApi, profileApi } from "@/lib/api";
import type { AdminUser, PaginatedResponse } from "@/lib/types";

const BPS_COLORS: Record<string, string> = {
  "BPS-1": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  "BPS-2": "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  "BPS-3": "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  "BPS-4": "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
};

export default function AdminUsersPage() {
  const router = useRouter();
  const [data, setData] = useState<PaginatedResponse<AdminUser> | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deactivating, setDeactivating] = useState<string | null>(null);

  const LIMIT = 20;

  useEffect(() => {
    // Guard: confirm admin role before loading
    profileApi.getProfile()
      .then((res) => {
        if (res.data.role !== "admin") {
          router.replace("/dashboard");
        }
      })
      .catch(() => router.replace("/dashboard"));
  }, [router]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    adminApi.getUsers(page, LIMIT)
      .then((res) => setData(res.data))
      .catch(() => setError("Failed to load users"))
      .finally(() => setLoading(false));
  }, [page]);

  async function handleDeactivate(userId: string, name: string) {
    if (!confirm(`Deactivate account for "${name}"? They will not be able to log in.`)) return;

    setDeactivating(userId);
    try {
      await adminApi.deactivateUser(userId);
      // Update the row locally
      setData((prev) =>
        prev
          ? {
              ...prev,
              items: prev.items.map((u) =>
                u.id === userId ? { ...u, is_active: false } : u
              ),
            }
          : prev
      );
    } catch {
      alert("Failed to deactivate user. Please try again.");
    } finally {
      setDeactivating(null);
    }
  }

  const totalPages = data ? Math.ceil(data.total / LIMIT) : 1;

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center gap-3">
        <Link
          href="/admin"
          className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">User Management</h1>
          <p className="text-sm text-muted-foreground">
            {data ? `${data.total} registered users` : "Loading…"}
          </p>
        </div>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl border border-destructive/30 bg-destructive/10">
          <AlertTriangle size={18} className="text-destructive shrink-0" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* ── Table ── */}
      {loading ? (
        <div className="rounded-xl border border-border bg-card divide-y divide-border">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-14 px-5 flex items-center gap-4">
              <div className="h-4 w-40 rounded bg-muted animate-pulse" />
              <div className="h-4 w-28 rounded bg-muted animate-pulse" />
              <div className="h-4 w-16 rounded bg-muted animate-pulse ml-auto" />
            </div>
          ))}
        </div>
      ) : data && data.items.length > 0 ? (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[2fr_2fr_1fr_1fr_1fr_auto] gap-4 px-5 py-3 bg-muted/50 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            <span>User</span>
            <span>Email</span>
            <span>BPS Level</span>
            <span>XP</span>
            <span>Status</span>
            <span />
          </div>

          {/* Rows */}
          {data.items.map((user) => (
            <div
              key={user.id}
              className="grid grid-cols-[2fr_2fr_1fr_1fr_1fr_auto] gap-4 px-5 py-3.5 border-b border-border last:border-b-0 items-center hover:bg-muted/30 transition-colors"
            >
              {/* Name + provider */}
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground">
                  {user.role === "admin" ? "Admin" : "User"} ·{" "}
                  {user.provider === "google" ? "Google" : "Email"}
                </p>
              </div>

              {/* Email */}
              <p className="text-sm text-muted-foreground truncate">{user.email}</p>

              {/* BPS level */}
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold w-fit ${
                  BPS_COLORS[user.proficiency_level] ?? "bg-muted text-muted-foreground"
                }`}
              >
                {user.proficiency_level}
              </span>

              {/* XP */}
              <p className="text-sm text-foreground font-medium">{user.xp_total}</p>

              {/* Status badge */}
              {user.is_active ? (
                <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400 font-medium">
                  <CheckCircle size={13} />
                  Active
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs text-red-500 font-medium">
                  <XCircle size={13} />
                  Inactive
                </span>
              )}

              {/* Action */}
              {user.is_active && user.role !== "admin" ? (
                <button
                  onClick={() => handleDeactivate(user.id, user.name)}
                  disabled={deactivating === user.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-destructive border border-destructive/30 hover:bg-destructive/10 transition-colors disabled:opacity-50"
                >
                  <UserX size={13} />
                  {deactivating === user.id ? "…" : "Deactivate"}
                </button>
              ) : (
                <div className="w-24" /> /* spacer for alignment */
              )}
            </div>
          ))}
        </div>
      ) : (
        !loading && (
          <div className="text-center py-16 text-muted-foreground text-sm">
            No users found.
          </div>
        )
      )}

      {/* ── Pagination ── */}
      {data && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg border border-border hover:bg-muted transition-colors disabled:opacity-40"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg border border-border hover:bg-muted transition-colors disabled:opacity-40"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
