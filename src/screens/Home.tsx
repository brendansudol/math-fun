import { useEffect } from 'react'
import { PathTrack } from '../components/PathTrack'
import { bonusChip, type Bonus } from '../lib/bonus'
import { currentStep, stepSubtitle, type Step } from '../lib/path'
import { MODE_INFO, type FreeMode } from '../lib/session'
import { ensureDaily, useProfile } from '../lib/store'

type Props = {
  onGuided: (step: Step) => void
  onBonus: (bonus: Bonus) => void
  onPick: (mode: FreeMode) => void
}

export function Home({ onGuided, onBonus, onPick }: Props) {
  const profile = useProfile()
  useEffect(() => ensureDaily(), [profile.id])

  const step = currentStep(profile.completed)
  const started = profile.completed.length > 0
  const daily = profile.daily

  return (
    <main className="page">
      <header className="page-head">
        <p className="eyebrow">Math</p>
        <h1 className="display">Practice</h1>
      </header>

      <section className="panel guided">
        <div className="panel-inner">
          <p className="eyebrow">Guided path</p>
          <h2 className="guided-title">{!step ? 'All done!' : started ? 'Keep going' : 'Start'}</h2>
          <p className="guided-sub">
            {step ? stepSubtitle(step) : 'You finished the whole path. Try the bonus or pick your own below.'}
          </p>
          {step && (
            <button className="btn btn-primary btn-wide" onClick={() => onGuided(step)}>
              {started ? 'Continue' : 'Start'}
            </button>
          )}
          <div className="path-divider" />
          <PathTrack completed={profile.completed} onStep={onGuided} />
        </div>
      </section>

      {daily && (
        <section className={daily.done ? 'panel bonus is-done' : 'panel bonus'}>
          <div className="panel-inner bonus-inner">
            <div className="bonus-copy">
              <p className="eyebrow">{daily.done ? 'Bonus complete' : 'Bonus challenge'}</p>
              <h2 className="bonus-title">{daily.done ? 'Nice work today!' : daily.bonus.title}</h2>
              <p className="bonus-sub">
                {daily.done ? (
                  <>Come back tomorrow for a new challenge.</>
                ) : (
                  <>
                    Answer {daily.bonus.goal} <span className="chip">{bonusChip(daily.bonus)}</span> facts correctly in a
                    row.
                  </>
                )}
              </p>
            </div>
            <div className="bonus-actions">
              <div className={daily.done ? 'reward is-earned' : 'reward'}>
                <span className="reward-tag">{daily.done ? 'Earned' : 'Extra'}</span>
                <span className="reward-pts">+{daily.bonus.points} Points</span>
              </div>
              <button
                className={daily.done ? 'btn btn-soft' : 'btn btn-primary'}
                onClick={() => onBonus(daily.bonus)}
              >
                {daily.done ? 'Play again' : 'Start bonus'}
              </button>
            </div>
          </div>
        </section>
      )}

      <section className="panel choose">
        <h2 className="choose-title">Choose your own</h2>
        <div className="mode-grid">
          {(['endless', 'timed', 'streak'] as const).map((m) => (
            <button key={m} className={`mode-card mode-${m}`} onClick={() => onPick(m)}>
              <span className="mode-inner">
                <span className="mode-mark" aria-hidden="true">
                  {m === 'endless' && '∞'}
                  {m === 'timed' && '60'}
                  {m === 'streak' && <StreakArrow />}
                </span>
                <span className="mode-title">
                  {m === 'timed' ? (
                    <>
                      Time
                      <br />
                      Trial
                    </>
                  ) : (
                    MODE_INFO[m].label
                  )}
                </span>
                <span className="mode-blurb">{MODE_INFO[m].blurb}</span>
              </span>
            </button>
          ))}
        </div>
      </section>
    </main>
  )
}

function StreakArrow() {
  return (
    <svg viewBox="0 0 64 96" width="64" height="96">
      <path d="M32 4L8 30h14v4L8 50h16v42h16V50h16L42 34v-4h14z" fill="currentColor" />
    </svg>
  )
}
