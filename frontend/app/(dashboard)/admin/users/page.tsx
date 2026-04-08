"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  UserX,
  CheckCircle,
  XCircle,
  Search,
  ExternalLink,
} from "lucide-react";
import { adminApi, profileApi } from "@/lib/api";
import type { AdminUser, PaginatedResponse } from "@/lib/types";
import { GlowCard } from "@/components/ui/glow-card";

const BPS_COLORS: Record<string, string> = {
  "BPS-1": "bg-muted text-muted-foreground",
  "BPS-2": "bg-secondary text-secondary-foreground",
  "BPS-3": "bg-accent text-accent-foreground",
  "BPS-4": "bg-primary text-primary-foreground",
};

export default function AdminUsersPage() {
  const router = useRouter();
  const [data, setData] = useState<PaginatedResponse<AdminUser> | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deactivating, setDeactivating] = useState<string | null>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const LIMIT = 20;

  // Guard: confirm admin role
  useEffect(() => {
    profileApi.getProfile()
      .then((res) => { if (res.data.role !== "admin") router.replace("/dashboard"); })
      .catch(() => router.replace("/dashboard"));
  }, [router]);

  // Fetch users whenever page or search changes
  useEffect(() => {
    setLoading(true);
    setError(null);
    adminApi.getUsers(page, LIMIT, search)
      .then((res) => setData(res.data))
      .catch(() => setError("Failed to load users"))
      .finally(() => setLoading(false));
  }, [page, search]);

  // Debounce search input — wait 400ms after last keystroke
  function handleSearchInput(val: string) {
    setSearchInput(val);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setPage(1);
      setSearch(val);
    }, 400);
  }

  async function handleDeactivate(userId: string, name: string) {
    if (!confirm(`Deactivate account for "${name}"? They will not be able to log in.`)) return;
    setDeactivating(userId);
    try {
      await adminApi.deactivateUser(userId);
      setData((prev) =>
        prev
          ? { ...prev, items: prev.items.map((u) => u.id === userId ? { ...u, is_active: false } : u) }
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
        <Link href="/admin" className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">User Management</h1>
          <p className="text-sm text-muted-foreground">
            {data ? `${data.total} user${data.total !== 1 ? "s" : ""}${search ? ` matching "${search}"` : ""}` : "Loading…"}
          </p>
        </div>
      </div>

      {/* ── Search bar ── */}
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          placeholder="Search by name or email…"
          value={searchInput}
          onChange={(e) => handleSearchInput(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
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
        <GlowCard className="bg-card divide-y divide-border overflow-hidden !rounded-xl">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-14 px-5 flex items-center gap-4">
              <div className="h-4 w-40 rounded bg-muted animate-pulse" />
              <div className="h-4 w-28 rounded bg-muted animate-pulse" />
              <div className="h-4 w-16 rounded bg-muted animate-pulse ml-auto" />
            </div>
          ))}
        </GlowCard>
      ) : data && data.items.length > 0 ? (
        <GlowCard className="bg-card overflow-hidden !rounded-xl">
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
              {/* Name + role */}
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground">
                  {user.role === "admin" ? "Admin" : "User"} · {user.provider === "google" ? "Google" : "Email"}
                </p>
              </div>

              {/* Email */}
              <p className="text-sm text-muted-foreground truncate">{user.email}</p>

              {/* BPS badge */}
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold w-fit ${BPS_COLORS[user.proficiency_level] ?? "bg-muted text-muted-foreground"}`}>
                {user.proficiency_level}
              </span>

              {/* XP */}
              <p className="text-sm text-foreground font-medium">{user.xp_total}</p>

              {/* Active/Inactive */}
              {user.is_active ? (
                <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400 font-medium">
                  <CheckCircle size={13} /> Active
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs text-red-500 font-medium">
                  <XCircle size={13} /> Inactive
                </span>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2">
                {/* View Details */}
                <Link
                  href={`/admin/users/${user.id}`}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-primary border border-primary/30 hover:bg-primary/10 transition-colors"
                >
                  <ExternalLink size={12} />
                  Details
                </Link>

                {/* Deactivate */}
                {user.is_active && user.role !== "admin" && (
                  <button
                    onClick={() => handleDeactivate(user.id, user.name)}
                    disabled={deactivating === user.id}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-destructive border border-destructive/30 hover:bg-destructive/10 transition-colors disabled:opacity-50"
                  >
                    <UserX size={12} />
                    {deactivating === user.id ? "…" : "Deactivate"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </GlowCard>
      ) : (
        !loading && (
          <div className="text-center py-16 text-muted-foreground text-sm">
            {search ? `No users found matching "${search}"` : "No users found."}
          </div>
        )
      )}

      {/* ── Pagination ── */}
      {data && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Page {page} of {totalPages}</p>
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
