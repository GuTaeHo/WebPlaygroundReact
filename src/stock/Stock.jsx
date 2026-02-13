import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ThemeToggle } from '../theme/ThemeContext.jsx'
import { LineChart, Line, ResponsiveContainer, YAxis, XAxis, Tooltip } from 'recharts'
import './Stock.css'

const CURRENCIES = [
  { symbol: 'KRW=X', name: 'USD/KRW', flag: '🇺🇸🇰🇷', unit: '원' },
  { symbol: 'JPYKRW=X', name: 'JPY/KRW', flag: '🇯🇵🇰🇷', unit: '원' },
  { symbol: 'DX-Y.NYB', name: 'Dollar Index', flag: '💵', unit: '' },
]

const INDICES = [
  { symbol: '^GSPC', name: 'S&P 500', flag: '🇺🇸', desc: '미국 대형주 500개로 구성된 대표 지수', example: '애플, 마이크로소프트, 아마존 등' },
  { symbol: '^IXIC', name: 'NASDAQ', flag: '🇺🇸', desc: '미국 기술주 중심의 나스닥 종합 지수', example: '애플, 엔비디아, 테슬라 등' },
  { symbol: '^DJI', name: 'Dow Jones', flag: '🇺🇸', desc: '미국 우량 대형주 30개로 구성된 산업평균 지수', example: '골드만삭스, 보잉, 월마트 등' },
  { symbol: '^KS11', name: 'KOSPI', flag: '🇰🇷', desc: '한국 유가증권시장 상장 종목 종합 지수', example: '삼성전자, SK하이닉스, 현대차 등' },
  { symbol: '^KQ11', name: 'KOSDAQ', flag: '🇰🇷', desc: '한국 코스닥시장 상장 종목 종합 지수', example: '에코프로, HLB, 알테오젠 등' },
  { symbol: '^N225', name: 'Nikkei 225', flag: '🇯🇵', desc: '일본 도쿄증권거래소 대표 225개 종목 지수', example: '도요타, 소니, 닌텐도 등' },
  { symbol: '^GDAXI', name: 'DAX', flag: '🇩🇪', desc: '독일 프랑크푸르트 증권거래소 주요 40개 종목 지수', example: 'SAP, 지멘스, 폭스바겐 등' },
  { symbol: '^FTSE', name: 'FTSE 100', flag: '🇬🇧', desc: '영국 런던증권거래소 시가총액 상위 100개 종목 지수', example: '쉘, HSBC, 아스트라제네카 등' },
  { symbol: '000001.SS', name: 'Shanghai', flag: '🇨🇳', desc: '중국 상하이증권거래소 종합 지수', example: '마오타이, ICBC, 페트로차이나 등' },
  { symbol: '^HSI', name: 'Hang Seng', flag: '🇭🇰', desc: '홍콩 항셍 대표 종목 지수', example: '텐센트, 알리바바, AIA 등' },
]

const RANGES = [
  { key: '1d', label: '일', range: '1d', interval: '5m' },
  { key: '5d', label: '주', range: '5d', interval: '30m' },
  { key: '1mo', label: '월', range: '1mo', interval: '1d' },
  { key: '3mo', label: '3개월', range: '3mo', interval: '1d' },
  { key: '1y', label: '1년', range: '1y', interval: '1wk' },
  { key: '5y', label: '5년', range: '5y', interval: '1mo' },
  { key: 'max', label: '전체', range: 'max', interval: '1mo' },
]

const PROXY = 'https://corsproxy.io/?url='

async function fetchIndex(symbol, range, interval) {
  const encoded = encodeURIComponent(symbol)
  const url = `${PROXY}${encodeURIComponent(
    `https://query1.finance.yahoo.com/v8/finance/chart/${encoded}?range=${range}&interval=${interval}`
  )}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const json = await res.json()
  const result = json.chart.result[0]
  const meta = result.meta
  const closes = result.indicators.quote[0].close
  const timestamps = result.timestamp

  const chartData = timestamps
    .map((t, i) => ({ time: t, price: closes[i] }))
    .filter((d) => d.price != null)

  const currentPrice = meta.regularMarketPrice
  const previousClose = meta.chartPreviousClose
  const change = currentPrice - previousClose
  const changePercent = (change / previousClose) * 100

  return {
    currentPrice,
    change,
    changePercent,
    chartData,
  }
}

function formatChartDate(timestamp, rangeKey) {
  const d = new Date(timestamp * 1000)
  if (rangeKey === '1d') {
    return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
  }
  if (rangeKey === '5d') {
    return d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
  }
  if (rangeKey === '1mo' || rangeKey === '3mo') {
    return d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
  }
  return d.toLocaleDateString('ko-KR', { year: '2-digit', month: 'short', day: 'numeric' })
}

function ChartTooltip({ active, payload, rangeKey }) {
  if (!active || !payload?.length) return null
  const { time, price } = payload[0].payload
  return (
    <div className="stock-tooltip">
      <div className="stock-tooltip-date">{formatChartDate(time, rangeKey)}</div>
      <div className="stock-tooltip-price">
        {price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </div>
    </div>
  )
}

function CurrencyCard({ item, data, loading, error }) {
  const isPositive = data && data.change >= 0
  const color = isPositive ? '#22c55e' : '#ef4444'

  return (
    <div className="currency-card">
      <div className="currency-top">
        <span className="currency-flag">{item.flag}</span>
        <span className="currency-name">{item.name}</span>
      </div>
      {loading && <span className="stock-loading">불러오는 중...</span>}
      {error && <span className="stock-error">로드 실패</span>}
      {data && (
        <div className="currency-bottom">
          <span className="currency-price">
            {data.currentPrice.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
            {item.unit && <span className="currency-unit"> {item.unit}</span>}
          </span>
          <span className="currency-change" style={{ color }}>
            {isPositive ? '▲' : '▼'}{' '}
            {Math.abs(data.change).toFixed(2)} ({isPositive ? '+' : ''}
            {data.changePercent.toFixed(2)}%)
          </span>
        </div>
      )}
    </div>
  )
}

function InfoBubble({ text, example }) {
  const [show, setShow] = useState(false)
  return (
    <span className="info-bubble-wrap">
      <button className="info-bubble-btn" onClick={() => setShow(v => !v)}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      </button>
      {show && (
        <>
          <div className="info-bubble-overlay" onClick={() => setShow(false)} />
          <div className="info-bubble-popup">
            <div>{text}</div>
            {example && <div className="info-bubble-example">({example})</div>}
          </div>
        </>
      )}
    </span>
  )
}

function IndexCard({ index, data, loading, error, rangeKey }) {
  const isPositive = data && data.change >= 0
  const color = isPositive ? '#22c55e' : '#ef4444'

  const startLabel = data ? formatChartDate(data.chartData[0].time, rangeKey) : ''
  const endLabel = data ? formatChartDate(data.chartData[data.chartData.length - 1].time, rangeKey) : ''

  return (
    <div className="stock-card">
      <div className="stock-card-top">
        <div className="stock-info">
          <span className="stock-flag">{index.flag}</span>
          <span className="stock-name">{index.name}</span>
          {index.desc && <InfoBubble text={index.desc} example={index.example} />}
        </div>
        {loading && <span className="stock-loading">불러오는 중...</span>}
        {error && <span className="stock-error">로드 실패</span>}
        {data && (
          <div className="stock-price-info">
            <span className="stock-price">
              {data.currentPrice.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
            <span className="stock-change" style={{ color }}>
              {isPositive ? '+' : ''}
              {data.change.toFixed(2)} ({isPositive ? '+' : ''}
              {data.changePercent.toFixed(2)}%)
            </span>
          </div>
        )}
      </div>
      {data && (
        <div className="stock-chart">
          <ResponsiveContainer width="100%" height={80}>
            <LineChart data={data.chartData} margin={{ bottom: 2 }}>
              <YAxis domain={['dataMin', 'dataMax']} hide />
              <XAxis
                dataKey="time"
                hide
              />
              <Tooltip
                content={<ChartTooltip rangeKey={rangeKey} />}
                cursor={{ stroke: '#888', strokeWidth: 1, strokeDasharray: '3 3' }}
              />
              <Line
                type="monotone"
                dataKey="price"
                stroke={color}
                strokeWidth={1.5}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
          <div className="stock-chart-dates">
            <span>{startLabel}</span>
            <span>{endLabel}</span>
          </div>
        </div>
      )}
    </div>
  )
}

function CurrencyCalculator({ usdKrw, jpyKrw }) {
  const [selectedCurrency, setSelectedCurrency] = useState('KRW')
  const [amount, setAmount] = useState('')
  const currencyUnitLabel = {
    KRW: '원',
    USD: '달러',
    JPY: '엔',
  }

  const amountNum = parseFloat(amount) || 0
  const formatAmount = (value) => {
    if (value === '-') return value
    const numberValue = Number(value)
    if (!Number.isFinite(numberValue)) return '-'
    return numberValue.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  const calculate = () => {
    if (!usdKrw || !jpyKrw) return { krw: '-', usd: '-', jpy: '-' }

    if (selectedCurrency === 'KRW') {
      return {
        krw: amountNum.toFixed(2),
        usd: (amountNum / usdKrw).toFixed(2),
        jpy: (amountNum / jpyKrw).toFixed(2),
      }
    } else if (selectedCurrency === 'USD') {
      return {
        krw: (amountNum * usdKrw).toFixed(2),
        usd: amountNum.toFixed(2),
        jpy: ((amountNum * usdKrw) / jpyKrw).toFixed(2),
      }
    } else {
      // JPY
      return {
        krw: (amountNum * jpyKrw).toFixed(2),
        usd: ((amountNum * jpyKrw) / usdKrw).toFixed(2),
        jpy: amountNum.toFixed(2),
      }
    }
  }

  const result = calculate()
  const resultItemsByBase = {
    KRW: [
      { key: 'usd', flag: '🇺🇸', label: '달러' },
      { key: 'jpy', flag: '🇯🇵', label: '엔' },
    ],
    USD: [
      { key: 'krw', flag: '🇰🇷', label: '원' },
      { key: 'jpy', flag: '🇯🇵', label: '엔' },
    ],
    JPY: [
      { key: 'krw', flag: '🇰🇷', label: '원' },
      { key: 'usd', flag: '🇺🇸', label: '달러' },
    ],
  }
  const visibleResults = resultItemsByBase[selectedCurrency]

  return (
    <div className="calc-panel">
      <div className="calc-tabs">
        <button
          className={`calc-tab ${selectedCurrency === 'KRW' ? 'active' : ''}`}
          onClick={() => setSelectedCurrency('KRW')}
        >
          🇰🇷 원
        </button>
        <button
          className={`calc-tab ${selectedCurrency === 'USD' ? 'active' : ''}`}
          onClick={() => setSelectedCurrency('USD')}
        >
          🇺🇸 달러
        </button>
        <button
          className={`calc-tab ${selectedCurrency === 'JPY' ? 'active' : ''}`}
          onClick={() => setSelectedCurrency('JPY')}
        >
          🇯🇵 엔
        </button>
      </div>
      <div className="calc-input-row">
        <input
          type="number"
          placeholder="금액 입력"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="calc-input"
        />
        <span className="calc-unit">{currencyUnitLabel[selectedCurrency]}</span>
      </div>
      <div className="calc-results">
        {visibleResults.map((item) => (
          <div className="calc-result" key={item.key}>
            <span className="calc-flag">{item.flag}</span>
            <span className="calc-value">{formatAmount(result[item.key])}</span>
            <span className="calc-label">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function Stock() {
  const navigate = useNavigate()
  const [showCalc, setShowCalc] = useState(false)
  const [selectedRange, setSelectedRange] = useState(() => {
    const saved = localStorage.getItem('stockRange')
    return RANGES.find((r) => r.key === saved) || RANGES[2]
  })
  const [indexData, setIndexData] = useState({})
  const [currencyData, setCurrencyData] = useState({})
  const [loadingSet, setLoadingSet] = useState(new Set())
  const [errorSet, setErrorSet] = useState(new Set())

  const fetchSymbols = useCallback((symbols, range, interval, setter) => {
    symbols.forEach((idx) => {
      setLoadingSet((prev) => new Set(prev).add(idx.symbol))
      fetchIndex(idx.symbol, range, interval)
        .then((data) => {
          setter((prev) => ({ ...prev, [idx.symbol]: data }))
          setLoadingSet((prev) => {
            const next = new Set(prev)
            next.delete(idx.symbol)
            return next
          })
        })
        .catch(() => {
          setLoadingSet((prev) => {
            const next = new Set(prev)
            next.delete(idx.symbol)
            return next
          })
          setErrorSet((prev) => new Set(prev).add(idx.symbol))
        })
    })
  }, [])

  // Fetch currencies once on mount (1d range)
  useEffect(() => {
    fetchSymbols(CURRENCIES, '1d', '5m', setCurrencyData)
  }, [fetchSymbols])

  // Fetch indices when range changes
  useEffect(() => {
    setIndexData({})
    setErrorSet((prev) => {
      const next = new Set(prev)
      INDICES.forEach((idx) => next.delete(idx.symbol))
      return next
    })
    fetchSymbols(INDICES, selectedRange.range, selectedRange.interval, setIndexData)
  }, [selectedRange, fetchSymbols])

  const handleRangeChange = (rangeObj) => {
    if (rangeObj.key === selectedRange.key) return
    setSelectedRange(rangeObj)
    localStorage.setItem('stockRange', rangeObj.key)
  }

  useEffect(() => {
    if (!showCalc) return undefined
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setShowCalc(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [showCalc])

  return (
    <div className="page">
      <div className="page-header">
        <button className="btn-back" onClick={() => navigate('/')}>
          ← 홈
        </button>
        <h1>주가 지수</h1>
        <ThemeToggle />
      </div>

      <div className="section-group">
        <div className="section-header">
          <h2 className="section-title">환율</h2>
          <button className="calc-toggle" onClick={() => setShowCalc(true)}>
            환율 계산기
          </button>
        </div>
        <div className="currency-list">
          {CURRENCIES.map((item) => (
            <CurrencyCard
              key={item.symbol}
              item={item}
              data={currencyData[item.symbol]}
              loading={loadingSet.has(item.symbol)}
              error={errorSet.has(item.symbol)}
            />
          ))}
        </div>
      </div>

      {showCalc && (
        <div className="calc-modal-overlay" onClick={() => setShowCalc(false)}>
          <div className="calc-modal" onClick={(e) => e.stopPropagation()}>
            <div className="calc-modal-header">
              <h2>실시간 환율 계산기</h2>
              <button className="calc-modal-close" onClick={() => setShowCalc(false)}>
                닫기
              </button>
            </div>
            <CurrencyCalculator
              usdKrw={currencyData['KRW=X']?.currentPrice}
              jpyKrw={currencyData['JPYKRW=X']?.currentPrice}
            />
          </div>
        </div>
      )}

      <div className="section-group">
        <h2 className="section-title">주가 지수</h2>
        <div className="range-tabs">
          {RANGES.map((r) => (
            <button
              key={r.key}
              className={`range-tab ${r.key === selectedRange.key ? 'active' : ''}`}
              onClick={() => handleRangeChange(r)}
            >
              {r.label}
            </button>
          ))}
        </div>

        <div className="stock-list">
          {INDICES.map((idx) => (
            <IndexCard
              key={idx.symbol}
              index={idx}
              data={indexData[idx.symbol]}
              loading={loadingSet.has(idx.symbol)}
              error={errorSet.has(idx.symbol)}
              rangeKey={selectedRange.key}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default Stock
