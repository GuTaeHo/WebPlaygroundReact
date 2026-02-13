import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ThemeToggle } from '../theme/ThemeContext.jsx'
import './CompoundInterest.css'

function formatNumber(n) {
  return n.toLocaleString('ko-KR', { maximumFractionDigits: 0 })
}

function addCommas(v) {
  const [int, dec] = v.split('.')
  const withCommas = int.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return dec !== undefined ? `${withCommas}.${dec}` : withCommas
}

function stripCommas(v) {
  return v.replace(/,/g, '')
}

function EyeIcon({ visible, onClick }) {
  return (
    <button className="ci-eye-btn" onClick={onClick} title={visible ? '숨기기' : '표시'}>
      {visible ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
          <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
          <line x1="1" y1="1" x2="23" y2="23" />
        </svg>
      )}
    </button>
  )
}

const DIGITS = ['', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구']
const SMALL_UNITS = ['', '십', '백', '천']
const BIG_UNITS = ['', '만', '억', '조']

function toKoreanUnit(n) {
  if (n === 0) return '영원'
  const str = String(Math.abs(Math.round(n)))
  const groups = []
  for (let i = str.length; i > 0; i -= 4) {
    groups.unshift(str.slice(Math.max(0, i - 4), i))
  }
  const parts = []
  const bigIdx = groups.length - 1
  for (let g = 0; g < groups.length; g++) {
    const chunk = groups[g]
    const digits = []
    for (let i = 0; i < chunk.length; i++) {
      const d = Number(chunk[i])
      if (d === 0) continue
      const unitPos = chunk.length - 1 - i
      digits.push((d === 1 && unitPos > 0 ? '' : DIGITS[d]) + SMALL_UNITS[unitPos])
    }
    if (digits.length) parts.push(digits.join(' ') + BIG_UNITS[bigIdx - g])
  }
  return (n < 0 ? '마이너스 ' : '') + parts.join(' ') + '원'
}

function CompoundInterest() {
  const navigate = useNavigate()
  const [principal, setPrincipal] = useState('')
  const [monthly, setMonthly] = useState('')
  const [rate, setRate] = useState('')
  const [years, setYears] = useState('')
  const [showDeposit, setShowDeposit] = useState(true)
  const [showInterest, setShowInterest] = useState(true)
  const [showDiff, setShowDiff] = useState(true)

  const handleNumber = (setter, allowDecimal = false) => (e) => {
    const raw = stripCommas(e.target.value)
    const v = allowDecimal
      ? raw.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1')
      : raw.replace(/[^0-9]/g, '')
    setter(v)
  }

  const result = useMemo(() => {
    const P = Number(principal) || 0
    const M = Number(monthly) || 0
    const r = (Number(rate) || 0) / 100
    const t = Number(years) || 0

    if (r === 0 && t === 0) return null

    const months = t * 12
    const monthlyRate = r / 12

    let totalDeposit = P + M * months
    let finalAmount

    if (monthlyRate === 0) {
      finalAmount = totalDeposit
    } else {
      const principalGrowth = P * Math.pow(1 + monthlyRate, months)
      const monthlyGrowth = M * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate)
      finalAmount = principalGrowth + monthlyGrowth
    }

    const totalInterest = finalAmount - totalDeposit

    const breakdown = []
    let balance = P
    for (let y = 1; y <= t; y++) {
      for (let m = 0; m < 12; m++) {
        balance = balance * (1 + monthlyRate) + M
      }
      breakdown.push({
        year: y,
        deposit: P + M * 12 * y,
        balance: Math.round(balance),
        interest: Math.round(balance - P - M * 12 * y),
      })
    }

    return {
      finalAmount: Math.round(finalAmount),
      totalDeposit: Math.round(totalDeposit),
      totalInterest: Math.round(totalInterest),
      breakdown,
    }
  }, [principal, monthly, rate, years])

  return (
    <div className="page">
      <div className="page-header">
        <button className="btn-back" onClick={() => navigate('/')}>← 홈</button>
        <h1>복리 계산기</h1>
        <ThemeToggle />
      </div>

      <div className="ci-section">
        <div className="ci-form">
          <label className="ci-label">
            <span>초기 투자금</span>
            <div className="ci-input-wrap">
              <input
                type="text"
                inputMode="numeric"
                className="ci-input"
                placeholder="0"
                value={addCommas(principal)}
                onChange={handleNumber(setPrincipal)}
              />
              <span className="ci-unit">원</span>
            </div>
          </label>
          <label className="ci-label">
            <span>월 적립금</span>
            <div className="ci-input-wrap">
              <input
                type="text"
                inputMode="numeric"
                className="ci-input"
                placeholder="0"
                value={addCommas(monthly)}
                onChange={handleNumber(setMonthly)}
              />
              <span className="ci-unit">원</span>
            </div>
          </label>
          <label className="ci-label">
            <span>연 이자율</span>
            <div className="ci-input-wrap">
              <input
                type="text"
                inputMode="decimal"
                className="ci-input"
                placeholder="예: 5"
                value={rate}
                onChange={handleNumber(setRate, true)}
              />
              <span className="ci-unit">%</span>
            </div>
          </label>
          <label className="ci-label">
            <span>투자 기간</span>
            <div className="ci-input-wrap">
              <input
                type="text"
                inputMode="numeric"
                className="ci-input"
                placeholder="예: 10"
                value={years}
                onChange={handleNumber(setYears)}
              />
              <span className="ci-unit">년</span>
            </div>
          </label>
        </div>
      </div>

      {result && (
        <>
          <div className="ci-section ci-summary">
            <div className="ci-summary-item">
              <span className="ci-summary-label">총 투자 원금</span>
              <div className="ci-summary-right">
                <span className="ci-summary-value">{formatNumber(result.totalDeposit)}원</span>
                <span className="ci-summary-korean">({toKoreanUnit(result.totalDeposit)})</span>
              </div>
            </div>
            <div className="ci-summary-item">
              <span className="ci-summary-label">총 이자 수익</span>
              <div className="ci-summary-right">
                <span className="ci-summary-value ci-interest">{formatNumber(result.totalInterest)}원</span>
                <span className="ci-summary-korean">({toKoreanUnit(result.totalInterest)})</span>
              </div>
            </div>
            <div className="ci-summary-item ci-summary-total">
              <span className="ci-summary-label">최종 금액</span>
              <div className="ci-summary-right">
                <span className="ci-summary-value ci-highlight">{formatNumber(result.finalAmount)}원</span>
                <span className="ci-summary-korean">({toKoreanUnit(result.finalAmount)})</span>
              </div>
            </div>
          </div>

          {result.breakdown.length > 0 && (
            <div className="ci-section">
              <h2 className="ci-table-title">연도별 내역</h2>
              <div className="ci-table-wrap">
                <table className="ci-table">
                  <thead>
                    <tr>
                      <th>연차</th>
                      <th className={`ci-th-toggle${showDeposit ? '' : ' ci-th-hidden'}`}>
                        누적 원금
                        <EyeIcon visible={showDeposit} onClick={() => setShowDeposit(v => !v)} />
                      </th>
                      <th className={`ci-th-toggle${showInterest ? '' : ' ci-th-hidden'}`}>
                        누적 이자
                        <EyeIcon visible={showInterest} onClick={() => setShowInterest(v => !v)} />
                      </th>
                      <th className={`ci-th-toggle${showDiff ? '' : ' ci-th-hidden'}`}>
                        이자 증가분
                        <EyeIcon visible={showDiff} onClick={() => setShowDiff(v => !v)} />
                      </th>
                      <th>총 잔액</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.breakdown.map((row, idx) => {
                      const prevInterest = idx > 0 ? result.breakdown[idx - 1].interest : 0
                      const diff = row.interest - prevInterest
                      return (
                        <tr key={row.year}>
                          <td>{row.year}년</td>
                          <td>{showDeposit ? `${formatNumber(row.deposit)}원` : ''}</td>
                          <td className={showInterest ? 'ci-interest' : ''}>{showInterest ? `${formatNumber(row.interest)}원` : ''}</td>
                          <td className={showDiff ? 'ci-diff' : ''}>{showDiff ? `+${formatNumber(diff)}원` : ''}</td>
                          <td>{formatNumber(row.balance)}원</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default CompoundInterest
