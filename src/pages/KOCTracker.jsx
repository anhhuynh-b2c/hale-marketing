import { useEffect, useState } from 'react'
import { Plus, X, Edit2, Trash2, Users, Gift, FileText, TrendingUp } from 'lucide-react'
import { supabase, KOC_STATUSES, STATUS_LABELS } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth.jsx'
import { useToast } from '../hooks/useToast.js'
import { StatusBadge, PlatformBadge, Toast, ConfirmModal } from '../components/Shared.jsx'

const PLATFORMS = ['TikTok', 'Instagram', 'Facebook', 'YouTube']

function KOCModal({ koc, onClose, onSave }) {
  const { user } = useAuth()
  const [form, setForm] = useState(koc?.id ? { ...koc } : {
    name: '', platform: 'TikTok', followers: '', contact: '',
    status: 'prospect', notes: '',
    gifting_sent: false, gifting_date: '', gifting_items: '',
    views: '', orders_from_koc: '', revenue_from_koc: ''
  })
  const [saving, setSaving] = useState(false)
  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  async function handleSave() {
    if (!form.name.trim()) return
    setSaving(true)
    const payload = {
      ...form,
      followers: parseInt(form.followers) || 0,
      views: parseInt(form.views) || 0,
      orders_from_koc: parseInt(form.orders_from_koc) || 0,
      revenue_from_koc: parseFloat(form.revenue_from_koc) || 0,
      created_by: user.id
    }
    let error
    if (koc?.id) {
      ({ error } = await supabase.from('koc_leads').update(payload).eq('id', koc.id))
    } else {
      ({ error } = await supabase.from('koc_leads').insert(payload))
    }
    setSaving(false)
    if (!error) onSave()
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 580 }}>
        <div className="modal-header">
          <h3>{koc?.id ? 'Chỉnh sửa KOC' : 'Thêm KOC mới'}</h3>
          <button className="btn-icon btn-ghost" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="grid-2" style={{ gap: '.75rem' }}>
          <div className="form-group"><label>Tên / Username *</label><input value={form.name} onChange={e => set('name', e.target.value)} placeholder="@username hoặc tên thật" /></div>
          <div className="form-group"><label>Liên hệ</label><input value={form.contact} onChange={e => set('contact', e.target.value)} placeholder="SĐT / email / link" /></div>
          <div className="form-group"><label>Nền tảng</label>
            <div className="flex-center gap-2" style={{ flexWrap: 'wrap' }}>
              {PLATFORMS.map(p => <button key={p} className={`chip ${form.platform === p ? 'active' : ''}`} onClick={() => set('platform', p)}>{p}</button>)}
            </div>
          </div>
          <div className="form-group"><label>Follower</label><input type="number" value={form.followers} onChange={e => set('followers', e.target.value)} placeholder="50000" /></div>
          <div className="form-group"><label>Trạng thái</label>
            <select value={form.status} onChange={e => set('status', e.target.value)}>
              {KOC_STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s] || s}</option>)}
            </select>
          </div>
        </div>

        <hr className="divider" style={{ margin: '1rem 0' }} />
        <div className="label mb-3">Thông tin gifting</div>
        <div className="grid-2" style={{ gap: '.75rem' }}>
          <div className="form-group">
            <label>Đã gửi hàng mẫu?</label>
            <div className="flex-center gap-3 mt-1">
              {[true, false].map(v => (
                <button key={String(v)} className={`chip ${form.gifting_sent === v ? 'active' : ''}`} onClick={() => set('gifting_sent', v)}>{v ? 'Đã gửi' : 'Chưa gửi'}</button>
              ))}
            </div>
          </div>
          {form.gifting_sent && <div className="form-group"><label>Ngày gửi</label><input type="date" value={form.gifting_date} onChange={e => set('gifting_date', e.target.value)} /></div>}
        </div>
        {form.gifting_sent && <div className="form-group"><label>Sản phẩm đã gửi</label><input value={form.gifting_items} onChange={e => set('gifting_items', e.target.value)} placeholder="VD: 1x Teak 40×30, 1x Acacia 35×25" /></div>}

        <hr className="divider" style={{ margin: '1rem 0' }} />
        <div className="label mb-3">Hiệu quả seeding</div>
        <div className="grid-3" style={{ gap: '.75rem' }}>
          <div className="form-group"><label>Lượt xem</label><input type="number" value={form.views} onChange={e => set('views', e.target.value)} placeholder="50000" /></div>
          <div className="form-group"><label>Đơn từ KOC</label><input type="number" value={form.orders_from_koc} onChange={e => set('orders_from_koc', e.target.value)} placeholder="15" /></div>
          <div className="form-group"><label>Doanh thu (VND)</label><input type="number" value={form.revenue_from_koc} onChange={e => set('revenue_from_koc', e.target.value)} placeholder="8000000" /></div>
        </div>

        <div className="form-group"><label>Ghi chú</label><textarea rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Deal seeding, ngày đăng bài, feedback..." /></div>

        <div className="flex-center gap-3 mt-4" style={{ justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={onClose}>Hủy</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? <><div className="spinner" />Đang lưu...</> : 'Lưu KOC'}</button>
        </div>
      </div>
    </div>
  )
}

function BriefModal({ koc, onClose }) {
  const [brief, setBrief] = useState(null)
  const [loading, setLoading] = useState(false)

  async function generate() {
    setLoading(true)
    try {
      const prompt = `Tạo seeding brief ngắn gọn bằng tiếng Việt để gửi cho KOC "${koc.name}" (${koc.platform}, ${new Intl.NumberFormat('vi-VN', {notation:'compact'}).format(koc.followers || 0)} followers) cho thương hiệu Ha Le Teak Premium — thớt gỗ teak & acacia premium tại Việt Nam.

Brief cần có: Giới thiệu thương hiệu (2 câu), Sản phẩm gửi kèm, Yêu cầu nội dung (format, hashtag, mention), Timeline, Deal seeding (hàng đổi content).

Trả về plain text, không dùng markdown đặc biệt, thân thiện và chuyên nghiệp.`
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 600, messages: [{ role: 'user', content: prompt }] })
      })
      const data = await res.json()
      setBrief(data.content?.find(c => c.type === 'text')?.text || '')
    } catch { setBrief('Lỗi kết nối AI.') }
    setLoading(false)
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 520 }}>
        <div className="modal-header">
          <h3>Seeding Brief — {koc.name}</h3>
          <button className="btn-icon btn-ghost" onClick={onClose}><X size={18} /></button>
        </div>
        {!brief ? (
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={generate} disabled={loading}>
            {loading ? <><div className="spinner" />Đang tạo brief...</> : <><FileText size={14} />Tạo brief bằng AI</>}
          </button>
        ) : (
          <>
            <div style={{ background: 'var(--cream)', borderRadius: 'var(--radius-md)', padding: '1rem', fontSize: 13, lineHeight: 1.75, whiteSpace: 'pre-wrap', marginBottom: '1rem' }}>{brief}</div>
            <div className="flex-center gap-3" style={{ justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => navigator.clipboard.writeText(brief)}>Copy brief</button>
              <button className="btn btn-secondary" onClick={() => setBrief(null)}>Tạo lại</button>
              <button className="btn btn-ghost" onClick={onClose}>Đóng</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function KOCTracker() {
  const { toast, showToast } = useToast()
  const [kocs, setKocs] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [briefModal, setBriefModal] = useState(null)
  const [confirm, setConfirm] = useState(null)
  const [filterStatus, setFilterStatus] = useState('all')

  useEffect(() => { load() }, [])
  async function load() {
    setLoading(true)
    const { data } = await supabase.from('koc_leads').select('*').order('created_at', { ascending: false })
    setKocs(data || [])
    setLoading(false)
  }
  async function del(id) {
    await supabase.from('koc_leads').delete().eq('id', id)
    showToast('Đã xóa.'); setConfirm(null); load()
  }

  const filtered = filterStatus === 'all' ? kocs : kocs.filter(k => k.status === filterStatus)
  const byStatus = KOC_STATUSES.reduce((a, s) => { a[s] = kocs.filter(k => k.status === s).length; return a }, {})
  const totalViews = kocs.reduce((s, k) => s + (k.views || 0), 0)
  const totalOrders = kocs.reduce((s, k) => s + (k.orders_from_koc || 0), 0)
  const totalRevenue = kocs.reduce((s, k) => s + (k.revenue_from_koc || 0), 0)

  return (
    <div>
      <Toast message={toast} />
      {confirm && <ConfirmModal message="Xóa KOC này?" onConfirm={() => del(confirm)} onCancel={() => setConfirm(null)} />}

      <div className="flex-between page-header">
        <div><h1>KOC Seeding</h1><p>Quản lý influencer seeding — từ tiếp cận đến đo lường hiệu quả</p></div>
        <button className="btn btn-primary" onClick={() => setModal({})}><Plus size={15} />Thêm KOC</button>
      </div>

      <div className="grid-stats mb-4">
        <div className="stat-card"><div className="stat-label">Tổng KOC</div><div className="stat-val">{kocs.length}</div></div>
        <div className="stat-card"><div className="stat-label">Đang seeding</div><div className="stat-val">{byStatus.seeding || 0}</div></div>
        <div className="stat-card"><div className="stat-label">Tổng lượt xem</div><div className="stat-val">{new Intl.NumberFormat('vi-VN', { notation: 'compact' }).format(totalViews)}</div></div>
        <div className="stat-card"><div className="stat-label">Đơn từ KOC</div><div className="stat-val">{totalOrders}</div></div>
        <div className="stat-card"><div className="stat-label">Doanh thu KOC</div><div className="stat-val" style={{ fontSize: 18 }}>{new Intl.NumberFormat('vi-VN', { notation: 'compact' }).format(totalRevenue)}₫</div></div>
      </div>

      <div className="flex-center gap-2 mb-4">
        <button className={`chip ${filterStatus === 'all' ? 'active' : ''}`} onClick={() => setFilterStatus('all')}>Tất cả ({kocs.length})</button>
        {KOC_STATUSES.map(s => (
          <button key={s} className={`chip ${filterStatus === s ? 'active' : ''}`} onClick={() => setFilterStatus(filterStatus === s ? 'all' : s)}>
            {STATUS_LABELS[s]} ({byStatus[s] || 0})
          </button>
        ))}
      </div>

      {loading ? <div className="flex-center gap-2 text-muted"><div className="spinner" />Đang tải...</div> : filtered.length === 0 ? (
        <div className="card empty-state"><Users size={32} style={{ opacity: .3 }} /><p>Chưa có KOC nào.</p><button className="btn btn-primary" onClick={() => setModal({})}>Thêm KOC đầu tiên</button></div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="table">
            <thead><tr><th>Tên / Username</th><th>Nền tảng</th><th>Follower</th><th>Gifting</th><th>Hiệu quả</th><th>Trạng thái</th><th>Ghi chú</th><th style={{ width: 100 }}></th></tr></thead>
            <tbody>
              {filtered.map(k => (
                <tr key={k.id}>
                  <td style={{ fontWeight: 500 }}>{k.name}</td>
                  <td><PlatformBadge platform={k.platform} /></td>
                  <td>{k.followers ? new Intl.NumberFormat('vi-VN', { notation: 'compact' }).format(k.followers) : '—'}</td>
                  <td>
                    {k.gifting_sent ? (
                      <div>
                        <span style={{ fontSize: 11, color: 'var(--green-text)', background: 'var(--green-bg)', padding: '1px 6px', borderRadius: 99 }}>✓ Đã gửi</span>
                        {k.gifting_items && <div className="text-xs text-faint mt-1">{k.gifting_items}</div>}
                      </div>
                    ) : <span className="text-faint text-xs">Chưa gửi</span>}
                  </td>
                  <td>
                    {k.views || k.orders_from_koc ? (
                      <div style={{ fontSize: 12 }}>
                        {k.views > 0 && <div className="text-muted">{new Intl.NumberFormat('vi-VN', { notation: 'compact' }).format(k.views)} views</div>}
                        {k.orders_from_koc > 0 && <div style={{ color: 'var(--accent)', fontWeight: 500 }}>{k.orders_from_koc} đơn</div>}
                      </div>
                    ) : <span className="text-faint text-xs">—</span>}
                  </td>
                  <td><StatusBadge status={k.status} /></td>
                  <td className="text-muted text-sm" style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{k.notes || '—'}</td>
                  <td>
                    <div className="flex-center gap-1">
                      <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setBriefModal(k)} title="Tạo brief"><FileText size={13} /></button>
                      <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setModal(k)}><Edit2 size={13} /></button>
                      <button className="btn btn-ghost btn-icon btn-sm" style={{ color: 'var(--red-text)' }} onClick={() => setConfirm(k.id)}><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal !== null && <KOCModal koc={modal} onClose={() => setModal(null)} onSave={() => { setModal(null); showToast('Đã lưu!'); load() }} />}
      {briefModal && <BriefModal koc={briefModal} onClose={() => setBriefModal(null)} />}
    </div>
  )
}
