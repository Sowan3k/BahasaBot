"use client";

import Link from "next/link";
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { WeakPointEntry } from "@/lib/types";

interface Props {
  weakPoints: WeakPointEntry[];
}

/** Map a strength score (0–1) to a bar colour. */
function scoreColor(score: number): string {
  if (score < 0.3) return "#ef4444"; // red-500
  if (score < 0.6) return "#f97316"; // orange-500
  return "#f9a620";                  // marigold
}

interface ChartDatum {
  topic: string;
  strength: number;
  fullTopic: string;
}

function truncate(str: string, max = 18): string {
  return str.length > max ? str.slice(0, max - 1) + "…" : str;
}

export default function WeakPointsChart({ weakPoints }: Props) {
  if (weakPoints.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center space-y-2">
        <p className="font-medium">No weak points yet</p>
        <p className="text-sm text-muted-foreground">
          Complete quizzes to see which areas need more practice.
        </p>
      </div>
    );
  }

  const data: ChartDatum[] = weakPoints.map((wp) => ({
    topic: truncate(wp.topic),
    fullTopic: wp.topic,
    strength: Math.round(wp.strength_score * 100),
  }));

  return (
    <div className="space-y-4">
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} layout="vertical" margin={{ left: 0, right: 24 }}>
          <XAxis
            type="number"
            domain={[0, 100]}
            tickFormatter={(v) => `${v}%`}
            tick={{ fontSize: 11 }}
          />
          <YAxis
            type="category"
            dataKey="topic"
            width={130}
            tick={{ fontSize: 12 }}
          />
          <Tooltip
            formatter={(value: number, _name: string, props: { payload?: ChartDatum }) => [
              `${value}%`,
              props.payload?.fullTopic ?? "Strength",
            ]}
            cursor={{ fill: "hsl(var(--muted))" }}
          />
          <Bar dataKey="strength" radius={[0, 4, 4, 0]}>
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={scoreColor(entry.strength / 100)}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-sm bg-red-500" />
          Critical (&lt;30%)
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-sm bg-orange-500" />
          Needs work (30–60%)
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-sm" style={{ backgroundColor: "#f9a620" }} />
          Improving (60–80%)
        </span>
      </div>

      <Link
        href="/quiz/adaptive"
        className="inline-block text-sm font-medium text-primary hover:underline"
      >
        Practice weak points with the adaptive quiz →
      </Link>
    </div>
  );
}
