"use client";

/**
 * Admin — User Journeys
 *
 * Read-only table of all user roadmaps (active, overdue, completed).
 * Clicking a row expands the full obstacle list with completion status.
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, Map, ShieldCheck } from "lucide-react";

import { journeyApi, profileApi } from "@/lib/api";
import type { AdminRoadmapRow, RoadmapElement } from "@/lib/types";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-MY", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const STATUS_BADGE: Record<string, string> = {
  active:    "bg-primary/20 text-primary",
  overdue:   "bg-amber-500/20 text-amber-600",
  completed: "bg-emerald-500/20 text-emerald-600",
  deleted:   "bg-muted text-muted-foreground",
};

// ── Row detail ────────────────────────────────────────────────────────────────

function RoadmapDetail({ elements }: { elements: RoadmapElement[] }) {
  return (
    <div className="px-4 pb-4 pt-2 bg-muted/30 border-t border-border/50 space-y-1.5">
      {elements.map((elem) => (
        <div
          key={elem.order}
          className={`flex items-start gap-3 rounded-lg px-3 py-2 text-xs ${
            elem.completed ? "bg-emerald-500/10" : "bg-background"
          }`}
        >
          <span
            className={`shrink-0 h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
              elem.completed
                ? "bg-emerald-500 text-white"
                : "bg-border text-muted-foreground"
            }`}
          >
            {elem.order}
          </span>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-foreground truncate">{elem.topic}</p>
            {elem.completed_at && (
              <p className="text-muted-foreground mt-0.5">
                Done: {formatDate(elem.completed_at)}
              </p>
            )}
          </div>
          {!elem.completed && (
            <span className="shrink-0 text-muted-foreground/60">Pending</span>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Row ───────────────────────────────────────────────────────────────────────

function JourneyRow({ row }: { row: AdminRoadmapRow }) {
  const [expanded, setExpanded] = useState(false);
  const pct =
    row.total_count > 0
      ? Math.round((row.completed_count / row.total_count) * 100)
      : 0;

  return (
    <>
      <tr
        className="border-b border-border/50 hover:bg-muted/30 cursor-pointer transition-colors"
        onClick={() => setExpanded((e) => !e)}
      >
        <td className="px-4 py-3 text-sm font-medium text-foreground">
          {row.user_name}
          <div className="text-xs text-muted-foreground font-normal">{row.user_email}</div>
        </td>
        <td className="px-4 py-3 text-xs text-muted-foreground max-w-[140px] truncate" title={row.intent}>
          {row.intent}
        </td>
        <td className="px-4 py-3 text-xs text-muted-foreground">{row.timeline_months}mo</td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-16 rounded-full bg-border overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground">
              {row.completed_count}/{row.total_count}
            </span>
          </div>
        </td>
        <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(row.deadline)}</td>
        <td className="px-4 py-3">
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[row.status] ?? ""}`}>
            {row.status}
          </span>
        </td>
        <td className="px-4 py-3 text-xs text-muted-foreground">{row.extended ? "Yes" : "No"}</td>
        <td className="px-4 py-3 text-muted-foreground">
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={8} className="p-0">
            <RoadmapDetail elements={row.elements} />
          </td>
        </tr>
      )}
    </>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminJourneysPage() {
  const router = useRouter();
  const [rows, setRows]       = useState<AdminRoadmapRow[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    // Admin guard
    profileApi.getProfile().then((r) => {
      if (r.data.role !== "admin") {
        router.replace("/dashboard");
        return;
      }
      journeyApi
        .getAdminJourneys()
        .then((res) => setRows(res.data))
        .catch(() => setError("Failed to load journey data."))
        .finally(() => setIsLoading(false));
    }).catch(() => router.replace("/login"));
  }, [router]);

  if (isLoading) {
    return (
      <div className="w-full p-6 space-y-3 animate-pulse">
        <div className="h-7 w-48 rounded bg-muted" />
        <div className="h-4 w-72 rounded bg-muted" />
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-12 rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full p-6">
        <p className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </p>
      </div>
    );
  }

  const total     = rows?.length ?? 0;
  const active    = rows?.filter((r) => r.status === "active").length ?? 0;
  const overdue   = rows?.filter((r) => r.status === "overdue").length ?? 0;
  const completed = rows?.filter((r) => r.status === "completed").length ?? 0;

  return (
    <div className="w-full p-4 sm:p-6 space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-5 w-5 text-primary" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">User Journeys</h1>
          <p className="text-sm text-muted-foreground">
            Read-only overview of all learning roadmaps
          </p>
        </div>
      </div>

      {/* Summary chips */}
      <div className="flex flex-wrap gap-3">
        {[
          { label: "Total",     value: total,     cls: "bg-muted text-foreground" },
          { label: "Active",    value: active,    cls: "bg-primary/20 text-primary" },
          { label: "Overdue",   value: overdue,   cls: "bg-amber-500/20 text-amber-600" },
          { label: "Completed", value: completed, cls: "bg-emerald-500/20 text-emerald-600" },
        ].map((s) => (
          <div key={s.label} className={`rounded-full px-4 py-1.5 text-sm font-medium ${s.cls}`}>
            {s.value} {s.label}
          </div>
        ))}
      </div>

      {/* Table */}
      {!rows || rows.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          <Map className="h-8 w-8 mx-auto mb-3 text-muted-foreground/30" />
          No roadmaps created yet.
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Intent
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Timeline
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Progress
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Deadline
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Extended
                  </th>
                  <th className="px-4 py-3 w-8" />
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <JourneyRow key={row.id} row={row} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
