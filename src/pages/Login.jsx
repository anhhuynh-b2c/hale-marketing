import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.jsx'
import { Eye, EyeOff } from 'lucide-react'

export default function Login() {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError(''); setLoading(true)
    if (mode === 'login') {
      const { error } = await signIn(email, password)
      if (error) setError(error.message === 'Invalid login credentials' ? 'Email hoặc mật khẩu không đúng.' : error.message)
      else navigate('/')
    } else {
      if (!name.trim()) { setError('Vui lòng nhập tên.'); setLoading(false); return }
      const { error } = await signUp(email, password, name)
      if (error) setError(error.message)
      else navigate('/')
    }
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'linear-gradient(135deg, #1C1209 0%, #2E1E0F 50%, #4A3018 100%)' }}>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', width: 500, height: 500, borderRadius: '50%', background: 'rgba(160,98,42,.05)', top: -150, right: -150, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', width: 350, height: 350, borderRadius: '50%', background: 'rgba(160,98,42,.04)', bottom: -80, left: -100, pointerEvents: 'none' }} />

        <div style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 1 }}>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 64, height: 64, background: 'rgba(160,98,42,.15)', borderRadius: 18, border: '1px solid rgba(160,98,42,.3)', marginBottom: '1.1rem' }}>
              <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
                <rect x="3" y="7" width="24" height="16" rx="2.5" stroke="#C4895A" strokeWidth="1.5"/>
                <path d="M3 11h24" stroke="#C4895A" strokeWidth="1.5"/>
                <path d="M9 7v4M15 7v4M21 7v4" stroke="#C4895A" strokeWidth="1.5" strokeLinecap="round"/>
                <circle cx="9" cy="18" r="1.5" fill="#C4895A" opacity=".6"/>
                <circle cx="15" cy="18" r="1.5" fill="#C4895A" opacity=".6"/>
                <circle cx="21" cy="18" r="1.5" fill="#C4895A" opacity=".6"/>
              </svg>
            </div>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 30, color: '#EDD9C4', letterSpacing: '.01em', lineHeight: 1.1 }}>Ha Le Teak</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,.3)', letterSpacing: '.14em', textTransform: 'uppercase', marginTop: 6 }}>Marketing OS</div>
          </div>

          <div style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 22, padding: '2rem 2.25rem', backdropFilter: 'blur(12px)' }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: '#EDD9C4', marginBottom: '.3rem' }}>
              {mode === 'login' ? 'Chào mừng trở lại' : 'Tạo tài khoản'}
            </h2>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,.4)', marginBottom: '1.75rem' }}>
              {mode === 'login' ? 'Đăng nhập để quản lý marketing Ha Le' : 'Tham gia team Ha Le Teak Premium'}
            </p>

            <form onSubmit={handleSubmit}>
              {mode === 'signup' && (
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,.45)', marginBottom: '.4rem' }}>Tên đầy đủ</label>
                  <input type="text" placeholder="Nguyễn Văn A" value={name} onChange={e => setName(e.target.value)} required
                    style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', color: '#EDD9C4', borderRadius: 10 }} />
                </div>
              )}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,.45)', marginBottom: '.4rem' }}>Email</label>
                <input type="email" placeholder="email@hale.com" value={email} onChange={e => setEmail(e.target.value)} required
                  style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', color: '#EDD9C4', borderRadius: 10 }} />
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,.45)', marginBottom: '.4rem' }}>Mật khẩu</label>
                <div style={{ position: 'relative' }}>
                  <input type={showPass ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required minLength={6}
                    style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', color: '#EDD9C4', borderRadius: 10, paddingRight: 40 }} />
                  <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,.3)', cursor: 'pointer', border: 'none', background: 'none', padding: 0 }}>
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {error && (
                <div style={{ background: 'rgba(122,26,26,.3)', border: '1px solid rgba(200,80,80,.3)', borderRadius: 8, padding: '.6rem .85rem', marginBottom: '1rem', fontSize: 13, color: '#F4A0A0' }}>
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading} style={{ width: '100%', padding: '12px', borderRadius: 11, background: loading ? 'rgba(160,98,42,.5)' : 'linear-gradient(135deg, #A0622A 0%, #7A4A1E 100%)', color: '#fff', fontWeight: 600, fontSize: 14, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all .15s', boxShadow: loading ? 'none' : '0 4px 12px rgba(160,98,42,.3)' }}>
                {loading ? <><div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />Đang xử lý...</> : mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}
              </button>
            </form>
          </div>

          <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: 13, color: 'rgba(255,255,255,.3)' }}>
            {mode === 'login' ? 'Chưa có tài khoản? ' : 'Đã có tài khoản? '}
            <button onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError('') }}
              style={{ color: '#C4895A', fontWeight: 600, cursor: 'pointer', fontSize: 13, background: 'none', border: 'none' }}>
              {mode === 'login' ? 'Đăng ký ngay' : 'Đăng nhập'}
            </button>
          </div>
          <div style={{ textAlign: 'center', marginTop: '2rem', fontSize: 11, color: 'rgba(255,255,255,.12)' }}>Ha Le Teak Premium © 2026</div>
        </div>
      </div>
      <style>{`input::placeholder{color:rgba(212,186,152,.25)!important}input:focus{border-color:rgba(160,98,42,.6)!important;box-shadow:0 0 0 3px rgba(160,98,42,.1)!important}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
