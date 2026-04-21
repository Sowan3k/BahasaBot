"use client";

import { useState } from "react";

import type { VocabularyEntry } from "@/lib/types";
import { SpeakerButton } from "@/components/ui/SpeakerButton";

interface Props {
  items: VocabularyEntry[];
  total: number;
  onPageChange?: (page: number) => void;
  onDelete?: (ids: string[]) => Promise<void>;
  page?: number;
  limit?: number;
  loading?: boolean;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function VocabularyTable({
  items,
  total,
  onPageChange,
  onDelete,
  page = 1,
  limit = 20,
  loading = false,
}: Props) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);

  const filtered = items.filter(
    (v) =>
      v.word.toLowerCase().includes(search.toLowerCase()) ||
      v.meaning.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const allFilteredSelected =
    filtered.length > 0 && filtered.every((v) => selected.has(v.id));

  function toggleAll() {
    if (allFilteredSelected) {
      setSelected((prev) => {
        const next = new Set(prev);
        filtered.forEach((v) => next.delete(v.id));
        return next;
      });
    } else {
      setSelected((prev) => {
        const next = new Set(prev);
        filtered.forEach((v) => next.add(v.id));
        return next;
      });
    }
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function handleDelete() {
    if (!onDelete || selected.size === 0) return;
    setDeleting(true);
    try {
      await onDelete(Array.from(selected));
      setSelected(new Set());
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <input
          type="text"
          placeholder="Search words or meanings…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        {onDelete && selected.size > 0 && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-1.5 rounded-md border border-destructive px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
          >
            {deleting ? "Deleting…" : `Delete (${selected.size})`}
          </button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <p className="text-sm text-muted-foreground py-4 text-center">Loading…</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">
          {items.length === 0 ? "No vocabulary learned yet." : "No results match your search."}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <table className="min-w-full divide-y divide-border text-sm">
            <thead className="bg-muted/50">
              <tr>
                {onDelete && (
                  <th className="px-3 py-2.5 w-8">
                    <input
                      type="checkbox"
                      checked={allFilteredSelected}
                      onChange={toggleAll}
                      className="rounded border-border cursor-pointer"
                      aria-label="Select all"
                    />
                  </th>
                )}
                <th className="px-4 py-2.5 text-left font-medium">Malay Word</th>
                <th className="px-4 py-2.5 text-left font-medium">Meaning</th>
                <th className="px-4 py-2.5 text-left font-medium">Source</th>
                <th className="px-4 py-2.5 text-left font-medium">Learned</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((v) => (
                <tr
                  key={v.id}
                  className={`hover:bg-muted/30 transition-colors ${selected.has(v.id) ? "bg-muted/20" : ""}`}
                >
                  {onDelete && (
                    <td className="px-3 py-2.5">
                      <input
                        type="checkbox"
                        checked={selected.has(v.id)}
                        onChange={() => toggleOne(v.id)}
                        className="rounded border-border cursor-pointer"
                        aria-label={`Select ${v.word}`}
                      />
                    </td>
                  )}
                  <td className="px-4 py-2.5 font-medium">
                    <span className="inline-flex items-center gap-1.5">
                      {v.word}
                      <SpeakerButton word={v.word} size="xs" />
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">{v.meaning}</td>
                  <td className="px-4 py-2.5">
                    <span
                      title={v.source_name}
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap max-w-[120px] overflow-hidden ${
                        v.source_type === "chatbot"
                          ? "bg-secondary text-secondary-foreground"
                          : "bg-accent text-accent-foreground"
                      }`}
                    >
                      <span className="truncate">{v.source_name}</span>
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground whitespace-nowrap">
                    {formatDate(v.learned_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {onPageChange && totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground pt-1">
          <span>
            {total} word{total !== 1 ? "s" : ""} total
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="px-2 py-1 rounded border disabled:opacity-40 hover:bg-muted transition-colors"
            >
              ← Prev
            </button>
            <span>
              {page} / {totalPages}
            </span>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="px-2 py-1 rounded border disabled:opacity-40 hover:bg-muted transition-colors"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
