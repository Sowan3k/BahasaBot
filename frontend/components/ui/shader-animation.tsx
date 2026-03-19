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

    // Botanical Garden palette
    // Fern Green  #4a7c59  →  vec3(0.290, 0.486, 0.349)
    // Marigold    #f9a620  →  vec3(0.976, 0.651, 0.125)
    // Terracotta  #b7472a  →  vec3(0.718, 0.278, 0.165)
    // Cream       #f5f3ed  →  vec3(0.961, 0.953, 0.929)
    const fragmentShader = `
      precision highp float;
      uniform vec2 resolution;
      uniform float time;

      void main(void) {
        vec2 uv = (gl_FragCoord.xy * 2.0 - resolution.xy) / min(resolution.x, resolution.y);
        float t = time * 0.05;
        float lineWidth = 0.003;

        vec3 fernGreen  = vec3(0.290, 0.486, 0.349);
        vec3 marigold   = vec3(0.976, 0.651, 0.125);
        vec3 terracotta = vec3(0.718, 0.278, 0.165);
        vec3 cream      = vec3(0.961, 0.953, 0.929);

        // Deep forest green background
        vec3 color = vec3(0.050, 0.102, 0.063);

        for (int i = 0; i < 5; i++) {
          float fi = float(i);
          float w = lineWidth * fi * fi;

          float r0 = w / abs(fract(t        + fi * 0.01) * 5.0 - length(uv) + mod(uv.x + uv.y, 0.2));
          float r1 = w / abs(fract(t - 0.01 + fi * 0.01) * 5.0 - length(uv) + mod(uv.x + uv.y, 0.2));
          float r2 = w / abs(fract(t - 0.02 + fi * 0.01) * 5.0 - length(uv) + mod(uv.x + uv.y, 0.2));
          float r3 = w / abs(fract(t - 0.03 + fi * 0.01) * 5.0 - length(uv) + mod(uv.x + uv.y, 0.2));

          color += r0 * fernGreen
                 + r1 * marigold
                 + r2 * terracotta
                 + r3 * cream * 0.4;
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
      style={{ background: "#0d1a0f", overflow: "hidden" }}
    />
  )
}
