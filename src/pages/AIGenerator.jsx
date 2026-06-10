import { useState, useEffect } from 'react'
import { Sparkles, Copy, Save, RefreshCw, Clock, ChevronRight, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth.jsx'
import { useToast } from '../hooks/useToast.js'
import { Toast } from '../components/Shared.jsx'
import { format, parseISO } from 'date-fns'

const PLATFORMS = ['TikTok', 'Facebook', 'Instagram', 'Shopee', 'YouTube']
const SKUS = [
  'Teak 40×30cm — 599K', 'Teak 50×35cm — 999K',
  'Acacia 35×25cm — 389K', 'Acacia 40×30cm — 459K',
  'Bộ gifting Teak cao cấp', 'Bộ gifting Acacia tiêu chuẩn'
]
const OBJECTIVES = [
  'Tăng nhận diện thương hiệu', 'Thu hút khách hàng mới',
  'Bán hàng trực tiếp', 'Giáo dục khách hàng',
  'Tăng engagement', 'Quảng bá corporate gifting'
]
const TONES = [
  { id: 'warm', label: 'Ấm áp, gần gũi', desc: 'Như người bạn chia sẻ' },
  { id: 'pro', label: 'Chuyên nghiệp', desc: 'Tin cậy, authority' },
  { id: 'luxury', label: 'Sang trọng', desc: 'Premium, tinh tế' },
  { id: 'funny', label: 'Hài hước', desc: 'Vui vẻ, viral' },
  { id: 'sell', label: 'Bán hàng', desc: 'Thuyết phục, urgency' },
]
const QUICK_PROMPTS = [
  { label: 'So sánh Teak vs Acacia', platform: 'TikTok', sku: 'Teak 40×30cm — 599K', obj: 'Giáo dục khách hàng' },
  { label: 'Unboxing gifting set', platform: 'Instagram', sku: 'Bộ gifting Teak cao cấp', obj: 'Tăng nhận diện thương hiệu' },
  { label: 'Flash deal Shopee', platform: 'Shopee', sku: 'Acacia 35×25cm — 389K', obj: 'Bán hàng trực tiếp' },
  { label: 'Hướng dẫn chăm sóc gỗ', platform: 'Facebook', sku: 'Teak 40×30cm — 599K', obj: 'Giáo dục khách hàng' },
  { label: 'Review KOC teak', platform: 'TikTok', sku: 'Teak 50×35cm — 999K', obj: 'Tăng nhận diện thương hiệu' },
  { label: 'Corporate gifting B2B', platform: 'Facebook', sku: 'Bộ gifting Teak cao cấp', obj: 'Quảng bá corporate gifting' },
]

const OUTPUT_TABS = [
  { key: 'caption', label: 'Caption' },
  { key: 'script', label: 'Kịch bản' },
  { key: 'hashtags', label: 'Hashtag' },
  { key: 'cta', label: 'CTA' },
]

export default function AIGenerator() {
  const { user } = useAuth()
  const { toast, showToast } = useToast()
  const [form, setForm] = useState({ platform: 'TikTok', sku: SKUS[0], objective: OBJECTIVES[0], tone: 'warm', content_type: 'Reel/Video', extra: '' })
  const [ideas, setIdeas] = useState(null)
  const [selectedIdea, setSelectedIdea] = useState(0)
  const [activeTab, setActiveTab] = useState('caption')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [history, setHistory] = useState([])
  const [showHistory, setShowHistory] = useState(false)

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  useEffect(() => { loadHistory() }, [])
  async function loadHistory() {
    const { data } = await supabase.from('ai_history').select('*').eq('created_by', user.id).order('created_at', { ascending: false }).limit(10)
    setHistory(data || [])
  }

  function applyQuickPrompt(qp) {
    setForm(f => ({ ...f, platform: qp.platform, sku: qp.sku, objective: qp.obj }))
  }

  async function generate() {
    setLoading(true); setIdeas(null)
    const toneLabel = TONES.find(t => t.id === form.tone)?.label || 'Ấm áp'
    const prompt = `Bạn là chuyên gia marketing của "Ha Le Teak Premium" — thương hiệu thớt gỗ teak & acacia premium tại Việt Nam.

Tạo 3 ý tưởng nội dung KHÁC NHAU (angle khác nhau) cho:
- Nền tảng: ${form.platform}
- Sản phẩm: ${form.sku}
- Mục tiêu: ${form.objective}
- Loại: ${form.content_type}
- Giọng điệu: ${toneLabel}
${form.extra ? `- Yêu cầu thêm: ${form.extra}` : ''}

Mỗi ý tưởng có angle khác nhau (vd: lợi ích, cảm xúc, so sánh, câu chuyện, khuyến mãi).

Trả về ĐÚNG format JSON (không có markdown):
{"ideas":[
  {"angle":"Tên angle","caption":"caption đầy đủ","script":"kịch bản hook→body→cta","hashtags":"tag1,tag2,tag3,tag4,tag5","cta":"3 biến thể CTA ngắn, mỗi cái cách nhau bằng |"},
  {"angle":"...","caption":"...","script":"...","hashtags":"...","cta":"..."},
  {"angle":"...","caption":"...","script":"...","hashtags":"...","cta":"..."}
]}`

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 2000, messages: [{ role: 'user', content: prompt }] })
      })
      const data = await res.json()
      const text = data.content?.find(c => c.type === 'text')?.text || ''
      const parsed = JSON.parse(text.replace(/```json|```/g, '').trim())
      setIdeas(parsed.ideas)
      setSelectedIdea(0)
      setActiveTab('caption')
      await supabase.from('ai_history').insert({
        platform: form.platform, sku: form.sku, objective: form.objective,
        result_caption: parsed.ideas[0]?.caption,
        result_script: parsed.ideas[0]?.script,
        result_hashtags: parsed.ideas[0]?.hashtags,
        result_cta: parsed.ideas[0]?.cta,
        created_by: user.id
      })
      loadHistory()
    } catch (e) {
      showToast('Lỗi kết nối AI. Kiểm tra API key.')
    }
    setLoading(false)
  }

  async function saveToStudio(ideaIndex) {
    if (!ideas) return
    const idea = ideas[ideaIndex ?? selectedIdea]
    setSaving(true)
    await supabase.from('posts').insert({
      title: `${form.sku} — ${form.platform} (${idea.angle})`,
      caption: idea.caption, script: idea.script,
      hashtags: idea.hashtags?.split(',').map(h => h.trim().replace(/^#/, '')).filter(Boolean),
      platform: form.platform, post_type: form.content_type,
      status: 'draft', created_by: user.id
    })
    setSaving(false)
    showToast('Đã lưu vào Content Studio!')
  }

  function copyText(text) {
    navigator.clipboard.writeText(text)
    showToast('Đã copy!')
  }

  const currentIdea = ideas?.[selectedIdea]

  return (
    <div>
      <Toast message={toast} />
      <div className="page-header">
        <h1>AI Content Generator</h1>
        <p>Tạo 3 ý tưởng nội dung khác nhau — chọn cái hay nhất và lưu vào Studio.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '1.5rem', alignItems: 'start' }}>
        <div>
          <div className="ai-panel mb-4">
            <h3 className="mb-3">Cài đặt nội dung</h3>

            <div className="form-group">
              <label>Quick prompts</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.35rem' }}>
                {QUICK_PROMPTS.map(qp => (
                  <button key={qp.label} className="btn btn-secondary btn-sm" style={{ justifyContent: 'space-between', textAlign: 'left' }} onClick={() => applyQuickPrompt(qp)}>
                    {qp.label} <ChevronRight size={12} />
                  </button>
                ))}
              </div>
            </div>

            <hr className="divider" style={{ margin: '1rem 0' }} />

            <div className="form-group"><label>Sản phẩm / SKU</label>
              <select value={form.sku} onChange={e => set('sku', e.target.value)}>
                {SKUS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>

            <div className="form-group"><label>Nền tảng</label>
              <div className="flex-center gap-2" style={{ flexWrap: 'wrap' }}>
                {PLATFORMS.map(p => <button key={p} className={`chip ${form.platform === p ? 'active' : ''}`} onClick={() => set('platform', p)}>{p}</button>)}
              </div>
            </div>

            <div className="form-group"><label>Mục tiêu</label>
              <select value={form.objective} onChange={e => set('objective', e.target.value)}>
                {OBJECTIVES.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>

            <div className="form-group"><label>Giọng điệu</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.35rem' }}>
                {TONES.map(t => (
                  <button key={t.id} className={`chip ${form.tone === t.id ? 'active' : ''}`} style={{ justifyContent: 'space-between', borderRadius: 'var(--radius-sm)', padding: '6px 10px' }} onClick={() => set('tone', t.id)}>
                    <span style={{ fontWeight: 500 }}>{t.label}</span>
                    <span style={{ fontSize: 11, opacity: .7 }}>{t.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group"><label>Yêu cầu thêm (tuỳ chọn)</label>
              <textarea rows={2} value={form.extra} onChange={e => set('extra', e.target.value)} placeholder="VD: đang có sale 15%, dịp Tết Nguyên Đán..." />
            </div>

            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '10px' }} onClick={generate} disabled={loading}>
              {loading ? <><div className="spinner" />Đang tạo 3 ý tưởng...</> : <><Sparkles size={15} />Tạo nội dung</>}
            </button>
          </div>

          {history.length > 0 && (
            <div className="ai-panel">
              <div className="flex-between mb-3">
                <h4>Lịch sử generate</h4>
                <button className="btn btn-ghost btn-sm" onClick={() => setShowHistory(!showHistory)}>{showHistory ? 'Ẩn' : 'Xem'}</button>
              </div>
              {showHistory && history.map(h => (
                <div key={h.id} style={{ padding: '.5rem 0', borderBottom: '1px solid var(--border)', cursor: 'pointer' }} onClick={() => setIdeas([{ angle: 'Từ lịch sử', caption: h.result_caption, script: h.result_script, hashtags: h.result_hashtags, cta: h.result_cta }])}>
                  <div style={{ fontSize: 12, fontWeight: 500 }}>{h.sku} → {h.platform}</div>
                  <div className="text-xs text-faint">{format(parseISO(h.created_at), 'dd/MM HH:mm')}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          {!ideas && !loading && (
            <div className="ai-panel empty-state" style={{ minHeight: 300 }}>
              <Sparkles size={36} style={{ color: 'var(--wood-300)' }} />
              <p>Điền thông tin bên trái và nhấn "Tạo nội dung"<br />AI sẽ tạo 3 ý tưởng khác nhau cho bạn chọn.</p>
            </div>
          )}

          {loading && (
            <div className="ai-panel" style={{ minHeight: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem' }}>
              <div className="spinner spinner-lg" />
              <p style={{ color: 'var(--text-muted)' }}>AI đang tạo 3 ý tưởng nội dung...</p>
            </div>
          )}

          {ideas && (
            <>
              <div className="flex-between mb-3">
                <h3>3 ý tưởng nội dung</h3>
                <div className="flex-center gap-2">
                  <button className="btn btn-sm btn-secondary" onClick={generate} disabled={loading}><RefreshCw size={13} />Tạo lại</button>
                  <button className="btn btn-sm btn-primary" onClick={() => saveToStudio()} disabled={saving}>
                    <Save size={13} />{saving ? 'Đang lưu...' : 'Lưu vào Studio'}
                  </button>
                </div>
              </div>

              <div className="grid-3 mb-4" style={{ gap: '.75rem' }}>
                {ideas.map((idea, i) => (
                  <div key={i} className={`ai-idea-card ${selectedIdea === i ? 'selected' : ''}`} onClick={() => setSelectedIdea(i)}>
                    <div style={{ padding: '.75rem' }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: selectedIdea === i ? 'var(--accent)' : 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '.35rem' }}>Ý tưởng {i + 1}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: '.4rem' }}>{idea.angle}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{idea.caption}</div>
                    </div>
                    <div style={{ padding: '.5rem .75rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>{form.platform}</span>
                      <button className="btn btn-sm btn-ghost" style={{ fontSize: 11 }} onClick={e => { e.stopPropagation(); saveToStudio(i) }}>Lưu</button>
                    </div>
                  </div>
                ))}
              </div>

              {currentIdea && (
                <div className="ai-panel">
                  <div className="flex-between mb-3">
                    <div className="tabs" style={{ borderBottom: 'none', margin: 0 }}>
                      {OUTPUT_TABS.map(tab => (
                        <div key={tab.key} className={`tab ${activeTab === tab.key ? 'active' : ''}`} onClick={() => setActiveTab(tab.key)} style={{ padding: '.4rem .85rem', fontSize: 13 }}>
                          {tab.label}
                        </div>
                      ))}
                    </div>
                    <button className="btn btn-sm btn-secondary" onClick={() => copyText(activeTab === 'hashtags' ? currentIdea.hashtags?.split(',').map(h => '#'+h.trim()).join(' ') : activeTab === 'cta' ? currentIdea.cta : currentIdea[activeTab])}>
                      <Copy size={13} />Copy
                    </button>
                  </div>

                  {activeTab === 'caption' && <div className="ai-result-box">{currentIdea.caption}</div>}
                  {activeTab === 'script' && <div className="ai-result-box">{currentIdea.script}</div>}
                  {activeTab === 'hashtags' && (
                    <div className="ai-result-box">
                      <div className="flex-center gap-2" style={{ flexWrap: 'wrap' }}>
                        {currentIdea.hashtags?.split(',').map((h, i) => (
                          <span key={i} style={{ background: 'var(--blue-bg)', color: 'var(--blue-text)', fontSize: 13, padding: '3px 10px', borderRadius: 99, fontWeight: 500 }}>#{h.trim()}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {activeTab === 'cta' && (
                    <div className="ai-result-box">
                      {currentIdea.cta?.split('|').map((c, i) => (
                        <div key={i} style={{ padding: '.5rem .75rem', marginBottom: '.4rem', background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: 13, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span>{c.trim()}</span>
                          <button className="btn btn-sm btn-ghost" onClick={() => copyText(c.trim())}><Copy size={11} /></button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
