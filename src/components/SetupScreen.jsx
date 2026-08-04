import { useState } from 'react'

export default function SetupScreen({ onInit, error }) {
  const [groqKey, setGroqKey] = useState('')
  const [finnhubKey, setFinnhubKey] = useState('')
  const [ticker, setTicker] = useState('AAPL')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    try {
      await onInit({ groqKey, finnhubKey, ticker: ticker.trim().toUpperCase() })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="setup">
      <header className="hero">
        <div className="logo-block">
          <span className="logo-accent">█</span>
          <h1 className="logo">QUANTEDGE</h1>
        </div>
        <p className="tagline">Systematic Algorithmic Trading Firm &mdash; Agentic Organisation</p>
        <p className="sub">
          Five specialised AI agents &mdash; AXIOM &rarr; VECTOR &rarr; FORGE &rarr; PULSE &rarr;
          MERIDIAN &mdash; collaborate sequentially to analyse live market data, design a trading
          strategy, prototype the implementation, communicate it to investors, and deliver an
          executive go/no-go decision.
        </p>
        <div className="flow">
          {['AXIOM', 'VECTOR', 'FORGE', 'PULSE', 'MERIDIAN'].map((n, i) => (
            <span key={n} className="flow-node">
              {n}
              {i < 4 && <span className="flow-arrow">&rarr;</span>}
            </span>
          ))}
        </div>
      </header>

      <form className="setup-form" onSubmit={submit}>
        <h2>Initialise Pipeline</h2>

        <label>
          <span className="field-label">Groq API Key</span>
          <input
            type="password"
            value={groqKey}
            onChange={(e) => setGroqKey(e.target.value)}
            placeholder="gsk_..."
            required
            autoComplete="off"
          />
        </label>

        <label>
          <span className="field-label">Finnhub API Key</span>
          <input
            type="password"
            value={finnhubKey}
            onChange={(e) => setFinnhubKey(e.target.value)}
            placeholder="cXXXX..."
            required
            autoComplete="off"
          />
        </label>

        <label>
          <span className="field-label">Stock Ticker</span>
          <input
            type="text"
            value={ticker}
            onChange={(e) => setTicker(e.target.value)}
            placeholder="AAPL"
            spellCheck="false"
          />
        </label>

        {error && <div className="banner error">[ERR] {error}</div>}

        <button type="submit" className="btn primary" disabled={busy}>
          {busy ? 'Initialising…' : 'Initialise Pipeline'}
        </button>

        <p className="fineprint">
          Your keys are held only in memory for this session and are never stored or transmitted
          anywhere except to Groq and Finnhub. Free keys: console.groq.com &middot; finnhub.io.
        </p>
      </form>
    </div>
  )
}