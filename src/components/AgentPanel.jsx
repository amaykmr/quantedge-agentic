import { useState } from 'react'

const STATUS_LABEL = {
  waiting: 'WAITING',
  running: 'RUNNING',
  complete: 'COMPLETE',
  error: 'ERROR'
}

export default function AgentPanel({ agent, result }) {
  const [showPrompt, setShowPrompt] = useState(false)
  const status = result?.status || 'waiting'

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
      </div>

      <button type="button" className="prompt-toggle" onClick={() => setShowPrompt((v) => !v)}>
        [{showPrompt ? '▼' : '▶'}] View System Prompt
      </button>
      {showPrompt && <pre className="system-prompt">{agent.systemPrompt}</pre>}

      <div className="agent-output">
        {status === 'complete' && result?.text && <pre className="output">{result.text}</pre>}
        {status === 'waiting' && <p className="placeholder">Awaiting handoff…</p>}
        {status === 'running' && <p className="placeholder typing">Analysing…</p>}
        {status === 'error' && <p className="placeholder error-text">{result?.error}</p>}
      </div>
    </section>
  )
}