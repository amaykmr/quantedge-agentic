import { useRef, useState } from 'react'
import { AGENTS } from './config/agents.js'
import {
  discoverModel,
  runAxiom,
  runAgent,
  truncateContext,
  isRateLimitError,
  isAbortError
} from './lib/groq.js'
import SetupScreen from './components/SetupScreen.jsx'
import Dashboard from './components/Dashboard.jsx'

const TOOL_MODELS = ['llama-3.3-70b-versatile', 'openai/gpt-oss-20b']
const MERIDIAN_MAX_HANDOFF_CHARS = 16000

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

  const abortRef = useRef(null)
  const cancelledRef = useRef(false)

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
    const controller = new AbortController()
    abortRef.current = controller
    cancelledRef.current = false

    setRunning(true)
    setError(null)
    setResults(emptyResults())

    const outputs = new Array(AGENTS.length).fill(null)
    let model = config.model

    const failoverModel = () => {
      const idx = TOOL_MODELS.indexOf(model)
      const next = TOOL_MODELS[idx + 1]
      return next || null
    }

    try {
      for (let i = 0; i < AGENTS.length; i++) {
        if (cancelledRef.current) break

        setResults((prev) =>
          prev.map((r) => (r.id === AGENTS[i].id ? { ...r, status: 'running' } : r))
        )

        let text
        try {
          if (i === 0) {
            const axiom = await runAxiom({
              groqKey: config.groqKey,
              model,
              ticker: config.ticker,
              finnhubKey: config.finnhubKey,
              signal: controller.signal,
              maxTokens: AGENTS[i].maxTokens
            })
            text = axiom.text
            setResults((prev) =>
              prev.map((r) =>
                r.id === 'axiom' ? { ...r, status: 'running', marketData: axiom.marketData } : r
              )
            )
          } else {
            const agent = AGENTS[i]
            let previousOutput
            if (agent.id === 'meridian') {
              previousOutput = outputs
                .filter(Boolean)
                .map((o) => truncateContext(o, MERIDIAN_MAX_HANDOFF_CHARS / 4))
                .join('\n\n')
            } else {
              previousOutput = truncateContext(outputs[i - 1])
            }
            text = await runAgent({
              groqKey: config.groqKey,
              model,
              systemPrompt: agent.systemPrompt,
              previousOutput,
              signal: controller.signal,
              maxTokens: agent.maxTokens
            })
          }
        } catch (err) {
          if (isAbortError(err) || cancelledRef.current) break

          if (isRateLimitError(err)) {
            const next = failoverModel()
            if (next) {
              model = next
              setResults((prev) =>
                prev.map((r) =>
                  r.id === AGENTS[i].id
                    ? { ...r, status: 'waiting', error: `Rate limit on ${model}; failing over to ${next}` }
                    : r
                )
              )
              await new Promise((r) => setTimeout(r, 1500))
              i-- // retry this agent with the new model
              continue
            }
          }

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

        if (i < AGENTS.length - 1 && !cancelledRef.current) {
          await new Promise((r) => setTimeout(r, 2500))
        }
      }

      if (cancelledRef.current) {
        setResults((prev) =>
          prev.map((r) => (r.status === 'running' ? { ...r, status: 'cancelled' } : r))
        )
      }
    } catch (err) {
      setError(err.message)
    } finally {
      abortRef.current = null
      setRunning(false)
    }
  }

  const handleStop = () => {
    cancelledRef.current = true
    if (abortRef.current) abortRef.current.abort()
  }

  const handleReset = () => {
    abortRef.current?.abort()
    cancelledRef.current = true
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
      onStop={handleStop}
      onReset={handleReset}
      onChangeTicker={handleChangeTicker}
    />
  )
}