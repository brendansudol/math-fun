import { useMemo, type CSSProperties } from 'react'

const COLORS = ['#22a2e0', '#f2a93b', '#8e6cef', '#2eb872', '#ff7a7a', '#ffd43b']

export function Confetti({ count = 70 }: { count?: number }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        left: Math.random() * 100,
        delay: Math.random() * 0.6,
        duration: 2.2 + Math.random() * 1.6,
        drift: (Math.random() - 0.5) * 220,
        spin: (Math.random() < 0.5 ? -1 : 1) * (360 + Math.random() * 540),
        color: COLORS[i % COLORS.length],
        w: 7 + Math.random() * 7,
        round: Math.random() < 0.3,
      })),
    [count],
  )
  return (
    <div className="confetti" aria-hidden="true">
      {pieces.map((p, i) => (
        <span
          key={i}
          style={
            {
              left: `${p.left}%`,
              width: p.w,
              height: p.round ? p.w : p.w * 0.45,
              borderRadius: p.round ? '50%' : 2,
              background: p.color,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
              '--drift': `${p.drift}px`,
              '--spin': `${p.spin}deg`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  )
}
