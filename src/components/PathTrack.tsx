import { OPS, OP_INFO } from '../lib/facts'
import { currentStep, stepSubtitle, stepsFor, type Step } from '../lib/path'

type Props = {
  completed: string[]
  onStep: (step: Step) => void
}

export function PathTrack({ completed, onStep }: Props) {
  const done = new Set(completed)
  const here = currentStep(completed)
  const activeOp = here?.op ?? 'divide'

  return (
    <div className="path-scroll">
      <div className="path">
        {OPS.map((op) => {
          const steps = stepsFor(op)
          const doneCount = steps.filter((s) => done.has(s.id)).length
          const active = op === activeOp
          return (
            <div key={op} className={active ? 'path-seg is-active' : 'path-seg'}>
              <div className="path-label">{OP_INFO[op].label}</div>
              <div className="path-bar">
                <span style={{ width: `${(doneCount / steps.length) * 100}%` }} />
              </div>
              <ol className="path-nodes">
                {steps.map((s) => {
                  const state = done.has(s.id) ? 'is-done' : s === here ? 'is-here' : 'is-locked'
                  const label = s.kind === 'number' ? s.numbers[0] : s.kind === 'star' ? '★' : ''
                  return (
                    <li key={s.id}>
                      <button
                        className={`node node-${s.kind} ${state}`}
                        disabled={state === 'is-locked'}
                        onClick={() => onStep(s)}
                        title={stepSubtitle(s)}
                        aria-label={`${stepSubtitle(s)}${state === 'is-done' ? ' (done)' : ''}`}
                      >
                        <span className="node-shape" />
                        {active && <span className="node-label">{label}</span>}
                      </button>
                    </li>
                  )
                })}
              </ol>
            </div>
          )
        })}
      </div>
    </div>
  )
}
