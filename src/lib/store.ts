import { useSyncExternalStore } from 'react'
import { factKey, type Fact, type FactStat, type Op } from './facts'
import { pickBonus, type Bonus } from './bonus'

export type Profile = {
  id: string
  name: string
  emoji: string
  points: number
  /** Guided-path step ids the kid has finished. */
  completed: string[]
  /** Per-fact history, keyed by factKey(). */
  stats: Record<string, FactStat>
  /** Best scores, keyed by recordKey(). */
  records: Record<string, number>
  daily: { date: string; bonus: Bonus; done: boolean } | null
  lastPick: { op: Op; numbers: number[] }
}

type State = { profiles: Profile[]; activeId: string }

const STORAGE_KEY = 'math-fun:v1'

export const AVATARS = ['⭐', '🚀', '🦖', '🦊', '🐙', '🦄', '🐢', '⚡️', '🌈', '🍕']

function newProfile(name: string, emoji: string): Profile {
  return {
    id: Math.random().toString(36).slice(2, 10),
    name,
    emoji,
    points: 0,
    completed: [],
    stats: {},
    records: {},
    daily: null,
    lastPick: { op: 'times', numbers: [3] },
  }
}

function load(): State {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as State
      if (parsed.profiles?.length) return parsed
    }
  } catch {
    // Fall through to a fresh profile.
  }
  const first = newProfile('Player 1', '⭐')
  return { profiles: [first], activeId: first.id }
}

let state: State = load()
const listeners = new Set<() => void>()

function commit(next: State) {
  state = next
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Storage can be unavailable (private mode); keep going in memory.
  }
  listeners.forEach((l) => l())
}

function subscribe(l: () => void) {
  listeners.add(l)
  return () => listeners.delete(l)
}

export function useAppState() {
  return useSyncExternalStore(subscribe, () => state)
}

export function useProfile(): Profile {
  const s = useAppState()
  return s.profiles.find((p) => p.id === s.activeId) ?? s.profiles[0]
}

export function getProfile(): Profile {
  return state.profiles.find((p) => p.id === state.activeId) ?? state.profiles[0]
}

/** Apply a change to the active profile. `fn` gets a copy it may mutate. */
export function updateProfile(fn: (p: Profile) => void) {
  const current = getProfile()
  const copy = structuredClone(current)
  fn(copy)
  commit({ ...state, profiles: state.profiles.map((p) => (p.id === current.id ? copy : p)) })
}

export function addProfile(name: string, emoji: string) {
  const p = newProfile(name.trim() || `Player ${state.profiles.length + 1}`, emoji)
  commit({ profiles: [...state.profiles, p], activeId: p.id })
}

export function switchProfile(id: string) {
  commit({ ...state, activeId: id })
}

export function renameProfile(name: string, emoji: string) {
  updateProfile((p) => {
    p.name = name.trim() || p.name
    p.emoji = emoji
  })
}

export const POINTS = { correct: 1, step: 10 }

export function recordAnswer(fact: Fact, correct: boolean, ms: number) {
  updateProfile((p) => {
    const key = factKey(fact)
    const s = p.stats[key] ?? { seen: 0, correct: 0, ms: 0 }
    s.seen++
    if (correct) s.correct++
    // Cap long pauses so a kid wandering off doesn't wreck their average.
    s.ms += Math.min(ms, 15000)
    p.stats[key] = s
    if (correct) p.points += POINTS.correct
  })
}

export function recordKey(mode: string, op: Op, numbers: number[]) {
  return `${mode}:${op}:${[...numbers].sort((a, b) => a - b).join(',')}`
}

/** Saves `value` if it beats the stored best. Returns the previous best. */
export function submitRecord(key: string, value: number): number | undefined {
  const prev = getProfile().records[key]
  if (value > 0 && (prev === undefined || value > prev)) {
    updateProfile((p) => {
      p.records[key] = value
    })
  }
  return prev
}

export function todayString(d = new Date()) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** Today's bonus challenge, picked once per day per kid. */
export function ensureDaily() {
  const p = getProfile()
  const today = todayString()
  if (p.daily?.date === today) return
  updateProfile((draft) => {
    draft.daily = { date: today, bonus: pickBonus(draft), done: false }
  })
}
