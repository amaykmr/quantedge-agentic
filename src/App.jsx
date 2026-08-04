import { useState } from 'react'
import { AGENTS } from './config/agents.js'
import { discoverModel, runAxiom, runAgent } from './lib/groq.js'
import SetupScreen from './components/SetupScreen.jsx'
import Dashboard from './components/Dashboard.jsx'

function emptyResults() {
  return AGENTS.map((a) => ({
    id: a.id,
    name: a.name,
    status: 'waiting',
    text: null,
    error: null
  }))
}

export default function App() {
  const [screen, setScreen] = useState('setup')
  const [config, setConfig] = useState(null)
  const [results, setResults] = useState(() => emptyResults())
  const [running, setRunning] = useState(false)
  const [error, setError] = useState(null)

  const handleInit = async ({ groqKey, finnhubKey, ticker }) => {
    setError(null)
    try {
      const model = await discoverModel(groqKey)
      setConfig({ groqKey, finnhubKey, ticker, model })
      setResults(emptyResults())
      setScreen('dashboard')
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  const handleRun = async () => {
    setRunning(true)
    setError(null)
    setResults(emptyResults())

    const outputs = new Array(AGENTS.length).fill(null)

    try {
      for (let i = 0; i < AGENTS.length; i++) {
        setResults((prev) =>
          prev.map((r) => (r.id === AGENTS[i].id ? { ...r, status: 'running' } : r))
        )

        let text
        try {
          if (i === 0) {
            const axiom = await runAxiom({
              groqKey: config.groqKey,
              model: config.model,
              ticker: config.ticker,
              finnhubKey: config.finnhubKey
            })
            text = axiom.text
            setResults((prev) =>
              prev.map((r) =>
                r.id === 'axiom'
                  ? { ...r, status: 'running', marketData: axiom.marketData }
                  : r
              )
            )
          } else {
            const agent = AGENTS[i]
            let previousOutput
            if (agent.id === 'meridian') {
              previousOutput = outputs.filter(Boolean).join('\n\n')
            } else {
              previousOutput = outputs[i - 1]
            }
            text = await runAgent({
              groqKey: config.groqKey,
              model: config.model,
              systemPrompt: agent.systemPrompt,
              previousOutput
            })
          }
        } catch (err) {
          setResults((prev) =>
            prev.map((r) =>
              r.id === AGENTS[i].id ? { ...r, status: 'error', error: err.message } : r
            )
          )
          throw err
        }

        outputs[i] = text
        setResults((prev) =>
          prev.map((r) =>
            r.id === AGENTS[i].id ? { ...r, status: 'complete', text, marketData: r.marketData } : r
          )
        )

        if (i < AGENTS.length - 1) {
          await new Promise((r) => setTimeout(r, 2500))
        }
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setRunning(false)
    }
  }

  const handleReset = () => {
    setResults(emptyResults())
    setScreen('setup')
    setConfig(null)
    setError(null)
  }

  const handleChangeTicker = (ticker) => {
    setConfig((c) => ({ ...c, ticker: ticker.toUpperCase() }))
    setResults(emptyResults())
  }

  if (screen === 'setup') {
    return <SetupScreen onInit={handleInit} error={error} />
  }

  return (
    <Dashboard
      config={config}
      results={results}
      running={running}
      error={error}
      onRun={handleRun}
      onReset={handleReset}
      onChangeTicker={handleChangeTicker}
    />
  )
}