"use client";

import React, { useRef, useEffect, useState } from 'react';
import { cn } from "@/lib/utils";
import { RippleButton } from "@/components/ui/multi-type-ripple-buttons";

// ── Internal CheckIcon ────────────────────────────────────────────────────────

const CheckIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16" height="16" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="3"
    strokeLinecap="round" strokeLinejoin="round"
    className={className}
  >
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

// ── ShaderCanvas ──────────────────────────────────────────────────────────────
// Animated WebGL background. Background colour matches BahasaBot's palette:
//   light → cream parchment #e4d7b0   dark → near-black #111110

export const ShaderCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const glProgramRef = useRef<WebGLProgram | null>(null);
  const glBgColorLocationRef = useRef<WebGLUniformLocation | null>(null);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  // Light: #e4d7b0 → (0.894, 0.843, 0.690)  Dark: #111110 → (0.067, 0.067, 0.063)
  const [backgroundColor, setBackgroundColor] = useState([0.894, 0.843, 0.690]);

  useEffect(() => {
    const root = document.documentElement;
    const updateColor = () => {
      const isDark = root.classList.contains('dark');
      setBackgroundColor(isDark ? [0.067, 0.067, 0.063] : [0.894, 0.843, 0.690]);
    };
    updateColor();
    const observer = new MutationObserver((mutationsList) => {
      for (const mutation of mutationsList) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          updateColor();
        }
      }
    });
    observer.observe(root, { attributes: true });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const gl = glRef.current;
    const program = glProgramRef.current;
    const location = glBgColorLocationRef.current;
    if (gl && program && location) {
      gl.useProgram(program);
      gl.uniform3fv(location, new Float32Array(backgroundColor));
    }
  }, [backgroundColor]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext('webgl');
    if (!gl) { console.error("WebGL not supported"); return; }
    glRef.current = gl;

    const vertexShaderSource = `attribute vec2 aPosition; void main() { gl_Position = vec4(aPosition, 0.0, 1.0); }`;
    const fragmentShaderSource = `
      precision highp float;
      uniform float iTime;
      uniform vec2 iResolution;
      uniform vec3 uBackgroundColor;
      mat2 rotate2d(float angle){ float c=cos(angle),s=sin(angle); return mat2(c,-s,s,c); }
      float variation(vec2 v1,vec2 v2,float strength,float speed){ return sin(dot(normalize(v1),normalize(v2))*strength+iTime*speed)/100.0; }
      vec3 paintCircle(vec2 uv,vec2 center,float rad,float width){
        vec2 diff = center-uv;
        float len = length(diff);
        len += variation(diff,vec2(0.,1.),5.,2.);
        len -= variation(diff,vec2(1.,0.),5.,2.);
        float circle = smoothstep(rad-width,rad,len)-smoothstep(rad,rad+width,len);
        return vec3(circle);
      }
      void main(){
        vec2 uv = gl_FragCoord.xy/iResolution.xy;
        uv.x *= 1.5; uv.x -= 0.25;
        float mask = 0.0;
        float radius = .35;
        vec2 center = vec2(.5);
        mask += paintCircle(uv,center,radius,.035).r;
        mask += paintCircle(uv,center,radius-.018,.01).r;
        mask += paintCircle(uv,center,radius+.018,.005).r;
        vec2 v=rotate2d(iTime)*uv;
        vec3 foregroundColor=vec3(v.x*.6+.3,v.y*.5+.35,.5-v.y*v.x*.4);
        vec3 color=mix(uBackgroundColor,foregroundColor,mask);
        color=mix(color,vec3(.95,.92,.85),paintCircle(uv,center,radius,.003).r);
        gl_FragColor=vec4(color,1.);
      }`;

    const compileShader = (type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) throw new Error("Could not create shader");
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        throw new Error(gl.getShaderInfoLog(shader) || "Shader compilation error");
      }
      return shader;
    };

    const program = gl.createProgram();
    if (!program) throw new Error("Could not create program");
    const vertexShader = compileShader(gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = compileShader(gl.FRAGMENT_SHADER, fragmentShaderSource);
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    gl.useProgram(program);
    glProgramRef.current = program;

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]), gl.STATIC_DRAW);
    const aPosition = gl.getAttribLocation(program, 'aPosition');
    gl.enableVertexAttribArray(aPosition);
    gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);

    const iTimeLoc = gl.getUniformLocation(program, 'iTime');
    const iResLoc = gl.getUniformLocation(program, 'iResolution');
    glBgColorLocationRef.current = gl.getUniformLocation(program, 'uBackgroundColor');
    gl.uniform3fv(glBgColorLocationRef.current, new Float32Array(backgroundColor));

    let animationFrameId: number;
    const render = (time: number) => {
      gl.uniform1f(iTimeLoc, time * 0.001);
      gl.uniform2f(iResLoc, canvas.width, canvas.height);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      animationFrameId = requestAnimationFrame(render);
    };
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    animationFrameId = requestAnimationFrame(render);
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <canvas ref={canvasRef} className="fixed top-0 left-0 w-full h-full block z-0" />;
};

// ── GlassCard ─────────────────────────────────────────────────────────────────
// Generic glass-morphism wrapper. Uses BahasaBot's background/border tokens.

export interface GlassCardProps {
  children: React.ReactNode;
  featured?: boolean;
  className?: string;
}

export const GlassCard = ({ children, featured = false, className }: GlassCardProps) => (
  <div
    className={cn(
      "backdrop-blur-[28px] bg-gradient-to-br rounded-2xl shadow-xl transition-all duration-300",
      "from-white/60 to-white/40 border border-black/12",
      "dark:from-white/14 dark:to-white/7 dark:border-white/12 dark:backdrop-brightness-[0.88]",
      featured && "ring-2 ring-primary/40 from-white/75 to-white/55 dark:from-white/22 dark:to-white/12 dark:border-primary/30 shadow-2xl",
      className
    )}
  >
    {children}
  </div>
);

// ── PricingCard (standalone, flat-props API) ──────────────────────────────────

export interface PricingCardProps {
  planName: string;
  description: string;
  price: string;
  priceSuffix?: string;
  features: string[];
  buttonText: string;
  isPopular?: boolean;
  buttonVariant?: 'primary' | 'secondary';
  onButtonClick?: () => void;
}

export const PricingCard = ({
  planName, description, price, priceSuffix = '/mo', features,
  buttonText, isPopular = false, buttonVariant = 'primary', onButtonClick,
}: PricingCardProps) => {
  const buttonClasses = cn(
    "mt-auto w-full py-2.5 rounded-xl font-semibold text-[14px] transition font-sans",
    buttonVariant === 'primary'
      ? "bg-primary hover:bg-primary/90 text-primary-foreground"
      : "bg-black/10 hover:bg-black/20 text-foreground border border-black/20 dark:bg-white/10 dark:hover:bg-white/20 dark:text-white dark:border-white/20"
  );

  return (
    <GlassCard
      featured={isPopular}
      className={cn("relative flex-1 max-w-xs px-7 py-8 flex flex-col", isPopular && "scale-105")}
    >
      {isPopular && (
        <div className="absolute -top-4 right-4 px-3 py-1 text-[12px] font-semibold rounded-full bg-primary text-primary-foreground">
          Most Popular
        </div>
      )}
      <div className="mb-3">
        <h2 className="text-[40px] font-extralight tracking-[-0.03em] text-foreground font-heading">{planName}</h2>
        <p className="text-[15px] text-foreground/70 mt-1 font-sans">{description}</p>
      </div>
      <div className="my-6 flex items-baseline gap-2">
        <span className="text-[48px] font-extralight text-foreground font-heading">{price}</span>
        <span className="text-[14px] text-foreground/70 font-sans">{priceSuffix}</span>
      </div>
      <div className="w-full mb-5 h-px bg-gradient-to-r from-transparent via-black/10 to-transparent dark:via-white/15" />
      <ul className="flex flex-col gap-2 text-[14px] text-foreground/90 mb-6 font-sans">
        {features.map((feature, index) => (
          <li key={index} className="flex items-center gap-2">
            <CheckIcon className="text-primary w-4 h-4 shrink-0" />
            {feature}
          </li>
        ))}
      </ul>
      <RippleButton className={buttonClasses} onClick={onButtonClick}>{buttonText}</RippleButton>
    </GlassCard>
  );
};

// ── ModernPricingPage ─────────────────────────────────────────────────────────

interface ModernPricingPageProps {
  title: React.ReactNode;
  subtitle: React.ReactNode;
  plans: PricingCardProps[];
  showAnimatedBackground?: boolean;
}

export const ModernPricingPage = ({
  title, subtitle, plans, showAnimatedBackground = true,
}: ModernPricingPageProps) => (
  <div className="bg-background text-foreground min-h-screen w-full overflow-x-hidden">
    {showAnimatedBackground && <ShaderCanvas />}
    <main className="relative w-full min-h-screen flex flex-col items-center justify-center px-4 py-8 z-10">
      <div className="w-full max-w-5xl mx-auto text-center mb-14">
        <h1 className="text-[48px] md:text-[64px] font-extralight leading-tight tracking-[-0.03em] bg-clip-text text-transparent bg-gradient-to-r from-foreground via-primary to-accent font-heading">
          {title}
        </h1>
        <p className="mt-3 text-[16px] md:text-[20px] text-foreground/80 max-w-2xl mx-auto font-sans">
          {subtitle}
        </p>
      </div>
      <div className="flex flex-col md:flex-row gap-8 md:gap-6 justify-center items-center w-full max-w-4xl">
        {plans.map((plan) => <PricingCard key={plan.planName} {...plan} />)}
      </div>
    </main>
  </div>
);
