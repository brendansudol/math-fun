import { NUMBERS, OPS, OP_INFO, PARTNERS, factKey, type Op } from './facts'
import { STEPS, currentStep } from './path'
import type { Profile } from './store'

export type Bonus = {
  kind: 'new' | 'sharpen' | 'mix'
  title: string
  op: Op
  numbers: number[]
  /** Correct answers needed in a row. */
  goal: number
  points: number
}

export const BONUS_POINTS = 30

export function bonusChip(b: Bonus) {
  return `${OP_INFO[b.op].label} ${b.numbers.length === 1 ? b.numbers[0] : 'mix'}`
}

type SetStat = { op: Op; n: number; seen: number; correct: number; ms: number }

function setStats(p: Profile): SetStat[] {
  const out: SetStat[] = []
  for (const op of OPS) {
    for (const n of NUMBERS) {
      const agg = { op, n, seen: 0, correct: 0, ms: 0 }
      for (const k of PARTNERS) {
        const s = p.stats[factKey({ op, n, k })]
        if (!s) continue
        agg.seen += s.seen
        agg.correct += s.correct
        agg.ms += s.ms
      }
      out.push(agg)
    }
  }
  return out
}

/**
 * Pick a daily challenge that either pushes a kid ahead of their guided path
 * ("try something new") or goes back to a fact set they struggle with.
 * When both make sense, alternate by day.
 */
export function pickBonus(p: Profile, date = new Date()): Bonus {
  const stats = setStats(p)
  const byKey = new Map(stats.map((s) => [`${s.op}:${s.n}`, s]))

  const weak = stats
    .filter((s) => s.seen >= 8 && (s.correct / s.seen < 0.85 || s.ms / s.seen > 6000))
    .sort((x, y) => x.correct / x.seen - y.correct / y.seen || y.ms / y.seen - x.ms / x.seen)

  const here = currentStep(p.completed)
  const hereIdx = here ? STEPS.indexOf(here) : STEPS.length
  const numberSteps = STEPS.map((s, i) => ({ s, i })).filter(({ s }) => s.kind === 'number')
  const untried = (from: number) =>
    numberSteps.find(({ s, i }) => i > from && byKey.get(`${s.op}:${s.numbers[0]}`)?.seen === 0)?.s
  const fresh = untried(hereIdx) ?? untried(-1)

  const sharpen = (): Bonus => ({
    kind: 'sharpen',
    title: 'Sharpen a tricky one',
    op: weak[0].op,
    numbers: [weak[0].n],
    goal: 10,
    points: BONUS_POINTS,
  })
  const tryNew = (): Bonus => ({
    kind: 'new',
    title: 'Try something new',
    op: fresh!.op,
    numbers: fresh!.numbers,
    goal: 12,
    points: BONUS_POINTS,
  })

  const evenDay = Math.floor(date.getTime() / 86_400_000) % 2 === 0
  if (weak.length && fresh) return evenDay ? sharpen() : tryNew()
  if (weak.length) return sharpen()
  if (fresh) return tryNew()

  const op = (here?.op ?? OPS[Math.floor(Math.random() * OPS.length)]) as Op
  return { kind: 'mix', title: 'Go for a big run', op, numbers: NUMBERS, goal: 20, points: BONUS_POINTS }
}
