import { OPS, OP_INFO, type Op } from './facts'

export type StepKind = 'number' | 'review' | 'star'

export type Step = {
  id: string
  op: Op
  kind: StepKind
  numbers: number[]
  goal: number
}

/** Easy anchors first (2, 5, 10), then the rest in pairs, each group capped by a review. */
const GROUPS = [[2, 5, 10], [3, 4], [6, 7], [8, 9], [11, 12]]

function buildSteps(): Step[] {
  const steps: Step[] = []
  for (const op of OPS) {
    GROUPS.forEach((group, gi) => {
      for (const n of group) steps.push({ id: `${op}-${n}`, op, kind: 'number', numbers: [n], goal: 10 })
      if (gi < GROUPS.length - 1) {
        steps.push({ id: `${op}-review-${gi}`, op, kind: 'review', numbers: group, goal: 15 })
      }
    })
    steps.push({ id: `${op}-star`, op, kind: 'star', numbers: GROUPS.flat(), goal: 20 })
  }
  return steps
}

export const STEPS = buildSteps()

export function stepsFor(op: Op) {
  return STEPS.filter((s) => s.op === op)
}

export function currentStep(completed: string[]): Step | null {
  const done = new Set(completed)
  return STEPS.find((s) => !done.has(s.id)) ?? null
}

export function stepTitle(step: Step) {
  const op = OP_INFO[step.op].label
  if (step.kind === 'number') return `${op} · ${step.numbers[0]}`
  if (step.kind === 'review') return `${op} · Review ${step.numbers.join(', ')}`
  return `${op} · All-star mix`
}

export function stepSubtitle(step: Step) {
  return `${stepTitle(step)} — get ${step.goal} correct`
}
