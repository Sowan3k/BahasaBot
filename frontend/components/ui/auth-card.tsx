"use client";

/**
 * AuthCard — animated glass card shell used by both /login and /register.
 *
 * Features:
 *  - Full-screen ShaderAnimation background (Three.js GLSL)
 *  - 3D tilt on mouse move (framer-motion)
 *  - Traveling light-beam border animation (top → right → bottom → left)
 *  - Glass card surface (bg-black/50 backdrop-blur)
 */

import { motion, useMotionValue, useTransform } from "framer-motion";
import { ShaderAnimation } from "@/components/ui/shader-animation";

export function AuthCard({ children }: { children: React.ReactNode }) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useTransform(mouseY, [-300, 300], [10, -10]);
  const rotateY = useTransform(mouseX, [-300, 300], [-10, 10]);

  function handleMouseMove(e: React.MouseEvent) {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left - rect.width / 2);
    mouseY.set(e.clientY - rect.top - rect.height / 2);
  }

  function handleMouseLeave() {
    mouseX.set(0);
    mouseY.set(0);
  }

  return (
    <div className="min-h-screen w-screen bg-black relative overflow-hidden flex items-center justify-center">
      {/* Shader background — fills the entire screen behind the card */}
      <div className="absolute inset-0">
        <ShaderAnimation />
      </div>

      {/* Card wrapper — handles 3D tilt */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-sm relative z-10 px-4"
        style={{ perspective: 1500 }}
      >
        <motion.div
          style={{ rotateX, rotateY }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <div className="relative group">
            {/* Traveling border beams */}
            <div className="absolute -inset-[1px] rounded-2xl overflow-hidden pointer-events-none">
              {/* Top */}
              <motion.div
                className="absolute top-0 left-0 h-[2px] w-[50%] bg-gradient-to-r from-transparent via-white to-transparent"
                animate={{ left: ["-50%", "100%"], opacity: [0.3, 0.65, 0.3] }}
                transition={{
                  left: { duration: 2.5, ease: "easeInOut", repeat: Infinity, repeatDelay: 1 },
                  opacity: { duration: 1.2, repeat: Infinity, repeatType: "mirror" },
                }}
              />
              {/* Right */}
              <motion.div
                className="absolute top-0 right-0 h-[50%] w-[2px] bg-gradient-to-b from-transparent via-white to-transparent"
                animate={{ top: ["-50%", "100%"], opacity: [0.3, 0.65, 0.3] }}
                transition={{
                  top: { duration: 2.5, ease: "easeInOut", repeat: Infinity, repeatDelay: 1, delay: 0.6 },
                  opacity: { duration: 1.2, repeat: Infinity, repeatType: "mirror", delay: 0.6 },
                }}
              />
              {/* Bottom */}
              <motion.div
                className="absolute bottom-0 right-0 h-[2px] w-[50%] bg-gradient-to-r from-transparent via-white to-transparent"
                animate={{ right: ["-50%", "100%"], opacity: [0.3, 0.65, 0.3] }}
                transition={{
                  right: { duration: 2.5, ease: "easeInOut", repeat: Infinity, repeatDelay: 1, delay: 1.2 },
                  opacity: { duration: 1.2, repeat: Infinity, repeatType: "mirror", delay: 1.2 },
                }}
              />
              {/* Left */}
              <motion.div
                className="absolute bottom-0 left-0 h-[50%] w-[2px] bg-gradient-to-b from-transparent via-white to-transparent"
                animate={{ bottom: ["-50%", "100%"], opacity: [0.3, 0.65, 0.3] }}
                transition={{
                  bottom: { duration: 2.5, ease: "easeInOut", repeat: Infinity, repeatDelay: 1, delay: 1.8 },
                  opacity: { duration: 1.2, repeat: Infinity, repeatType: "mirror", delay: 1.8 },
                }}
              />
            </div>

            {/* Glass card surface */}
            <div className="relative bg-black/50 backdrop-blur-xl rounded-2xl border border-white/[0.07] shadow-2xl overflow-hidden p-6">
              {children}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
