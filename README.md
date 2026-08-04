# QUANTEDGE — Agentic Organisation

A fully agentic trading organisation: five specialised AI agents collaborate in sequence to turn live market data into a complete trading opportunity analysis, ending with an executive go/no-go decision.

**Live demo:** `https://amaykmr.github.io/quantedge-agentic/`

## The Pipeline

```
AXIOM → VECTOR → FORGE → PULSE → MERIDIAN
```

| Agent | Archetype | Role | Produces |
|---|---|---|---|
| **AXIOM** | Researcher | Market Intelligence Analyst | Market opportunity brief |
| **VECTOR** | Designer | Quantitative Strategy Designer | Trading strategy specification |
| **FORGE** | Maker | Quantitative Developer | Pseudocode implementation + backtest logic |
| **PULSE** | Communicator | Investor Relations Strategist | Investor communication package |
| **MERIDIAN** | Manager | Managing Director & Chief Risk Officer | Executive summary + go/no-go decision |

Each agent's output is handed to the next; MERIDIAN reviews all four outputs before deciding.

## Live Data Connection

AXIOM is the only agent that connects to an external data source. It issues a `get_market_data` **tool call** (Groq function calling); the app executes the Finnhub REST calls on its behalf and returns the result to the model:

- `GET /quote` — current price, day high/low, open, previous close, day change
- `GET /stock/profile2` — company profile (name, industry, market cap, exchange)
- `GET /stock/metric?metric=all` — 52-week high/low, average volumes, valuation metrics

All data is fetched at runtime — nothing is hardcoded or cached.

## Tech Stack

- **React 19 + Vite 8** (SPA, no router)
- **Groq API** — LLM inference (`llama-3.3-70b-versatile` auto-discovered from the live model list)
- **Finnhub API** — real-time market data
- **GitHub Pages** — hosting

## Setup

1. Create free API keys: [console.groq.com](https://console.groq.com) and [finnhub.io](https://finnhub.io)
2. `npm install`
3. `npm run dev`
4. Enter both keys on the setup screen and click **Initialise Pipeline**

Keys are held in React state for the session only — never stored, never committed.

## Scripts

```bash
npm run dev       # local dev server
npm run build     # production build
npm run lint      # oxlint
npm run deploy    # publish dist/ to gh-pages branch
```

## Project Status

Academic project (NCI H9CEAI — Customer Engagement and AI). Not investment advice.
