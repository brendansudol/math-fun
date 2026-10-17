export type Op = 'plus' | 'minus' | 'times' | 'divide'

export const OPS: Op[] = ['plus', 'minus', 'times', 'divide']

export const OP_INFO: Record<Op, { label: string; symbol: string }> = {
  plus: { label: 'Plus', symbol: '+' },
  minus: { label: 'Minus', symbol: '−' },
  times: { label: 'Times', symbol: '×' },
  divide: { label: 'Divide', symbol: '÷' },
}

/** The numbers a kid can pick to practice ("Plus 3", "Times 7", …). */
export const NUMBERS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

/** Each fact set pairs the picked number with 1…12. */
export const PARTNERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

export type Fact = {
  op: Op
  /** The number being practiced. */
  n: number
  /** The partner number (1…12). */
  k: number
  /** Left operand as shown. */
  a: number
  /** Right operand as shown. */
  b: number
  answer: number
}

export function factKey(f: Pick<Fact, 'op' | 'n' | 'k'>) {
  return `${f.op}:${f.n}:${f.k}`
}

export function setKey(op: Op, n: number) {
  return `${op}:${n}`
}

/**
 * Build a fact. Plus and times flip their operands at random so kids see both
 * 3 × 9 and 9 × 3; minus and divide always take the practiced number away.
 */
export function makeFact(op: Op, n: number, k: number, flip = Math.random() < 0.5): Fact {
  switch (op) {
    case 'plus':
      return flip ? { op, n, k, a: k, b: n, answer: n + k } : { op, n, k, a: n, b: k, answer: n + k }
    case 'times':
      return flip ? { op, n, k, a: k, b: n, answer: n * k } : { op, n, k, a: n, b: k, answer: n * k }
    case 'minus':
      return { op, n, k, a: n + k, b: n, answer: k }
    case 'divide':
      return { op, n, k, a: n * k, b: n, answer: k }
  }
}

export function factText(f: Fact, withAnswer = false) {
  const s = `${f.a} ${OP_INFO[f.op].symbol} ${f.b}`
  return withAnswer ? `${s} = ${f.answer}` : s
}

export function numbersLabel(numbers: number[]) {
  const sorted = [...numbers].sort((x, y) => x - y)
  if (sorted.length === NUMBERS.length) return 'All'
  if (sorted.length <= 3) return sorted.join(', ')
  return `${sorted.length} numbers`
}

export function shuffle<T>(items: T[]): T[] {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

export type FactStat = { seen: number; correct: number; ms: number }

/**
 * A shuffled deck over the chosen fact sets. Missed facts come back a few
 * cards later, and facts a kid often misses get an extra copy in each pass.
 */
export class Deck {
  private queue: Fact[] = []
  private retry: { fact: Fact; dueIn: number }[] = []

  constructor(
    private op: Op,
    private numbers: number[],
    private stats: Record<string, FactStat> = {},
  ) {}

  private pool(): Fact[] {
    const pool: Fact[] = []
    for (const n of this.numbers) {
      for (const k of PARTNERS) {
        pool.push(makeFact(this.op, n, k))
        const s = this.stats[factKey({ op: this.op, n, k })]
        if (s && s.seen >= 2 && s.correct / s.seen < 0.7) pool.push(makeFact(this.op, n, k))
      }
    }
    return shuffle(pool)
  }

  /** Draw the next card, never repeating `avoid` (the card on screen) back to back. */
  next(avoid?: string): Fact {
    for (const r of this.retry) r.dueIn--
    const dueIdx = this.retry.findIndex((r) => r.dueIn <= 0 && factKey(r.fact) !== avoid)
    if (dueIdx >= 0) {
      const { fact } = this.retry.splice(dueIdx, 1)[0]
      return makeFact(fact.op, fact.n, fact.k)
    }
    if (this.queue.every((f) => factKey(f) === avoid)) this.queue = [...this.queue, ...this.pool()]
    // The top of the deck is the end of the array.
    let idx = this.queue.length - 1
    while (idx > 0 && factKey(this.queue[idx]) === avoid) idx--
    return this.queue.splice(idx, 1)[0]
  }

  missed(fact: Fact) {
    this.retry.push({ fact, dueIn: 2 + Math.floor(Math.random() * 3) })
  }
}
