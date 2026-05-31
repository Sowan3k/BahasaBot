"use client";

import React from "react";

/**
 * AetherFlowHero — canvas particle animation adapted for BahasaBot.
 *
 * Original concept: interactive floating particles connected by lines,
 * repelling from the mouse cursor (and from touch on mobile/tablet).
 *
 * Adaptations from the source component:
 * - Colours: olive-green (#8a9f7b) particles/lines, warm-wheat (#dbc894) near cursor
 * - Background: BahasaBot dark base (#111110) instead of pure black
 * - Hero text overlay removed — auth-card provides all UI content on top
 * - TypeScript types added; null guards use a re-capture pattern so that
 *   inner functions and the Particle class see properly-typed (non-null) canvas/ctx
 * - connect() inner loop starts at b = a + 1 (avoids self-connection)
 * - touchmove/touchend wired so the repel effect works on mobile and tablet
 */

export function AetherFlowHero() {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    // ── Null guards ──────────────────────────────────────────────────────────
    // Capture narrowed (non-null) types in new consts so that TypeScript
    // maintains them inside the Particle class and all inner functions.
    const _canvas = canvasRef.current;
    if (!_canvas) return;
    const _ctx = _canvas.getContext("2d");
    if (!_ctx) return;

    const canvas: HTMLCanvasElement = _canvas;
    const ctx: CanvasRenderingContext2D = _ctx;

    // ── State ────────────────────────────────────────────────────────────────
    let animationFrameId: number;
    const mouse: { x: number | null; y: number | null; radius: number } = {
      x: null,
      y: null,
      radius: 200,
    };

    // ── Particle class ───────────────────────────────────────────────────────
    class Particle {
      x: number;
      y: number;
      directionX: number;
      directionY: number;
      size: number;
      color: string;

      constructor(
        x: number,
        y: number,
        directionX: number,
        directionY: number,
        size: number,
        color: string
      ) {
        this.x = x;
        this.y = y;
        this.directionX = directionX;
        this.directionY = directionY;
        this.size = size;
        this.color = color;
      }

      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false);
        ctx.fillStyle = this.color;
        ctx.fill();
      }

      update() {
        // Bounce off canvas edges
        if (this.x > canvas.width || this.x < 0) this.directionX = -this.directionX;
        if (this.y > canvas.height || this.y < 0) this.directionY = -this.directionY;

        // Repel from pointer (mouse or touch)
        if (mouse.x !== null && mouse.y !== null) {
          const dx = mouse.x - this.x;
          const dy = mouse.y - this.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance < mouse.radius + this.size) {
            const force = (mouse.radius - distance) / mouse.radius;
            this.x -= (dx / distance) * force * 5;
            this.y -= (dy / distance) * force * 5;
          }
        }

        this.x += this.directionX;
        this.y += this.directionY;
        this.draw();
      }
    }

    // ── Particle pool ────────────────────────────────────────────────────────
    let particles: Particle[] = [];

    function init() {
      particles = [];
      // Density scales automatically with screen area — mobile gets ~30 particles,
      // tablet ~80, desktop ~230. All are comfortable for the O(n²) connect pass.
      const count = (canvas.height * canvas.width) / 9000;
      for (let i = 0; i < count; i++) {
        const size = Math.random() * 2 + 1;
        const x = Math.random() * (canvas.width - size * 4) + size * 2;
        const y = Math.random() * (canvas.height - size * 4) + size * 2;
        const dirX = Math.random() * 0.4 - 0.2;
        const dirY = Math.random() * 0.4 - 0.2;
        // Olive green — matches --primary in BahasaBot dark mode (#8a9f7b)
        particles.push(new Particle(x, y, dirX, dirY, size, "rgba(138, 159, 123, 0.75)"));
      }
    }

    // ── Connection lines ─────────────────────────────────────────────────────
    function connect() {
      const threshold = (canvas.width / 7) * (canvas.height / 7);

      for (let a = 0; a < particles.length; a++) {
        for (let b = a + 1; b < particles.length; b++) {
          const dx = particles[a].x - particles[b].x;
          const dy = particles[a].y - particles[b].y;
          const dist2 = dx * dx + dy * dy;

          if (dist2 < threshold) {
            const opacity = Math.max(0, 1 - dist2 / 20000);

            // Warm wheat (#dbc894) near pointer — olive everywhere else
            const nearPointer =
              mouse.x !== null &&
              mouse.y !== null &&
              Math.hypot(particles[a].x - mouse.x, particles[a].y - mouse.y) < mouse.radius;

            ctx.strokeStyle = nearPointer
              ? `rgba(219, 200, 148, ${opacity})`
              : `rgba(138, 159, 123, ${opacity})`;

            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(particles[a].x, particles[a].y);
            ctx.lineTo(particles[b].x, particles[b].y);
            ctx.stroke();
          }
        }
      }
    }

    // ── Render loop ──────────────────────────────────────────────────────────
    function animate() {
      animationFrameId = requestAnimationFrame(animate);
      // BahasaBot dark background (#111110) instead of pure black
      ctx.fillStyle = "#111110";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => p.update());
      connect();
    }

    // ── Resize ───────────────────────────────────────────────────────────────
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      init();
    };

    // ── Pointer events (mouse) ───────────────────────────────────────────────
    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    const handleMouseOut = () => {
      mouse.x = null;
      mouse.y = null;
    };

    // ── Pointer events (touch — mobile & tablet) ─────────────────────────────
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        mouse.x = e.touches[0].clientX;
        mouse.y = e.touches[0].clientY;
      }
    };

    const handleTouchEnd = () => {
      mouse.x = null;
      mouse.y = null;
    };

    // ── Wire everything up ───────────────────────────────────────────────────
    window.addEventListener("resize", resizeCanvas);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseout", handleMouseOut);
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchend", handleTouchEnd);

    resizeCanvas(); // sets canvas dimensions + calls init()
    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseout", handleMouseOut);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />;
}
