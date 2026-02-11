import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ThemeToggle } from "./App.jsx";
import KoreanLunarCalendar from "korean-lunar-calendar";

const calendar = new KoreanLunarCalendar();

function formatDate(y, m, d) {
  return `${y}년 ${m}월 ${d}일`;
}

function NumInput({ value, onChange, maxLen, placeholder, min = 1, max }) {
  const clamp = (v) => (max && Number(v) > max ? String(max) : v);
  const handleChange = (e) => {
    const v = e.target.value.replace(/[^0-9]/g, "").slice(0, maxLen);
    onChange(clamp(v));
  };
  const step = (delta) => {
    const n = (Number(value) || 0) + delta;
    if (n < min) return;
    if (max && n > max) return;
    onChange(String(n));
  };
  return (
    <div className="lunar-num-group">
      <button className="lunar-step-btn" onClick={() => step(-1)}>−</button>
      <input
        type="text"
        inputMode="numeric"
        className="lunar-input lunar-input-num"
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
      />
      <button className="lunar-step-btn" onClick={() => step(1)}>+</button>
    </div>
  );
}

function getSolarMaxDay(y, m) {
  if (!y || !m) return 31;
  return new Date(y, m, 0).getDate();
}

function getLunarMaxDay(y, m) {
  if (!y || !m) return 30;
  try {
    if (calendar.setLunarDate(y, m, 30, false)) return 30;
  } catch { /* ignore */ }
  return 29;
}

function formatGapja(g) {
  const parts = [g.year, g.month, g.day];
  if (g.intercalation) parts.push(`(${g.intercalation})`);
  return parts.join(" ");
}

function SolarToLunar() {
  const now = new Date();
  const [year, setYear] = useState(String(now.getFullYear()));
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [day, setDay] = useState(String(now.getDate()));
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const clampDay = (y, m, d) => {
    const max = getSolarMaxDay(Number(y), Number(m));
    if (d && Number(d) > max) return String(max);
    return d;
  };
  const handleYear = (v) => { setYear(v); setDay((d) => clampDay(v, month, d)); };
  const handleMonth = (v) => { setMonth(v); setDay((d) => clampDay(year, v, d)); };

  const convert = () => {
    const y = Number(year), m = Number(month), d = Number(day);
    if (!y || !m || !d || !calendar.setSolarDate(y, m, d)) {
      setError("유효하지 않은 날짜입니다 (1000~2050년)");
      setResult(null);
      return;
    }
    const l = calendar.getLunarCalendar();
    const g = calendar.getKoreanGapja();
    const lunarStr = formatDate(l.year, l.month, l.day) + (l.intercalation ? " (윤달)" : "");
    const gapjaStr = formatGapja(g);
    setResult({ lunar: lunarStr, gapja: gapjaStr });
    setError("");
  };

  return (
    <div className="lunar-section">
      <h2 className="lunar-section-title">양력 → 음력</h2>
      <div className="lunar-input-row">
        <NumInput value={year} onChange={handleYear} maxLen={4} placeholder="년" />
        <NumInput value={month} onChange={handleMonth} maxLen={2} placeholder="월" max={12} />
        <NumInput value={day} onChange={setDay} maxLen={2} placeholder="일" max={getSolarMaxDay(Number(year), Number(month))} />
        <button className="lunar-btn" onClick={convert}>
          변환
        </button>
      </div>
      {error && <p className="lunar-error">{error}</p>}
      {result && (
        <div className="lunar-result-card">
          <div className="lunar-result-main">{result.lunar}</div>
          <div className="lunar-result-sub">{result.gapja}</div>
        </div>
      )}
    </div>
  );
}

function LunarToSolar() {
  const now = new Date();
  const [year, setYear] = useState(String(now.getFullYear()));
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [day, setDay] = useState(String(now.getDate()));
  const [isLeap, setIsLeap] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const clampDay = (y, m, d) => {
    const max = getLunarMaxDay(Number(y), Number(m));
    if (d && Number(d) > max) return String(max);
    return d;
  };
  const handleYear = (v) => { setYear(v); setDay((d) => clampDay(v, month, d)); };
  const handleMonth = (v) => { setMonth(v); setDay((d) => clampDay(year, v, d)); };

  const convert = () => {
    const y = Number(year), m = Number(month), d = Number(day);
    if (!y || !m || !d || !calendar.setLunarDate(y, m, d, isLeap)) {
      setError("유효하지 않은 음력 날짜입니다");
      setResult(null);
      return;
    }
    const s = calendar.getSolarCalendar();
    const g = calendar.getKoreanGapja();
    const solarStr = formatDate(s.year, s.month, s.day);
    const gapjaStr = formatGapja(g);
    setResult({ solar: solarStr, gapja: gapjaStr });
    setError("");
  };

  return (
    <div className="lunar-section">
      <h2 className="lunar-section-title">음력 → 양력</h2>
      <div className="lunar-input-row">
        <NumInput value={year} onChange={handleYear} maxLen={4} placeholder="년" />
        <NumInput value={month} onChange={handleMonth} maxLen={2} placeholder="월" max={12} />
        <NumInput value={day} onChange={setDay} maxLen={2} placeholder="일" max={getLunarMaxDay(Number(year), Number(month))} />
        <label className="lunar-checkbox">
          <input
            type="checkbox"
            checked={isLeap}
            onChange={(e) => setIsLeap(e.target.checked)}
          />
          윤달
        </label>
        <button className="lunar-btn" onClick={convert}>
          변환
        </button>
      </div>
      {error && <p className="lunar-error">{error}</p>}
      {result && (
        <div className="lunar-result-card">
          <div className="lunar-result-main">{result.solar}</div>
          <div className="lunar-result-sub">{result.gapja}</div>
        </div>
      )}
    </div>
  );
}

function LunarConverter() {
  const navigate = useNavigate();

  return (
    <div className="page">
      <div className="page-header">
        <button className="btn-back" onClick={() => navigate("/")}>
          ← 홈
        </button>
        <h1>양력 ↔ 음력 변환기</h1>
        <ThemeToggle />
      </div>
      <SolarToLunar />
      <LunarToSolar />
    </div>
  );
}

export default LunarConverter;
