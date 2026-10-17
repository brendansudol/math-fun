import { useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { Keypad } from '../components/Keypad'
import { OpIcon } from '../components/OpIcon'
import { Deck, factKey, type Fact } from '../lib/facts'
import { TIME_TRIAL_SECONDS, type SessionConfig, type SessionResult } from '../lib/session'
import { POINTS, getProfile, recordAnswer, recordKey, submitRecord, updateProfile } from '../lib/store'

type Props = {
  config: SessionConfig
  onFinish: (result: SessionResult) => void
}

type Phase = 'countdown' | 'ask' | 'correct' | 'wrong' | 'over'

const FEEDBACK_MS = { correct: 280, wrong: 1700, wrongTimed: 1100, goal: 550, timeUp: 1100 }

export function Session({ config, onFinish }: Props) {
  const { mode, goal = 10 } = config
  const deck = useRef<Deck | null>(null)
  if (!deck.current) deck.current = new Deck(config.op, config.numbers, getProfile().stats)

  const [fact, setFact] = useState<Fact>(() => deck.current!.next())
  const [cardId, setCardId] = useState(0)
  const [input, setInput] = useState('')
  const [phase, setPhaseState] = useState<Phase>(mode === 'timed' ? 'countdown' : 'ask')
  const [count, setCount] = useState(3)
  const [now, setNow] = useState(() => Date.now())
  const [, rerender] = useReducer((x: number) => x + 1, 0)

  const phaseRef = useRef(phase)
  const tally = useRef({ correct: 0, attempts: 0, streak: 0, bestStreak: 0, misses: [] as Fact[], answerMs: 0 })
  const askedAt = useRef(Date.now())
  const endsAt = useRef<number | null>(null)
  const timers = useRef<number[]>([])
  const done = useRef(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const coarse = useMemo(() => window.matchMedia('(pointer: coarse)').matches, [])
  const best = useMemo(
    () => (mode === 'timed' || mode === 'streak' ? getProfile().records[recordKey(mode, config.op, config.numbers)] : undefined),
    [mode, config.op, config.numbers],
  )

  const setPhase = (p: Phase) => {
    phaseRef.current = p
    setPhaseState(p)
  }
  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms))
  }

  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  // Keep the answer box focused whenever a new card is up.
  useEffect(() => {
    if (phase === 'ask') inputRef.current?.focus({ preventScroll: true })
  }, [phase, cardId])

  // 3-2-1-Go before a time trial.
  useEffect(() => {
    if (phase !== 'countdown') return
    if (count === 0) {
      const id = window.setTimeout(() => {
        endsAt.current = Date.now() + TIME_TRIAL_SECONDS * 1000
        askedAt.current = Date.now()
        setNow(Date.now())
        setPhase('ask')
      }, 550)
      return () => clearTimeout(id)
    }
    const id = window.setTimeout(() => setCount((c) => c - 1), 750)
    return () => clearTimeout(id)
  }, [phase, count])

  const finish = (goalReached: boolean, delay = 0) => {
    if (done.current) return
    done.current = true
    timers.current.forEach(clearTimeout)
    timers.current = []
    if (delay > 0 && mode === 'timed') setPhase('over')

    const t = tally.current
    let extra = 0
    if (goalReached && mode === 'guided' && config.stepId) {
      const id = config.stepId
      if (!getProfile().completed.includes(id)) {
        updateProfile((p) => {
          p.completed.push(id)
          p.points += POINTS.step
        })
        extra += POINTS.step
      }
    }
    if (goalReached && mode === 'bonus') {
      const daily = getProfile().daily
      if (daily && !daily.done) {
        updateProfile((p) => {
          p.daily!.done = true
          p.points += daily.bonus.points
        })
        extra += daily.bonus.points
      }
    }

    let record: SessionResult['record']
    if (mode === 'timed' || mode === 'streak') {
      const value = mode === 'timed' ? t.correct : t.bestStreak
      const prev = submitRecord(recordKey(mode, config.op, config.numbers), value)
      record = { value, prev, isNew: value > 0 && (prev === undefined || value > prev) }
    }

    const result: SessionResult = {
      config,
      correct: t.correct,
      attempts: t.attempts,
      bestStreak: t.bestStreak,
      ms: t.answerMs,
      misses: t.misses,
      finished: goalReached,
      pointsEarned: t.correct * POINTS.correct + extra,
      record,
    }
    if (delay > 0) later(() => onFinish(result), delay)
    else onFinish(result)
  }

  // Time trial clock.
  useEffect(() => {
    if (mode !== 'timed' || phase === 'countdown' || done.current) return
    const id = window.setInterval(() => {
      const t = Date.now()
      setNow(t)
      if (endsAt.current && t >= endsAt.current) finish(false, FEEDBACK_MS.timeUp)
    }, 100)
    return () => clearInterval(id)
    // finish only reads refs and props, so a stale copy is fine here.
  }, [mode, phase])

  const nextCard = () => {
    if (done.current) return
    setFact(deck.current!.next(factKey(fact)))
    setCardId((id) => id + 1)
    setInput('')
    askedAt.current = Date.now()
    setPhase('ask')
  }

  const submit = (value: string) => {
    if (phaseRef.current !== 'ask' || value === '') return
    const ms = Date.now() - askedAt.current
    const ok = Number(value) === fact.answer
    const t = tally.current
    t.attempts++
    t.answerMs += ms
    recordAnswer(fact, ok, ms)

    if (ok) {
      t.correct++
      t.streak++
      t.bestStreak = Math.max(t.bestStreak, t.streak)
      setPhase('correct')
      const reached = (mode === 'guided' && t.correct >= goal) || (mode === 'bonus' && t.streak >= goal)
      if (reached) finish(true, FEEDBACK_MS.goal)
      else later(nextCard, FEEDBACK_MS.correct)
    } else {
      t.misses.push(fact)
      t.streak = 0
      deck.current!.missed(fact)
      setPhase('wrong')
      if (mode === 'streak') finish(false, FEEDBACK_MS.wrong)
      else later(nextCard, mode === 'timed' ? FEEDBACK_MS.wrongTimed : FEEDBACK_MS.wrong)
    }
    rerender()
  }

  const type = (raw: string) => {
    if (phaseRef.current !== 'ask') return
    const v = raw.replace(/\D/g, '').slice(0, 3)
    setInput(v)
    // A right answer counts as soon as it's typed; wrong ones wait for Enter.
    if (v === String(fact.answer)) submit(v)
  }

  // Let digits work even if focus wandered off the answer box.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (el instanceof HTMLButtonElement && e.key === 'Enter') return
      if (/^\d$/.test(e.key)) {
        inputRef.current?.focus({ preventScroll: true })
        type(input + e.key)
        e.preventDefault()
      } else if (e.key === 'Backspace') {
        type(input.slice(0, -1))
      } else if (e.key === 'Enter') {
        submit(input)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const t = tally.current
  const secondsLeft =
    mode !== 'timed' ? 0 : endsAt.current === null ? TIME_TRIAL_SECONDS : Math.max(0, Math.ceil((endsAt.current - now) / 1000))
  const timeFrac =
    mode !== 'timed' || endsAt.current === null ? 1 : Math.max(0, (endsAt.current - now) / (TIME_TRIAL_SECONDS * 1000))

  const showEquation = phase !== 'countdown' && !(phase === 'over' && mode === 'timed')

  return (
    <main className="page session">
      <div className="hud">
        {mode === 'guided' && <Progress value={t.correct} goal={goal} label={`${t.correct} of ${goal} correct`} />}
        {mode === 'bonus' && <Progress value={t.streak} goal={goal} label={`${t.streak} of ${goal} in a row`} />}
        {mode === 'timed' && (
          <>
            <div className={secondsLeft <= 10 && endsAt.current ? 'timer is-low' : 'timer'}>
              <span className="timer-fill" style={{ transform: `scaleX(${timeFrac})` }} />
              <span className="timer-text">0:{String(secondsLeft).padStart(2, '0')}</span>
            </div>
            <Stat label="Correct" value={t.correct} />
            {best !== undefined && <Stat label="Best" value={best} muted />}
          </>
        )}
        {mode === 'streak' && (
          <>
            <Stat label="Streak" value={t.streak} hot={t.streak >= 5} />
            {best !== undefined && <Stat label="Best" value={best} muted />}
          </>
        )}
        {mode === 'endless' && (
          <>
            <Stat label="Correct" value={t.correct} />
            <Stat label="In a row" value={t.streak} hot={t.streak >= 5} />
          </>
        )}
      </div>

      <div className="stage">
        <div className="card-stack">
          <div className="card-back back-1" />
          <div className="card-back back-2" />
          <div
            key={cardId}
            className={`flashcard${phase === 'correct' ? ' is-correct' : ''}${phase === 'wrong' ? ' is-wrong' : ''}`}
          >
            <span className="card-glow glow-a" />
            <span className="card-glow glow-b" />
            {phase === 'countdown' && (
              <div key={count} className="countdown">
                {count || 'Go!'}
              </div>
            )}
            {phase === 'over' && mode === 'timed' && <div className="countdown is-final">Time’s up!</div>}
            {showEquation && (
              <>
                <div className="equation" aria-label={`${fact.a} ${config.op} ${fact.b}`}>
                  <span>{fact.a}</span>
                  <span className="eq-op">
                    <OpIcon op={fact.op} size={96} />
                  </span>
                  <span>{fact.b}</span>
                </div>
                {phase === 'wrong' ? (
                  <div className="answer-box is-reveal" role="status">
                    <s>{input}</s>
                    <strong>{fact.answer}</strong>
                  </div>
                ) : (
                  <input
                    ref={inputRef}
                    className="answer-box"
                    value={input}
                    onChange={(e) => type(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') submit(e.currentTarget.value.replace(/\D/g, ''))
                    }}
                    inputMode={coarse ? 'none' : 'numeric'}
                    autoComplete="off"
                    aria-label="Your answer"
                    readOnly={phase !== 'ask'}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <div className="session-foot">
        {coarse ? (
          <Keypad
            disabled={phase !== 'ask'}
            onDigit={(d) => type(input + d)}
            onDelete={() => type(input.slice(0, -1))}
            onEnter={() => submit(input)}
          />
        ) : (
          <p className="hint">Type your answer · press Enter to check</p>
        )}
        {(mode === 'endless' || mode === 'streak') && (
          <button className="btn btn-soft" onClick={() => finish(false)} disabled={done.current}>
            {mode === 'streak' ? 'End my run' : 'I’m done'}
          </button>
        )}
      </div>
    </main>
  )
}

function Progress({ value, goal, label }: { value: number; goal: number; label: string }) {
  return (
    <div className="progress" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={goal}>
      <div className="progress-dots">
        {Array.from({ length: goal }, (_, i) => (
          <span key={i} className={i < value ? 'pdot is-on' : 'pdot'} />
        ))}
      </div>
      <span className="progress-label">{label}</span>
    </div>
  )
}

function Stat({ label, value, muted, hot }: { label: string; value: number; muted?: boolean; hot?: boolean }) {
  return (
    <div className={`stat${muted ? ' is-muted' : ''}${hot ? ' is-hot' : ''}`}>
      <span key={value} className="stat-value">
        {value}
      </span>
      <span className="stat-label">{label}</span>
    </div>
  )
}
