type Props = {
  onDigit: (d: string) => void
  onDelete: () => void
  onEnter: () => void
  disabled?: boolean
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'del', '0', 'enter']

/** On-screen number pad for tablets and phones. */
export function Keypad({ onDigit, onDelete, onEnter, disabled }: Props) {
  return (
    <div className="keypad">
      {KEYS.map((k) => (
        <button
          key={k}
          type="button"
          className={`key key-${k.length > 1 ? k : 'digit'}`}
          disabled={disabled}
          // Keep focus on the answer box so a hardware keyboard keeps working.
          onPointerDown={(e) => e.preventDefault()}
          onClick={() => (k === 'del' ? onDelete() : k === 'enter' ? onEnter() : onDigit(k))}
          aria-label={k === 'del' ? 'Delete' : k === 'enter' ? 'Check answer' : k}
        >
          {k === 'del' ? '⌫' : k === 'enter' ? '✓' : k}
        </button>
      ))}
    </div>
  )
}
