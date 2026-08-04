import MarketVisuals from './MarketVisuals.jsx'

const STATUS_LABEL = {
  waiting: 'WAITING',
  running: 'RUNNING',
  complete: 'COMPLETE',
  error: 'ERROR',
  cancelled: 'CANCELLED'
}

export default function AgentPanel({ agent, result }) {
  const status = result?.status || 'waiting'
  const showVisuals = agent.id === 'axiom' && result?.marketData && status !== 'cancelled'

  return (
    <section className="agent-panel" data-status={status}>
      <header className="agent-header">
        <span className="status-dot" title={STATUS_LABEL[status]}></span>
        <span className="agent-name" style={{ color: agent.accent }}>
          {agent.name}
        </span>
        <span className="agent-role">{agent.role}</span>
        <span className="agent-archetype">{agent.archetype}</span>
        <span className={`status-badge status-${status}`}>{STATUS_LABEL[status]}</span>
      </header>

      <div className="agent-meta">
        <span>
          <span className="meta-key">INPUT</span> {agent.input}
        </span>
        <span>
          <span className="meta-key">OUTPUT</span> {agent.output}
        </span>
        <span>
          <span className="meta-key">TOKEN BUDGET</span> max {agent.maxTokens} output tokens
        </span>
      </div>

      {showVisuals && <MarketVisuals data={result.marketData} />}

      <div className="agent-output">
        {status === 'complete' && result?.text && <pre className="output">{result.text}</pre>}
        {status === 'waiting' && <p className="placeholder">Awaiting handoff…</p>}
        {status === 'running' && <p className="placeholder typing">Analysing…</p>}
        {status === 'error' && <p className="placeholder error-text">{result?.error}</p>}
        {status === 'cancelled' && (
          <p className="placeholder">Stopped by operator — pipeline ended.</p>
        )}
      </div>
    </section>
  )
}