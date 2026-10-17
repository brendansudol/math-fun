import type { Fact, Op } from './facts'

export type Mode = 'endless' | 'timed' | 'streak' | 'guided' | 'bonus'
export type FreeMode = Extract<Mode, 'endless' | 'timed' | 'streak'>

export const MODE_INFO: Record<Mode, { label: string; blurb: string }> = {
  endless: { label: 'Endless', blurb: 'Practice as long as you want with the same flash-card flow.' },
  timed: { label: 'Time Trial', blurb: 'See how many you can answer correctly in one minute.' },
  streak: { label: 'Streak', blurb: 'Keep going until you miss or decide your run is done.' },
  guided: { label: 'Guided path', blurb: '' },
  bonus: { label: 'Bonus', blurb: '' },
}

export const TIME_TRIAL_SECONDS = 60

export type SessionConfig = {
  mode: Mode
  op: Op
  numbers: number[]
  title: string
  /** Guided: total correct needed. Bonus: correct in a row needed. */
  goal?: number
  stepId?: string
}

export type SessionResult = {
  config: SessionConfig
  correct: number
  attempts: number
  bestStreak: number
  /** Time spent answering, in ms. */
  ms: number
  misses: Fact[]
  /** Guided or bonus goal reached. */
  finished: boolean
  pointsEarned: number
  record?: { value: number; prev?: number; isNew: boolean }
}
