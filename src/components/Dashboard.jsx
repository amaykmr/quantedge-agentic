import { useState } from 'react'
import { AGENTS } from '../config/agents.js'
import AgentPanel from './AgentPanel.jsx'

export default function Dashboard({ config, results, running, error, onRun, onStop, onReset, onChangeTicker }) {
  const [tickerInput, setTickerInput] = useState(config.ticker)

  const submitTicker = (e) => {
    e.preventDefault()
    onChangeTicker(tickerInput.trim().toUpperCase())
  }

  const allComplete = results.every((r) => r.status === 'complete')

  return (
    <div className="dashboard">
      <header className="dash-header">
        <div className="logo-block">
          <span className="logo-accent">█</span>
          <h1 className="logo small">QUANTEDGE</h1>
        </div>

        <div className="dash-controls">
          <form onSubmit={submitTicker} className="ticker-form">
            <input
              type="text"
              value={tickerInput}
              onChange={(e) => setTickerInput(e.target.value)}
              aria-label="Ticker symbol"
              spellCheck="false"
              disabled={running}
            />
            <button type="submit" className="btn ghost" disabled={running}>
              Set Ticker
            </button>
          </form>

          <button type="button" className="btn primary" onClick={onRun} disabled={running}>
            {running ? 'Pipeline Running…' : 'Run Pipeline'}
          </button>
          {running && (
            <button type="button" className="btn danger" onClick={onStop}>
              ■ End Pipeline
            </button>
          )}
          <button type="button" className="btn ghost" onClick={onReset} disabled={running}>
            Reset
          </button>
        </div>
      </header>

      <div className="sys-line mono">
        MODEL: {config.model} &nbsp;&nbsp;|&nbsp;&nbsp; TICKER: {config.ticker.toUpperCase()}
        &nbsp;&nbsp;|&nbsp;&nbsp; TOTAL OUTPUT BUDGET: {AGENTS.reduce((s, a) => s + a.maxTokens, 0)} tokens
      </div>

      {error && <div className="banner error">[ERR] {error}</div>}
      {allComplete && (
        <div className="banner success">
          [OK] Pipeline complete. All five agents produced output for {config.ticker.toUpperCase()}.
        </div>
      )}

      <div className="pipeline">
        {AGENTS.map((agent, i) => (
          <div key={agent.id} className="pipeline-step">
            <div className="step-line">
              <span className="step-index mono">{i + 1}</span>
              {i < AGENTS.length - 1 && <span className="step-connector"></span>}
            </div>
            <AgentPanel agent={agent} result={results[i]} />
          </div>
        ))}
      </div>

      <footer className="disclaimer">
        QUANTEDGE is an educational demonstration. Nothing produced by this pipeline is investment
        advice. All decisions require human oversight.
      </footer>
    </div>
  )
}