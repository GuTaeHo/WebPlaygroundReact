import { Routes, Route, useNavigate } from 'react-router-dom'
import Memo from './Memo.jsx'
import Stock from './Stock.jsx'
import './App.css'

function Home() {
  const navigate = useNavigate()

  return (
    <div className="home">
      <h1>Web Playground</h1>
      <p className="home-description">원하는 앱을 선택하세요</p>
      <div className="app-grid">
        <button className="app-card-link" onClick={() => navigate('/memo')}>
          <div className="app-icon">📝</div>
          <div className="app-card-title">메모장</div>
          <div className="app-card-desc">간단한 메모를 작성하고 관리하세요</div>
        </button>
        <button className="app-card-link" onClick={() => navigate('/stock')}>
          <div className="app-icon">📈</div>
          <div className="app-card-title">주식 차트</div>
          <div className="app-card-desc">각 나라의 대표 주가 지수를 확인하세요</div>
        </button>
      </div>
    </div>
  )
}

function App() {
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/memo" element={<Memo />} />
        <Route path="/stock" element={<Stock />} />
      </Routes>
    </div>
  )
}

export default App
