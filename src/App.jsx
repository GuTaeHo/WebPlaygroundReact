import { useState, useEffect, createContext, useContext } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import Memo from "./Memo.jsx";
import Stock from "./Stock.jsx";
import LunarConverter from "./LunarConverter.jsx";
import "./App.css";

const ThemeContext = createContext();

export function useTheme() {
  return useContext(ThemeContext);
}

const SunIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <circle cx="8" cy="8" r="3" />
    <line x1="8" y1="1" x2="8" y2="3" />
    <line x1="8" y1="13" x2="8" y2="15" />
    <line x1="1" y1="8" x2="3" y2="8" />
    <line x1="13" y1="8" x2="15" y2="8" />
    <line x1="3.05" y1="3.05" x2="4.46" y2="4.46" />
    <line x1="11.54" y1="11.54" x2="12.95" y2="12.95" />
    <line x1="3.05" y1="12.95" x2="4.46" y2="11.54" />
    <line x1="11.54" y1="4.46" x2="12.95" y2="3.05" />
  </svg>
);

const MoonIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <path d="M13.5 8.5a5.5 5.5 0 1 1-6-6 4.5 4.5 0 0 0 6 6z" />
  </svg>
);

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button className="btn-theme" onClick={toggle} aria-label="Toggle theme">
      {theme === "dark" ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}

function Home() {
  const navigate = useNavigate();

  return (
    <div className="home">
      <div className="home-header">
        <h1>Playground</h1>
        <ThemeToggle />
      </div>
      <div className="app-grid">
        <button className="app-card-link" onClick={() => navigate("/memo")}>
          <div className="app-icon">{"\uD83D\uDCDD"}</div>
          <div className="app-card-title">메모장</div>
          <div className="app-card-desc">간단한 메모를 작성하고 관리하세요</div>
        </button>
        <button className="app-card-link" onClick={() => navigate("/stock")}>
          <div className="app-icon">{"\uD83D\uDCC8"}</div>
          <div className="app-card-title">주식 차트</div>
          <div className="app-card-desc">
            각 나라의 대표 주가 지수를 확인하세요
          </div>
        </button>
        <button className="app-card-link" onClick={() => navigate("/lunar")}>
          <div className="app-icon">{"\uD83C\uDF19"}</div>
          <div className="app-card-title">음력 변환기</div>
          <div className="app-card-desc">양력과 음력을 서로 변환하세요</div>
        </button>
      </div>
    </div>
  );
}

function App() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("theme") || "dark";
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("light", theme === "light");
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggle = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      <div className="app">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/memo" element={<Memo />} />
          <Route path="/stock" element={<Stock />} />
          <Route path="/lunar" element={<LunarConverter />} />
        </Routes>
      </div>
    </ThemeContext.Provider>
  );
}

export default App;
