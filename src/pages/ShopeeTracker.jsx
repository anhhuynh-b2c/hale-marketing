import { useEffect, useState } from 'react'
import { Plus, X, TrendingUp, TrendingDown } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth.jsx'
import { useToast } from '../hooks/useToast.js'
import { Toast } from '../components/Shared.jsx'
import { format, parseISO, subDays, eachDayOfInterval } from 'date-fns'

export default function ShopeeTracker() {
  const { user } = useAuth()
  const { toast, showToast } = useToast()
  const [stats, setStats] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ date: format(new Date(), 'yyyy-MM-dd'), revenue: '', orders: '', visitors: '' })

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('shopee_stats').select('*').order('date', { ascending: false }).limit(30)
    setStats(data || [])
    setLoading(false)
  }

  async function save() {
    if (!form.date || !form.revenue) return
    const existing = stats.find(s => s.date === form.date)
    if (existing) {
      await supabase.from('shopee_stats').update({ revenue: parseFloat(form.revenue), orders: parseInt(form.orders) || 0, visitors: parseInt(form.visitors) || 0 }).eq('id', existing.id)
    } else {
      await supabase.from('shopee_stats').insert({ ...form, revenue: parseFloat(form.revenue), orders: parseInt(form.orders) || 0, visitors: parseInt(form.visitors) || 0, created_by: user.id })
    }
    showToast('Đã lưu!')
    setShowForm(false)
    setForm({ date: format(new Date(), 'yyyy-MM-dd'), revenue: '', orders: '', visitors: '' })
    load()
  }

  async function del(id) {
    await supabase.from('shopee_stats').delete().eq('id', id)
    showToast('Đã xóa.')
    load()
  }

  const totalRevenue = stats.reduce((s, d) => s + (d.revenue || 0), 0)
  const totalOrders = stats.reduce((s, d) => s + (d.orders || 0), 0)
  const avgRevPerOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0
  const last7 = stats.slice(0, 7)
  const prev7 = stats.slice(7, 14)
  const last7Rev = last7.reduce((s, d) => s + (d.revenue || 0), 0)
  const prev7Rev = prev7.reduce((s, d) => s + (d.revenue || 0), 0)
  const revDelta = prev7Rev > 0 ? ((last7Rev - prev7Rev) / prev7Rev * 100).toFixed(0) : null

  return (
    <div>
      <Toast message={toast} />
      <div className="flex-between page-header">
        <div><h1>Shopee Tracker</h1><p>Nhập và theo dõi doanh thu Shopee hàng ngày</p></div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}><Plus size={15} />Nhập doanh thu</button>
      </div>

      {showForm && (
        <div className="section-card mb-4">
          <div className="section-card-header">
            <h3>Nhập doanh thu ngày</h3>
            <button className="btn btn-ghost btn-icon" onClick={() => setShowForm(false)}><X size={16} /></button>
          </div>
          <div className="grid-4" style={{ gap: '.75rem', alignItems: 'end' }}>
            <div className="form-group" style={{ marginBottom: 0 }}><label>Ngày</label><input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} /></div>
            <div className="form-group" style={{ marginBottom: 0 }}><label>Doanh thu (VND)</label><input type="number" value={form.revenue} onChange={e => setForm(f => ({ ...f, revenue: e.target.value }))} placeholder="1500000" /></div>
            <div className="form-group" style={{ marginBottom: 0 }}><label>Số đơn hàng</label><input type="number" value={form.orders} onChange={e => setForm(f => ({ ...f, orders: e.target.value }))} placeholder="5" /></div>
            <div className="form-group" style={{ marginBottom: 0 }}><label>Lượt truy cập</label><input type="number" value={form.visitors} onChange={e => setForm(f => ({ ...f, visitors: e.target.value }))} placeholder="120" /></div>
          </div>
          <div className="flex-center gap-3 mt-3" style={{ justifyContent: 'flex-end' }}>
            <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Hủy</button>
            <button className="btn btn-primary" onClick={save}>Lưu</button>
          </div>
        </div>
      )}

      <div className="grid-stats mb-6">
        <div className="stat-card">
          <div className="stat-label">Tổng doanh thu (30 ngày)</div>
          <div className="stat-val">{new Intl.NumberFormat('vi-VN', { notation: 'compact' }).format(totalRevenue)}₫</div>
          {revDelta && <div className={`stat-delta ${parseFloat(revDelta) >= 0 ? 'up' : 'down'}`}>{parseFloat(revDelta) >= 0 ? '↑' : '↓'} {Math.abs(revDelta)}% so với tuần trước</div>}
        </div>
        <div className="stat-card">
          <div className="stat-label">Tổng đơn hàng</div>
          <div className="stat-val">{totalOrders}</div>
          <div className="stat-sub">30 ngày gần nhất</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Trung bình / đơn</div>
          <div className="stat-val">{new Intl.NumberFormat('vi-VN', { notation: 'compact' }).format(Math.round(avgRevPerOrder))}₫</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">7 ngày gần nhất</div>
          <div className="stat-val">{new Intl.NumberFormat('vi-VN', { notation: 'compact' }).format(last7Rev)}₫</div>
          <div className="stat-sub">{last7.reduce((s,d)=>s+(d.orders||0),0)} đơn</div>
        </div>
      </div>

      {loading ? <div className="text-muted">Đang tải...</div> : stats.length === 0 ? (
        <div className="card empty-state"><TrendingUp size={32} style={{ opacity: .3 }} /><p>Chưa có dữ liệu. Nhập doanh thu ngày đầu tiên!</p></div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="table">
            <thead><tr><th>Ngày</th><th>Doanh thu</th><th>Đơn hàng</th><th>Lượt truy cập</th><th>Trung bình/đơn</th><th style={{ width: 50 }}></th></tr></thead>
            <tbody>
              {stats.map(s => (
                <tr key={s.id}>
                  <td style={{ fontWeight: 500 }}>{format(parseISO(s.date), 'EEEE dd/MM', { locale: undefined })}</td>
                  <td style={{ fontWeight: 600, color: 'var(--accent)' }}>{new Intl.NumberFormat('vi-VN').format(s.revenue)}₫</td>
                  <td>{s.orders || 0} đơn</td>
                  <td>{s.visitors ? new Intl.NumberFormat('vi-VN').format(s.visitors) : '—'}</td>
                  <td className="text-muted">{s.orders > 0 ? new Intl.NumberFormat('vi-VN', { notation: 'compact' }).format(Math.round(s.revenue / s.orders)) + '₫' : '—'}</td>
                  <td><button onClick={() => del(s.id)} style={{ color: 'var(--red-text)' }}><X size={13} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
