import { useEffect, useState } from 'react'
import { Plus, X, Edit2, Trash2, ChevronRight, TrendingUp, DollarSign, Target, BarChart2, Calendar, Users } from 'lucide-react'
import { supabase, PLATFORMS, CAMP_STATUSES, STATUS_LABELS } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth.jsx'
import { useToast } from '../hooks/useToast.js'
import { PlatformBadge, StatusBadge, Toast, ConfirmModal, ImageUpload } from '../components/Shared.jsx'
import { format, parseISO, differenceInDays, isAfter, isBefore, addDays } from 'date-fns'
import { vi } from 'date-fns/locale'

const PLATFORM_BUDGET_COLORS = {
  TikTok: '#2D6A1F', Facebook: '#1A4A7A', Instagram: '#7A1A4A',
  Shopee: '#7A4E00', YouTube: '#7A1A1A'
}

function CampaignModal({ camp, onClose, onSave }) {
  const { user } = useAuth()
  const [form, setForm] = useState(camp?.id ? { ...camp, platforms: camp.platforms || [] } : {
    name: '', objective: '', start_date: '', end_date: '',
    budget: '', spent: '0', status: 'draft', platforms: [],
    key_visual_url: '', notes: ''
  })
  const [saving, setSaving] = useState(false)
  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }
  function togglePlatform(p) { set('platforms', form.platforms.includes(p) ? form.platforms.filter(x => x !== p) : [...form.platforms, p]) }

  async function handleSave() {
    if (!form.name.trim()) return
    setSaving(true)
    const payload = { ...form, budget: parseFloat(form.budget) || 0, spent: parseFloat(form.spent) || 0, created_by: user.id }
    let error
    if (camp?.id) {
      ({ error } = await supabase.from('campaigns').update(payload).eq('id', camp.id))
    } else {
      ({ error } = await supabase.from('campaigns').insert(payload))
    }
    setSaving(false)
    if (!error) onSave()
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 620 }}>
        <div className="modal-header">
          <h3>{camp?.id ? 'Chỉnh sửa campaign' : 'Tạo campaign mới'}</h3>
          <button className="btn-icon btn-ghost" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="grid-2" style={{ gap: '1.25rem' }}>
          <div>
            <div className="form-group"><label>Key Visual</label><ImageUpload value={form.key_visual_url} onChange={v => set('key_visual_url', v)} folder="campaigns" /></div>
          </div>
          <div>
            <div className="form-group"><label>Tên campaign *</label><input value={form.name} onChange={e => set('name', e.target.value)} placeholder="VD: Tết Gifting 2027" /></div>
            <div className="form-group"><label>Mục tiêu</label><input value={form.objective} onChange={e => set('objective', e.target.value)} placeholder="VD: Tăng doanh thu gifting 200%" /></div>
            <div className="form-group"><label>Trạng thái</label>
              <select value={form.status} onChange={e => set('status', e.target.value)}>
                {CAMP_STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s] || s}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="grid-2" style={{ gap: '.75rem' }}>
          <div className="form-group"><label>Ngày bắt đầu</label><input type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)} /></div>
          <div className="form-group"><label>Ngày kết thúc</label><input type="date" value={form.end_date} onChange={e => set('end_date', e.target.value)} /></div>
        </div>

        <div className="grid-2" style={{ gap: '.75rem' }}>
          <div className="form-group"><label>Ngân sách (VND)</label><input type="number" value={form.budget} onChange={e => set('budget', e.target.value)} placeholder="10000000" /></div>
          <div className="form-group"><label>Đã chi (VND)</label><input type="number" value={form.spent} onChange={e => set('spent', e.target.value)} placeholder="0" /></div>
        </div>

        <div className="form-group"><label>Nền tảng</label>
          <div className="flex-center gap-2" style={{ flexWrap: 'wrap' }}>
            {PLATFORMS.map(p => <button key={p} className={`chip ${form.platforms.includes(p) ? 'active' : ''}`} onClick={() => togglePlatform(p)}>{p}</button>)}
          </div>
        </div>

        <div className="form-group"><label>Ghi chú</label><textarea rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Thông tin thêm về campaign..." /></div>

        <div className="flex-center gap-3 mt-4" style={{ justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={onClose}>Hủy</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving || !form.name.trim()}>
            {saving ? <><div className="spinner" />Đang lưu...</> : 'Lưu campaign'}
          </button>
        </div>
      </div>
    </div>
  )
}

function KPIModal({ campaign, onClose, onSave }) {
  const [form, setForm] = useState({ reach: '', engagement: '', clicks: '', orders: '', revenue: '', recorded_at: format(new Date(), 'yyyy-MM-dd') })
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    await supabase.from('campaign_kpis').insert({
      campaign_id: campaign.id,
      reach: parseInt(form.reach) || 0,
      engagement: parseInt(form.engagement) || 0,
      clicks: parseInt(form.clicks) || 0,
      orders: parseInt(form.orders) || 0,
      revenue: parseFloat(form.revenue) || 0,
      recorded_at: form.recorded_at,
    })
    setSaving(false)
    onSave()
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 480 }}>
        <div className="modal-header">
          <h3>Nhập KPI — {campaign.name}</h3>
          <button className="btn-icon btn-ghost" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="form-group"><label>Ngày ghi nhận</label><input type="date" value={form.recorded_at} onChange={e => setForm(f => ({ ...f, recorded_at: e.target.value }))} /></div>
        <div className="grid-2" style={{ gap: '.75rem' }}>
          <div className="form-group"><label>Lượt tiếp cận</label><input type="number" value={form.reach} onChange={e => setForm(f => ({ ...f, reach: e.target.value }))} placeholder="10000" /></div>
          <div className="form-group"><label>Lượt tương tác</label><input type="number" value={form.engagement} onChange={e => setForm(f => ({ ...f, engagement: e.target.value }))} placeholder="500" /></div>
          <div className="form-group"><label>Click vào link</label><input type="number" value={form.clicks} onChange={e => setForm(f => ({ ...f, clicks: e.target.value }))} placeholder="200" /></div>
          <div className="form-group"><label>Đơn hàng</label><input type="number" value={form.orders} onChange={e => setForm(f => ({ ...f, orders: e.target.value }))} placeholder="15" /></div>
        </div>
        <div className="form-group"><label>Doanh thu (VND)</label><input type="number" value={form.revenue} onChange={e => setForm(f => ({ ...f, revenue: e.target.value }))} placeholder="8500000" /></div>
        <div className="flex-center gap-3 mt-4" style={{ justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={onClose}>Hủy</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu KPI'}</button>
        </div>
      </div>
    </div>
  )
}

function CampaignDetail({ campaign, kpis, onEdit, onAddKPI, onBack }) {
  const totalReach = kpis.reduce((s, k) => s + (k.reach || 0), 0)
  const totalEngagement = kpis.reduce((s, k) => s + (k.engagement || 0), 0)
  const totalClicks = kpis.reduce((s, k) => s + (k.clicks || 0), 0)
  const totalOrders = kpis.reduce((s, k) => s + (k.orders || 0), 0)
  const totalRevenue = kpis.reduce((s, k) => s + (k.revenue || 0), 0)
  const roas = campaign.spent > 0 ? (totalRevenue / campaign.spent).toFixed(2) : null

  const spentPct = campaign.budget > 0 ? Math.min(100, Math.round(campaign.spent / campaign.budget * 100)) : 0

  const days = campaign.start_date && campaign.end_date ? differenceInDays(parseISO(campaign.end_date), parseISO(campaign.start_date)) : null
  const today = new Date()
  const daysLeft = campaign.end_date ? differenceInDays(parseISO(campaign.end_date), today) : null

  const TIMELINE = [
    { label: 'Bắt đầu chiến dịch', desc: 'Triển khai nội dung & quảng cáo', offset: 0 },
    { label: 'Đẩy mạnh giai đoạn 1', desc: 'Tăng ngân sách quảng cáo', offset: Math.round((days || 30) * 0.25) },
    { label: 'Tối ưu & A/B Testing', desc: 'Tối ưu nhóm quảng cáo', offset: Math.round((days || 30) * 0.55) },
    { label: 'Kết thúc chiến dịch', desc: 'Tổng kết, đánh giá hiệu quả', offset: days || 30 },
  ]

  const budgetByPlatform = (campaign.platforms || []).map((p, i) => {
    const weights = [0.48, 0.24, 0.16, 0.08, 0.04]
    const pct = weights[i] || 0.04
    return { platform: p, pct: Math.round(pct * 100), amount: Math.round(campaign.budget * pct) }
  })

  return (
    <div>
      <button className="btn btn-ghost mb-4" onClick={onBack} style={{ gap: 6 }}>← Tất cả campaigns</button>

      <div className="section-card">
        <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr auto', gap: '1.5rem', alignItems: 'start' }}>
          {campaign.key_visual_url ? (
            <img src={campaign.key_visual_url} style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 'var(--radius-md)' }} />
          ) : (
            <div style={{ width: '100%', height: 140, background: 'var(--cream)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Target size={32} style={{ color: 'var(--text-faint)' }} />
            </div>
          )}
          <div>
            <div className="flex-center gap-2 mb-2">
              <StatusBadge status={campaign.status} />
              {daysLeft !== null && daysLeft > 0 && <span className="badge badge-scheduled">Còn {daysLeft} ngày</span>}
              {daysLeft !== null && daysLeft <= 0 && <span className="badge badge-archived">Đã kết thúc</span>}
            </div>
            <h2 style={{ marginBottom: '.4rem' }}>{campaign.name}</h2>
            {campaign.objective && <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>{campaign.objective}</p>}
            <div className="flex-center gap-4 mt-3 text-sm text-muted">
              {campaign.start_date && <span>📅 {format(parseISO(campaign.start_date), 'dd/MM/yyyy')} → {campaign.end_date ? format(parseISO(campaign.end_date), 'dd/MM/yyyy') : '?'}</span>}
              {days && <span>⏱ {days} ngày</span>}
            </div>
            <div className="flex-center gap-2 mt-3">
              {(campaign.platforms || []).map(p => <PlatformBadge key={p} platform={p} />)}
            </div>
          </div>
          <div className="flex-center gap-2">
            <button className="btn btn-secondary" onClick={onAddKPI}><BarChart2 size={14} />Nhập KPI</button>
            <button className="btn btn-ghost btn-icon" onClick={onEdit}><Edit2 size={15} /></button>
          </div>
        </div>
      </div>

      <div className="grid-stats mt-4">
        {[
          { label: 'Lượt tiếp cận', val: new Intl.NumberFormat('vi-VN', { notation: 'compact' }).format(totalReach), icon: Users },
          { label: 'Tương tác', val: new Intl.NumberFormat('vi-VN', { notation: 'compact' }).format(totalEngagement), icon: TrendingUp },
          { label: 'Click vào link', val: new Intl.NumberFormat('vi-VN', { notation: 'compact' }).format(totalClicks), icon: ChevronRight },
          { label: 'Đơn hàng', val: totalOrders, icon: Target },
          { label: 'Doanh thu', val: new Intl.NumberFormat('vi-VN', { notation: 'compact' }).format(totalRevenue) + '₫', icon: DollarSign },
          { label: 'ROAS', val: roas ? `${roas}x` : '—', icon: BarChart2 },
        ].map(item => (
          <div key={item.label} className="stat-card">
            <div className="stat-label">{item.label}</div>
            <div className="stat-val" style={{ fontSize: 20 }}>{item.val}</div>
          </div>
        ))}
      </div>

      <div className="grid-2 mt-4" style={{ gap: '1rem' }}>
        <div className="section-card">
          <h3 className="mb-4">Ngân sách</h3>
          <div className="flex-between mb-2">
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Tổng ngân sách</span>
            <span style={{ fontWeight: 600 }}>{new Intl.NumberFormat('vi-VN').format(campaign.budget)}₫</span>
          </div>
          <div className="flex-between mb-1">
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Đã chi</span>
            <span style={{ fontWeight: 600, color: spentPct > 90 ? 'var(--red-text)' : 'var(--accent)' }}>{spentPct}%</span>
          </div>
          <div className="progress-bar mb-3">
            <div className="progress-fill" style={{ width: `${spentPct}%`, background: spentPct > 90 ? 'var(--red-text)' : 'var(--accent)' }} />
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: '1rem' }}>
            Đã chi {new Intl.NumberFormat('vi-VN').format(campaign.spent)}₫ / {new Intl.NumberFormat('vi-VN').format(campaign.budget)}₫
          </div>
          {budgetByPlatform.length > 0 && (
            <>
              <div className="label mb-3">Phân bổ theo kênh</div>
              {budgetByPlatform.map(b => (
                <div key={b.platform} className="flex-between mb-2" style={{ alignItems: 'center', gap: '1rem' }}>
                  <div className="flex-center gap-2" style={{ minWidth: 90 }}>
                    <PlatformBadge platform={b.platform} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="progress-bar">
                      <div style={{ height: '100%', width: `${b.pct}%`, background: PLATFORM_BUDGET_COLORS[b.platform] || 'var(--accent)', borderRadius: 99 }} />
                    </div>
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 500, minWidth: 80, textAlign: 'right' }}>{new Intl.NumberFormat('vi-VN', { notation: 'compact' }).format(b.amount)}₫ ({b.pct}%)</div>
                </div>
              ))}
            </>
          )}
          {roas && (
            <div style={{ marginTop: '1rem', background: 'var(--green-bg)', borderRadius: 'var(--radius-sm)', padding: '.75rem', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, color: 'var(--green-text)', fontWeight: 500 }}>ROAS (Return on Ad Spend)</span>
              <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--green-text)' }}>{roas}x</span>
            </div>
          )}
        </div>

        <div className="section-card">
          <h3 className="mb-4">Timeline chiến dịch</h3>
          {campaign.start_date ? (
            <div>
              {TIMELINE.map((item, i) => {
                const itemDate = campaign.start_date ? addDays(parseISO(campaign.start_date), item.offset) : null
                const isPast = itemDate && isBefore(itemDate, today)
                const isCurrent = i === TIMELINE.findIndex(t => {
                  const d = campaign.start_date ? addDays(parseISO(campaign.start_date), t.offset) : null
                  return d && isAfter(d, today)
                }) - 1
                return (
                  <div key={i} style={{ display: 'flex', gap: '1rem', marginBottom: '.9rem', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                      <div style={{ width: 14, height: 14, borderRadius: '50%', background: isPast ? 'var(--accent)' : isCurrent ? 'var(--amber-text)' : 'var(--border-dark)', border: '2px solid var(--white)', marginTop: 2 }} />
                      {i < TIMELINE.length - 1 && <div style={{ width: 2, height: 32, background: isPast ? 'var(--accent)' : 'var(--border)', marginTop: 2 }} />}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: isPast ? 'var(--text-primary)' : 'var(--text-muted)' }}>{item.label}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>{item.desc}</div>
                      {itemDate && <div style={{ fontSize: 11, color: 'var(--accent)', marginTop: 2 }}>{format(itemDate, 'dd/MM/yyyy')}</div>}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : <p className="text-muted text-sm">Chưa có ngày bắt đầu.</p>}
        </div>
      </div>

      {kpis.length > 0 && (
        <div className="section-card mt-4">
          <h3 className="mb-3">Lịch sử KPI</h3>
          <table className="table">
            <thead><tr><th>Ngày</th><th>Tiếp cận</th><th>Tương tác</th><th>Click</th><th>Đơn</th><th>Doanh thu</th></tr></thead>
            <tbody>
              {kpis.map(k => (
                <tr key={k.id}>
                  <td>{format(parseISO(k.recorded_at), 'dd/MM/yyyy')}</td>
                  <td>{new Intl.NumberFormat('vi-VN').format(k.reach || 0)}</td>
                  <td>{new Intl.NumberFormat('vi-VN').format(k.engagement || 0)}</td>
                  <td>{new Intl.NumberFormat('vi-VN').format(k.clicks || 0)}</td>
                  <td>{k.orders || 0}</td>
                  <td style={{ fontWeight: 500, color: 'var(--accent)' }}>{new Intl.NumberFormat('vi-VN', { notation: 'compact' }).format(k.revenue || 0)}₫</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default function Campaigns() {
  const { toast, showToast } = useToast()
  const [campaigns, setCampaigns] = useState([])
  const [kpis, setKpis] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [kpiModal, setKpiModal] = useState(null)
  const [detail, setDetail] = useState(null)
  const [confirm, setConfirm] = useState(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const [c, k] = await Promise.all([
      supabase.from('campaigns').select('*').order('created_at', { ascending: false }),
      supabase.from('campaign_kpis').select('*').order('recorded_at', { ascending: false })
    ])
    setCampaigns(c.data || [])
    setKpis(k.data || [])
    setLoading(false)
  }

  async function del(id) {
    await supabase.from('campaigns').delete().eq('id', id)
    showToast('Đã xóa.')
    setConfirm(null)
    if (detail?.id === id) setDetail(null)
    load()
  }

  if (detail) {
    const campKpis = kpis.filter(k => k.campaign_id === detail.id)
    return (
      <div>
        <Toast message={toast} />
        <CampaignDetail
          campaign={detail}
          kpis={campKpis}
          onEdit={() => setModal(detail)}
          onAddKPI={() => setKpiModal(detail)}
          onBack={() => setDetail(null)}
        />
        {modal && <CampaignModal camp={modal} onClose={() => setModal(null)} onSave={() => { setModal(null); showToast('Đã lưu!'); load().then(() => { }) }} />}
        {kpiModal && <KPIModal campaign={kpiModal} onClose={() => setKpiModal(null)} onSave={() => { setKpiModal(null); showToast('Đã lưu KPI!'); load() }} />}
      </div>
    )
  }

  const active = campaigns.filter(c => c.status === 'active')
  const others = campaigns.filter(c => c.status !== 'active')

  return (
    <div>
      <Toast message={toast} />
      {confirm && <ConfirmModal message="Xóa campaign này?" onConfirm={() => del(confirm)} onCancel={() => setConfirm(null)} />}

      <div className="flex-between page-header">
        <div><h1>Campaigns</h1><p>Quản lý chiến dịch marketing đa kênh</p></div>
        <button className="btn btn-primary" onClick={() => setModal({})}><Plus size={15} />Tạo campaign</button>
      </div>

      {loading ? <div className="flex-center gap-2 text-muted"><div className="spinner" />Đang tải...</div> : campaigns.length === 0 ? (
        <div className="card empty-state"><Target size={32} style={{ opacity: .3 }} /><p>Chưa có campaign nào.</p><button className="btn btn-primary" onClick={() => setModal({})}>Tạo campaign đầu tiên</button></div>
      ) : (
        <>
          {active.length > 0 && (
            <>
              <div className="label mb-3">Đang chạy ({active.length})</div>
              <div className="grid-2 mb-6" style={{ gap: '1rem' }}>
                {active.map(c => <CampCard key={c.id} c={c} kpis={kpis.filter(k=>k.campaign_id===c.id)} onClick={() => setDetail(c)} onEdit={() => setModal(c)} onDelete={() => setConfirm(c.id)} onAddKPI={() => setKpiModal(c)} />)}
              </div>
            </>
          )}
          {others.length > 0 && (
            <>
              <div className="label mb-3">Tất cả ({others.length})</div>
              <div className="grid-2" style={{ gap: '1rem' }}>
                {others.map(c => <CampCard key={c.id} c={c} kpis={kpis.filter(k=>k.campaign_id===c.id)} onClick={() => setDetail(c)} onEdit={() => setModal(c)} onDelete={() => setConfirm(c.id)} onAddKPI={() => setKpiModal(c)} />)}
              </div>
            </>
          )}
        </>
      )}

      {modal !== null && <CampaignModal camp={modal} onClose={() => setModal(null)} onSave={() => { setModal(null); showToast('Đã lưu!'); load() }} />}
      {kpiModal && <KPIModal campaign={kpiModal} onClose={() => setKpiModal(null)} onSave={() => { setKpiModal(null); showToast('Đã lưu KPI!'); load() }} />}
    </div>
  )
}

function CampCard({ c, kpis, onClick, onEdit, onDelete, onAddKPI }) {
  const totalRevenue = kpis.reduce((s, k) => s + (k.revenue || 0), 0)
  const totalOrders = kpis.reduce((s, k) => s + (k.orders || 0), 0)
  const spentPct = c.budget > 0 ? Math.min(100, Math.round(c.spent / c.budget * 100)) : 0
  const daysLeft = c.end_date ? differenceInDays(parseISO(c.end_date), new Date()) : null

  return (
    <div className="section-card" style={{ cursor: 'pointer' }} onClick={onClick}>
      <div style={{ display: 'grid', gridTemplateColumns: c.key_visual_url ? '100px 1fr' : '1fr', gap: '1rem', alignItems: 'start', marginBottom: '1rem' }}>
        {c.key_visual_url && <img src={c.key_visual_url} style={{ width: '100%', height: 70, objectFit: 'cover', borderRadius: 'var(--radius-sm)' }} />}
        <div>
          <div className="flex-between mb-1">
            <div>
              <StatusBadge status={c.status} />
              {daysLeft !== null && daysLeft > 0 && daysLeft <= 7 && <span className="badge badge-pending" style={{ marginLeft: 6 }}>Còn {daysLeft}d</span>}
            </div>
            <div className="flex-center gap-1" onClick={e => e.stopPropagation()}>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={onAddKPI} title="Nhập KPI"><BarChart2 size={13} /></button>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={onEdit}><Edit2 size={13} /></button>
              <button className="btn btn-ghost btn-icon btn-sm" style={{ color: 'var(--red-text)' }} onClick={onDelete}><Trash2 size={13} /></button>
            </div>
          </div>
          <div style={{ fontWeight: 600, fontSize: 15, marginBottom: '.25rem' }}>{c.name}</div>
          {c.objective && <div className="text-sm text-muted truncate">{c.objective}</div>}
        </div>
      </div>

      <div className="flex-center gap-2 mb-3">
        {(c.platforms || []).map(p => <PlatformBadge key={p} platform={p} />)}
      </div>

      {c.budget > 0 && (
        <div style={{ marginBottom: '1rem' }}>
          <div className="flex-between mb-1">
            <span className="text-xs text-muted">Ngân sách đã dùng</span>
            <span className="text-xs fw-500">{spentPct}% — {new Intl.NumberFormat('vi-VN', { notation: 'compact' }).format(c.spent)}₫ / {new Intl.NumberFormat('vi-VN', { notation: 'compact' }).format(c.budget)}₫</span>
          </div>
          <div className="progress-bar"><div className="progress-fill" style={{ width: `${spentPct}%` }} /></div>
        </div>
      )}

      {kpis.length > 0 && (
        <div className="flex-center gap-4" style={{ borderTop: '1px solid var(--border)', paddingTop: '.75rem' }}>
          <div><div className="text-xs text-faint">Đơn hàng</div><div style={{ fontWeight: 600, fontSize: 15 }}>{totalOrders}</div></div>
          <div><div className="text-xs text-faint">Doanh thu</div><div style={{ fontWeight: 600, fontSize: 15, color: 'var(--accent)' }}>{new Intl.NumberFormat('vi-VN', { notation: 'compact' }).format(totalRevenue)}₫</div></div>
          {c.start_date && <div><div className="text-xs text-faint">Thời gian</div><div style={{ fontWeight: 500, fontSize: 13 }}>{format(parseISO(c.start_date), 'dd/MM')} → {c.end_date ? format(parseISO(c.end_date), 'dd/MM') : '?'}</div></div>}
        </div>
      )}
    </div>
  )
}
