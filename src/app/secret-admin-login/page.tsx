'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function SecretAdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await signIn('credentials', {
        email: email.trim(),
        password,
        isAdmin: 'true',
        redirect: false,
      })

      if (res?.ok) {
        router.push('/M4ster@305/admin')
      } else {
        setError('⛔ Access Denied: Invalid administrator credentials.')
      }
    } catch {
      setError('An authentication error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at top, #111827 0%, #030712 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
      fontFamily: 'Inter, sans-serif',
      color: '#f3f4f6',
    }}>
      <div style={{
        maxWidth: 440,
        width: '100%',
        background: 'rgba(17, 24, 39, 0.85)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: 20,
        padding: '36px 32px',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5), 0 0 40px rgba(108, 71, 255, 0.15)',
      }}>
        {/* Header Icon */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{
            width: 60, height: 60, borderRadius: 16,
            background: 'linear-gradient(135deg, #6c47ff, #3b82f6)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, boxShadow: '0 8px 24px rgba(108, 71, 255, 0.3)',
            marginBottom: 14,
          }}>
            🛡️
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 900, margin: 0, letterSpacing: '-0.5px' }}>
            Master Admin Portal
          </h1>
          <div style={{
            display: 'inline-block',
            marginTop: 8,
            fontSize: 11,
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '1px',
            color: '#ef4444',
            background: 'rgba(239, 68, 68, 0.12)',
            padding: '3px 10px',
            borderRadius: 99,
            border: '1px solid rgba(239, 68, 68, 0.25)',
          }}>
            Restricted System Access
          </div>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            borderRadius: 10,
            padding: '12px 14px',
            fontSize: 13,
            color: '#f87171',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontWeight: 600,
          }}>
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6, color: '#9ca3af' }}>
              Admin Email
            </label>
            <input
              type="email"
              required
              className="input"
              placeholder="admin@virelo.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(31, 41, 55, 0.7)',
                borderColor: 'rgba(75, 85, 99, 0.4)',
                color: '#fff',
                fontSize: 14,
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6, color: '#9ca3af' }}>
              Secret Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                className="input"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(31, 41, 55, 0.7)',
                  borderColor: 'rgba(75, 85, 99, 0.4)',
                  color: '#fff',
                  fontSize: 14,
                  paddingRight: 40,
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 16,
                }}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 10,
              padding: '13px 20px',
              borderRadius: 10,
              border: 'none',
              background: 'linear-gradient(135deg, #6c47ff, #3b82f6)',
              color: '#fff',
              fontSize: 15,
              fontWeight: 800,
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 18px rgba(108, 71, 255, 0.35)',
              transition: 'all 0.2s',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Authenticating...' : '🔐 Sign In to Admin Panel'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 24, fontSize: 11, color: '#6b7280' }}>
          Virelo Rewards Infrastructure • Secure Protocol
        </div>
      </div>
    </div>
  )
}
