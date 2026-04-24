"use client";

import { useEffect, useRef } from "react";

/**
 * Slow, subtle canvas-wave background for the dashboard.
 *
 * Design intent: barely perceptible movement in the background — the wave
 * is a gentle "breathing" effect, not a distraction from the content.
 * Colors stay tightly within the BahasaBot design-system palette:
 *
 *   Dark  mode: base #25221a → peak ~#38332a  (≈20 RGB units of variation)
 *   Light mode: base #e4d7b0 → peak ~#d5c89e  (≈15 RGB units darker)
 *
 * Theme is re-read every frame so switching themes is instant.
 */
const DashboardWaveBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Render at ¼ resolution, scale up with bilinear smoothing.
    // This gives a pleasantly blurry, paint-like appearance and is 16× cheaper.
    const SCALE = 4;
    let width = 0;
    let height = 0;
    let imageData: ImageData;
    let data: Uint8ClampedArray;
    let animationId: number;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      width = Math.floor(canvas.width / SCALE);
      height = Math.floor(canvas.height / SCALE);
      imageData = ctx.createImageData(width, height);
      data = imageData.data;
    };

    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();

    const startTime = Date.now();

    // Pre-built trig tables
    const SIN_TABLE = new Float32Array(1024);
    const COS_TABLE = new Float32Array(1024);
    for (let i = 0; i < 1024; i++) {
      const angle = (i / 1024) * Math.PI * 2;
      SIN_TABLE[i] = Math.sin(angle);
      COS_TABLE[i] = Math.cos(angle);
    }

    // Correct negative-modulo handling — without this, negative angles map to
    // index 0, creating flat bands in the wave pattern.
    const fastSin = (x: number): number => {
      let n = x % (Math.PI * 2);
      if (n < 0) n += Math.PI * 2;
      return SIN_TABLE[Math.floor((n / (Math.PI * 2)) * 1024) & 1023];
    };
    const fastCos = (x: number): number => {
      let n = x % (Math.PI * 2);
      if (n < 0) n += Math.PI * 2;
      return COS_TABLE[Math.floor((n / (Math.PI * 2)) * 1024) & 1023];
    };

    const render = () => {
      const isDark = document.documentElement.classList.contains("dark");

      // Light mode: clear to transparent so CSS bg-background shows through unchanged.
      if (!isDark) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        animationId = requestAnimationFrame(render);
        return;
      }

      // t drives the animation — 0.1 gives a slow, hypnotic pace
      const t = (Date.now() - startTime) * 0.001 * 0.1;

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const u_x = (2 * x - width) / height;
          const u_y = (2 * y - height) / height;

          let a = 0;
          let d = 0;
          for (let i = 0; i < 4; i++) {
            a += fastCos(i - d + t - a * u_x * 0.6);
            d += fastSin(i * u_y * 0.6 + a);
          }

          // wave ∈ [−0.5, +0.5]  →  remapped to [0, 1] for colour mixing
          const w = (fastSin(a) + fastCos(d)) * 0.5 + 0.5; // 0 → 1

          // Dark palette: interpolate #25221a → #38332a
          // (37,34,26) → (56,51,42)  — 19 / 17 / 16 unit range
          let r = 37 + 19 * w;
          let g = 34 + 17 * w;
          let b = 26 + 16 * w;

          // Faint olive tint at bright peaks (w > 0.6) — matches primary #8a9f7b
          if (w > 0.6) {
            const peak = (w - 0.6) / 0.4; // 0 → 1
            g += peak * 6;  // nudge green slightly
            r -= peak * 2;  // cool the red fractionally
          }

          const idx = (y * width + x) * 4;
          data[idx]     = r;
          data[idx + 1] = g;
          data[idx + 2] = b;
          data[idx + 3] = 255;
        }
      }

      // Write low-res frame to the top-left of the canvas…
      ctx.putImageData(imageData, 0, 0);
      // …then scale it up with bilinear smoothing to fill the full canvas
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(canvas, 0, 0, width, height, 0, 0, canvas.width, canvas.height);

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
};

export default DashboardWaveBackground;
