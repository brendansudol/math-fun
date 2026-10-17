import type { Op } from '../lib/facts'

/** Chunky rounded operator glyphs, drawn so they line up regardless of font. */
export function OpIcon({ op, size = 48 }: { op: Op; size?: number }) {
  const stroke = { stroke: 'currentColor', strokeWidth: 9, strokeLinecap: 'round' as const, fill: 'none' }
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} aria-hidden="true" className="op-icon">
      {op === 'times' && <path d="M13 13l22 22M35 13L13 35" {...stroke} />}
      {op === 'plus' && <path d="M24 9v30M9 24h30" {...stroke} />}
      {op === 'minus' && <path d="M11 24h26" {...stroke} />}
      {op === 'divide' && (
        <>
          <path d="M9 24h30" {...stroke} />
          <circle cx="24" cy="11" r="4.6" fill="currentColor" />
          <circle cx="24" cy="37" r="4.6" fill="currentColor" />
        </>
      )}
    </svg>
  )
}
