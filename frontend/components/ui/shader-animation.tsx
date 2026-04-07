"use client"

import { useEffect, useRef } from "react"
import * as THREE from "three"

export function ShaderAnimation() {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<{
    camera: THREE.Camera
    scene: THREE.Scene
    renderer: THREE.WebGLRenderer
    uniforms: any
    animationId: number
  } | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const container = containerRef.current

    const vertexShader = `
      void main() {
        gl_Position = vec4( position, 1.0 );
      }
    `

    // BahasaBot Design System palette (dark-mode shader)
    // Primary:    #8a9f7b  →  vec3(0.541, 0.624, 0.482)  — olive sage
    // Accent:     #a18f5c  →  vec3(0.635, 0.561, 0.361)  — warm wheat (dark)
    // Ring:       #9db18c  →  vec3(0.616, 0.694, 0.549)  — soft sage
    // Background: #e4d7b0  →  vec3(0.894, 0.843, 0.690)  — cream (light streaks)
    const fragmentShader = `
      precision highp float;
      uniform vec2 resolution;
      uniform float time;

      void main(void) {
        vec2 uv = (gl_FragCoord.xy * 2.0 - resolution.xy) / min(resolution.x, resolution.y);
        float t = time * 0.05;
        float lineWidth = 0.003;

        vec3 primary = vec3(0.541, 0.624, 0.482);   // #8a9f7b — olive sage
        vec3 accent  = vec3(0.635, 0.561, 0.361);   // #a18f5c — warm wheat
        vec3 ringCol = vec3(0.616, 0.694, 0.549);   // #9db18c — soft sage
        vec3 bgLight = vec3(0.894, 0.843, 0.690);   // #e4d7b0 — cream

        // Dark olive base (#14120a) — matches new dark palette
        vec3 color = vec3(0.078, 0.071, 0.039);

        for (int i = 0; i < 5; i++) {
          float fi = float(i);
          float w = lineWidth * fi * fi;

          float r0 = w / abs(fract(t        + fi * 0.01) * 5.0 - length(uv) + mod(uv.x + uv.y, 0.2));
          float r1 = w / abs(fract(t - 0.01 + fi * 0.01) * 5.0 - length(uv) + mod(uv.x + uv.y, 0.2));
          float r2 = w / abs(fract(t - 0.02 + fi * 0.01) * 5.0 - length(uv) + mod(uv.x + uv.y, 0.2));
          float r3 = w / abs(fract(t - 0.03 + fi * 0.01) * 5.0 - length(uv) + mod(uv.x + uv.y, 0.2));

          color += r0 * primary   * 0.7
                 + r1 * accent    * 0.5
                 + r2 * ringCol   * 0.6
                 + r3 * bgLight   * 0.15;
        }

        gl_FragColor = vec4(color, 1.0);
      }
    `

    const camera = new THREE.Camera()
    camera.position.z = 1

    const scene = new THREE.Scene()
    const geometry = new THREE.PlaneGeometry(2, 2)

    const uniforms = {
      time: { type: "f", value: 1.0 },
      resolution: { type: "v2", value: new THREE.Vector2() },
    }

    const material = new THREE.ShaderMaterial({
      uniforms: uniforms,
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
    })

    const mesh = new THREE.Mesh(geometry, material)
    scene.add(mesh)

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(window.devicePixelRatio)
    container.appendChild(renderer.domElement)

    const onWindowResize = () => {
      const width = container.clientWidth
      const height = container.clientHeight
      renderer.setSize(width, height)
      uniforms.resolution.value.x = renderer.domElement.width
      uniforms.resolution.value.y = renderer.domElement.height
    }

    onWindowResize()
    window.addEventListener("resize", onWindowResize, false)

    const animate = () => {
      const animationId = requestAnimationFrame(animate)
      uniforms.time.value += 0.05
      renderer.render(scene, camera)
      if (sceneRef.current) {
        sceneRef.current.animationId = animationId
      }
    }

    sceneRef.current = { camera, scene, renderer, uniforms, animationId: 0 }
    animate()

    return () => {
      window.removeEventListener("resize", onWindowResize)
      if (sceneRef.current) {
        cancelAnimationFrame(sceneRef.current.animationId)
        if (container && sceneRef.current.renderer.domElement) {
          container.removeChild(sceneRef.current.renderer.domElement)
        }
        sceneRef.current.renderer.dispose()
        geometry.dispose()
        material.dispose()
      }
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
      style={{ background: "#14120a", overflow: "hidden" }}
    />
  )
}
