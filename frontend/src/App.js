import { useEffect } from 'react';
import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import AnalysisPage from './pages/AnalysisPage';

function App() {
  return (
    <div style={{ background: '#02060a', minHeight: '100vh' }}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/analysis" element={<AnalysisPage />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
