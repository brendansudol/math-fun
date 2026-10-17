import { useState } from 'react'
import { OpIcon } from '../components/OpIcon'
import { NUMBERS, OP_INFO, numbersLabel, type Op } from '../lib/facts'
import { MODE_INFO, type FreeMode, type SessionConfig } from '../lib/session'
import { recordKey, updateProfile, useProfile } from '../lib/store'

type Props = {
  mode: FreeMode
  onStart: (config: SessionConfig) => void
}

const PICKER_OPS: Op[] = ['times', 'divide', 'plus', 'minus']

export function Picker({ mode, onStart }: Props) {
  const profile = useProfile()
  const [op, setOp] = useState<Op>(profile.lastPick.op)
  const [numbers, setNumbers] = useState<number[]>(profile.lastPick.numbers)

  const all = numbers.length === NUMBERS.length

  const toggle = (n: number) => {
    // From "All", tapping a number narrows straight down to it.
    if (all) return setNumbers([n])
    if (numbers.includes(n)) {
      if (numbers.length > 1) setNumbers(numbers.filter((x) => x !== n))
    } else {
      setNumbers([...numbers, n].sort((a, b) => a - b))
    }
  }

  const best = mode === 'endless' ? undefined : profile.records[recordKey(mode, op, numbers)]

  const start = () => {
    updateProfile((p) => {
      p.lastPick = { op, numbers }
    })
    onStart({ mode, op, numbers, title: `${OP_INFO[op].label} · ${numbersLabel(numbers)}` })
  }

  return (
    <main className="page">
      <header className="page-head">
        <p className="eyebrow">Math · {MODE_INFO[mode].label}</p>
        <h1 className="display">Practice facts</h1>
      </header>

      <div className="op-grid" role="radiogroup" aria-label="Operation">
        {PICKER_OPS.map((o) => (
          <button
            key={o}
            role="radio"
            aria-checked={o === op}
            className={o === op ? 'op-card is-on' : 'op-card'}
            onClick={() => setOp(o)}
          >
            <span className="op-inner">
              <OpIcon op={o} size={56} />
              <span className="op-label">{OP_INFO[o].label}</span>
            </span>
          </button>
        ))}
      </div>

      <section className="panel numbers-panel">
        <h2 className="panel-heading">Pick numbers</h2>
        <div className="num-grid">
          <button className={all ? 'num is-on' : 'num'} aria-pressed={all} onClick={() => setNumbers(NUMBERS)}>
            All
          </button>
          {NUMBERS.map((n) => {
            const on = !all && numbers.includes(n)
            return (
              <button key={n} className={on ? 'num is-on' : 'num'} aria-pressed={on} onClick={() => toggle(n)}>
                {n}
              </button>
            )
          })}
        </div>
      </section>

      <div className="start-row">
        <button className="btn btn-primary btn-xl" onClick={start}>
          Start
        </button>
        {best !== undefined && (
          <p className="best-note">
            Best {mode === 'timed' ? 'score' : 'streak'} here: <strong>{best}</strong>
          </p>
        )}
      </div>
    </main>
  )
}
