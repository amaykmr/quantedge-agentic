import { useState } from 'react'
import { AGENTS } from '../config/agents.js'
import AgentPanel from './AgentPanel.jsx'

export default function Dashboard({ config, results, running, error, onRun, onReset, onChangeTicker }) {
  const [tickerInput, setTickerInput] = useState(config.ticker)

  const submitTicker = (e) => {
    e.preventDefault()
    onChangeTicker(tickerInput.trim().toUpperCase())
  }

  const allComplete = results.every((r) => r.status === 'complete')
  const axiom = results[0]

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
          <button type="button" className="btn ghost" onClick={onReset} disabled={running}>
            Reset
          </button>
        </div>
      </header>

      <div className="sys-line mono">
        MODEL: {config.model} &nbsp;&nbsp;|&nbsp;&nbsp; TICKER: {config.ticker.toUpperCase()}
      </div>

      {axiom?.marketData && <MarketDataStrip data={axiom.marketData} />}

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

function MarketDataStrip({ data }) {
  const items = [
    ['LIVE PRICE', data.currentPrice != null ? `$${data.currentPrice.toFixed(2)}` : '—'],
    ['CHG %', data.dayChangePct != null ? `${data.dayChangePct.toFixed(2)}%` : '—'],
    ['DAY HIGH', data.dayHigh != null ? `$${data.dayHigh.toFixed(2)}` : '—'],
    ['DAY LOW', data.dayLow != null ? `$${data.dayLow.toFixed(2)}` : '—'],
    ['52W HIGH', data.high52Week != null ? `$${data.high52Week.toFixed(2)}` : '—'],
    ['52W LOW', data.low52Week != null ? `$${data.low52Week.toFixed(2)}` : '—'],
    ['MKT CAP', data.marketCap != null ? `$${(data.marketCap / 1000).toFixed(1)}B` : '—'],
    ['SECTOR', data.industry !== 'unavailable' ? data.industry.toUpperCase() : '—']
  ]
  return (
    <div className="market-strip mono">
      <span className="strip-title">LIVE MARKET DATA — FINNHUB</span>
      <div className="strip-grid">
        {items.map(([k, v]) => (
          <div key={k} className="strip-item">
            <span className="strip-key">{k}</span>
            <span className="strip-val">{v}</span>
          </div>
        ))}
      </div>
    </div>
  )
}