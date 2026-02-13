"use client"

import { useEffect, useMemo, useRef } from "react"
import { cn } from "@/lib/utils"

type SpringOptions = {
  stiffness?: number
  damping?: number
}

export type StarsBackgroundProps = React.ComponentProps<"div"> & {
  factor?: number
  speed?: number
  transition?: SpringOptions
  starColor?: string
  pointerEvents?: boolean
}

const STAR_MAP = [
  { x: 6, y: 10, s: 2, d: 8, delay: 0 },
  { x: 12, y: 22, s: 3, d: 10, delay: 1.2 },
  { x: 18, y: 36, s: 2, d: 7, delay: 0.8 },
  { x: 25, y: 14, s: 4, d: 12, delay: 0.4 },
  { x: 31, y: 28, s: 2, d: 9, delay: 1.8 },
  { x: 38, y: 8, s: 3, d: 11, delay: 0.6 },
  { x: 44, y: 32, s: 2, d: 8, delay: 2.2 },
  { x: 52, y: 18, s: 4, d: 13, delay: 1.5 },
  { x: 59, y: 40, s: 2, d: 9, delay: 0.3 },
  { x: 66, y: 12, s: 3, d: 10, delay: 1.1 },
  { x: 72, y: 27, s: 2, d: 7, delay: 0.7 },
  { x: 79, y: 6, s: 4, d: 12, delay: 1.9 },
  { x: 85, y: 20, s: 3, d: 11, delay: 0.2 },
  { x: 91, y: 34, s: 2, d: 8, delay: 1.6 },
  { x: 8, y: 54, s: 3, d: 10, delay: 2.1 },
  { x: 15, y: 66, s: 2, d: 8, delay: 0.9 },
  { x: 22, y: 80, s: 4, d: 13, delay: 1.3 },
  { x: 29, y: 60, s: 2, d: 7, delay: 0.5 },
  { x: 36, y: 74, s: 3, d: 9, delay: 2.4 },
  { x: 43, y: 88, s: 2, d: 8, delay: 1.7 },
  { x: 50, y: 58, s: 4, d: 12, delay: 0.1 },
  { x: 57, y: 70, s: 2, d: 9, delay: 1.4 },
  { x: 64, y: 84, s: 3, d: 11, delay: 2.0 },
  { x: 71, y: 56, s: 2, d: 7, delay: 0.6 },
  { x: 78, y: 68, s: 4, d: 13, delay: 1.0 },
  { x: 86, y: 82, s: 2, d: 8, delay: 2.2 },
  { x: 93, y: 62, s: 3, d: 10, delay: 1.8 },
]

export function StarsBackground({
  factor = 0.05,
  speed = 50,
  transition = { stiffness: 50, damping: 20 },
  starColor = "#fff",
  pointerEvents = true,
  className,
  ...props
}: StarsBackgroundProps) {
  const layerRef = useRef<HTMLDivElement | null>(null)
  const frameRef = useRef<number | null>(null)
  const targetRef = useRef({ x: 0, y: 0 })
  const currentRef = useRef({ x: 0, y: 0 })
  const stars = useMemo(() => STAR_MAP, [])

  useEffect(() => {
    if (!pointerEvents) return

    const handlePointerMove = (event: PointerEvent) => {
      const nx = event.clientX / window.innerWidth - 0.5
      const ny = event.clientY / window.innerHeight - 0.5
      targetRef.current = {
        x: nx * window.innerWidth * factor,
        y: ny * window.innerHeight * factor,
      }
    }

    const handlePointerLeave = () => {
      targetRef.current = { x: 0, y: 0 }
    }

    const tick = () => {
      const stiffness = transition.stiffness ?? 50
      const damping = transition.damping ?? 20
      const dt = Math.max(0.01, 1 / Math.max(1, speed))
      const easing = Math.min(1, (stiffness / (stiffness + damping)) * dt * 8)

      currentRef.current.x += (targetRef.current.x - currentRef.current.x) * easing
      currentRef.current.y += (targetRef.current.y - currentRef.current.y) * easing

      if (layerRef.current) {
        layerRef.current.style.transform = `translate3d(${currentRef.current.x.toFixed(2)}px, ${currentRef.current.y.toFixed(2)}px, 0)`
      }

      frameRef.current = requestAnimationFrame(tick)
    }

    window.addEventListener("pointermove", handlePointerMove)
    window.addEventListener("pointerleave", handlePointerLeave)
    frameRef.current = requestAnimationFrame(tick)

    return () => {
      window.removeEventListener("pointermove", handlePointerMove)
      window.removeEventListener("pointerleave", handlePointerLeave)
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
    }
  }, [factor, pointerEvents, speed, transition.damping, transition.stiffness])

  return (
    <div
      className={cn(
        "relative overflow-hidden bg-[radial-gradient(circle_at_20%_10%,rgba(59,130,246,0.16),transparent_35%),radial-gradient(circle_at_80%_90%,rgba(34,197,94,0.12),transparent_30%),#05070b]",
        pointerEvents ? "pointer-events-auto" : "pointer-events-none",
        className
      )}
      aria-hidden="true"
      {...props}
    >
      <div ref={layerRef} className="absolute inset-0 opacity-90 will-change-transform">
        {stars.map((star, index) => (
          <span
            key={index}
            className="absolute block rounded-full shadow-[0_0_10px_rgba(255,255,255,0.65)]"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: `${star.s}px`,
              height: `${star.s}px`,
              backgroundColor: starColor,
              animation: `rp-gravity-stars-twinkle ${star.d}s ease-in-out ${star.delay}s infinite, rp-gravity-stars-rise ${Math.max(24, Math.round(3200 / Math.max(1, speed)))}s linear ${star.delay}s infinite`,
            }}
          />
        ))}
      </div>
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent,rgba(0,0,0,0.35))]" />
      <style jsx global>{`
        @keyframes rp-gravity-stars-twinkle {
          0% {
            opacity: 0.5;
          }
          50% {
            opacity: 1;
          }
          100% {
            opacity: 0.5;
          }
        }

        @keyframes rp-gravity-stars-rise {
          0% {
            transform: translate3d(0, 0, 0);
          }
          100% {
            transform: translate3d(0, -26px, 0);
          }
        }
      `}</style>
    </div>
  )
}

export function GravityStarsBackground(props: StarsBackgroundProps) {
  return <StarsBackground {...props} />
}
