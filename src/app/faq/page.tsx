'use client'
import { useState } from 'react'
import Link from 'next/link'

const FAQ_CATEGORIES = [
  {
    title: '🎬 Earning',
    items: [
      { q: 'How do I earn ₹20?', a: 'Watch a sponsored video for its required minimum duration. Your session is tracked server-side. Once validated, ₹20 is automatically credited to your wallet.' },
      { q: 'What is the daily earning limit?', a: 'By default, you can earn from up to 10 videos per day (₹200 maximum daily). This limit is configurable by the platform.' },
      { q: 'Why was my reward not credited?', a: 'Rewards require: completing the minimum watch duration, passing fraud validation, the campaign being active, and the campaign budget not being exhausted. Suspicious activity (fast completion, bot detection) will block rewards.' },
      { q: 'Can I skip or fast-forward a video?', a: 'No. Skipping is detected server-side. You must genuinely watch for the required duration to qualify.' },
      { q: 'Do campaigns expire?', a: 'Yes. Campaigns have start/end dates and total budgets. Once a budget is exhausted or the campaign ends, it is no longer available.' },
    ],
  },
  {
    title: '👥 Referrals',
    items: [
      { q: 'How does the referral program work?', a: 'Share your unique referral link. When a friend signs up and completes their first eligible video, you earn ₹200.' },
      { q: 'When is my referral reward credited?', a: 'Only after your referred friend: creates a verified account AND completes their first eligible sponsored video. Simply signing up is not enough.' },
      { q: 'Can I refer myself?', a: 'No. Self-referrals and fake account referrals are detected and will result in account suspension.' },
    ],
  },
  {
    title: '💳 Wallet & Withdrawals',
    items: [
      { q: 'What is the minimum withdrawal?', a: 'The minimum withdrawal amount is ₹2,000 by default. This is shown on the Withdraw page.' },
      { q: 'How long does withdrawal take?', a: 'Withdrawal requests are reviewed within 1–3 business days. You will be notified at each stage.' },
      { q: 'Which payment methods are supported?', a: 'UPI, PhonePe, Google Pay, and Bank Transfer.' },
      { q: 'Can I have multiple pending withdrawals?', a: 'No. Only one withdrawal request can be pending at a time.' },
    ],
  },
  {
    title: '🔒 Account & Security',
    items: [
      { q: 'Can I create multiple accounts?', a: 'No. Multiple accounts from the same person, device, or IP are detected and flagged. All associated accounts may be suspended.' },
      { q: 'What happens if my account is suspended?', a: 'You will be notified via the app. Your account will be under review. Legitimate earnings are not confiscated without a review process.' },
      { q: 'How do you detect fraud?', a: 'Our system monitors: watch time vs required duration, session tokens, IP patterns, duplicate completions, heartbeat intervals, and referral patterns.' },
    ],
  },
]

export default function FAQPage() {
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({})

  function toggle(key: string) {
    setOpenItems((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)', padding: '16px 0' }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            <div style={{ width: 32, height: 32, background: 'var(--primary-gradient)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>▶</div>
            <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>Virelo Rewards</span>
          </Link>
          <span style={{ color: 'var(--text-muted)' }}>/ FAQ</span>
        </div>
      </div>

      <div className="container" style={{ maxWidth: 800, padding: '60px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <h1 style={{ fontSize: 36, fontWeight: 900, marginBottom: 12 }}>Frequently Asked Questions</h1>
          <p style={{ color: 'var(--text-muted)' }}>Everything you need to know about Virelo Rewards.</p>
        </div>

        {FAQ_CATEGORIES.map((cat) => (
          <div key={cat.title} style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16, color: 'var(--primary)' }}>{cat.title}</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {cat.items.map((item, i) => {
                const key = `${cat.title}-${i}`
                const isOpen = openItems[key]
                return (
                  <div
                    key={key}
                    className="card"
                    style={{
                      cursor: 'pointer',
                      borderColor: isOpen ? 'rgba(108,71,255,0.3)' : 'var(--border)',
                      transition: 'all 0.2s',
                    }}
                    onClick={() => toggle(key)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
                      <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>{item.q}</h3>
                      <span
                        style={{
                          color: 'var(--primary)',
                          fontSize: 20,
                          flexShrink: 0,
                          transition: 'transform 0.2s',
                          transform: isOpen ? 'rotate(180deg)' : 'none',
                          display: 'inline-block',
                        }}
                      >
                        ▾
                      </span>
                    </div>
                    {isOpen && (
                      <p
                        style={{
                          marginTop: 12,
                          fontSize: 14,
                          lineHeight: 1.8,
                          color: 'var(--text-secondary)',
                          paddingTop: 12,
                          borderTop: '1px solid var(--border)',
                        }}
                        className="animate-fade-in"
                      >
                        {item.a}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        {/* Still need help? */}
        <div
          className="card"
          style={{
            textAlign: 'center',
            padding: '40px',
            background: 'linear-gradient(135deg, rgba(108,71,255,0.1) 0%, var(--bg-card) 100%)',
            borderColor: 'rgba(108,71,255,0.3)',
          }}
        >
          <div style={{ fontSize: 36, marginBottom: 12 }}>💬</div>
          <h2 style={{ fontSize: 20, marginBottom: 8 }}>Still have questions?</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: 20 }}>Contact our support team from your dashboard.</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <Link href="/signup" className="btn btn-primary">Create Account</Link>
            <Link href="/login" className="btn btn-ghost">Login</Link>
          </div>
        </div>

        <div style={{ marginTop: 40, display: 'flex', gap: 16, justifyContent: 'center' }}>
          <Link href="/terms" style={{ color: 'var(--primary)', fontSize: 14 }}>Terms of Service</Link>
          <Link href="/privacy" style={{ color: 'var(--primary)', fontSize: 14 }}>Privacy Policy</Link>
          <Link href="/" style={{ color: 'var(--text-muted)', fontSize: 14 }}>Home</Link>
        </div>
      </div>
    </div>
  )
}
