import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Plus, X, Clock, Info } from 'lucide-react'
import { supabase, PLATFORMS } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth.jsx'
import { useToast } from '../hooks/useToast.js'
import { PlatformBadge, StatusBadge, Toast } from '../components/Shared.jsx'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isToday, isSameMonth, isSameDay, parseISO, addMonths, subMonths, addDays } from 'date-fns'
import { vi } from 'date-fns/locale'

const PLATFORM_COLORS = {
  TikTok:    { bg: '#E8F5E3', text: '#2D6A1F' },
  Facebook:  { bg: '#E3EEF8', text: '#1A4A7A' },
  Instagram: { bg: '#F8E8F0', text: '#7A1A4A' },
  Shopee:    { bg: '#FDF3E0', text: '#7A4E00' },
  YouTube:   { bg: '#FDE8E8', text: '#7A1A1A' },
}

const BEST_TIMES = {
  TikTok: ['07:00', '12:00', '19:00', '21:00'],
  Facebook: ['09:00', '13:00', '17:00', '20:00'],
  Instagram: ['08:00', '12:00', '18:00', '21:00'],
  Shopee: ['10:00', '12:00', '20:00', '22:00'],
  YouTube: ['14:00', '17:00', '20:00'],
}

function BulkScheduleModal({ posts, date, onClose, onSave }) {
  const [assignments, setAssignments] = useState(posts.slice(0, 5).map((p, i) => ({ post_id: p.id, time: `${9 + i * 2}:00` })))
  const [saving, setSaving] = useState(false)
  const [selectedPosts, setSelectedPosts] = useState(new Set(posts.slice(0, 5).map(p => p.id)))

  async function handleSave() {
    setSaving(true)
    const updates = assignments.filter(a => selectedPosts.has(a.post_id)).map(a => ({
      id: a.post_id,
      scheduled_at: `${format(date, 'yyyy-MM-dd')}T${a.time}:00`,
      status: 'scheduled'
    }))
    for (const u of updates) {
      await supabase.from('posts').update({ scheduled_at: u.scheduled_at, status: u.status }).eq('id', u.id)
    }
    setSaving(false)
    onSave()
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 520 }}>
        <div className="modal-header">
          <h3>Lên lịch hàng loạt — {format(date, 'dd/MM/yyyy')}</h3>
          <button className="btn-icon btn-ghost" onClick={onClose}><X size={18} /></button>
        </div>
        <p className="text-sm text-muted mb-4">Chọn bài và gán giờ đăng cho từng bài:</p>
        {posts.slice(0, 8).map((p, i) => {
          const a = assignments.find(x => x.post_id === p.id) || { time: '09:00' }
          const times = BEST_TIMES[p.platform] || ['09:00', '12:00', '19:00']
          return (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '.75rem', padding: '.5rem 0', borderBottom: '1px solid var(--border)' }}>
              <input type="checkbox" checked={selectedPosts.has(p.id)} onChange={e => {
                const n = new Set(selectedPosts); e.target.checked ? n.add(p.id) : n.delete(p.id); setSelectedPosts(n)
              }} style={{ accentColor: 'var(--accent)', width: 15, height: 15, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.title}</div>
                <PlatformBadge platform={p.platform} />
              </div>
              <select style={{ width: 'auto' }} value={a.time} onChange={e => setAssignments(prev => prev.map(x => x.post_id === p.id ? { ...x, time: e.target.value } : x).concat(prev.find(x => x.post_id === p.id) ? [] : [{ post_id: p.id, time: e.target.value }]))}>
                {times.map(t => <option key={t} value={t}>⭐ {t}</option>)}
                {['06:00','07:00','08:00','10:00','11:00','13:00','14:00','15:00','16:00','17:00','18:00','20:00','21:00','22:00'].filter(t => !times.includes(t)).map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          )
        })}
        <div className="flex-center gap-3 mt-4" style={{ justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={onClose}>Hủy</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving || selectedPosts.size === 0}>
            {saving ? <><div className="spinner" />Đang lưu...</> : `Lên lịch ${selectedPosts.size} bài`}
          </button>
        </div>
      </div>
    </div>
  )
}

function PostDetailModal({ post, onClose, onEdit }) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 500 }}>
        <div className="modal-header">
          <div>
            <h3>{post.title}</h3>
            <div className="flex-center gap-2 mt-2">
              <PlatformBadge platform={post.platform} />
              <StatusBadge status={post.status} />
              {post.scheduled_at && <span className="text-sm text-muted">{format(parseISO(post.scheduled_at), 'HH:mm — dd/MM/yyyy')}</span>}
            </div>
          </div>
          <button className="btn-icon btn-ghost" onClick={onClose}><X size={18} /></button>
        </div>
        {post.image_url && <img src={post.image_url} style={{ width: '100%', height: 180, objectFit: 'cover', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }} />}
        {post.caption && <><div className="label mb-2">Caption</div><div style={{ fontSize: 13, lineHeight: 1.75, marginBottom: '1rem', whiteSpace: 'pre-wrap' }}>{post.caption}</div></>}
        {post.hashtags?.length > 0 && (
          <div className="flex-center gap-2" style={{ flexWrap: 'wrap', marginBottom: '1rem' }}>
            {post.hashtags.map(t => <span key={t} style={{ fontSize: 11, color: 'var(--blue-text)', background: 'var(--blue-bg)', padding: '2px 8px', borderRadius: 99 }}>#{t}</span>)}
          </div>
        )}
        <div className="flex-center gap-3 mt-3" style={{ justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={onClose}>Đóng</button>
          <button className="btn btn-primary" onClick={() => { onClose(); onEdit(post) }}>Chỉnh sửa</button>
        </div>
      </div>
    </div>
  )
}

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [posts, setPosts] = useState([])
  const [unscheduled, setUnscheduled] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [bulkDate, setBulkDate] = useState(null)
  const [filterPlatform, setFilterPlatform] = useState('all')
  const { toast, showToast } = useToast()

  useEffect(() => { loadPosts() }, [currentDate])
  useEffect(() => { loadUnscheduled() }, [])

  async function loadPosts() {
    setLoading(true)
    const start = format(startOfMonth(currentDate), 'yyyy-MM-dd')
    const end = format(endOfMonth(currentDate), 'yyyy-MM-dd')
    const { data } = await supabase.from('posts').select('*').gte('scheduled_at', start).lte('scheduled_at', end + 'T23:59:59').not('scheduled_at', 'is', null).neq('status', 'archived')
    setPosts(data || [])
    setLoading(false)
  }

  async function loadUnscheduled() {
    const { data } = await supabase.from('posts').select('id, title, platform, post_type').is('scheduled_at', null).eq('status', 'draft').order('created_at', { ascending: false }).limit(20)
    setUnscheduled(data || [])
  }

  const monthStart = startOfMonth(currentDate)
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calEnd = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start: calStart, end: calEnd })

  function postsForDay(day) {
    let filtered = posts.filter(p => p.scheduled_at && isSameDay(parseISO(p.scheduled_at), day))
    if (filterPlatform !== 'all') filtered = filtered.filter(p => p.platform === filterPlatform)
    return filtered.sort((a, b) => parseISO(a.scheduled_at) - parseISO(b.scheduled_at))
  }

  const upcoming = posts.filter(p => {
    if (!p.scheduled_at) return false
    return parseISO(p.scheduled_at) >= new Date()
  }).sort((a, b) => parseISO(a.scheduled_at) - parseISO(b.scheduled_at)).slice(0, 8)

  return (
    <div>
      <Toast message={toast} />

      <div className="flex-between page-header">
        <div><h1>Content Calendar</h1><p>Lên lịch & quản lý nội dung theo tháng</p></div>
        <div className="flex-center gap-3">
          <div className="flex-center gap-1">
            {['all', ...PLATFORMS].map(p => (
              <button key={p} className={`chip ${filterPlatform === p ? 'active' : ''}`} onClick={() => setFilterPlatform(p)} style={{ fontSize: 11 }}>
                {p === 'all' ? 'Tất cả' : p}
              </button>
            ))}
          </div>
          <div className="flex-center gap-2">
            <button className="btn btn-ghost btn-icon" onClick={() => setCurrentDate(subMonths(currentDate, 1))}><ChevronLeft size={16} /></button>
            <span style={{ fontWeight: 600, minWidth: 130, textAlign: 'center' }}>{format(currentDate, 'MMMM yyyy', { locale: vi })}</span>
            <button className="btn btn-ghost btn-icon" onClick={() => setCurrentDate(addMonths(currentDate, 1))}><ChevronRight size={16} /></button>
            <button className="btn btn-secondary btn-sm" onClick={() => setCurrentDate(new Date())}>Hôm nay</button>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: '1.25rem', alignItems: 'start' }}>
        <div>
          <div className="cal-grid-head" style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', marginBottom: 4 }}>
            {['Th 2','Th 3','Th 4','Th 5','Th 6','Th 7','CN'].map(d => (
              <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 600, color: 'var(--text-faint)', padding: '4px 0', textTransform: 'uppercase', letterSpacing: '.04em' }}>{d}</div>
            ))}
          </div>
          <div className="cal-grid">
            {days.map(day => {
              const dayPosts = postsForDay(day)
              const other = !isSameMonth(day, currentDate)
              const todayClass = isToday(day) ? 'today' : ''
              return (
                <div key={day.toISOString()} className={`cal-cell ${other ? 'other' : ''} ${todayClass}`}
                  onDoubleClick={() => !other && setBulkDate(day)}
                >
                  <div className="day-num">
                    <span style={{ fontSize: 11, fontWeight: 600, color: other ? 'var(--text-faint)' : 'var(--text-primary)' }}>{format(day, 'd')}</span>
                  </div>
                  {dayPosts.slice(0, 3).map(p => {
                    const colors = PLATFORM_COLORS[p.platform] || { bg: '#F7F0E8', text: '#8B5E35' }
                    return (
                      <div key={p.id} className="cal-event"
                        style={{ background: colors.bg, color: colors.text }}
                        onClick={() => setSelected(p)}
                        title={p.title}>
                        {p.scheduled_at ? format(parseISO(p.scheduled_at), 'HH:mm') : ''} {p.title}
                      </div>
                    )
                  })}
                  {dayPosts.length > 3 && (
                    <div style={{ fontSize: 10, color: 'var(--text-faint)', padding: '1px 4px', cursor: 'pointer' }} onClick={() => setBulkDate(day)}>
                      +{dayPosts.length - 3} bài nữa
                    </div>
                  )}
                  {!other && (
                    <div style={{ marginTop: 2 }}>
                      <button style={{ fontSize: 9, color: 'var(--text-faint)', width: '100%', textAlign: 'left', padding: '0 2px', opacity: 0 }} className="cal-add-btn" onMouseEnter={e => e.target.style.opacity=1} onMouseLeave={e => e.target.style.opacity=0} onClick={() => setBulkDate(day)}>+ lên lịch</button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          <div style={{ marginTop: '.5rem', fontSize: 11, color: 'var(--text-faint)', textAlign: 'center' }}>Double-click vào ngày để lên lịch hàng loạt</div>
        </div>

        <div>
          <div className="section-card mb-4">
            <h4 className="mb-3">Sắp đến</h4>
            {upcoming.length === 0 ? <p className="text-sm text-muted">Không có bài nào sắp đăng.</p> : upcoming.map(p => {
              const colors = PLATFORM_COLORS[p.platform] || { bg: '#F7F0E8', text: '#8B5E35' }
              return (
                <div key={p.id} style={{ display: 'flex', gap: '.6rem', padding: '.4rem 0', borderBottom: '1px solid var(--border)', cursor: 'pointer', alignItems: 'flex-start' }} onClick={() => setSelected(p)}>
                  <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-sm)', background: colors.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 10, fontWeight: 600, color: colors.text }}>{p.platform?.slice(0,2)}</div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>{p.scheduled_at ? format(parseISO(p.scheduled_at), 'dd/MM HH:mm') : ''}</div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="section-card mb-4">
            <h4 className="mb-1">Giờ đăng tốt nhất</h4>
            <p className="text-xs text-muted mb-3">Dựa trên engagement trung bình</p>
            {PLATFORMS.slice(0, 4).map(p => (
              <div key={p} style={{ marginBottom: '.6rem' }}>
                <div className="flex-center gap-2 mb-1">
                  <PlatformBadge platform={p} />
                </div>
                <div className="flex-center gap-1" style={{ flexWrap: 'wrap' }}>
                  {(BEST_TIMES[p] || []).map(t => (
                    <span key={t} style={{ fontSize: 10, background: 'var(--cream)', border: '1px solid var(--border)', borderRadius: 4, padding: '1px 5px', color: 'var(--text-secondary)', fontWeight: 500 }}>{t}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {unscheduled.length > 0 && (
            <div className="section-card">
              <h4 className="mb-1">Bài chưa lên lịch ({unscheduled.length})</h4>
              <p className="text-xs text-muted mb-3">Double-click vào ngày để lên lịch</p>
              {unscheduled.slice(0, 5).map(p => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '.5rem', padding: '.35rem 0', borderBottom: '1px solid var(--border)' }}>
                  <PlatformBadge platform={p.platform} />
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</span>
                </div>
              ))}
              {unscheduled.length > 5 && <div className="text-xs text-faint mt-2">+{unscheduled.length - 5} bài nữa</div>}
            </div>
          )}
        </div>
      </div>

      {selected && <PostDetailModal post={selected} onClose={() => setSelected(null)} onEdit={p => { setSelected(null) }} />}
      {bulkDate && unscheduled.length > 0 && (
        <BulkScheduleModal posts={unscheduled} date={bulkDate} onClose={() => setBulkDate(null)} onSave={() => { setBulkDate(null); showToast('Đã lên lịch!'); loadPosts(); loadUnscheduled() }} />
      )}
      {bulkDate && unscheduled.length === 0 && (
        <div className="modal-overlay" onClick={() => setBulkDate(null)}>
          <div className="modal" style={{ maxWidth: 360 }}>
            <h3 className="mb-3">Không có bài nào để lên lịch</h3>
            <p className="text-muted text-sm mb-4">Tạo bài trong Content Studio trước, sau đó quay lại đây để lên lịch.</p>
            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setBulkDate(null)}>Đóng</button>
          </div>
        </div>
      )}
    </div>
  )
}
