import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import { AuthProvider, useAuth } from './hooks/useAuth.jsx'
import Layout from './components/Layout.jsx'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Calendar from './pages/Calendar.jsx'
import ContentStudio from './pages/ContentStudio.jsx'
import AIGenerator from './pages/AIGenerator.jsx'
import Campaigns from './pages/Campaigns.jsx'
import KOCTracker from './pages/KOCTracker.jsx'
import B2BPipeline from './pages/B2BPipeline.jsx'
import ShopeeTracker from './pages/ShopeeTracker.jsx'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: '1rem', background: 'var(--cream)' }}>
      <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 24, color: 'var(--wood-700)' }}>Ha Le Teak</div>
      <div style={{ width: 24, height: 24, border: '2px solid var(--wood-200)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
    </div>
  )
  return user ? children : <Navigate to="/login" replace />
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="studio" element={<ContentStudio />} />
            <Route path="calendar" element={<Calendar />} />
            <Route path="ai" element={<AIGenerator />} />
            <Route path="campaigns" element={<Campaigns />} />
            <Route path="koc" element={<KOCTracker />} />
            <Route path="b2b" element={<B2BPipeline />} />
            <Route path="shopee" element={<ShopeeTracker />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
)
