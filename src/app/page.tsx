'use client'
import Link from 'next/link'
import { useState } from 'react'

const NAV_LINKS = [
  { href: '#how-it-works', label: 'How It Works' },
  { href: '#earn', label: 'Watch & Earn' },
  { href: '#refer', label: 'Refer & Earn' },
  { href: '#faq', label: 'FAQ' },
  { href: '/advertise', label: '📢 Advertise' },
]

const FAQ_ITEMS = [
  {
    q: 'How do I earn rewards?',
    a: 'Watch sponsored videos to their minimum required duration. Once your session is validated, ₹20 is automatically credited to your wallet.',
  },
  {
    q: 'When do I receive referral rewards?',
    a: 'Referral rewards are credited only after your referred friend creates a verified account and completes their first eligible video. This prevents fraudulent referrals.',
  },
  {
    q: 'What is the minimum withdrawal amount?',
    a: 'The minimum withdrawal is ₹2,000. This is configurable by the platform admin. You can withdraw via UPI, PhonePe, Google Pay, or Bank Transfer.',
  },
  {
    q: 'How long does withdrawal take?',
    a: 'Withdrawal requests are reviewed by our team within 1–3 business days. You will be notified at each stage.',
  },
  {
    q: 'Can I create multiple accounts?',
    a: 'No. Multiple accounts from the same device or person will be detected and flagged. We maintain an anti-fraud system to ensure fair participation.',
  },
  {
    q: 'Can rewards be cancelled?',
    a: 'Rewards earned through valid activity are credited permanently. However, rewards from suspicious or fraudulent activity may be reversed after a review process, as outlined in our Terms of Service.',
  },
]

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100vh' }}>
      {/* ─── Navbar ─────────────────────────────────────────────────── */}
      <nav
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          background: 'rgba(7, 13, 26, 0.85)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div
              style={{
                width: 36,
                height: 36,
                background: 'var(--primary-gradient)',
                borderRadius: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
              }}
            >
              ▶
            </div>
            <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>
              Virelo<span style={{ color: 'var(--primary)' }}>.</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }} className="desktop-nav">
            {NAV_LINKS.map((l) => (
              <a key={l.href} href={l.href} className="sidebar-link" style={{ padding: '8px 14px', borderRadius: 8 }}>
                {l.label}
              </a>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <Link href="/login" className="btn btn-ghost btn-sm">Login</Link>
            <Link href="/signup" className="btn btn-primary btn-sm">Start Earning</Link>
          </div>
        </div>
      </nav>

      {/* ─── Hero ───────────────────────────────────────────────────── */}
      <section
        className="hero-gradient"
        style={{
          padding: '100px 0 80px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background orbs */}
        <div
          style={{
            position: 'absolute',
            top: -100,
            left: '30%',
            width: 600,
            height: 600,
            background: 'radial-gradient(circle, rgba(108,71,255,0.08) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        <div className="container animate-fade-in">
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(108,71,255,0.12)',
              border: '1px solid rgba(108,71,255,0.3)',
              borderRadius: 50,
              padding: '6px 16px',
              marginBottom: 28,
              fontSize: 13,
              color: 'var(--primary)',
              fontWeight: 600,
            }}
          >
            ✦ India&apos;s Trusted Video Reward Platform
          </div>

          <h1
            style={{
              fontSize: 'clamp(40px, 6vw, 72px)',
              fontWeight: 900,
              lineHeight: 1.1,
              marginBottom: 24,
              maxWidth: 800,
              margin: '0 auto 24px',
            }}
          >
            Watch.{' '}
            <span
              style={{
                background: 'var(--primary-gradient)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Earn.
            </span>{' '}
            Refer.{' '}
            <span
              style={{
                background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Repeat.
            </span>
          </h1>

          <p
            style={{
              fontSize: 18,
              color: 'var(--text-secondary)',
              maxWidth: 560,
              margin: '0 auto 40px',
              lineHeight: 1.7,
            }}
          >
            Turn your time into rewards by watching sponsored content and completing verified earning tasks.
          </p>

          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/signup" className="btn btn-primary btn-lg animate-pulse-glow">
              🚀 Start Earning
            </Link>
            <Link href="/login" className="btn btn-ghost btn-lg">
              Login to Dashboard
            </Link>
          </div>

          {/* Stats row */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 16,
              maxWidth: 720,
              margin: '60px auto 0',
            }}
            className="stats-grid"
          >
            {[
              { value: '₹20', label: 'Per eligible video' },
              { value: '⚡', label: 'Instant wallet updates' },
              { value: '₹200', label: 'Per referral reward' },
              { value: '🏦', label: 'Multiple payout methods' },
            ].map((s) => (
              <div key={s.label} className="card" style={{ textAlign: 'center', padding: '16px 12px' }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--primary)', marginBottom: 4 }}>
                  {s.value}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How It Works ───────────────────────────────────────────── */}
      <section id="how-it-works" className="section">
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <h2 style={{ fontSize: 36, marginBottom: 12 }}>How It Works</h2>
            <p style={{ color: 'var(--text-secondary)', maxWidth: 480, margin: '0 auto' }}>
              Getting started is simple. Your rewards are real and verifiable.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 24 }}>
            {[
              { step: '01', icon: '📝', title: 'Create Account', desc: 'Sign up with your email and mobile. Verification required.' },
              { step: '02', icon: '▶️', title: 'Watch Videos', desc: 'Watch sponsored content for the required duration. No skipping.' },
              { step: '03', icon: '✅', title: 'Earn Verified', desc: 'Session validated server-side. ₹20 credited to wallet.' },
              { step: '04', icon: '🏧', title: 'Withdraw', desc: 'Reach ₹2,000 balance. Withdraw via UPI, bank, or other methods.' },
            ].map((item) => (
              <div key={item.step} className="feature-card" style={{ position: 'relative' }}>
                <div
                  style={{
                    position: 'absolute',
                    top: -1,
                    right: 20,
                    fontSize: 48,
                    fontWeight: 900,
                    color: 'rgba(108,71,255,0.08)',
                    lineHeight: 1,
                  }}
                >
                  {item.step}
                </div>
                <div style={{ fontSize: 36, marginBottom: 16 }}>{item.icon}</div>
                <h3 style={{ fontSize: 18, marginBottom: 8 }}>{item.title}</h3>
                <p style={{ fontSize: 14, lineHeight: 1.6 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Earn Section ───────────────────────────────────────────── */}
      <section id="earn" style={{ padding: '60px 0', background: 'rgba(108,71,255,0.03)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }}>
            <div>
              <div className="badge badge-primary" style={{ marginBottom: 16 }}>Watch & Earn</div>
              <h2 style={{ fontSize: 36, marginBottom: 16 }}>Earn ₹20 per video</h2>
              <p style={{ marginBottom: 24, lineHeight: 1.8 }}>
                Watch sponsored videos from verified brands. Each video requires you to watch for a minimum duration before your session is validated and the reward is credited.
              </p>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  'Watch up to 10 videos per day',
                  'Instant wallet credit after validation',
                  'Track your daily progress',
                  'No bots, no shortcuts — only genuine watch sessions',
                ].map((item) => (
                  <li key={item} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 15, color: 'var(--text-secondary)' }}>
                    <span style={{ color: 'var(--success)', fontSize: 18 }}>✓</span> {item}
                  </li>
                ))}
              </ul>
              <Link href="/signup" className="btn btn-primary" style={{ marginTop: 28, display: 'inline-flex' }}>
                Start Watching
              </Link>
            </div>
            <div>
              {/* Video card mockup */}
              <div className="card glow-purple" style={{ padding: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <div style={{ width: 44, height: 44, background: 'var(--primary-gradient)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>▶</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>Sponsored Video</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Watch 30 seconds to earn</div>
                  </div>
                  <div className="badge badge-success" style={{ marginLeft: 'auto' }}>₹20</div>
                </div>
                <div style={{ background: 'var(--bg-surface)', borderRadius: 12, height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, border: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 48, opacity: 0.5 }}>▶</span>
                </div>
                <div className="progress-bar-bg">
                  <div className="progress-bar-fill" style={{ width: '64%' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 13, color: 'var(--text-muted)' }}>
                  <span>Progress: 64%</span>
                  <span>19s remaining</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Refer Section ──────────────────────────────────────────── */}
      <section id="refer" className="section">
        <div className="container" style={{ textAlign: 'center' }}>
          <div className="badge badge-primary" style={{ marginBottom: 16 }}>Refer & Earn</div>
          <h2 style={{ fontSize: 36, marginBottom: 16 }}>Earn ₹200 per qualified referral</h2>
          <p style={{ maxWidth: 560, margin: '0 auto 48px', lineHeight: 1.8 }}>
            Share your referral link. When your friend signs up and completes their first eligible video, you earn ₹200. Honest rewards for genuine referrals.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, maxWidth: 700, margin: '0 auto' }}>
            {[
              { icon: '🔗', title: 'Share your link', desc: 'Via WhatsApp, Telegram, or any platform' },
              { icon: '👥', title: 'Friend signs up', desc: 'They create a verified account' },
              { icon: '💰', title: 'You earn ₹200', desc: 'After they complete first eligible video' },
            ].map((item) => (
              <div key={item.title} className="card" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>{item.icon}</div>
                <h3 style={{ fontSize: 16, marginBottom: 8 }}>{item.title}</h3>
                <p style={{ fontSize: 13 }}>{item.desc}</p>
              </div>
            ))}
          </div>

          <div
            className="card"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 12,
              marginTop: 32,
              padding: '14px 20px',
              background: 'rgba(239,68,68,0.05)',
              border: '1px solid rgba(239,68,68,0.2)',
            }}
          >
            <span>⚠️</span>
            <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
              Referral reward requires the referred user to genuinely complete eligibility steps — not just sign up.
            </span>
          </div>
        </div>
      </section>

      {/* ─── Security ───────────────────────────────────────────────── */}
      <section style={{ padding: '60px 0', background: 'rgba(16,185,129,0.03)', borderTop: '1px solid var(--border)' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: 32, marginBottom: 16 }}>🔒 Anti-Fraud Protection</h2>
          <p style={{ maxWidth: 560, margin: '0 auto 40px' }}>
            Virelo uses server-side validation to ensure every reward is legitimate. Suspicious activity is automatically flagged.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, maxWidth: 800, margin: '0 auto' }}>
            {[
              '🕐 Watch-time validation',
              '📍 IP pattern monitoring',
              '🔁 Duplicate session detection',
              '🤖 Bot activity detection',
              '👥 Referral abuse prevention',
              '🔐 Secure session tokens',
            ].map((item) => (
              <div key={item} className="card" style={{ padding: '14px 16px', textAlign: 'center', fontSize: 14, color: 'var(--text-secondary)' }}>
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FAQ ────────────────────────────────────────────────────── */}
      <section id="faq" className="section">
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ fontSize: 36, marginBottom: 12 }}>Frequently Asked Questions</h2>
          </div>

          <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {FAQ_ITEMS.map((item, i) => (
              <div key={i} className="card" style={{ cursor: 'pointer' }} onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <h3 style={{ fontSize: 16, fontWeight: 600 }}>{item.q}</h3>
                  <span style={{ color: 'var(--primary)', fontSize: 18, transition: 'transform 0.2s', transform: openFaq === i ? 'rotate(180deg)' : 'none' }}>▾</span>
                </div>
                {openFaq === i && (
                  <p style={{ marginTop: 12, fontSize: 14, lineHeight: 1.7 }} className="animate-fade-in">
                    {item.a}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ────────────────────────────────────────────────────── */}
      <section style={{ padding: '80px 0', textAlign: 'center' }}>
        <div className="container">
          <div
            className="card glow-purple"
            style={{
              maxWidth: 640,
              margin: '0 auto',
              background: 'linear-gradient(135deg, rgba(108,71,255,0.15) 0%, rgba(168,85,247,0.08) 100%)',
              borderColor: 'rgba(108,71,255,0.3)',
              padding: '56px 40px',
            }}
          >
            <h2 style={{ fontSize: 36, marginBottom: 16 }}>Ready to start earning?</h2>
            <p style={{ marginBottom: 32 }}>Create your account in minutes and begin earning from sponsored content.</p>
            <Link href="/signup" className="btn btn-primary btn-lg">
              Create Free Account
            </Link>
            <p style={{ marginTop: 20, fontSize: 13, color: 'var(--text-muted)' }}>
              By signing up, you agree to our{' '}
              <Link href="/terms" style={{ color: 'var(--primary)' }}>Terms of Service</Link>{' '}
              and{' '}
              <Link href="/privacy" style={{ color: 'var(--primary)' }}>Privacy Policy</Link>.
            </p>
          </div>
        </div>
      </section>

      {/* ─── Footer ─────────────────────────────────────────────────── */}
      <footer style={{ borderTop: '1px solid var(--border)', padding: '40px 0' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 28, height: 28, background: 'var(--primary-gradient)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>▶</div>
              <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Virelo Rewards</span>
            </div>
            <div style={{ display: 'flex', gap: 24, fontSize: 14 }}>
              <Link href="/terms" style={{ color: 'var(--text-muted)' }}>Terms</Link>
              <Link href="/privacy" style={{ color: 'var(--text-muted)' }}>Privacy</Link>
              <Link href="/faq" style={{ color: 'var(--text-muted)' }}>FAQ</Link>
              <Link href="/advertise" style={{ color: 'var(--primary)', fontWeight: 600 }}>Advertise</Link>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>© 2024 Virelo Rewards. All rights reserved.</p>
          </div>
        </div>
      </footer>

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
          section > .container > div[style*="grid-template-columns: 1fr 1fr"] { grid-template-columns: 1fr !important; }
          section > .container > div[style*="grid-template-columns: repeat(3"] { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
