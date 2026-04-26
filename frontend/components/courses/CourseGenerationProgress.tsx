"use client";

// Floating progress indicator for background course generation.
// Desktop (md+): bottom-right card with spinning pinwheel animation.
// Mobile (<md):  compact bottom-center pill — stays out of the way of page content.
// Polls GET /api/courses/jobs/{job_id} every 3 s via React Query.

import Link from "next/link";
import { CheckCircle2, XCircle } from "lucide-react";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useRef, useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { coursesApi } from "@/lib/api";
import { useCourseGeneration } from "@/lib/course-generation-context";
import type { JobStatusResponse } from "@/lib/types";

const MAX_MISSES = 5;

// ── Embedded animation CSS ────────────────────────────────────────────────────
// All classes prefixed `bb-` to avoid global collisions.
// Leaf colours draw from the project's botanical palette:
//   rust #c85a3c | gold #d4a843 | olive #8d9d4f | sage #7d8f6b | warm-gold #a18f5c
// These work on both the light (#e4d7b0) and dark (#111110) card backgrounds.
const ANIM_CSS = `
  /* ── Pinwheel flower (desktop card) ────────────────────────────────── */

  /* Outer loader wrapper — layout anchor, 20×20 px */
  .bb-pw-loader { position: relative; width: 20px; height: 20px; }

  /* Spinning flower container */
  .bb-pw-spin {
    position: relative; width: 20px; height: 20px;
    transform: rotate(30deg) scale(0.77);
    animation: bbPwRotate 3s infinite linear;
  }

  /* Centre pin */
  .bb-pw-pin {
    position: absolute; top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    width: 8px; height: 8px;
    background-color: #fdfbf6;
    z-index: 10; border-radius: 9999px;
  }

  /* Individual petal wrapper (absolute, scaled up 1.5×) */
  .bb-pw-pc { position: absolute; scale: 1.5; }

  /* Petal body — teardrop shape via clip-path + border trick */
  .bb-pw-l1 {
    position: relative; width: 0; height: 0;
    clip-path: ellipse(50% 50% at 50% 109%);
    border-left: 30px solid transparent;
    border-right: 30px solid transparent;
    border-top-left-radius: 222px;
    border-top-right-radius: 222px;
  }

  /* Petal shadow/fold overlay */
  .bb-pw-l2 {
    position: absolute; right: -1px; bottom: 0;
    width: 30px; height: 20.5px;
    border-bottom-right-radius: 2px; z-index: 2;
  }
  .bb-pw-l2::before {
    content: "";
    position: absolute; bottom: 0;
    width: 24.5px; height: 20.5px;
    clip-path: ellipse(100% 100% at 0% 100%);
    border-top-right-radius: 9999px;
    box-shadow:
      inset -5px 0px 3px -3px rgba(0, 0, 0, 0.2),
      10px -10px 10px 0px rgba(255, 255, 255, 0.1);
    z-index: 1;
  }

  /* Petal angular positions (unchanged from original) */
  .bb-pw-a { top: 50%; left: 50%; transform: translate(-80%, -85%);             z-index: 2; }
  .bb-pw-b { top: 50%; left: 50%; transform: rotate(90deg)  translate(-75%,-10%); z-index: 3; }
  .bb-pw-c { top: 50%; left: 50%; transform: rotate(180deg) translate(-16%,-17%); z-index: 4; }
  .bb-pw-d { top: 50%; left: 50%; transform: rotate(270deg) translate(-22%,-90%); z-index: 5; }

  /* Petal colours — botanical palette */
  .bb-l1a { border-bottom: 50px solid #c85a3c; } .bb-l1b { background-color: #c85a3c; }
  .bb-l2a { border-bottom: 50px solid #d4a843; } .bb-l2b { background-color: #d4a843; }
  .bb-l3a { border-bottom: 50px solid #8d9d4f; } .bb-l3b { background-color: #8d9d4f; }
  .bb-l4a { border-bottom: 50px solid #7d8f6b; } .bb-l4b { background-color: #7d8f6b; }

  @keyframes bbPwRotate {
    from { transform: rotate(30deg)  scale(0.77); }
    to   { transform: rotate(390deg) scale(0.77); }
  }

  /* ── Domino bars (mobile pill) ──────────────────────────────────────── */

  .bb-dm-wrap {
    position: relative;
    width: 44px; height: 44px;
    display: flex; justify-content: center; align-items: center;
    border-radius: 50%; flex-shrink: 0;
  }

  /* Each bar */
  .bb-dm {
    width: 4px; height: 13px;
    left: var(--dm-l);
    border-radius: 10px 50px;
    box-shadow: 0 0 3px rgba(0, 0, 0, 0.25);
    animation: bbDominos 1s ease infinite;
    position: absolute;
  }

  /* Positions scaled proportionally from the 200 px original to the 44 px container */
  .bb-dm:nth-child(1) { --dm-l: 26px; animation-delay: 0.325s; background-color: #c85a3c; }
  .bb-dm:nth-child(2) { --dm-l: 22px; animation-delay: 0.500s; background-color: #d4a843; }
  .bb-dm:nth-child(3) { left: 17px;   animation-delay: 0.625s; background-color: #8d9d4f; }
  .bb-dm:nth-child(4) { left: 13px;   animation-delay: 0.740s; background-color: #a18f5c; }
  .bb-dm:nth-child(5) { left:  9px;   animation-delay: 0.865s; background-color: #7d8f6b; }

  @keyframes bbDominos {
    50% { opacity: 0.7; }
    75% { transform: rotate(90deg); }
    80% { opacity: 1; }
  }
`;

// ── Pinwheel sub-component (desktop) ─────────────────────────────────────────
// Root cause of previous broken rendering: `display:flex` on the clip container
// uses `alignItems:stretch` by default, which stretched the scale wrapper to fill
// the full 100 px height. That moved the `transformOrigin:"center"` point to
// (10px, 50px) inside the scale wrapper (not 10px) — completely wrong origin.
//
// Fix: use `position:absolute; top:50%; left:50%; transform:translate(-50%,-50%)`
// to centre the 20×20 px loader inside a `position:relative` container, then
// apply scale(0.55). The scale-origin defaults to the loader's own centre, which
// is already at the container centre — no flex-stretch ambiguity.
//
// Max petal radius from spin-centre (all scales combined):
//   69.5 px × spin-scale(0.77) × external-scale(0.55) ≈ 29 px
// Container is 120 px → centre at 60 px → petals span 31–89 px  ✓
// Stick is intentionally omitted for the card context.
function Pinwheel() {
  return (
    <div style={{ position: "relative", height: 120, width: "100%" }}>
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%) scale(0.55)",
        }}
      >
        <div className="bb-pw-loader">
          <div className="bb-pw-spin">
            <div className="bb-pw-pin" />
            <div className="bb-pw-pc bb-pw-a">
              <div className="bb-pw-l1 bb-l1a" />
              <div className="bb-pw-l2 bb-l1b" />
            </div>
            <div className="bb-pw-pc bb-pw-b">
              <div className="bb-pw-l1 bb-l2a" />
              <div className="bb-pw-l2 bb-l2b" />
            </div>
            <div className="bb-pw-pc bb-pw-c">
              <div className="bb-pw-l1 bb-l3a" />
              <div className="bb-pw-l2 bb-l3b" />
            </div>
            <div className="bb-pw-pc bb-pw-d">
              <div className="bb-pw-l1 bb-l4a" />
              <div className="bb-pw-l2 bb-l4b" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Domino bars sub-component (mobile) ───────────────────────────────────────
function Dominos() {
  return (
    <div className="bb-dm-wrap">
      <div className="bb-dm" />
      <div className="bb-dm" />
      <div className="bb-dm" />
      <div className="bb-dm" />
      <div className="bb-dm" />
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function CourseGenerationProgress() {
  const { activeJobId, setActiveJobId } = useCourseGeneration();
  const queryClient = useQueryClient();

  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const dragStart = useRef({ touchX: 0, touchY: 0, startX: 0, startY: 0 });

  useEffect(() => { setDragOffset({ x: 0, y: 0 }); }, [activeJobId]);

  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    dragStart.current = { touchX: t.clientX, touchY: t.clientY, startX: dragOffset.x, startY: dragOffset.y };
  };
  const onTouchMove = (e: React.TouchEvent) => {
    const t = e.touches[0];
    setDragOffset({
      x: dragStart.current.startX + (t.clientX - dragStart.current.touchX),
      y: dragStart.current.startY + (t.clientY - dragStart.current.touchY),
    });
  };

  const { data, failureCount } = useQuery<JobStatusResponse>({
    queryKey: ["courseJob", activeJobId],
    queryFn: () => coursesApi.getJobStatus(activeJobId!).then((r) => r.data),
    enabled: !!activeJobId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === "complete" || status === "failed") return false;
      return 3000;
    },
    retry: MAX_MISSES,
  });

  // Give up polling if Redis TTL has expired and job is gone
  if (failureCount >= MAX_MISSES && activeJobId) {
    setActiveJobId(null);
  }

  // Invalidate course list so the new card appears immediately on completion
  if (data?.status === "complete") {
    queryClient.invalidateQueries({ queryKey: ["courses"] });
  }

  if (!activeJobId || !data) return null;

  const isDone   = data.status === "complete";
  const isFailed = data.status === "failed";
  const isActive = !isDone && !isFailed;

  const dismiss = () => setActiveJobId(null);

  return (
    <>
      {/* Inject animation keyframes + class definitions once into the document */}
      <style dangerouslySetInnerHTML={{ __html: ANIM_CSS }} />

      {/* ── DESKTOP card (md+) ─────────────────────────────────────────────
           Fixed bottom-right. Card has three zones:
           1. Animation / result icon  2. Text labels  3. Progress bar + actions  */}
      <div
        className={cn(
          "hidden md:flex flex-col",
          "fixed bottom-6 right-6 z-50",
          "w-72 rounded-2xl border bg-card shadow-2xl overflow-hidden",
        )}
      >
        {/* Zone 1 — animation or result icon */}
        <div className="flex flex-col items-center pt-5 pb-1">
          {isActive ? (
            <Pinwheel />
          ) : isDone ? (
            <CheckCircle2 className="w-14 h-14 text-primary my-3" strokeWidth={1.5} />
          ) : (
            <XCircle className="w-14 h-14 text-destructive my-3" strokeWidth={1.5} />
          )}
        </div>

        {/* Zone 2 — status text, always below the animation */}
        <div className="px-5 pb-1 text-center space-y-0.5">
          <p className="text-sm font-semibold leading-tight">
            {isDone
              ? "Course ready!"
              : isFailed
              ? "Generation failed"
              : "Generating your course…"}
          </p>
          <p className="text-xs text-muted-foreground line-clamp-2">
            {isFailed ? (data.error ?? "Something went wrong.") : data.step}
          </p>
        </div>

        {/* Zone 3 — progress bar (active only) */}
        {isActive && (
          <div className="px-5 pt-3 pb-1">
            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${data.progress}%` }}
              />
            </div>
            <p className="text-right text-[10px] text-muted-foreground mt-1 font-mono">
              {data.progress}%
            </p>
          </div>
        )}

        {/* Zone 3 — action buttons (done / failed only) */}
        {(isDone || isFailed) && (
          <div className="flex justify-end gap-3 px-5 pb-5 pt-3">
            {isDone && data.course_id && (
              <Link
                href={`/courses/${data.course_id}`}
                onClick={dismiss}
                className="text-xs font-semibold text-primary hover:underline"
              >
                View Course →
              </Link>
            )}
            <button
              onClick={dismiss}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>

      {/* ── MOBILE pill (< md) ─────────────────────────────────────────────
           Compact floating pill centred at the very bottom.
           Max width 260 px (active: 220 px) — leaves the whole page visible
           on either side. Safe-area-inset-bottom clears the iPhone home bar.

           While running: [dominos | "Generating course…" | step | %]
           When done:     [✓ icon  | "Course ready!"      | View → | Dismiss] */}
      <div
        className={cn(
          "flex md:hidden items-center gap-3",
          "fixed bottom-5 left-1/2 z-50",
          "px-4 py-2.5 rounded-2xl",
          "border bg-card/95 backdrop-blur-md",
          "shadow-[0_4px_24px_rgba(0,0,0,0.18)]",
          "transition-[width] duration-300",
          isActive ? "w-[220px]" : "w-[260px]",
        )}
        style={{
          touchAction: "none",
          transform: `translateX(calc(-50% + ${dragOffset.x}px)) translateY(${dragOffset.y}px)`,
          paddingBottom: "max(10px, env(safe-area-inset-bottom))",
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
      >
        {/* Left: animation or result icon */}
        <div className="shrink-0">
          {isActive
            ? <Dominos />
            : isDone
              ? <CheckCircle2 className="w-6 h-6 text-primary"     strokeWidth={1.5} />
              : <XCircle      className="w-6 h-6 text-destructive" strokeWidth={1.5} />}
        </div>

        {/* Centre: status text */}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold truncate leading-tight">
            {isDone   ? "Course ready!"      :
             isFailed ? "Generation failed"  :
                        "Generating course…"}
          </p>
          {isActive && (
            <p className="text-[10px] text-muted-foreground truncate leading-tight mt-0.5">
              {data.step}
            </p>
          )}
        </div>

        {/* Right: progress % while running, action buttons when done */}
        {isActive ? (
          <span className="shrink-0 text-[10px] font-mono text-muted-foreground">
            {data.progress}%
          </span>
        ) : (
          <div className="shrink-0 flex items-center gap-2">
            {isDone && data.course_id && (
              <Link
                href={`/courses/${data.course_id}`}
                onClick={dismiss}
                className="text-[11px] font-semibold text-primary whitespace-nowrap hover:underline"
              >
                View →
              </Link>
            )}
            <button
              onClick={dismiss}
              className="text-[11px] text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>
    </>
  );
}
