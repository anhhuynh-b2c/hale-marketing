import { X, Upload, Image } from 'lucide-react'
import { useState, useRef } from 'react'
import { supabase, PLATFORM_COLORS, STATUS_LABELS } from '../lib/supabase'

export function PlatformBadge({ platform, size = 'sm' }) {
  const map = { TikTok: 'badge-tt', Facebook: 'badge-fb', Instagram: 'badge-ig', Shopee: 'badge-sh', YouTube: 'badge-yt' }
  return <span className={`badge ${map[platform] || 'badge-draft'}`}>{platform}</span>
}

export function StatusBadge({ status }) {
  const map = {
    draft:'badge-draft', pending:'badge-pending', scheduled:'badge-scheduled',
    published:'badge-published', archived:'badge-archived',
    prospect:'badge-prospect', contacted:'badge-contacted', seeding:'badge-seeding', done:'badge-done',
    new:'badge-new', qualified:'badge-qualified', proposal:'badge-proposal', won:'badge-won', lost:'badge-lost',
    active:'badge-active',
  }
  return <span className={`badge ${map[status] || 'badge-draft'}`}>{STATUS_LABELS[status] || status}</span>
}

export function ScoreBadge({ score }) {
  if (!score) return null
  const cls = score >= 8 ? 'score-high' : score >= 6 ? 'score-mid' : 'score-low'
  return <span className={`score-badge ${cls}`}>★ {score}/10</span>
}

export function TagInput({ tags = [], onChange, placeholder = 'Nhập #hashtag...' }) {
  const [input, setInput] = useState('')
  const ref = useRef()
  function addTag(e) {
    if ((e.key === 'Enter' || e.key === ',') && input.trim()) {
      e.preventDefault()
      const tag = input.trim().replace(/^#/, '')
      if (tag && !tags.includes(tag)) onChange([...tags, tag])
      setInput('')
    }
    if (e.key === 'Backspace' && !input && tags.length) onChange(tags.slice(0, -1))
  }
  return (
    <div className="tag-input-wrap" onClick={() => ref.current?.focus()}>
      {tags.map(t => (
        <span key={t} className="tag-chip">#{t} <X size={10} style={{cursor:'pointer'}} onClick={() => onChange(tags.filter(x=>x!==t))} /></span>
      ))}
      <input ref={ref} className="tag-input" value={input} onChange={e=>setInput(e.target.value)} onKeyDown={addTag} placeholder={tags.length ? '' : placeholder} />
    </div>
  )
}

export function ImageUpload({ value, onChange, folder = 'posts' }) {
  const [uploading, setUploading] = useState(false)
  const [drag, setDrag] = useState(false)
  const ref = useRef()

  async function upload(file) {
    if (!file || !file.type.startsWith('image/')) return
    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `${folder}/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('content-images').upload(path, file)
    if (!error) {
      const { data } = supabase.storage.from('content-images').getPublicUrl(path)
      onChange(data.publicUrl)
    }
    setUploading(false)
  }

  return (
    <div>
      {value ? (
        <div style={{ position: 'relative', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border)' }}>
          <img src={value} style={{ width: '100%', height: 160, objectFit: 'cover', display: 'block' }} />
          <button onClick={() => onChange('')} style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(0,0,0,.6)', color: '#fff', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={12} /></button>
        </div>
      ) : (
        <div
          className={`upload-zone ${drag ? 'drag' : ''}`}
          onClick={() => ref.current?.click()}
          onDragOver={e => { e.preventDefault(); setDrag(true) }}
          onDragLeave={() => setDrag(false)}
          onDrop={e => { e.preventDefault(); setDrag(false); upload(e.dataTransfer.files[0]) }}
        >
          {uploading ? (
            <div className="flex-center gap-2" style={{ justifyContent: 'center', color: 'var(--text-muted)' }}><div className="spinner" /> Đang upload...</div>
          ) : (
            <>
              <Upload size={20} style={{ color: 'var(--text-faint)', margin: '0 auto .4rem' }} />
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Kéo thả hoặc <span style={{ color: 'var(--accent)', fontWeight: 500 }}>chọn ảnh</span></div>
              <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 3 }}>PNG, JPG, WEBP — tối đa 5MB</div>
            </>
          )}
          <input ref={ref} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => upload(e.target.files[0])} />
        </div>
      )}
    </div>
  )
}

export function ContentThumb({ imageUrl, platform, postType }) {
  const colors = PLATFORM_COLORS[platform] || { bg: '#F7F0E8', text: '#8B5E35' }
  if (imageUrl) return (
    <div className="content-thumb">
      <img src={imageUrl} alt="" loading="lazy" />
    </div>
  )
  return (
    <div className="content-thumb" style={{ background: colors.bg }}>
      <div className="content-thumb-placeholder" style={{ color: colors.text }}>
        <Image size={20} />
        <span>{platform}</span>
        <span style={{ fontSize: 10, opacity: .7 }}>{postType}</span>
      </div>
    </div>
  )
}

export function Toast({ message }) {
  if (!message) return null
  return <div className="toast">{message}</div>
}

export function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" style={{ maxWidth: 380 }} onClick={e => e.stopPropagation()}>
        <h3 style={{ marginBottom: '.75rem' }}>Xác nhận</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>{message}</p>
        <div className="flex-center gap-3" style={{ justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={onCancel}>Hủy</button>
          <button className="btn btn-danger" onClick={onConfirm}>Xác nhận</button>
        </div>
      </div>
    </div>
  )
}
