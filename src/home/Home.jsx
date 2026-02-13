import { useNavigate } from 'react-router-dom'
import { ThemeToggle } from '../theme/ThemeContext.jsx'
import './Home.css'

function Home() {
  const navigate = useNavigate()

  return (
    <div className="home">
      <div className="home-header">
        <h1>Playground</h1>
        <ThemeToggle />
      </div>
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
        <button className="app-card-link" onClick={() => navigate('/lunar')}>
          <div className="app-icon">🌙</div>
          <div className="app-card-title">음력 변환기</div>
          <div className="app-card-desc">양력과 음력을 서로 변환하세요</div>
        </button>
        <button className="app-card-link" onClick={() => navigate('/compound')}>
          <div className="app-icon">💰</div>
          <div className="app-card-title">복리 계산기</div>
          <div className="app-card-desc">복리 투자 수익을 계산하세요</div>
        </button>
        <button className="app-card-link" onClick={() => navigate('/meal')}>
          <div className="app-icon">🍽️</div>
          <div className="app-card-title">식비 계산기</div>
          <div className="app-card-desc">일주일 식비를 정산하세요</div>
        </button>
      </div>
    </div>
  )
}

export default Home
