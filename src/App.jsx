import { Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './theme/ThemeContext.jsx'
import Home from './home/Home.jsx'
import Memo from './memo/Memo.jsx'
import Stock from './stock/Stock.jsx'
import LunarConverter from './lunar/LunarConverter.jsx'
import './App.css'

function App() {
  return (
    <ThemeProvider>
      <div className="app">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/memo" element={<Memo />} />
          <Route path="/stock" element={<Stock />} />
          <Route path="/lunar" element={<LunarConverter />} />
        </Routes>
      </div>
    </ThemeProvider>
  )
}

export default App
