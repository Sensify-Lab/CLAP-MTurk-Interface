import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home';
import Auth from './pages/Auth';
import Survey from './pages/Survey';
import AccessDenied from './pages/AccessDenied';
import './App.css';
import { useEffect } from 'react';

function App() {
  useEffect(() => {
    fetch('http://localhost:8000/health')
      .then(res => res.json())
      .then(data => console.log(data.status))
      .catch(err => console.error('FastAPI not reachable:', err));
  }, []);

  return (
    <Router>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/survey" element={<Survey />} />
        <Route path="/denied" element={<AccessDenied />} />
      </Routes>
    </Router>
  );
}

export default App;