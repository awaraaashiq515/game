'use client'
import { useState, useEffect, Suspense } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialRef = searchParams.get('ref') ?? ''

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [referralCode, setReferralCode] = useState(initialRef.toUpperCase())
  const [referralFeedback, setReferralFeedback] = useState<{
    status: 'idle' | 'valid' | 'invalid'
    message?: string
  }>({ status: 'idle' })
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // Validate referral code when typed
  useEffect(() => {
    const code = referralCode.trim().toUpperCase()
    if (!code || code.length < 4) {
      setReferralFeedback({ status: 'idle' })
      return
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/referral/apply?code=${encodeURIComponent(code)}`)
        const data = await res.json()
        if (data.success) {
          setReferralFeedback({
            status: 'valid',
            message: `Invited by ${data.data.referrerName}`,
          })
        } else {
          setReferralFeedback({
            status: 'invalid',
            message: 'Referral code not found',
          })
        }
      } catch {
        setReferralFeedback({ status: 'idle' })
      }
    }, 400)

    return () => clearTimeout(timer)
  }, [referralCode])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await signIn('credentials', {
        email,
        password,
        isAdmin: isAdmin ? 'true' : 'false',
        redirect: false,
      })
      if (res?.ok) {
        // If regular user provided a referral code, apply it to their account
        if (!isAdmin && referralCode.trim()) {
          try {
            await fetch('/api/referral/apply', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ referralCode: referralCode.trim().toUpperCase() }),
            })
          } catch {
            // Non-critical, continue login
          }
        }
        router.push(isAdmin ? '/admin' : '/dashboard')
      } else {
        setError('Invalid email or password. Please try again.')
      }
    } catch {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card-glass" style={{ padding: 36 }}>
      <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 6 }}>Welcome back</h1>
      <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 28 }}>
        Sign in to your Virelo Rewards account
      </p>

      {/* Admin toggle */}
      <div
        style={{
          display: 'flex',
          background: 'var(--bg-surface)',
          borderRadius: 10,
          padding: 4,
          marginBottom: 24,
        }}
      >
        <button
          type="button"
          onClick={() => setIsAdmin(false)}
          style={{
            flex: 1,
            padding: '8px 0',
            borderRadius: 8,
            border: 'none',
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 600,
            transition: 'all 0.2s',
            background: !isAdmin ? 'var(--primary-gradient)' : 'transparent',
            color: !isAdmin ? 'white' : 'var(--text-muted)',
          }}
        >
          User
        </button>
        <button
          type="button"
          onClick={() => setIsAdmin(true)}
          style={{
            flex: 1,
            padding: '8px 0',
            borderRadius: 8,
            border: 'none',
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 600,
            transition: 'all 0.2s',
            background: isAdmin ? 'var(--primary-gradient)' : 'transparent',
            color: isAdmin ? 'white' : 'var(--text-muted)',
          }}
        >
          Admin
        </button>
      </div>

      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {error && (
          <div
            style={{
              background: 'var(--error-bg)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 10,
              padding: '12px 16px',
              fontSize: 14,
              color: 'var(--error)',
            }}
          >
            {error}
          </div>
        )}

        <div className="input-group">
          <label className="input-label" htmlFor="login-email">Email Address</label>
          <input
            type="email"
            className="input"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            id="login-email"
            autoComplete="email"
          />
        </div>

        <div className="input-group">
          <label className="input-label" htmlFor="login-password">Password</label>
          <div style={{ position: 'relative' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              className="input"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              id="login-password"
              autoComplete="current-password"
              style={{ paddingRight: 48 }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                fontSize: 16,
              }}
            >
              {showPassword ? '🙈' : '👁'}
            </button>
          </div>
        </div>

        {/* Referral Code Field (User only) */}
        {!isAdmin && (
          <div className="input-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="input-label" htmlFor="login-referral" style={{ margin: 0 }}>
                Referral Code <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(Optional)</span>
              </label>
              {referralFeedback.status === 'valid' && (
                <span style={{ fontSize: 12, color: '#10b981', fontWeight: 600 }}>
                  ✓ {referralFeedback.message}
                </span>
              )}
              {referralFeedback.status === 'invalid' && (
                <span style={{ fontSize: 12, color: '#ef4444' }}>
                  {referralFeedback.message}
                </span>
              )}
            </div>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="input"
                placeholder="Enter referral code (e.g. VIR12345)"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                maxLength={12}
                id="login-referral"
                autoComplete="off"
                style={{
                  textTransform: 'uppercase',
                  letterSpacing: referralCode ? '1px' : 'normal',
                  fontWeight: referralCode ? 600 : 400,
                }}
              />
              {referralCode && referralFeedback.status === 'idle' && (
                <span
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: 12,
                    color: 'var(--primary)',
                    fontWeight: 500,
                  }}
                >
                  🎁 Referral
                </span>
              )}
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
              Enter your inviter&apos;s code to link rewards on login or registration.
            </p>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Link href="/forgot-password" style={{ fontSize: 13, color: 'var(--primary)' }}>
            Forgot Password?
          </Link>
        </div>

        <button
          type="submit"
          className="btn btn-primary btn-full"
          disabled={loading}
          id="login-submit"
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
              Signing in...
            </span>
          ) : (
            'Login'
          )}
        </button>
      </form>

      <p style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: 'var(--text-muted)' }}>
        New to Virelo?{' '}
        <Link
          href={referralCode.trim() ? `/signup?ref=${encodeURIComponent(referralCode.trim())}` : '/signup'}
          style={{ color: 'var(--primary)', fontWeight: 600 }}
        >
          Create Account {referralCode.trim() ? `with code` : ''}
        </Link>
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg-base)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        position: 'relative',
      }}
    >
      {/* Background gradient */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'radial-gradient(ellipse at 50% 0%, rgba(108,71,255,0.12) 0%, transparent 60%)',
          pointerEvents: 'none',
        }}
      />

      <div style={{ width: '100%', maxWidth: 440, position: 'relative', zIndex: 1 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <Link
            href="/"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                background: 'var(--primary-gradient)',
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 24,
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

        <Suspense
          fallback={
            <div className="card-glass" style={{ padding: 36, textAlign: 'center' }}>
              <div
                className="animate-spin"
                style={{
                  width: 32,
                  height: 32,
                  border: '3px solid var(--border)',
                  borderTopColor: 'var(--primary)',
                  borderRadius: '50%',
                  margin: '0 auto',
                }}
              />
            </div>
          }
        >
          <LoginForm />
        </Suspense>
      </div>
    </div>
  )
}
