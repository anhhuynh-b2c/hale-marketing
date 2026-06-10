import { useEffect, useState } from 'react'
import { Plus, X, Edit2, Trash2, Briefcase, FileText, Calculator } from 'lucide-react'
import { supabase, B2B_STAGES, STATUS_LABELS } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth.jsx'
import { useToast } from '../hooks/useToast.js'
import { StatusBadge, Toast, ConfirmModal } from '../components/Shared.jsx'
import { format, parseISO, differenceInDays } from 'date-fns'

const PRODUCTS = ['Teak 40×30cm — 599K', 'Teak 50×35cm — 999K', 'Acacia 35×25cm — 389K', 'Acacia 40×30cm — 459K', 'Bộ gifting Teak', 'Bộ gifting Acacia']
const BULK_DISCOUNTS = [{ min: 10, pct: 5 }, { min: 20, pct: 8 }, { min: 50, pct: 12 }, { min: 100, pct: 15 }, { min: 200, pct: 18 }]

function DealCalculator({ onClose }) {
  const [product, setProduct] = useState(PRODUCTS[0])
  const [qty, setQty] = useState(10)
  const basePrice = { 'Teak 40×30cm — 599K': 599000, 'Teak 50×35cm — 999K': 999000, 'Acacia 35×25cm — 389K': 389000, 'Acacia 40×30cm — 459K': 459000, 'Bộ gifting Teak': 699000, 'Bộ gifting Acacia': 499000 }
  const price = basePrice[product] || 599000
  const discount = BULK_DISCOUNTS.filter(d => qty >= d.min).pop()?.pct || 0
  const subtotal = price * qty
  const discountAmt = Math.round(subtotal * discount / 100)
  const total = subtotal - discountAmt

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 420 }}>
        <div className="modal-header">
          <h3>Deal Calculator</h3>
          <button className="btn-icon btn-ghost" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="form-group"><label>Sản phẩm</label>
          <select value={product} onChange={e => setProduct(e.target.value)}>
            {PRODUCTS.map(p => <option key={p}>{p}</option>)}
          </select>
        </div>
        <div className="form-group"><label>Số lượng</label>
          <input type="number" value={qty} onChange={e => setQty(parseInt(e.target.value) || 1)} min={1} />
        </div>
        <div style={{ background: 'var(--cream)', borderRadius: 'var(--radius-md)', padding: '1rem', marginBottom: '1rem' }}>
          <div className="flex-between mb-2"><span className="text-sm text-muted">Đơn giá</span><span style={{ fontWeight: 500 }}>{new Intl.NumberFormat('vi-VN').format(price)}₫</span></div>
          <div className="flex-between mb-2"><span className="text-sm text-muted">Số lượng</span><span style={{ fontWeight: 500 }}>{qty}</span></div>
          <div className="flex-between mb-2"><span className="text-sm text-muted">Tạm tính</span><span style={{ fontWeight: 500 }}>{new Intl.NumberFormat('vi-VN').format(subtotal)}₫</span></div>
          <div className="flex-between mb-2"><span className="text-sm" style={{ color: 'var(--green-text)' }}>Chiết khấu bulk ({discount}%)</span><span style={{ fontWeight: 500, color: 'var(--green-text)' }}>-{new Intl.NumberFormat('vi-VN').format(discountAmt)}₫</span></div>
          <hr className="divider" style={{ margin: '.5rem 0' }} />
          <div className="flex-between"><span style={{ fontWeight: 600 }}>Tổng cộng</span><span style={{ fontWeight: 700, fontSize: 18, color: 'var(--accent)' }}>{new Intl.NumberFormat('vi-VN').format(total)}₫</span></div>
        </div>
        <div className="label mb-2">Bảng chiết khấu</div>
        <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap' }}>
          {BULK_DISCOUNTS.map(d => (
            <div key={d.min} style={{ fontSize: 11, padding: '3px 8px', borderRadius: 99, background: qty >= d.min ? 'var(--green-bg)' : 'var(--cream)', color: qty >= d.min ? 'var(--green-text)' : 'var(--text-muted)', fontWeight: 500 }}>
              {d.min}+ sản phẩm: -{d.pct}%
            </div>
          ))}
        </div>
        <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }} onClick={() => navigator.clipboard.writeText(`${product} x${qty}: ${new Intl.NumberFormat('vi-VN').format(total)}₫ (chiết khấu ${discount}%)`)}>Copy báo giá</button>
      </div>
    </div>
  )
}

function ProposalModal({ lead, onClose }) {
  const [proposal, setProposal] = useState(null)
  const [loading, setLoading] = useState(false)

  async function generate() {
    setLoading(true)
    try {
      const prompt = `Viết email đề xuất corporate gifting bằng tiếng Việt gửi cho "${lead.contact_name || 'Anh/Chị'}" tại công ty "${lead.company}".

Thương hiệu: Ha Le Teak Premium — thớt gỗ teak & acacia premium, chất liệu tự nhiên, bền đẹp, phù hợp làm quà tặng doanh nghiệp cao cấp.

Sản phẩm đề xuất: ${lead.products?.join(', ') || 'Bộ gifting Teak cao cấp'}
Giá trị deal ước tính: ${lead.deal_size ? new Intl.NumberFormat('vi-VN').format(lead.deal_size) + '₫' : 'linh hoạt theo nhu cầu'}

Email cần: lời mở đầu ấm áp, giới thiệu thương hiệu ngắn, điểm nổi bật sản phẩm, đề xuất hợp tác, CTA rõ ràng. Tông: chuyên nghiệp nhưng thân thiện. Không quá dài.`
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 600, messages: [{ role: 'user', content: prompt }] })
      })
      const data = await res.json()
      setProposal(data.content?.find(c => c.type === 'text')?.text || '')
    } catch { setProposal('Lỗi kết nối AI.') }
    setLoading(false)
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 540 }}>
        <div className="modal-header">
          <h3>Email đề xuất — {lead.company}</h3>
          <button className="btn-icon btn-ghost" onClick={onClose}><X size={18} /></button>
        </div>
        {!proposal ? (
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={generate} disabled={loading}>
            {loading ? <><div className="spinner" />Đang viết email...</> : <><FileText size={14} />Tạo email bằng AI</>}
          </button>
        ) : (
          <>
            <div style={{ background: 'var(--cream)', borderRadius: 'var(--radius-md)', padding: '1rem', fontSize: 13, lineHeight: 1.75, whiteSpace: 'pre-wrap', marginBottom: '1rem', maxHeight: 340, overflowY: 'auto' }}>{proposal}</div>
            <div className="flex-center gap-3" style={{ justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => navigator.clipboard.writeText(proposal)}>Copy email</button>
              <button className="btn btn-secondary" onClick={() => setProposal(null)}>Viết lại</button>
              <button className="btn btn-ghost" onClick={onClose}>Đóng</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function B2BModal({ lead, onClose, onSave }) {
  const { user } = useAuth()
  const [form, setForm] = useState(lead?.id ? { ...lead, products: lead.products || [] } : {
    company: '', contact_name: '', contact_email: '',
    deal_size: '', quantity: '', stage: 'new',
    notes: '', follow_up_date: '', last_contact: '',
    products: []
  })
  const [saving, setSaving] = useState(false)
  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }
  function toggleProduct(p) { set('products', form.products.includes(p) ? form.products.filter(x => x !== p) : [...form.products, p]) }

  async function handleSave() {
    if (!form.company.trim()) return
    setSaving(true)
    const payload = { ...form, deal_size: parseFloat(form.deal_size) || 0, quantity: parseInt(form.quantity) || 0, created_by: user.id, follow_up_date: form.follow_up_date || null, last_contact: form.last_contact || null }
    let error
    if (lead?.id) {
      ({ error } = await supabase.from('b2b_leads').update(payload).eq('id', lead.id))
    } else {
      ({ error } = await supabase.from('b2b_leads').insert(payload))
    }
    setSaving(false)
    if (!error) onSave()
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 580 }}>
        <div className="modal-header">
          <h3>{lead?.id ? 'Chỉnh sửa lead' : 'Thêm B2B lead'}</h3>
          <button className="btn-icon btn-ghost" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="grid-2" style={{ gap: '.75rem' }}>
          <div className="form-group"><label>Tên công ty *</label><input value={form.company} onChange={e => set('company', e.target.value)} placeholder="Công ty TNHH ABC" /></div>
          <div className="form-group"><label>Giai đoạn</label>
            <select value={form.stage} onChange={e => set('stage', e.target.value)}>
              {B2B_STAGES.map(s => <option key={s} value={s}>{STATUS_LABELS[s] || s}</option>)}
            </select>
          </div>
          <div className="form-group"><label>Người liên hệ</label><input value={form.contact_name} onChange={e => set('contact_name', e.target.value)} placeholder="Nguyễn Văn A" /></div>
          <div className="form-group"><label>Email / SĐT</label><input value={form.contact_email} onChange={e => set('contact_email', e.target.value)} placeholder="email@company.com" /></div>
          <div className="form-group"><label>Giá trị deal (VND)</label><input type="number" value={form.deal_size} onChange={e => set('deal_size', e.target.value)} placeholder="10000000" /></div>
          <div className="form-group"><label>Số lượng ước tính</label><input type="number" value={form.quantity} onChange={e => set('quantity', e.target.value)} placeholder="50" /></div>
          <div className="form-group"><label>Follow-up ngày</label><input type="date" value={form.follow_up_date} onChange={e => set('follow_up_date', e.target.value)} /></div>
          <div className="form-group"><label>Liên hệ lần cuối</label><input type="date" value={form.last_contact} onChange={e => set('last_contact', e.target.value)} /></div>
        </div>
        <div className="form-group"><label>Sản phẩm quan tâm</label>
          <div className="flex-center gap-2" style={{ flexWrap: 'wrap' }}>
            {PRODUCTS.map(p => <button key={p} className={`chip ${form.products.includes(p) ? 'active' : ''}`} onClick={() => toggleProduct(p)} style={{ fontSize: 11 }}>{p.split('—')[0].trim()}</button>)}
          </div>
        </div>
        <div className="form-group"><label>Ghi chú</label><textarea rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Dịp tặng quà, yêu cầu đặc biệt, timeline..." /></div>
        <div className="flex-center gap-3 mt-4" style={{ justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={onClose}>Hủy</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? <><div className="spinner" />Đang lưu...</> : 'Lưu lead'}</button>
        </div>
      </div>
    </div>
  )
}

export default function B2BPipeline() {
  const { toast, showToast } = useToast()
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [proposalModal, setProposalModal] = useState(null)
  const [showCalculator, setShowCalculator] = useState(false)
  const [confirm, setConfirm] = useState(null)

  useEffect(() => { load() }, [])
  async function load() {
    setLoading(true)
    const { data } = await supabase.from('b2b_leads').select('*').order('created_at', { ascending: false })
    setLeads(data || [])
    setLoading(false)
  }
  async function del(id) {
    await supabase.from('b2b_leads').delete().eq('id', id)
    showToast('Đã xóa.'); setConfirm(null); load()
  }

  const totalDeal = leads.filter(l => l.stage === 'won').reduce((s, l) => s + (l.deal_size || 0), 0)
  const pipeline = leads.filter(l => !['won','lost'].includes(l.stage)).reduce((s, l) => s + (l.deal_size || 0), 0)
  const overdue = leads.filter(l => l.follow_up_date && differenceInDays(new Date(), parseISO(l.follow_up_date)) > 0 && !['won','lost'].includes(l.stage))

  return (
    <div>
      <Toast message={toast} />
      {confirm && <ConfirmModal message="Xóa lead này?" onConfirm={() => del(confirm)} onCancel={() => setConfirm(null)} />}

      <div className="flex-between page-header">
        <div>
          <h1>B2B Pipeline</h1>
          <p>Corporate gifting — quản lý đối tác doanh nghiệp</p>
        </div>
        <div className="flex-center gap-2">
          <button className="btn btn-secondary" onClick={() => setShowCalculator(true)}><Calculator size={14} />Deal Calculator</button>
          <button className="btn btn-primary" onClick={() => setModal({})}><Plus size={15} />Thêm lead</button>
        </div>
      </div>

      {overdue.length > 0 && (
        <div style={{ background: 'var(--amber-bg)', border: '1px solid rgba(122,78,0,.2)', borderRadius: 'var(--radius-md)', padding: '.75rem 1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '.75rem' }}>
          <span style={{ color: 'var(--amber-text)', fontWeight: 600, fontSize: 13 }}>⚠️ {overdue.length} lead quá hạn follow-up:</span>
          <span style={{ fontSize: 13, color: 'var(--amber-text)' }}>{overdue.map(l => l.company).join(', ')}</span>
        </div>
      )}

      <div className="grid-4 mb-6">
        <div className="stat-card"><div className="stat-label">Tổng leads</div><div className="stat-val">{leads.length}</div></div>
        <div className="stat-card"><div className="stat-label">Trong pipeline</div><div className="stat-val">{leads.filter(l => !['won','lost'].includes(l.stage)).length}</div></div>
        <div className="stat-card"><div className="stat-label">Giá trị pipeline</div><div className="stat-val" style={{ fontSize: 18 }}>{new Intl.NumberFormat('vi-VN', { notation: 'compact' }).format(pipeline)}₫</div></div>
        <div className="stat-card"><div className="stat-label">Đã chốt</div><div className="stat-val" style={{ fontSize: 18, color: 'var(--green-text)' }}>{new Intl.NumberFormat('vi-VN', { notation: 'compact' }).format(totalDeal)}₫</div></div>
      </div>

      {loading ? <div className="flex-center gap-2 text-muted"><div className="spinner" />Đang tải...</div> : leads.length === 0 ? (
        <div className="card empty-state"><Briefcase size={32} style={{ opacity: .3 }} /><p>Chưa có B2B lead nào.</p><button className="btn btn-primary" onClick={() => setModal({})}>Thêm lead đầu tiên</button></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0,1fr))', gap: '.75rem', alignItems: 'start' }}>
          {B2B_STAGES.map(stage => {
            const stageLeads = leads.filter(l => l.stage === stage)
            const stageTotal = stageLeads.reduce((s, l) => s + (l.deal_size || 0), 0)
            return (
              <div key={stage} className="pipeline-col">
                <div className="pipeline-col-header">
                  <span className="pipeline-col-title">{STATUS_LABELS[stage]}</span>
                  <span className="pipeline-col-count">{stageLeads.length}</span>
                </div>
                {stageTotal > 0 && <div style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600, marginBottom: '.6rem' }}>{new Intl.NumberFormat('vi-VN', { notation: 'compact' }).format(stageTotal)}₫</div>}
                {stageLeads.length === 0 && <div style={{ fontSize: 12, color: 'var(--text-faint)', textAlign: 'center', padding: '.75rem 0' }}>Trống</div>}
                {stageLeads.map(l => {
                  const isOverdue = l.follow_up_date && differenceInDays(new Date(), parseISO(l.follow_up_date)) > 0 && !['won','lost'].includes(l.stage)
                  return (
                    <div key={l.id} className="pipeline-card">
                      <div style={{ fontWeight: 600, fontSize: 13, marginBottom: '.3rem', color: 'var(--text-primary)' }}>{l.company}</div>
                      {l.contact_name && <div className="text-sm text-muted">{l.contact_name}</div>}
                      {l.deal_size > 0 && <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)', marginTop: '.3rem' }}>{new Intl.NumberFormat('vi-VN', { notation: 'compact' }).format(l.deal_size)}₫</div>}
                      {l.quantity > 0 && <div className="text-xs text-muted">{l.quantity} sản phẩm</div>}
                      {l.follow_up_date && (
                        <div className={`text-xs mt-1 ${isOverdue ? 'overdue' : 'text-muted'}`}>
                          {isOverdue ? '⚠️' : '📅'} Follow-up: {format(parseISO(l.follow_up_date), 'dd/MM')}
                        </div>
                      )}
                      {l.notes && <div className="text-xs text-muted mt-1" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{l.notes}</div>}
                      <div className="flex-center gap-1 mt-2" style={{ borderTop: '1px solid var(--border)', paddingTop: '.4rem' }}>
                        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setProposalModal(l)} title="Tạo proposal"><FileText size={12} /></button>
                        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setModal(l)}><Edit2 size={12} /></button>
                        <button className="btn btn-ghost btn-icon btn-sm" style={{ color: 'var(--red-text)' }} onClick={() => setConfirm(l.id)}><Trash2 size={12} /></button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      )}

      {modal !== null && <B2BModal lead={modal} onClose={() => setModal(null)} onSave={() => { setModal(null); showToast('Đã lưu!'); load() }} />}
      {proposalModal && <ProposalModal lead={proposalModal} onClose={() => setProposalModal(null)} />}
      {showCalculator && <DealCalculator onClose={() => setShowCalculator(false)} />}
    </div>
  )
}
