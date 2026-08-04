function pct(v) {
  return v != null ? `${v >= 0 ? '+' : ''}${v.toFixed(2)}%` : '—'
}
function money(v) {
  return v != null ? `$${v.toFixed(2)}` : '—'
}

function RangeBar({ label, low, high, price, lowLabel, highLabel }) {
  const pctIn = price != null && low != null && high != null && high > low
    ? Math.min(100, Math.max(0, ((price - low) / (high - low)) * 100))
    : null

  return (
    <div className="rangebar">
      <div className="rangebar-head">
        <span className="rangebar-label">{label}</span>
        <span className="rangebar-price">{money(price)}</span>
      </div>
      <div className="rangebar-track">
        {pctIn != null && (
          <span className="rangebar-fill" style={{ width: `${pctIn}%` }}></span>
        )}
        {pctIn != null && (
          <span className="rangebar-marker" style={{ left: `calc(${pctIn}% - 4px)` }}></span>
        )}
      </div>
      <div className="rangebar-foot">
        <span>{lowLabel ? `${lowLabel} ${money(low)}` : money(low)}</span>
        <span>{highLabel ? `${highLabel} ${money(high)}` : money(high)}</span>
      </div>
    </div>
  )
}

export default function MarketVisuals({ data }) {
  const up = data.dayChangePct != null && data.dayChangePct >= 0
  const changeCls = up ? 'pos' : data.dayChangePct != null ? 'neg' : ''

  const chips = [
    ['LIVE PRICE', money(data.currentPrice), changeCls],
    ['DAY CHANGE', pct(data.dayChangePct), changeCls],
    ['OPEN', money(data.openPrice)],
    ['PREV CLOSE', money(data.previousClose)],
    ['DAY HIGH', money(data.dayHigh)],
    ['DAY LOW', money(data.dayLow)],
    ['52W RETURN', pct(data.return52Week), data.return52Week != null && data.return52Week >= 0 ? 'pos' : 'neg'],
    ['10D AVG VOL', data.volume10DayAvg != null ? `${(data.volume10DayAvg / 1000).toFixed(1)}M` : '—'],
    ['P/E', data.pe != null ? data.pe.toFixed(1) : '—'],
    ['DIV YIELD', data.divYield != null ? `${data.divYield.toFixed(2)}%` : '—']
  ]

  return (
    <div className="market-visuals">
      <div className="mv-title mono">RESEARCHER DATA — LIVE FINNHUB SNAPSHOT</div>

      <div className="mv-chips">
        {chips.map(([k, v, cls]) => (
          <div key={k} className="mv-chip">
            <span className="mv-chip-key">{k}</span>
            <span className={`mv-chip-val ${cls || ''}`}>{v}</span>
          </div>
        ))}
      </div>

      <div className="mv-ranges">
        <RangeBar
          label="52-WEEK RANGE"
          low={data.low52Week}
          high={data.high52Week}
          price={data.currentPrice}
          lowLabel="LOW"
          highLabel="HIGH"
        />
        <RangeBar
          label="DAY RANGE"
          low={data.dayLow}
          high={data.dayHigh}
          price={data.currentPrice}
          lowLabel="LOW"
          highLabel="HIGH"
        />
      </div>

      {data.note && <div className="mv-note">{data.note}</div>}
    </div>
  )
}