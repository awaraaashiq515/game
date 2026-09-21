'use client'
import { useState } from 'react'
import Link from 'next/link'

const CATEGORIES = [
  'Fashion & Apparel',
  'Technology & Gadgets',
  'Food & Beverages',
  'Health & Fitness',
  'Finance & Banking',
  'Education & E-Learning',
  'Real Estate',
  'Travel & Hospitality',
  'Beauty & Cosmetics',
  'Gaming & Entertainment',
  'E-Commerce & Retail',
  'Automobiles',
  'Other',
]

const BUDGET_OPTIONS = [
  '₹5,000 – ₹10,000',
  '₹10,000 – ₹25,000',
  '₹25,000 – ₹50,000',
  '₹50,000 – ₹1,00,000',
  '₹1,00,000+',
]

const BENEFITS = [
  { icon: '👁️', title: 'Massive Reach', desc: 'Thousands of active users watch sponsored videos every day' },
  { icon: '✅', title: 'Verified Views', desc: 'Every view is server-validated — no bots, no fake impressions' },
  { icon: '🎯', title: 'Engaged Audience', desc: 'Users are incentivized to watch your full ad — guaranteed attention' },
  { icon: '📊', title: 'Real Analytics', desc: 'Track completions, budget spent, and ROI in real-time' },
  { icon: '⚡', title: 'Fast Go-Live', desc: 'Your campaign can be live within 24–48 hours of approval' },
  { icon: '💰', title: 'Flexible Budgets', desc: 'Start small or go big — packages for every business size' },
]

type FormState = {
  brandName: string
  contactName: string
  email: string
  phone: string
  website: string
  category: string
  budget: string
  message: string
}

export default function AdvertisePage() {
  const [form, setForm] = useState<FormState>({
    brandName: '',
    contactName: '',
    email: '',
    phone: '',
    website: '',
    category: '',
    budget: '',
    message: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  function set(key: keyof FormState) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [key]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const res = await fetch('/api/brand-applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!data.success) {
        setError(data.error || 'Kuch gadbad ho gayi. Dobara try karo.')
      } else {
        setSubmitted(true)
      }
    } catch {
      setError('Network error. Please check your connection.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100vh' }}>
      {/* ─── Navbar ──────────────────────────────────────────────────────── */}
      <nav
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          background: 'rgba(7, 13, 26, 0.90)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{ width: 36, height: 36, background: 'var(--primary-gradient)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>▶</div>
            <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>
              Virelo<span style={{ color: 'var(--primary)' }}>.</span>
            </span>
          </Link>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <Link href="/" className="btn btn-ghost btn-sm">← Back to Home</Link>
            <Link href="/login" className="btn btn-primary btn-sm">Login</Link>
          </div>
        </div>
      </nav>

      {/* ─── Hero ────────────────────────────────────────────────────────── */}
      <section
        style={{
          padding: '90px 0 70px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
          background: 'radial-gradient(ellipse at top, rgba(108,71,255,0.12) 0%, transparent 60%)',
        }}
      >
        {/* Decorative orbs */}
        <div style={{ position: 'absolute', top: -60, left: '15%', width: 400, height: 400, background: 'radial-gradient(circle, rgba(108,71,255,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: 20, right: '10%', width: 300, height: 300, background: 'radial-gradient(circle, rgba(245,158,11,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div className="container animate-fade-in">
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(245,158,11,0.12)',
              border: '1px solid rgba(245,158,11,0.3)',
              borderRadius: 50,
              padding: '6px 18px',
              marginBottom: 28,
              fontSize: 13,
              color: '#f59e0b',
              fontWeight: 600,
            }}
          >
            📢 Partner With Virelo
          </div>

          <h1
            style={{
              fontSize: 'clamp(36px, 5.5vw, 64px)',
              fontWeight: 900,
              lineHeight: 1.1,
              marginBottom: 20,
              maxWidth: 800,
              margin: '0 auto 20px',
            }}
          >
            Reach{' '}
            <span style={{ background: 'var(--primary-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Thousands
            </span>{' '}
            of Verified Viewers
          </h1>

          <p style={{ fontSize: 18, color: 'var(--text-secondary)', maxWidth: 560, margin: '0 auto', lineHeight: 1.7 }}>
            Advertise your brand on India&apos;s trusted video reward platform. Every view is real, every impression is earned.
          </p>
        </div>
      </section>

      {/* ─── Benefits ────────────────────────────────────────────────────── */}
      <section style={{ padding: '60px 0', borderTop: '1px solid var(--border)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ fontSize: 30, fontWeight: 800, marginBottom: 10 }}>Why Advertise on Virelo?</h2>
            <p style={{ color: 'var(--text-secondary)' }}>High-quality, engaged audience — guaranteed.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
            {BENEFITS.map((b) => (
              <div
                key={b.title}
                className="card"
                style={{
                  padding: '24px 20px',
                  transition: 'transform 0.2s, border-color 0.2s',
                  cursor: 'default',
                }}
                onMouseEnter={e => {
                  ;(e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)'
                  ;(e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(108,71,255,0.4)'
                }}
                onMouseLeave={e => {
                  ;(e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'
                  ;(e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)'
                }}
              >
                <div style={{ fontSize: 32, marginBottom: 12 }}>{b.icon}</div>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>{b.title}</h3>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Application Form ────────────────────────────────────────────── */}
      <section id="apply-form" style={{ padding: '70px 0', background: 'rgba(108,71,255,0.03)', borderTop: '1px solid var(--border)' }}>
        <div className="container">
          <div style={{ maxWidth: 720, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  background: 'rgba(108,71,255,0.12)',
                  border: '1px solid rgba(108,71,255,0.25)',
                  borderRadius: 50,
                  padding: '6px 18px',
                  marginBottom: 20,
                  fontSize: 13,
                  color: 'var(--primary)',
                  fontWeight: 600,
                }}
              >
                ✦ Apply Now
              </div>
              <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 10 }}>Submit Your Brand Application</h2>
              <p style={{ color: 'var(--text-secondary)' }}>
                Fill in the form below. Our team will review and contact you within 48 hours.
              </p>
            </div>

            {submitted ? (
              /* ── Success State ── */
              <div
                className="card animate-fade-in"
                style={{
                  textAlign: 'center',
                  padding: '64px 40px',
                  background: 'linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(16,185,129,0.03) 100%)',
                  borderColor: 'rgba(16,185,129,0.25)',
                }}
              >
                <div style={{ fontSize: 64, marginBottom: 20 }}>🎉</div>
                <h3 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12, color: 'var(--success)' }}>
                  Application Submitted!
                </h3>
                <p style={{ color: 'var(--text-secondary)', maxWidth: 440, margin: '0 auto 28px', lineHeight: 1.7 }}>
                  Thank you for your interest in advertising on Virelo. Our team will review your application and reach out at{' '}
                  <strong style={{ color: 'var(--text-primary)' }}>{form.email}</strong> within 48 hours.
                </p>
                <Link href="/" className="btn btn-primary">
                  Back to Home
                </Link>
              </div>
            ) : (
              /* ── Form ── */
              <form
                onSubmit={handleSubmit}
                className="card"
                style={{ borderColor: 'rgba(108,71,255,0.2)', padding: 36 }}
              >
                {error && (
                  <div
                    style={{
                      background: 'rgba(239,68,68,0.08)',
                      border: '1px solid rgba(239,68,68,0.25)',
                      borderRadius: 10,
                      padding: '12px 16px',
                      marginBottom: 20,
                      fontSize: 14,
                      color: 'var(--error)',
                    }}
                  >
                    ⚠️ {error}
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }} className="adv-form-grid">
                  {/* Brand Name */}
                  <div className="input-group">
                    <label className="input-label" htmlFor="adv-brand-name">
                      Brand Name <span style={{ color: 'var(--error)' }}>*</span>
                    </label>
                    <input
                      id="adv-brand-name"
                      type="text"
                      className="input"
                      placeholder="e.g. Nike India"
                      value={form.brandName}
                      onChange={set('brandName')}
                      required
                    />
                  </div>

                  {/* Contact Person */}
                  <div className="input-group">
                    <label className="input-label" htmlFor="adv-contact-name">
                      Contact Person <span style={{ color: 'var(--error)' }}>*</span>
                    </label>
                    <input
                      id="adv-contact-name"
                      type="text"
                      className="input"
                      placeholder="Your full name"
                      value={form.contactName}
                      onChange={set('contactName')}
                      required
                    />
                  </div>

                  {/* Email */}
                  <div className="input-group">
                    <label className="input-label" htmlFor="adv-email">
                      Business Email <span style={{ color: 'var(--error)' }}>*</span>
                    </label>
                    <input
                      id="adv-email"
                      type="email"
                      className="input"
                      placeholder="contact@yourbrand.com"
                      value={form.email}
                      onChange={set('email')}
                      required
                    />
                  </div>

                  {/* Phone */}
                  <div className="input-group">
                    <label className="input-label" htmlFor="adv-phone">Phone (Optional)</label>
                    <input
                      id="adv-phone"
                      type="tel"
                      className="input"
                      placeholder="+91 98765 43210"
                      value={form.phone}
                      onChange={set('phone')}
                    />
                  </div>

                  {/* Website */}
                  <div className="input-group">
                    <label className="input-label" htmlFor="adv-website">Website (Optional)</label>
                    <input
                      id="adv-website"
                      type="url"
                      className="input"
                      placeholder="https://yourbrand.com"
                      value={form.website}
                      onChange={set('website')}
                    />
                  </div>

                  {/* Category */}
                  <div className="input-group">
                    <label className="input-label" htmlFor="adv-category">
                      Business Category <span style={{ color: 'var(--error)' }}>*</span>
                    </label>
                    <select
                      id="adv-category"
                      className="input"
                      value={form.category}
                      onChange={set('category')}
                      required
                    >
                      <option value="">Select a category…</option>
                      {CATEGORIES.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  {/* Budget */}
                  <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="input-label" htmlFor="adv-budget">
                      Monthly Ad Budget <span style={{ color: 'var(--error)' }}>*</span>
                    </label>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      {BUDGET_OPTIONS.map(b => (
                        <button
                          key={b}
                          type="button"
                          id={`adv-budget-${b}`}
                          onClick={() => setForm(f => ({ ...f, budget: b }))}
                          style={{
                            padding: '8px 16px',
                            borderRadius: 8,
                            border: `1.5px solid ${form.budget === b ? 'var(--primary)' : 'var(--border)'}`,
                            background: form.budget === b ? 'rgba(108,71,255,0.15)' : 'var(--bg-surface)',
                            color: form.budget === b ? 'var(--primary)' : 'var(--text-secondary)',
                            fontSize: 13,
                            fontWeight: form.budget === b ? 700 : 400,
                            cursor: 'pointer',
                            transition: 'all 0.15s',
                          }}
                        >
                          {b}
                        </button>
                      ))}
                    </div>
                    {/* Hidden input for required validation */}
                    <input type="text" style={{ display: 'none' }} value={form.budget} required readOnly />
                  </div>

                  {/* Message */}
                  <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="input-label" htmlFor="adv-message">
                      Campaign Description <span style={{ color: 'var(--error)' }}>*</span>
                    </label>
                    <textarea
                      id="adv-message"
                      className="input"
                      rows={4}
                      placeholder="Tell us about your brand, target audience, campaign goals, and what type of video ad you want to run..."
                      value={form.message}
                      onChange={set('message')}
                      required
                      style={{ resize: 'vertical', minHeight: 100 }}
                    />
                  </div>
                </div>

                <div style={{ marginTop: 28, display: 'flex', justifyContent: 'center' }}>
                  <button
                    type="submit"
                    className="btn btn-primary btn-lg animate-pulse-glow"
                    id="adv-submit-btn"
                    disabled={submitting || !form.budget}
                    style={{ minWidth: 220 }}
                  >
                    {submitting ? '⏳ Submitting…' : '🚀 Submit Application'}
                  </button>
                </div>

                <p style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: 'var(--text-muted)' }}>
                  By submitting, you agree to our{' '}
                  <Link href="/terms" style={{ color: 'var(--primary)' }}>Terms of Service</Link>.
                  We will never share your information.
                </p>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* ─── Process Steps ───────────────────────────────────────────────── */}
      <section style={{ padding: '70px 0', borderTop: '1px solid var(--border)' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 40 }}>How It Works — For Brands</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24, maxWidth: 900, margin: '0 auto' }}>
            {[
              { step: '01', icon: '📝', title: 'Apply', desc: 'Fill the form above with your brand & campaign details' },
              { step: '02', icon: '🔍', title: 'Review', desc: 'Our team reviews your application within 48 hours' },
              { step: '03', icon: '📹', title: 'Upload Ad', desc: 'Once approved, share your video ad link with us' },
              { step: '04', icon: '📈', title: 'Go Live', desc: 'Your campaign launches and reaches thousands of users' },
            ].map(item => (
              <div key={item.step} className="card" style={{ position: 'relative', padding: '28px 20px' }}>
                <div style={{ position: 'absolute', top: -2, right: 16, fontSize: 44, fontWeight: 900, color: 'rgba(108,71,255,0.07)', lineHeight: 1 }}>
                  {item.step}
                </div>
                <div style={{ fontSize: 36, marginBottom: 12 }}>{item.icon}</div>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>{item.title}</h3>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA Banner ──────────────────────────────────────────────────── */}
      <section style={{ padding: '60px 0', background: 'rgba(108,71,255,0.04)', borderTop: '1px solid var(--border)' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <div
            className="card glow-purple"
            style={{
              maxWidth: 600,
              margin: '0 auto',
              padding: '48px 36px',
              background: 'linear-gradient(135deg, rgba(108,71,255,0.15) 0%, rgba(168,85,247,0.08) 100%)',
              borderColor: 'rgba(108,71,255,0.3)',
            }}
          >
            <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 12 }}>Ready to grow your brand?</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 28 }}>
              Join verified brands already advertising on Virelo.
            </p>
            <a href="#apply-form" className="btn btn-primary btn-lg">
              Apply Now — It&apos;s Free
            </a>
          </div>
        </div>
      </section>

      {/* ─── Footer ──────────────────────────────────────────────────────── */}
      <footer style={{ borderTop: '1px solid var(--border)', padding: '32px 0' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 28, height: 28, background: 'var(--primary-gradient)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>▶</div>
            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Virelo Rewards</span>
          </div>
          <div style={{ display: 'flex', gap: 24, fontSize: 14 }}>
            <Link href="/terms" style={{ color: 'var(--text-muted)' }}>Terms</Link>
            <Link href="/privacy" style={{ color: 'var(--text-muted)' }}>Privacy</Link>
            <Link href="/faq" style={{ color: 'var(--text-muted)' }}>FAQ</Link>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>© 2024 Virelo Rewards. All rights reserved.</p>
        </div>
      </footer>

      <style>{`
        @media (max-width: 640px) {
          .adv-form-grid { grid-template-columns: 1fr !important; }
          .adv-form-grid > div[style*="grid-column"] { grid-column: 1 !important; }
        }
      `}</style>
    </div>
  )
}
