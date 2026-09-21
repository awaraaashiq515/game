'use client'
import { useState } from 'react'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitted(true)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ position: 'fixed', inset: 0, background: 'radial-gradient(ellipse at 50% 0%, rgba(108,71,255,0.12) 0%, transparent 60%)', pointerEvents: 'none' }} />
      <div style={{ width: '100%', maxWidth: 440, position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{ width: 44, height: 44, background: 'var(--primary-gradient)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>▶</div>
            <span style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)' }}>Virelo<span style={{ color: 'var(--primary)' }}>.</span></span>
          </Link>
        </div>

        <div className="card-glass" style={{ padding: 36 }}>
          {submitted ? (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>📧</div>
              <h2 style={{ fontSize: 22, marginBottom: 12 }}>Check your email</h2>
              <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24, lineHeight: 1.6 }}>
                If an account with <strong style={{ color: 'var(--text-primary)' }}>{email}</strong> exists, you will receive password reset instructions shortly.
              </p>
              <Link href="/login" className="btn btn-primary btn-full">Back to Login</Link>
            </div>
          ) : (
            <>
              <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Forgot password?</h1>
              <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 28 }}>Enter your email and we&apos;ll send reset instructions.</p>
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div className="input-group">
                  <label className="input-label">Email Address</label>
                  <input type="email" className="input" id="forgot-email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <button type="submit" className="btn btn-primary btn-full" id="forgot-submit">Send Reset Link</button>
              </form>
              <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: 'var(--text-muted)' }}>
                Remember your password?{' '}
                <Link href="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>Login</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
