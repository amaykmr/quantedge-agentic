import { fetchMarketData } from './finnhub.js'
import { AGENTS } from '../config/agents.js'

const GROQ_URL = 'https://api.groq.com/openai/v1'

// Models that reliably support function calling (AXIOM requires it).
// Order = preference. Failover moves down this list on rate limits.
const TOOL_MODELS = ['llama-3.3-70b-versatile', 'openai/gpt-oss-20b']

// Truncate handoff context so the pipeline stays inside Groq's free-tier
// token budgets. ~4 chars per token is a safe average for mixed text.
export const MAX_HANDOFF_CHARS = 8000

export async function discoverModel(groqKey) {
  const res = await fetch(`${GROQ_URL}/models`, {
    headers: { Authorization: `Bearer ${groqKey}` }
  })
  if (!res.ok) throw new Error(`Groq models endpoint failed (${res.status})`)
  const data = await res.json()
  const available = (data.data || []).map((m) => m.id)
  return TOOL_MODELS.find((m) => available.includes(m)) || available[0]
}

export function truncateContext(text, maxChars = MAX_HANDOFF_CHARS) {
  if (!text) return text
  if (text.length <= maxChars) return text
  return text.slice(0, maxChars) + '\n\n[PREVIOUS OUTPUT TRUNCATED — token budget]'
}

export async function runAxiom({ groqKey, model, ticker, finnhubKey, signal, maxTokens }) {
  const agent = AGENTS.find((a) => a.id === 'axiom')
  const budget = maxTokens || agent.maxTokens

  const tools = [
    {
      type: 'function',
      function: {
        name: 'get_market_data',
        description: 'Fetch live market data for a stock ticker from Finnhub',
        parameters: {
          type: 'object',
          properties: {
            ticker: { type: 'string', description: 'Stock ticker symbol e.g. AAPL' }
          },
          required: ['ticker']
        }
      }
    }
  ]

  const userMessage = (t) =>
    `Analyse the current market opportunity for ${t}. Use the get_market_data tool to fetch live data first. Do not provide an analysis until you have received the tool result.`

  const firstCall = await groqChat({
    groqKey,
    model,
    signal,
    messages: [
      { role: 'system', content: agent.systemPrompt },
      { role: 'user', content: userMessage(ticker) }
    ],
    tools,
    tool_choice: 'required',
    max_tokens: 300
  })

  const assistantMsg = firstCall.choices[0].message
  const toolCalls = assistantMsg.tool_calls

  if (!toolCalls || !toolCalls.length) {
    throw new Error(
      'AXIOM did not issue a get_market_data tool call. This usually means the selected model does not support function calling reliably.'
    )
  }

  const toolCall = toolCalls[0]
  let requestedTicker = ticker
  try {
    const args = JSON.parse(toolCall.function.arguments || '{}')
    if (args.ticker) requestedTicker = args.ticker
  } catch {
    /* keep ticker */
  }

  const marketData = await fetchMarketData(requestedTicker, finnhubKey, signal)

  const secondCall = await groqChat({
    groqKey,
    model,
    signal,
    messages: [
      { role: 'system', content: agent.systemPrompt },
      { role: 'user', content: userMessage(ticker) },
      assistantMsg,
      { role: 'tool', tool_call_id: toolCall.id, content: JSON.stringify(marketData) }
    ],
    max_tokens: budget
  })

  return {
    text: secondCall.choices[0].message.content,
    marketData,
    requestedTicker
  }
}

export async function runAgent({ groqKey, model, systemPrompt, previousOutput, signal, maxTokens }) {
  const res = await groqChat({
    groqKey,
    model,
    signal,
    messages: [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: `The previous agent produced the following output. Use it as the input for your task.\n\n--- PREVIOUS AGENT OUTPUT ---\n${truncateContext(previousOutput)}`
      }
    ],
    max_tokens: maxTokens || 900
  })
  return res.choices[0].message.content
}

const sleep = (ms, signal) =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms)
    if (signal) {
      signal.addEventListener(
        'abort',
        () => {
          clearTimeout(timer)
          reject(new DOMException('Aborted', 'AbortError'))
        },
        { once: true }
      )
    }
  })

async function groqChat({ groqKey, model, signal, ...body }) {
  const maxAttempts = 4
  const baseDelay = 12000

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const res = await fetch(`${GROQ_URL}/chat/completions`, {
      method: 'POST',
      signal,
      headers: {
        Authorization: `Bearer ${groqKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        temperature: 0.3,
        ...body
      })
    })

    if (res.ok) return res.json()

    const detail = await res.text().catch(() => '')
    const limited = res.status === 429 || detail.includes('Rate limit reached') || detail.includes('TPD') || detail.includes('TPM')

    if (limited && attempt < maxAttempts) {
      const retryAfter = Number(res.headers.get('retry-after'))
      const pause = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : baseDelay * attempt
      await sleep(pause, signal)
      continue
    }

    throw new Error(detail ? `Groq request failed (${res.status}): ${detail.slice(0, 200)}` : `Groq request failed (${res.status})`)
  }
  throw new Error('Groq request failed after multiple retries')
}

export function isRateLimitError(err) {
  return /429|rate limit|TPM|TPD/i.test(err?.message || '')
}

export function isAbortError(err) {
  return err?.name === 'AbortError'
}