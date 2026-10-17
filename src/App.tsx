import { useEffect, useState } from 'react'
import { Decor } from './components/Decor'
import { TopBar } from './components/TopBar'
import { bonusChip, type Bonus } from './lib/bonus'
import { stepTitle, type Step } from './lib/path'
import { MODE_INFO, type FreeMode, type SessionConfig, type SessionResult } from './lib/session'
import { useProfile } from './lib/store'
import { Home } from './screens/Home'
import { Picker } from './screens/Picker'
import { Session } from './screens/Session'
import { Summary } from './screens/Summary'

type Screen =
  | { name: 'home' }
  | { name: 'picker'; mode: FreeMode }
  | { name: 'session'; config: SessionConfig; run: number; from: Screen }
  | { name: 'summary'; result: SessionResult; from: Screen }

const HOME: Screen = { name: 'home' }

export default function App() {
  const profile = useProfile()
  const [screen, setScreen] = useState<Screen>(HOME)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [screen])

  // Switching kids mid-run drops back to the home screen.
  useEffect(() => {
    setScreen(HOME)
  }, [profile.id])

  const play = (config: SessionConfig, from: Screen) =>
    setScreen({ name: 'session', config, run: Date.now(), from })

  const playStep = (step: Step) =>
    play(
      { mode: 'guided', op: step.op, numbers: step.numbers, goal: step.goal, stepId: step.id, title: stepTitle(step) },
      HOME,
    )

  const playBonus = (b: Bonus) =>
    play({ mode: 'bonus', op: b.op, numbers: b.numbers, goal: b.goal, title: bonusChip(b) }, HOME)

  let body
  let crumbs = ['Math', 'Practice']
  let onBack: (() => void) | undefined

  switch (screen.name) {
    case 'home':
      body = <Home onGuided={playStep} onBonus={playBonus} onPick={(mode) => setScreen({ name: 'picker', mode })} />
      break
    case 'picker':
      crumbs = ['Practice', MODE_INFO[screen.mode].label]
      onBack = () => setScreen(HOME)
      body = <Picker mode={screen.mode} onStart={(config) => play(config, screen)} />
      break
    case 'session':
      crumbs = ['Practice', screen.config.title]
      onBack = () => setScreen(screen.from)
      body = (
        <Session
          key={screen.run}
          config={screen.config}
          onFinish={(result) => setScreen({ name: 'summary', result, from: screen.from })}
        />
      )
      break
    case 'summary':
      crumbs = ['Practice', 'Results']
      onBack = () => setScreen(HOME)
      body = (
        <Summary
          result={screen.result}
          onAgain={() => play(screen.result.config, screen.from)}
          onHome={() => setScreen(HOME)}
          onStep={playStep}
        />
      )
      break
  }

  return (
    <div className="app">
      <Decor />
      <TopBar crumbs={crumbs} onBack={onBack} />
      {body}
    </div>
  )
}
