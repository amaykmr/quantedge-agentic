const FINNHUB_BASE = 'https://finnhub.io/api/v1'

export async function fetchMarketData(ticker, finnhubKey, signal) {
  const quote = await finnhubGet(`/quote?symbol=${encodeURIComponent(ticker)}`, finnhubKey, signal)
  const profile = await finnhubGet(`/stock/profile2?symbol=${encodeURIComponent(ticker)}`, finnhubKey, signal)

  let metrics = {}
  try {
    const m = await finnhubGet(
      `/stock/metric?symbol=${encodeURIComponent(ticker)}&metric=all`,
      finnhubKey,
      signal
    )
    metrics = m?.metric || {}
  } catch {
    metrics = {}
  }

  return {
    ticker,
    companyName: profile?.name || ticker,
    industry: profile?.finnhubIndustry || 'unavailable',
    marketCap: profile?.marketCapitalization ?? null,
    country: profile?.country || 'unavailable',
    exchange: profile?.exchange || 'unavailable',
    currency: profile?.currency || 'unavailable',
    currentPrice: quote?.c ?? null,
    dayHigh: quote?.h ?? null,
    dayLow: quote?.l ?? null,
    openPrice: quote?.o ?? null,
    previousClose: quote?.pc ?? null,
    dayChangePct: quote?.dp ?? null,
    volume10DayAvg: metrics['10DayAverageTradingVolume'] ?? null,
    volume3MonthAvg: metrics['3MonthAverageTradingVolume'] ?? null,
    high52Week: metrics['52WeekHigh'] ?? null,
    low52Week: metrics['52WeekLow'] ?? null,
    high52WeekDate: metrics['52WeekHighDate'] ?? null,
    low52WeekDate: metrics['52WeekLowDate'] ?? null,
    return52Week: metrics['52WeekPriceReturnDaily'] ?? null,
    pe: metrics['peNormalizedAnnual'] ?? metrics['peTTM'] ?? null,
    divYield: metrics['dividendYieldIndicatedAnnual'] ?? null,
    beta: metrics?.beta ?? null
  }
}

async function finnhubGet(path, finnhubKey, signal) {
  const res = await fetch(`${FINNHUB_BASE}${path}&token=${finnhubKey}`, { method: 'GET', signal })
  if (!res.ok) throw new Error(`Finnhub request failed (${res.status}) for ${path}`)
  return res.json()
}