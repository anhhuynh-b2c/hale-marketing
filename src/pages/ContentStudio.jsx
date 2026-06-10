import { useEffect, useState, useCallback } from 'react'
import { Plus, Search, X, Edit2, Trash2, Copy, RefreshCw, Eye, Archive, RotateCcw, Filter, ChevronDown } from 'lucide-react'
import { supabase, PLATFORMS, POST_TYPES, POST_STATUSES } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth.jsx'
import { useToast } from '../hooks/useToast.js'
import { PlatformBadge, StatusBadge, ScoreBadge, TagInput, ImageUpload, ContentThumb, Toast, ConfirmModal } from '../components/Shared.jsx'
import { format, parseISO } from 'date-fns'
import { vi } from 'date-fns/locale'

const SCORE_PROMPT = (title, caption, platform) => `Rate this social media post caption for ${platform} on a scale of 1-10. Consider: hook strength, clarity, CTA, emotional appeal, brand fit for a premium teak wood cutting board brand in Vietnam. Title: "${title}". Caption: "${caption}". Reply with ONLY a JSON: {"score": NUMBER, "tip": "ONE short improvement tip in Vietnamese under 15 words"}`

function PostModal({ post, onClose, onSave }) {
  const { user } = useAuth()
  const [form, setForm] = useState(post?.id ? { ...post, hashtags: post.hashtags || [], scheduled_at: post.scheduled_at ? format(parseISO(post.scheduled_at), "yyyy-MM-dd'T'HH:mm") : '' } : { title: '', caption: '', script: '', platform: 'TikTok', post_type: 'Reel/Video', status: 'draft', scheduled_at: '', hashtags: [], image_url: '' })
  const [saving, setSaving] = useState(false)
  const [scoring, setScoring] = useState(false)
  const [scoreTip, setScoreTip] = useState(post?.content_score ? `Điểm hiện tại: ${post.content_score}/10` : '')

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  async function scoreCaption() {
    if (!form.caption?.trim()) return
    setScoring(true)
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 200, messages: [{ role: 'user', content: SCORE_PROMPT(form.title, form.caption, form.platform) }] })
      })
      const data = await res.json()
      const text = data.content?.find(c => c.type === 'text')?.text || ''
      const parsed = JSON.parse(text.replace(/```json|```/g, '').trim())
      set('content_score', parsed.score)
      setScoreTip(parsed.tip)
    } catch {}
    setScoring(false)
  }

  async function handleSave() {
    if (!form.title.trim()) return
    setSaving(true)
    const payload = { ...form, created_by: user.id, updated_at: new Date().toISOString(), scheduled_at: form.scheduled_at || null }
    let error
    if (post?.id) {
      ({ error } = await supabase.from('posts').update(payload).eq('id', post.id))
    } else {
      ({ error } = await supabase.from('posts').insert(payload))
    }
    setSaving(false)
    if (!error) onSave()
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 640 }}>
        <div className="modal-header">
          <h3>{post?.id ? 'Chỉnh sửa bài' : 'Tạo bài mới'}</h3>
          <button className="btn-icon btn-ghost" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="grid-2" style={{ gap: '1.25rem' }}>
          <div>
            <div className="form-group"><label>Ảnh thumbnail</label><ImageUpload value={form.image_url} onChange={v => set('image_url', v)} /></div>
          </div>
          <div>
            <div className="form-group"><label>Tiêu đề *</label><input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Tên bài đăng..." /></div>
            <div className="form-group"><label>Nền tảng</label>
              <div className="flex-center gap-2" style={{ flexWrap: 'wrap' }}>
                {PLATFORMS.map(p => <button key={p} className={`chip ${form.platform === p ? 'active' : ''}`} onClick={() => set('platform', p)}>{p}</button>)}
              </div>
            </div>
            <div className="grid-2" style={{ gap: '.75rem' }}>
              <div className="form-group"><label>Loại nội dung</label>
                <select value={form.post_type} onChange={e => set('post_type', e.target.value)}>
                  {POST_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group"><label>Trạng thái</label>
                <select value={form.status} onChange={e => set('status', e.target.value)}>
                  {POST_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group"><label>Lịch đăng</label><input type="datetime-local" value={form.scheduled_at} onChange={e => set('scheduled_at', e.target.value)} /></div>
          </div>
        </div>

        <div className="form-group">
          <div className="flex-between mb-2">
            <label style={{ margin: 0 }}>Caption</label>
            <div className="flex-center gap-2">
              {form.content_score && <ScoreBadge score={form.content_score} />}
              <button className="btn btn-sm btn-secondary" onClick={scoreCaption} disabled={scoring || !form.caption}>
                {scoring ? <><div className="spinner" style={{ width: 12, height: 12, borderWidth: 1.5 }} />Đang chấm...</> : '★ Chấm điểm AI'}
              </button>
            </div>
          </div>
          <textarea rows={4} value={form.caption} onChange={e => set('caption', e.target.value)} placeholder="Caption cho bài đăng — hook, body, CTA..." />
          {scoreTip && <div style={{ fontSize: 12, color: 'var(--accent)', marginTop: '.3rem', fontStyle: 'italic' }}>💡 {scoreTip}</div>}
        </div>

        <div className="form-group">
          <label>Kịch bản / Script</label>
          <textarea rows={4} value={form.script} onChange={e => set('script', e.target.value)} placeholder="Hook (0-3s): ...&#10;Body (3-25s): ...&#10;CTA (25-30s): ..." />
        </div>

        <div className="form-group">
          <label>Hashtag</label>
          <TagInput tags={form.hashtags} onChange={v => set('hashtags', v)} placeholder="#thớtgỗteak #haleteakpremium..." />
        </div>

        <div className="flex-center gap-3 mt-4" style={{ justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={onClose}>Hủy</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving || !form.title.trim()}>
            {saving ? <><div className="spinner" />Đang lưu...</> : 'Lưu bài'}
          </button>
        </div>
      </div>
    </div>
  )
}

function PreviewModal({ post, onClose, onEdit }) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 580 }}>
        <div className="modal-header">
          <div>
            <h3>{post.title}</h3>
            <div className="flex-center gap-2 mt-2">
              <PlatformBadge platform={post.platform} />
              <StatusBadge status={post.status} />
              {post.content_score && <ScoreBadge score={post.content_score} />}
              {post.scheduled_at && <span className="text-muted text-sm">{format(parseISO(post.scheduled_at), 'dd/MM/yyyy HH:mm')}</span>}
            </div>
          </div>
          <button className="btn-icon btn-ghost" onClick={onClose}><X size={18} /></button>
        </div>

        {post.image_url && <img src={post.image_url} style={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }} />}

        {post.caption && (
          <div style={{ marginBottom: '1rem' }}>
            <div className="label mb-2">Caption</div>
            <div style={{ fontSize: 13, lineHeight: 1.75, color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>{post.caption}</div>
          </div>
        )}

        {post.script && (
          <div style={{ marginBottom: '1rem' }}>
            <div className="label mb-2">Kịch bản</div>
            <div style={{ fontSize: 13, lineHeight: 1.75, background: 'var(--cream)', padding: '.85rem', borderRadius: 'var(--radius-sm)', whiteSpace: 'pre-wrap' }}>{post.script}</div>
          </div>
        )}

        {post.hashtags?.length > 0 && (
          <div style={{ marginBottom: '1rem' }}>
            <div className="label mb-2">Hashtag</div>
            <div className="flex-center gap-2" style={{ flexWrap: 'wrap' }}>
              {post.hashtags.map(t => <span key={t} style={{ fontSize: 12, color: 'var(--blue-text)', background: 'var(--blue-bg)', padding: '2px 8px', borderRadius: 99 }}>#{t}</span>)}
            </div>
          </div>
        )}

        <div className="flex-center gap-3 mt-4" style={{ justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={onClose}>Đóng</button>
          <button className="btn btn-primary" onClick={() => { onClose(); onEdit(post) }}>Chỉnh sửa</button>
        </div>
      </div>
    </div>
  )
}

function RepurposeModal({ post, onClose, onSave }) {
  const { user } = useAuth()
  const [targetPlatform, setTargetPlatform] = useState(PLATFORMS.filter(p => p !== post.platform)[0])
  const [generating, setGenerating] = useState(false)
  const [result, setResult] = useState(null)
  const [saving, setSaving] = useState(false)

  async function generate() {
    setGenerating(true)
    try {
      const prompt = `Repurpose this social media post from ${post.platform} to ${targetPlatform} for Ha Le Teak Premium (premium teak cutting boards, Vietnam).

Original caption: "${post.caption}"
Original script: "${post.script || ''}"

Adapt the tone, format, and length for ${targetPlatform}. Reply ONLY with JSON:
{"caption":"...","script":"...","hashtags":"tag1,tag2,tag3"}`
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 800, messages: [{ role: 'user', content: prompt }] })
      })
      const data = await res.json()
      const text = data.content?.find(c => c.type === 'text')?.text || ''
      setResult(JSON.parse(text.replace(/```json|```/g, '').trim()))
    } catch (e) { setResult({ caption: 'Lỗi kết nối AI.', script: '', hashtags: '' }) }
    setGenerating(false)
  }

  async function saveRepurposed() {
    if (!result) return
    setSaving(true)
    await supabase.from('posts').insert({
      title: post.title + ` (${targetPlatform})`,
      caption: result.caption, script: result.script,
      hashtags: result.hashtags?.split(',').map(h => h.trim().replace(/^#/, '')).filter(Boolean),
      platform: targetPlatform, post_type: post.post_type,
      image_url: post.image_url, status: 'draft', created_by: user.id
    })
    setSaving(false)
    onSave()
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 520 }}>
        <div className="modal-header">
          <h3>Repurpose bài sang kênh khác</h3>
          <button className="btn-icon btn-ghost" onClick={onClose}><X size={18} /></button>
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <div className="label mb-2">Từ <PlatformBadge platform={post.platform} /> sang</div>
          <div className="flex-center gap-2" style={{ flexWrap: 'wrap' }}>
            {PLATFORMS.filter(p => p !== post.platform).map(p => (
              <button key={p} className={`chip ${targetPlatform === p ? 'active' : ''}`} onClick={() => setTargetPlatform(p)}>{p}</button>
            ))}
          </div>
        </div>
        {!result ? (
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={generate} disabled={generating}>
            {generating ? <><div className="spinner" />AI đang chuyển đổi...</> : `Chuyển sang ${targetPlatform}`}
          </button>
        ) : (
          <>
            <div className="label mb-2">Caption mới</div>
            <div style={{ fontSize: 13, lineHeight: 1.7, background: 'var(--cream)', padding: '.85rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', whiteSpace: 'pre-wrap' }}>{result.caption}</div>
            <div className="flex-center gap-3" style={{ justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setResult(null)}>Thử lại</button>
              <button className="btn btn-primary" onClick={saveRepurposed} disabled={saving}>
                {saving ? 'Đang lưu...' : 'Lưu bài mới'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function ContentStudio() {
  const { toast, showToast } = useToast()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterPlatform, setFilterPlatform] = useState('all')
  const [filterType, setFilterType] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selected, setSelected] = useState(new Set())
  const [editModal, setEditModal] = useState(null)
  const [previewModal, setPreviewModal] = useState(null)
  const [repurposeModal, setRepurposeModal] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [view, setView] = useState('grid')

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('posts').select('*').order('created_at', { ascending: false })
    setPosts(data || [])
    setLoading(false)
  }

  async function deletePost(id) {
    await supabase.from('posts').delete().eq('id', id)
    showToast('Đã xóa bài.')
    setConfirmDelete(null)
    load()
  }

  async function bulkUpdateStatus(status) {
    if (!selected.size) return
    await supabase.from('posts').update({ status }).in('id', [...selected])
    showToast(`Đã cập nhật ${selected.size} bài.`)
    setSelected(new Set())
    load()
  }

  async function duplicatePost(post) {
    const { id, created_at, updated_at, ...rest } = post
    await supabase.from('posts').insert({ ...rest, title: rest.title + ' (copy)', status: 'draft' })
    showToast('Đã nhân đôi bài.')
    load()
  }

  function toggleSelect(id) {
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  const filtered = posts.filter(p => {
    if (search && !p.title?.toLowerCase().includes(search.toLowerCase()) && !p.caption?.toLowerCase().includes(search.toLowerCase())) return false
    if (filterPlatform !== 'all' && p.platform !== filterPlatform) return false
    if (filterType !== 'all' && p.post_type !== filterType) return false
    if (filterStatus !== 'all' && p.status !== filterStatus) return false
    return true
  })

  const counts = {
    all: posts.length,
    ...POST_TYPES.reduce((a, t) => { a[t] = posts.filter(p => p.post_type === t).length; return a }, {})
  }

  return (
    <div>
      <Toast message={toast} />
      {confirmDelete && <ConfirmModal message="Xóa bài này? Không thể hoàn tác." onConfirm={() => deletePost(confirmDelete)} onCancel={() => setConfirmDelete(null)} />}

      <div className="flex-between page-header">
        <div><h1>Content Studio</h1><p>Quản lý và xuất bản nội dung trên các kênh</p></div>
        <div className="flex-center gap-3">
          {selected.size > 0 && (
            <div className="flex-center gap-2">
              <span className="text-muted text-sm">Đã chọn {selected.size}</span>
              <button className="btn btn-sm btn-secondary" onClick={() => bulkUpdateStatus('scheduled')}>Lên lịch</button>
              <button className="btn btn-sm btn-secondary" onClick={() => bulkUpdateStatus('published')}>Đã đăng</button>
              <button className="btn btn-sm btn-danger" onClick={() => bulkUpdateStatus('archived')}>Lưu trữ</button>
              <button className="btn btn-sm btn-ghost" onClick={() => setSelected(new Set())}><X size={13} /></button>
            </div>
          )}
          <button className="btn btn-primary" onClick={() => setEditModal({})}><Plus size={15} />Tạo bài mới</button>
        </div>
      </div>

      <div className="flex-center gap-3 mb-4" style={{ flexWrap: 'wrap' }}>
        <div className="search-bar" style={{ flex: 1, minWidth: 220 }}>
          <Search size={14} style={{ color: 'var(--text-faint)', flexShrink: 0 }} />
          <input placeholder="Tìm bài viết, caption..." value={search} onChange={e => setSearch(e.target.value)} />
          {search && <button onClick={() => setSearch('')}><X size={13} style={{ color: 'var(--text-faint)' }} /></button>}
        </div>
        <select style={{ width: 'auto' }} value={filterPlatform} onChange={e => setFilterPlatform(e.target.value)}>
          <option value="all">Tất cả kênh</option>
          {PLATFORMS.map(p => <option key={p}>{p}</option>)}
        </select>
        <select style={{ width: 'auto' }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="all">Tất cả trạng thái</option>
          {POST_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="tabs">
        <div className={`tab ${filterType === 'all' ? 'active' : ''}`} onClick={() => setFilterType('all')}>
          Tất cả <span className="tab-count">{counts.all}</span>
        </div>
        {POST_TYPES.map(t => (
          <div key={t} className={`tab ${filterType === t ? 'active' : ''}`} onClick={() => setFilterType(t)}>
            {t} {counts[t] > 0 && <span className="tab-count">{counts[t]}</span>}
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex-center gap-3" style={{ padding: '2rem', color: 'var(--text-muted)' }}><div className="spinner" /> Đang tải...</div>
      ) : filtered.length === 0 ? (
        <div className="card empty-state">
          <Plus size={32} style={{ opacity: .3 }} />
          <p>{search || filterPlatform !== 'all' || filterStatus !== 'all' ? 'Không tìm thấy bài nào phù hợp.' : 'Chưa có bài nào. Tạo bài đầu tiên!'}</p>
          {!search && <button className="btn btn-primary" onClick={() => setEditModal({})}>Tạo bài mới</button>}
        </div>
      ) : (
        <div className="grid-4" style={{ gap: '1rem' }}>
          {filtered.map(p => (
            <div key={p.id} className="content-card" style={{ outline: selected.has(p.id) ? '2px solid var(--accent)' : 'none' }}>
              <div style={{ position: 'relative' }} onClick={() => setPreviewModal(p)}>
                <ContentThumb imageUrl={p.image_url} platform={p.platform} postType={p.post_type} />
                <div style={{ position: 'absolute', top: 6, left: 6 }}>
                  <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggleSelect(p.id)} onClick={e => e.stopPropagation()} style={{ width: 16, height: 16, cursor: 'pointer', accentColor: 'var(--accent)' }} />
                </div>
                {p.status === 'published' && <div style={{ position: 'absolute', top: 6, right: 6 }}><StatusBadge status={p.status} /></div>}
                {p.content_score && <div style={{ position: 'absolute', bottom: 6, right: 6 }}><ScoreBadge score={p.content_score} /></div>}
              </div>
              <div className="content-card-body">
                <div className="content-card-title truncate">{p.title}</div>
                {p.caption && <div className="text-sm text-muted truncate mb-2">{p.caption}</div>}
                <div className="content-card-meta">
                  <div className="flex-center gap-2">
                    <PlatformBadge platform={p.platform} />
                    {p.status !== 'published' && <StatusBadge status={p.status} />}
                  </div>
                </div>
                {p.scheduled_at && <div className="text-xs text-faint mt-2">{format(parseISO(p.scheduled_at), 'dd/MM HH:mm')}</div>}
                <div className="flex-center gap-1 mt-3" style={{ borderTop: '1px solid var(--border)', paddingTop: '.5rem' }}>
                  <button className="btn btn-sm btn-ghost" style={{ flex: 1, justifyContent: 'center', fontSize: 11 }} onClick={() => setEditModal(p)}><Edit2 size={12} />Sửa</button>
                  <button className="btn btn-sm btn-ghost" style={{ flex: 1, justifyContent: 'center', fontSize: 11 }} onClick={() => duplicatePost(p)}><Copy size={12} />Copy</button>
                  <button className="btn btn-sm btn-ghost" style={{ flex: 1, justifyContent: 'center', fontSize: 11 }} onClick={() => setRepurposeModal(p)}><RefreshCw size={12} />Reuse</button>
                  <button className="btn btn-sm btn-ghost" style={{ color: 'var(--red-text)', padding: '6px 8px' }} onClick={() => setConfirmDelete(p.id)}><Trash2 size={12} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {editModal !== null && <PostModal post={editModal} onClose={() => setEditModal(null)} onSave={() => { setEditModal(null); showToast('Đã lưu bài!'); load() }} />}
      {previewModal && <PreviewModal post={previewModal} onClose={() => setPreviewModal(null)} onEdit={p => { setPreviewModal(null); setEditModal(p) }} />}
      {repurposeModal && <RepurposeModal post={repurposeModal} onClose={() => setRepurposeModal(null)} onSave={() => { setRepurposeModal(null); showToast('Đã tạo bài repurpose!'); load() }} />}
    </div>
  )
}
