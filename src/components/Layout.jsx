import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { LayoutDashboard, FolderOpen, Calendar, Sparkles, Megaphone, Users, Briefcase, LogOut, TrendingUp } from 'lucide-react'
import { useAuth } from '../hooks/useAuth.jsx'
import { Toast } from './Shared.jsx'

const NAV = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { section: 'Nội dung' },
  { to: '/studio', icon: FolderOpen, label: 'Content Studio' },
  { to: '/calendar', icon: Calendar, label: 'Content Calendar' },
  { to: '/ai', icon: Sparkles, label: 'AI Generator' },
  { section: 'Chiến dịch' },
  { to: '/campaigns', icon: Megaphone, label: 'Campaigns' },
  { section: 'Kinh doanh' },
  { to: '/koc', icon: Users, label: 'KOC Seeding' },
  { to: '/b2b', icon: Briefcase, label: 'B2B Pipeline' },
  { to: '/shopee', icon: TrendingUp, label: 'Shopee Tracker' },
]

export default function Layout() {
  const { profile, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const initials = profile?.full_name?.split(' ').map(w=>w[0]).slice(-2).join('').toUpperCase() || 'HL'

  return (
    <div>
      <nav className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-mark display">Ha Le Teak</div>
          <div className="logo-sub">Marketing OS</div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '1rem' }}>
          {NAV.map((item, i) => {
            if (item.section) return <div key={i} className="nav-section">{item.section}</div>
            const Icon = item.icon
            const active = location.pathname === item.to
            return (
              <div key={item.to} className={`nav-item ${active ? 'active' : ''}`} onClick={() => navigate(item.to)}>
                <Icon size={16} />
                {item.label}
              </div>
            )
          })}
        </div>
        <div className="sidebar-footer">
          <div className="avatar">{initials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,.8)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{profile?.full_name || 'User'}</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,.3)', textTransform: 'uppercase', letterSpacing: '.05em' }}>{profile?.role || 'member'}</div>
          </div>
          <button onClick={signOut} style={{ color: 'rgba(255,255,255,.3)', cursor: 'pointer', padding: 4 }} title="Đăng xuất"><LogOut size={15} /></button>
        </div>
      </nav>
      <main className="main">
        <Outlet />
      </main>
    </div>
  )
}
