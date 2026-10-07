'use client'
import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'

function SignupForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [form, setForm] = useState({
    name: '',
    email: '',
    mobile: '',
    password: '',
    confirmPassword: '',
    referralCode: searchParams.get('ref') ?? '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  function handleChange(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (form.password.length < 4) {
      setError('Password must be at least 4 digits or characters.')
      return
    }

    if (form.password !== form.confirmPassword) {
      setError('Password and Confirm Password do not match.')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (data.success) {
        setSuccess(true)
        setTimeout(() => router.push('/login'), 2500)
      } else {
        setError(data.error ?? 'Signup failed. Please try again.')
      }
    } catch {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 0' }}>
        <div style={{ fontSize: 64, marginBottom: 20 }}>🎉</div>
        <h2 style={{ fontSize: 24, marginBottom: 12 }}>Account Created!</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
          Welcome to Virelo Rewards. Redirecting you to login...
        </p>
        <div className="animate-spin" style={{ width: 32, height: 32, border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', margin: '0 auto' }} />
      </div>
    )
  }

  const isPasswordShort = form.password.length > 0 && form.password.length < 4
  const passwordsMatch = form.confirmPassword.length > 0 && form.password === form.confirmPassword
  const passwordsMismatch = form.confirmPassword.length > 0 && form.password !== form.confirmPassword

  return (
    <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {error && (
        <div style={{ background: 'var(--error-bg)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '12px 16px', fontSize: 14, color: 'var(--error)' }}>
          {error}
        </div>
      )}

      <div className="input-group">
        <label className="input-label" htmlFor="signup-name">Full Name</label>
        <input
          type="text"
          className="input"
          id="signup-name"
          placeholder="Your full name"
          value={form.name}
          onChange={(e) => handleChange('name', e.target.value)}
          required
          autoComplete="name"
        />
      </div>

      <div className="form-row-responsive">
        <div className="input-group">
          <label className="input-label" htmlFor="signup-email">Email Address</label>
          <input
            type="email"
            className="input"
            id="signup-email"
            placeholder="you@example.com"
            value={form.email}
            onChange={(e) => handleChange('email', e.target.value)}
            required
            autoComplete="email"
          />
        </div>
        <div className="input-group">
          <label className="input-label" htmlFor="signup-mobile">Mobile Number</label>
          <input
            type="tel"
            className="input"
            id="signup-mobile"
            placeholder="10-digit number"
            value={form.mobile}
            onChange={(e) => handleChange('mobile', e.target.value.replace(/\D/g, '').slice(0, 10))}
            required
            autoComplete="tel"
            maxLength={10}
            inputMode="numeric"
          />
        </div>
      </div>

      <div className="form-row-responsive">
        <div className="input-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label className="input-label" htmlFor="signup-password">Password</label>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Min. 4 digits / chars</span>
          </div>
          <div style={{ position: 'relative' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              className="input"
              id="signup-password"
              placeholder="e.g. 1234 or any password"
              value={form.password}
              onChange={(e) => handleChange('password', e.target.value)}
              required
              autoComplete="new-password"
              style={{ paddingRight: 48 }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              style={{
                position: 'absolute',
                right: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontSize: 16,
                padding: '6px 8px',
                lineHeight: 1,
              }}
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>
          {isPasswordShort && (
            <span style={{ fontSize: 12, color: 'var(--warning)' }}>
              ⚠️ At least 4 digits or characters needed ({form.password.length}/4)
            </span>
          )}
        </div>

        <div className="input-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label className="input-label" htmlFor="signup-confirm-password">Confirm Password</label>
            {passwordsMatch && (
              <span style={{ fontSize: 11, color: 'var(--success)', fontWeight: 600 }}>✓ Match</span>
            )}
          </div>
          <div style={{ position: 'relative' }}>
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              className="input"
              id="signup-confirm-password"
              placeholder="Re-enter password"
              value={form.confirmPassword}
              onChange={(e) => handleChange('confirmPassword', e.target.value)}
              required
              autoComplete="new-password"
              style={{ paddingRight: 48 }}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
              style={{
                position: 'absolute',
                right: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontSize: 16,
                padding: '6px 8px',
                lineHeight: 1,
              }}
            >
              {showConfirmPassword ? '🙈' : '👁️'}
            </button>
          </div>
          {passwordsMismatch && (
            <span style={{ fontSize: 12, color: 'var(--error)' }}>
              ✕ Passwords do not match
            </span>
          )}
        </div>
      </div>

      <div className="input-group">
        <label className="input-label" htmlFor="signup-referral">
          Referral Code <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(Optional)</span>
        </label>
        <input
          type="text"
          className="input"
          id="signup-referral"
          placeholder="Enter referral code"
          value={form.referralCode}
          onChange={(e) => handleChange('referralCode', e.target.value.toUpperCase())}
          maxLength={8}
        />
        {form.referralCode && (
          <span style={{ fontSize: 12, color: 'var(--success)' }}>✓ Referral code applied</span>
        )}
      </div>

      <button
        type="submit"
        className="btn btn-primary btn-full"
        id="signup-submit"
        disabled={loading}
        style={{ marginTop: 6, minHeight: 48 }}
      >
        {loading ? (
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              className="animate-spin"
              style={{
                display: 'inline-block',
                width: 16,
                height: 16,
                border: '2px solid rgba(255,255,255,0.3)',
                borderTopColor: 'white',
                borderRadius: '50%',
              }}
            />
            Creating account...
          </span>
        ) : (
          'Create Account'
        )}
      </button>

      <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.6 }}>
        By creating an account, you agree to our{' '}
        <Link href="/terms" style={{ color: 'var(--primary)' }}>
          Terms of Service
        </Link>{' '}
        and{' '}
        <Link href="/privacy" style={{ color: 'var(--primary)' }}>
          Privacy Policy
        </Link>.
      </p>
    </form>
  )
}

export default function SignupPage() {
  return (
    <div className="auth-page-container">
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'radial-gradient(ellipse at 50% 0%, rgba(108,71,255,0.12) 0%, transparent 60%)',
          pointerEvents: 'none',
        }}
      />
      <div style={{ width: '100%', maxWidth: 520, position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div
              style={{
                width: 44,
                height: 44,
                background: 'var(--primary-gradient)',
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 22,
                boxShadow: '0 8px 24px var(--primary-glow)',
              }}
            >
              ▶
            </div>
            <span style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)' }}>
              Virelo<span style={{ color: 'var(--primary)' }}>.</span>
            </span>
          </Link>
        </div>

        <div className="auth-card-box">
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6 }}>Create your account</h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24 }}>
            Start earning rewards from sponsored videos
          </p>

          <Suspense fallback={<div>Loading...</div>}>
            <SignupForm />
          </Suspense>

          <p style={{ textAlign: 'center', marginTop: 22, fontSize: 14, color: 'var(--text-muted)' }}>
            Already have an account?{' '}
            <Link href="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
