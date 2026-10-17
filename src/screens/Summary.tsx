import { Confetti } from '../components/Confetti'
import { factKey, factText } from '../lib/facts'
import { currentStep, stepSubtitle, type Step } from '../lib/path'
import { MODE_INFO, type SessionResult } from '../lib/session'
import { useProfile } from '../lib/store'

type Props = {
  result: SessionResult
  onAgain: () => void
  onHome: () => void
  onStep: (step: Step) => void
}

function headline(r: SessionResult) {
  const { mode } = r.config
  if (mode === 'guided') return r.finished ? 'Step complete!' : 'Good practice'
  if (mode === 'bonus') return r.finished ? 'Bonus complete!' : 'So close!'
  if (mode === 'timed') return 'Time’s up!'
  if (mode === 'streak') return r.record?.isNew ? 'New best streak!' : 'Run over'
  return 'Nice practice!'
}

export function Summary({ result: r, onAgain, onHome, onStep }: Props) {
  const profile = useProfile()
  const { mode } = r.config
  const big = mode === 'streak' ? r.bestStreak : r.correct
  const bigLabel = mode === 'streak' ? 'in a row' : mode === 'timed' ? 'correct in one minute' : 'correct'
  const accuracy = r.attempts ? Math.round((r.correct / r.attempts) * 100) : 0
  const avg = r.attempts ? (r.ms / r.attempts / 1000).toFixed(1) : '–'
  const celebrate = r.finished || r.record?.isNew

  const misses = [...new Map(r.misses.map((f) => [factKey(f), f])).values()]
  const next = mode === 'guided' && r.finished ? currentStep(profile.completed) : null

  return (
    <main className="page summary">
      {celebrate && <Confetti />}
      <header className="page-head">
        <p className="eyebrow">
          {MODE_INFO[mode].label} · {r.config.title}
        </p>
        <h1 className="display">{headline(r)}</h1>
      </header>

      <section className="panel result">
        <div className="panel-inner result-inner">
          <div className="result-hero">
            <span className="result-num">{big}</span>
            <span className="result-label">{bigLabel}</span>
            {r.record?.isNew && (
              <span className="badge badge-record">{r.record.prev === undefined ? 'First record!' : `New best · was ${r.record.prev}`}</span>
            )}
            {r.record && !r.record.isNew && r.record.prev !== undefined && (
              <span className="badge">Best: {r.record.prev}</span>
            )}
          </div>
          <dl className="result-stats">
            <div>
              <dt>Answered</dt>
              <dd>{r.attempts}</dd>
            </div>
            <div>
              <dt>Accuracy</dt>
              <dd>{r.attempts ? `${accuracy}%` : '–'}</dd>
            </div>
            <div>
              <dt>Avg time</dt>
              <dd>{avg === '–' ? avg : `${avg}s`}</dd>
            </div>
            <div className="is-points">
              <dt>Points</dt>
              <dd>+{r.pointsEarned}</dd>
            </div>
          </dl>
        </div>
      </section>

      {misses.length > 0 && (
        <section className="panel misses">
          <h2 className="panel-heading">Facts to practice</h2>
          <ul className="miss-list">
            {misses.map((f) => (
              <li key={factKey(f)} className="miss">
                {factText(f)} = <strong>{f.answer}</strong>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="summary-actions">
        {next ? (
          <>
            <button className="btn btn-primary btn-xl" onClick={() => onStep(next)}>
              Next: {stepSubtitle(next).split(' — ')[0]}
            </button>
            <button className="btn btn-soft" onClick={onHome}>
              Back to practice
            </button>
          </>
        ) : (
          <>
            <button className="btn btn-primary btn-xl" onClick={onAgain}>
              Play again
            </button>
            <button className="btn btn-soft" onClick={onHome}>
              Back to practice
            </button>
          </>
        )}
      </div>
    </main>
  )
}
