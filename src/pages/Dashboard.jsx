import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LayoutDashboard, FolderOpen, Sparkles, Megaphone, Users, Briefcase, TrendingUp, ArrowRight, Plus, Clock } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth.jsx'
import { PlatformBadge, StatusBadge } from '../components/Shared.jsx'
import { format, isToday, parseISO, subDays, eachDayOfInterval, startOfWeek, endOfWeek } from 'date-fns'
import { vi } from 'date-fns/locale'

function MiniBarChart({ data }) {
  if (!data || data.length === 0) return null
  const max = Math.max(...data.map(d => d.value), 1)
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 40 }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <div style={{ width: '100%', background: i === data.length - 1 ? 'var(--accent)' : 'var(--cream-dark)', borderRadius: 3, height: Math.max(4, Math.round((d.value / max) * 36)), transition: 'height .3s' }} title={`${d.label}: ${new Intl.NumberFormat('vi-VN', { notation: 'compact' }).format(d.value)}₫`} />
        </div>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState({ posts: 0, campaigns: 0, koc: 0, b2b: 0, pendingPosts: 0, overdueB2B: 0 })
  const [todayPosts, setTodayPosts] = useState([])
  const [recentPosts, setRecentPosts] = useState([])
  const [shopeeData, setShopeeData] = useState([])
  const [activeCampaign, setActiveCampaign] = useState(null)
  const [campaignKpis, setCampaignKpis] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    const [postsRes, campaignsRes, kocRes, b2bRes, shopeeRes, activeCampRes] = await Promise.all([
      supabase.from('posts').select('id,title,platform,status,scheduled_at,image_url,post_type').order('scheduled_at', { ascending: true }).limit(50),
      supabase.from('campaigns').select('id', { count: 'exact' }).eq('status', 'active'),
      supabase.from('koc_leads').select('id', { count: 'exact' }),
      supabase.from('b2b_leads').select('id,follow_up_date,stage'),
      supabase.from('shopee_stats').select('*').order('date', { ascending: false }).limit(14),
      supabase.from('campaigns').select('*').eq('status', 'active').limit(1).single(),
    ])

    const allPosts = postsRes.data || []
    const today = allPosts.filter(p => p.scheduled_at && isToday(parseISO(p.scheduled_at)))
    const pending = allPosts.filter(p => p.status === 'pending')
    setTodayPosts(today)
    setRecentPosts(allPosts.filter(p => !isToday(parseISO(p.scheduled_at || '2000-01-01'))).slice(0, 5))

    const b2bLeads = b2bRes.data || []
    const overdueB2B = b2bLeads.filter(l => l.follow_up_date && new Date(l.follow_up_date) < new Date() && !['won','lost'].includes(l.stage)).length

    setStats({ posts: postsRes.data?.length || 0, campaigns: campaignsRes.count || 0, koc: kocRes.count || 0, b2b: b2bLeads.length, pendingPosts: pending.length, overdueB2B })

    const shopee = (shopeeRes.data || []).reverse()
    setShopeeData(shopee.map(s => ({ label: format(parseISO(s.date), 'dd/MM'), value: s.revenue || 0, orders: s.orders || 0 })))

    if (activeCampRes.data) {
      setActiveCampaign(activeCampRes.data)
      const { data: kpis } = await supabase.from('campaign_kpis').select('*').eq('campaign_id', activeCampRes.data.id)
      if (kpis?.length) {
        setCampaignKpis({
          reach: kpis.reduce((s, k) => s + (k.reach || 0), 0),
          engagement: kpis.reduce((s, k) => s + (k.engagement || 0), 0),
          orders: kpis.reduce((s, k) => s + (k.orders || 0), 0),
          revenue: kpis.reduce((s, k) => s + (k.revenue || 0), 0),
        })
      }
    }
    setLoading(false)
  }

  const firstName = profile?.full_name?.split(' ').pop() || 'bạn'
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Chào buổi sáng' : hour < 18 ? 'Xin chào' : 'Chào buổi tối'
  const shopeeTotal7 = shopeeData.slice(-7).reduce((s, d) => s + d.value, 0)
  const shopeeOrders7 = shopeeData.slice(-7).reduce((s, d) => s + (d.orders || 0), 0)

  const QUICK_ACTIONS = [
    { icon: Sparkles, label: 'Generate AI', sub: 'Tạo caption, script', to: '/ai', color: 'var(--purple-bg)', iconColor: 'var(--purple-text)' },
    { icon: FolderOpen, label: 'Tạo bài mới', sub: 'Content Studio', to: '/studio', color: 'var(--blue-bg)', iconColor: 'var(--blue-text)' },
    { icon: Megaphone, label: 'Campaigns', sub: 'Theo dõi chiến dịch', to: '/campaigns', color: 'var(--amber-bg)', iconColor: 'var(--amber-text)' },
    { icon: Users, label: 'KOC Seeding', sub: 'Influencer pipeline', to: '/koc', color: 'var(--green-bg)', iconColor: 'var(--green-text)' },
    { icon: Briefcase, label: 'B2B Pipeline', sub: 'Corporate gifting', to: '/b2b', color: 'var(--pink-bg)', iconColor: 'var(--pink-text)' },
    { icon: TrendingUp, label: 'Shopee Tracker', sub: 'Doanh thu hàng ngày', to: '/shopee', color: 'var(--accent-light)', iconColor: 'var(--accent)' },
  ]

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ width: 28, height: 28, border: '2.5px solid var(--cream-dark)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
      <div className="text-muted">Đang tải dashboard...</div>
    </div>
  )

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: 22 }}>{greeting}, {firstName}! 👋</h1>
            <p style={{ color: 'var(--text-muted)', marginTop: '.2rem' }}>
              {format(new Date(), "EEEE, dd MMMM yyyy", { locale: vi })}
              {todayPosts.length > 0 && ` · ${todayPosts.length} bài đăng hôm nay`}
            </p>
          </div>
          <button className="btn btn-primary" onClick={() => navigate('/studio')}><Plus size={15} />Tạo bài mới</button>
        </div>

        {/* Alert badges */}
        {(stats.pendingPosts > 0 || stats.overdueB2B > 0) && (
          <div className="flex-center gap-2 mt-3">
            {stats.pendingPosts > 0 && (
              <div style={{ background: 'var(--amber-bg)', border: '1px solid rgba(122,78,0,.15)', borderRadius: 8, padding: '.4rem .85rem', fontSize: 12, color: 'var(--amber-text)', fontWeight: 500, cursor: 'pointer' }} onClick={() => navigate('/studio')}>
                ⏳ {stats.pendingPosts} bài chờ duyệt
              </div>
            )}
            {stats.overdueB2B > 0 && (
              <div style={{ background: 'var(--red-bg)', border: '1px solid rgba(122,26,26,.15)', borderRadius: 8, padding: '.4rem .85rem', fontSize: 12, color: 'var(--red-text)', fontWeight: 500, cursor: 'pointer' }} onClick={() => navigate('/b2b')}>
                ⚠️ {stats.overdueB2B} B2B lead quá hạn follow-up
              </div>
            )}
          </div>
        )}
      </div>

      {/* Stats row */}
      <div className="grid-stats mb-6">
        <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/studio')}>
          <div className="stat-label">Tổng nội dung</div>
          <div className="stat-val">{stats.posts}</div>
          <div className="stat-sub">bài viết</div>
        </div>
        <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/campaigns')}>
          <div className="stat-label">Campaign active</div>
          <div className="stat-val">{stats.campaigns}</div>
          <div className="stat-sub">đang chạy</div>
        </div>
        <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/koc')}>
          <div className="stat-label">KOC</div>
          <div className="stat-val">{stats.koc}</div>
          <div className="stat-sub">influencer</div>
        </div>
        <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/b2b')}>
          <div className="stat-label">B2B leads</div>
          <div className="stat-val">{stats.b2b}</div>
          <div className="stat-sub">đối tác tiềm năng</div>
        </div>
        {shopeeTotal7 > 0 && (
          <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/shopee')}>
            <div className="stat-label">Shopee 7 ngày</div>
            <div className="stat-val" style={{ fontSize: 18 }}>{new Intl.NumberFormat('vi-VN', { notation: 'compact' }).format(shopeeTotal7)}₫</div>
            <div className="stat-sub">{shopeeOrders7} đơn hàng</div>
          </div>
        )}
      </div>

      <div className="grid-2" style={{ gap: '1.25rem', marginBottom: '1.25rem' }}>
        {/* Today's content */}
        <div>
          <div className="flex-between mb-3">
            <h3>Nội dung hôm nay</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/calendar')} style={{ fontSize: 12 }}>
              Xem calendar <ArrowRight size={13} />
            </button>
          </div>
          {todayPosts.length === 0 ? (
            <div className="card empty-state" style={{ minHeight: 130 }}>
              <Clock size={24} style={{ opacity: .3 }} />
              <p>Chưa có bài đăng hôm nay</p>
              <button className="btn btn-secondary btn-sm" onClick={() => navigate('/calendar')}>Lên lịch ngay</button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
              {todayPosts.map(p => (
                <div key={p.id} className="card flex-between" style={{ padding: '.75rem 1rem', cursor: 'pointer' }} onClick={() => navigate('/studio')}>
                  <div className="flex-center gap-3" style={{ minWidth: 0 }}>
                    {p.image_url ? (
                      <img src={p.image_url} style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                    ) : (
                      <div style={{ width: 40, height: 40, borderRadius: 8, background: 'var(--cream)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 10, color: 'var(--text-faint)' }}>{p.platform?.slice(0,2)}</div>
                    )}
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 500, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.title}</div>
                      <div className="text-xs text-faint mt-1">
                        {p.scheduled_at ? format(parseISO(p.scheduled_at), 'HH:mm') : ''}
                      </div>
                    </div>
                  </div>
                  <div className="flex-center gap-2">
                    <PlatformBadge platform={p.platform} />
                    <StatusBadge status={p.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div>
          <div className="flex-between mb-3">
            <h3>Quick actions</h3>
          </div>
          <div className="grid-2" style={{ gap: '.6rem' }}>
            {QUICK_ACTIONS.map(item => (
              <div key={item.to} className="card" style={{ cursor: 'pointer', padding: '.9rem', transition: 'box-shadow .15s' }}
                onClick={() => navigate(item.to)}
                onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--shadow-md)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = 'var(--shadow-sm)'}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: item.color, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '.6rem' }}>
                  <item.icon size={17} style={{ color: item.iconColor }} />
                </div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{item.label}</div>
                <div className="text-xs text-muted mt-1">{item.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid-2" style={{ gap: '1.25rem' }}>
        {/* Shopee chart */}
        <div className="section-card">
          <div className="flex-between mb-3">
            <div>
              <h3>Shopee — 14 ngày</h3>
              {shopeeTotal7 > 0 && <div className="text-xs text-muted mt-1">{new Intl.NumberFormat('vi-VN').format(shopeeTotal7)}₫ tuần này</div>}
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/shopee')} style={{ fontSize: 12 }}>Chi tiết <ArrowRight size={12} /></button>
          </div>
          {shopeeData.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-faint)', fontSize: 13 }}>
              <TrendingUp size={24} style={{ opacity: .3, display: 'block', margin: '0 auto .5rem' }} />
              Chưa có dữ liệu. <span style={{ color: 'var(--accent)', cursor: 'pointer' }} onClick={() => navigate('/shopee')}>Nhập ngay →</span>
            </div>
          ) : (
            <>
              <MiniBarChart data={shopeeData.slice(-14)} />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '.35rem' }}>
                <span className="text-xs text-faint">{shopeeData[Math.max(0, shopeeData.length-14)]?.label}</span>
                <span className="text-xs text-faint">{shopeeData[shopeeData.length-1]?.label}</span>
              </div>
            </>
          )}
        </div>

        {/* Active campaign */}
        <div className="section-card">
          <div className="flex-between mb-3">
            <h3>Campaign đang chạy</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/campaigns')} style={{ fontSize: 12 }}>Xem tất cả <ArrowRight size={12} /></button>
          </div>
          {!activeCampaign ? (
            <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-faint)', fontSize: 13 }}>
              <Megaphone size={24} style={{ opacity: .3, display: 'block', margin: '0 auto .5rem' }} />
              Không có campaign đang chạy. <span style={{ color: 'var(--accent)', cursor: 'pointer' }} onClick={() => navigate('/campaigns')}>Tạo ngay →</span>
            </div>
          ) : (
            <div style={{ cursor: 'pointer' }} onClick={() => navigate('/campaigns')}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: '1rem' }}>
                {activeCampaign.key_visual_url ? (
                  <img src={activeCampaign.key_visual_url} style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 10, flexShrink: 0 }} />
                ) : (
                  <div style={{ width: 48, height: 48, background: 'var(--cream)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Megaphone size={20} style={{ color: 'var(--text-faint)' }} />
                  </div>
                )}
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{activeCampaign.name}</div>
                  {activeCampaign.objective && <div className="text-xs text-muted mt-1 truncate">{activeCampaign.objective}</div>}
                </div>
              </div>
              {activeCampaign.budget > 0 && (
                <>
                  <div className="flex-between mb-1">
                    <span className="text-xs text-muted">Ngân sách đã dùng</span>
                    <span className="text-xs fw-500">{Math.round(activeCampaign.spent / activeCampaign.budget * 100)}%</span>
                  </div>
                  <div className="progress-bar mb-3"><div className="progress-fill" style={{ width: `${Math.min(100, Math.round(activeCampaign.spent / activeCampaign.budget * 100))}%` }} /></div>
                </>
              )}
              {campaignKpis && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '.5rem' }}>
                  {[
                    { label: 'Tiếp cận', val: new Intl.NumberFormat('vi-VN', { notation: 'compact' }).format(campaignKpis.reach) },
                    { label: 'Tương tác', val: new Intl.NumberFormat('vi-VN', { notation: 'compact' }).format(campaignKpis.engagement) },
                    { label: 'Đơn', val: campaignKpis.orders },
                    { label: 'Doanh thu', val: new Intl.NumberFormat('vi-VN', { notation: 'compact' }).format(campaignKpis.revenue) + '₫' },
                  ].map(item => (
                    <div key={item.label} style={{ background: 'var(--cream)', borderRadius: 8, padding: '.5rem .6rem', textAlign: 'center' }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{item.val}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-faint)', marginTop: 1 }}>{item.label}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Recent posts */}
      {recentPosts.length > 0 && (
        <div style={{ marginTop: '1.25rem' }}>
          <div className="flex-between mb-3">
            <h3>Nội dung gần đây</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/studio')} style={{ fontSize: 12 }}>Xem tất cả <ArrowRight size={13} /></button>
          </div>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="table">
              <thead><tr><th>Tiêu đề</th><th>Nền tảng</th><th>Loại</th><th>Trạng thái</th><th>Lịch đăng</th></tr></thead>
              <tbody>
                {recentPosts.map(p => (
                  <tr key={p.id} style={{ cursor: 'pointer' }} onClick={() => navigate('/studio')}>
                    <td style={{ fontWeight: 500 }}>{p.title}</td>
                    <td><PlatformBadge platform={p.platform} /></td>
                    <td className="text-muted text-sm">{p.post_type}</td>
                    <td><StatusBadge status={p.status} /></td>
                    <td className="text-muted text-sm">{p.scheduled_at ? format(parseISO(p.scheduled_at), 'dd/MM HH:mm') : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
