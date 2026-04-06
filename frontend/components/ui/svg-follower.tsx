"use client"

import { useRef, useEffect, useCallback } from "react"

interface Position {
  x: number
  y: number
}

interface Point {
  position: Position
  time: number
  drift: Position
  age: number
  direction: Position
}

interface SVGFollowerProps {
  /** Colours cycled across the follower trails. Defaults to BahasaBot theme palette. */
  colors?: string[]
  /** How long (ms) a trail point lives before being removed. */
  removeDelay?: number
  /** Opacity applied to every drawn path/shape (0–1). */
  opacity?: number
  /** Extra className on the outer wrapper div. */
  className?: string
  /**
   * When true, mouse/touch events are captured from `window` instead of the
   * container div. Use this when the component is a fixed/absolute background
   * so that pointer-events-none can be set and clicks still reach content above.
   */
  useWindowEvents?: boolean
}

export function SVGFollower({
  colors = ["#8d9d4f", "#9db18c", "#dbc894", "#b19681", "#5e6e58"],
  removeDelay = 400,
  opacity = 1,
  className = "",
  useWindowEvents = false,
}: SVGFollowerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const followersRef = useRef<InstanceType<ReturnType<typeof makeFollowerClass>>[]>([])
  const animationRef = useRef<number>()

  // Factory so the class can close over svgRef, removeDelay, and opacity
  // without being defined inside render (avoids class-in-loop lint warning).
  function makeFollowerClass(
    stage: SVGSVGElement,
    color: string,
    delay: number,
    alpha: number,
  ) {
    class Follower {
      private points: Point[] = []
      private line: SVGPathElement

      constructor() {
        this.line = document.createElementNS("http://www.w3.org/2000/svg", "path")
        this.line.style.fill = color
        this.line.style.stroke = color
        this.line.style.strokeWidth = "1"
        this.line.style.opacity = String(alpha)
        stage.appendChild(this.line)
      }

      private getDrift(): number {
        return (Math.random() - 0.5) * 3
      }

      public add(position: Position) {
        const direction: Position = { x: 0, y: 0 }
        if (this.points[0]) {
          direction.x = (position.x - this.points[0].position.x) * 0.25
          direction.y = (position.y - this.points[0].position.y) * 0.25
        }

        const point: Point = {
          position,
          time: Date.now(),
          drift: {
            x: this.getDrift() + direction.x / 2,
            y: this.getDrift() + direction.y / 2,
          },
          age: 0,
          direction,
        }

        const shapeChance = Math.random()
        const chance = 0.1
        if (shapeChance < chance) this.makeCircle(point)
        else if (shapeChance < chance * 2) this.makeSquare(point)
        else if (shapeChance < chance * 3) this.makeTriangle(point)

        this.points.unshift(point)
      }

      private createLine(points: Point[]): string {
        if (!points.length) return ""
        const path: string[] = ["M"]
        let forward = true
        let i = 0

        while (i >= 0) {
          const point = points[i]
          const offsetX = point.direction.x * ((i - points.length) / points.length) * 0.6
          const offsetY = point.direction.y * ((i - points.length) / points.length) * 0.6
          const x = point.position.x + (forward ? offsetY : -offsetY)
          const y = point.position.y + (forward ? offsetX : -offsetX)
          point.age += 0.2

          path.push(String(x + point.drift.x * point.age))
          path.push(String(y + point.drift.y * point.age))

          i += forward ? 1 : -1
          if (i === points.length) {
            i--
            forward = false
          }
        }

        return path.join(" ")
      }

      public trim() {
        if (this.points.length > 0) {
          const last = this.points[this.points.length - 1]
          if (last.time < Date.now() - delay) {
            this.points.pop()
          }
        }
        this.line.setAttribute("d", this.createLine(this.points))
      }

      private makeCircle(point: Point) {
        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle")
        const radius = (Math.abs(point.direction.x) + Math.abs(point.direction.y)) * 1
        circle.setAttribute("r", String(radius))
        circle.style.fill = color
        circle.style.opacity = String(alpha)
        circle.setAttribute("cx", "0")
        circle.setAttribute("cy", "0")
        this.moveShape(circle, point)
      }

      private makeSquare(point: Point) {
        const size = (Math.abs(point.direction.x) + Math.abs(point.direction.y)) * 1.5
        const square = document.createElementNS("http://www.w3.org/2000/svg", "rect")
        square.setAttribute("width", String(size))
        square.setAttribute("height", String(size))
        square.style.fill = color
        square.style.opacity = String(alpha)
        this.moveShape(square, point)
      }

      private makeTriangle(point: Point) {
        const size = (Math.abs(point.direction.x) + Math.abs(point.direction.y)) * 1.5
        const triangle = document.createElementNS("http://www.w3.org/2000/svg", "polygon")
        triangle.setAttribute("points", `0,0 ${size},${size / 2} 0,${size}`)
        triangle.style.fill = color
        triangle.style.opacity = String(alpha)
        this.moveShape(triangle, point)
      }

      private moveShape(shape: SVGElement, point: Point) {
        stage.appendChild(shape)
        const driftX =
          point.position.x +
          point.direction.x * (Math.random() * 20) +
          point.drift.x * (Math.random() * 10)
        const driftY =
          point.position.y +
          point.direction.y * (Math.random() * 20) +
          point.drift.y * (Math.random() * 10)

        shape.style.transform = `translate(${point.position.x}px, ${point.position.y}px)`
        shape.style.transition = "all 0.5s ease-out"

        setTimeout(() => {
          shape.style.transform = `translate(${driftX}px, ${driftY}px) scale(0) rotate(${Math.random() * 360}deg)`
          setTimeout(() => {
            if (stage.contains(shape)) stage.removeChild(shape)
          }, 500)
        }, 10)
      }
    }
    return Follower
  }

  // Resolve mouse/touch position relative to the container rect.
  const resolvePosition = useCallback((clientX: number, clientY: number): Position | null => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return null
    return { x: clientX - rect.left, y: clientY - rect.top }
  }, [])

  const feedPosition = useCallback(
    (pos: Position) => {
      followersRef.current.forEach((f) => f.add(pos))
    },
    [],
  )

  // Handlers for inline (non-window) mode
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const pos = resolvePosition(e.clientX, e.clientY)
      if (pos) feedPosition(pos)
    },
    [resolvePosition, feedPosition],
  )

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault()
      const touch = e.touches[0]
      const pos = resolvePosition(touch.clientX, touch.clientY)
      if (pos) feedPosition(pos)
    },
    [resolvePosition, feedPosition],
  )

  const animate = useCallback(() => {
    followersRef.current.forEach((f) => f.trim())
    animationRef.current = requestAnimationFrame(animate)
  }, [])

  // Initialise followers + animation loop
  useEffect(() => {
    if (!svgRef.current) return
    const stage = svgRef.current

    // Clear any SVG children left by a previous run (e.g. on theme/color change)
    while (stage.firstChild) {
      stage.removeChild(stage.firstChild)
    }

    followersRef.current = colors.map((color) => {
      const FollowerClass = makeFollowerClass(stage, color, removeDelay, opacity)
      return new FollowerClass()
    })

    animate()

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [colors, removeDelay, opacity, animate])

  // Window-level event listeners (background mode)
  useEffect(() => {
    if (!useWindowEvents) return

    function onWindowMouseMove(e: MouseEvent) {
      const pos = resolvePosition(e.clientX, e.clientY)
      if (pos) feedPosition(pos)
    }

    function onWindowTouchMove(e: TouchEvent) {
      const touch = e.touches[0]
      const pos = resolvePosition(touch.clientX, touch.clientY)
      if (pos) feedPosition(pos)
    }

    window.addEventListener("mousemove", onWindowMouseMove)
    window.addEventListener("touchmove", onWindowTouchMove, { passive: true })

    return () => {
      window.removeEventListener("mousemove", onWindowMouseMove)
      window.removeEventListener("touchmove", onWindowTouchMove)
    }
  }, [useWindowEvents, resolvePosition, feedPosition])

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      onMouseMove={useWindowEvents ? undefined : handleMouseMove}
      onTouchMove={useWindowEvents ? undefined : handleTouchMove}
    >
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        xmlns="http://www.w3.org/2000/svg"
        className="absolute inset-0"
      />
    </div>
  )
}
