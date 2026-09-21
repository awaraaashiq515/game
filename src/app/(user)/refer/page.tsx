'use client'
import { useEffect, useState } from 'react'
import { formatINR, formatDate } from '@/lib/utils'

interface ReferralData {
  referralCode: string
  referralLink: string
  totalReferrals: number
  qualifiedReferrals: number
  pendingReferrals: number
  totalEarnings: number
  referrals: Array<{ id: string; name: string; joinedAt: string; status: string; rewardAmount: number | null; qualifiedAt: string | null }>
}

export default function ReferPage() {
  const [data, setData] = useState<ReferralData | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetch('/api/refer').then(r => r.json()).then(d => {
      if (d.success) setData(d.data)
      setLoading(false)
    })
  }, [])

  function copyLink() {
    if (!data) return
    navigator.clipboard.writeText(data.referralLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function shareOn(platform: string) {
    if (!data) return
    const text = `Join Virelo Rewards and earn money watching videos! Use my referral link: ${data.referralLink}`
    const urls: Record<string, string> = {
      whatsapp: `https://wa.me/?text=${encodeURIComponent(text)}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(data.referralLink)}&text=${encodeURIComponent('Join Virelo Rewards!')}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(data.referralLink)}`,
    }
    if (urls[platform]) window.open(urls[platform], '_blank')
  }

  if (loading) return <div className="skeleton" style={{ height: 400, borderRadius: 16 }} />

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Refer & Earn</h1>
        <p style={{ color: 'var(--text-muted)' }}>Invite friends and earn rewards when they complete the required eligibility steps.</p>
      </div>

      {/* Reward highlight */}
      <div
        className="card glow-purple"
        style={{
          marginBottom: 24,
          background: 'linear-gradient(135deg, rgba(108,71,255,0.15) 0%, rgba(168,85,247,0.08) 100%)',
          borderColor: 'rgba(108,71,255,0.4)',
          textAlign: 'center',
          padding: '40px',
        }}
      >
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Referral Reward</div>
        <div style={{ fontSize: 56, fontWeight: 900, color: 'var(--primary)', lineHeight: 1, marginBottom: 12 }}>₹200</div>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', maxWidth: 480, margin: '0 auto' }}>
          Earn ₹200 for every friend who signs up using your link <strong style={{ color: 'var(--text-primary)' }}>and</strong> completes their first eligible video.
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'Friends Joined', value: data?.totalReferrals ?? 0, color: 'var(--text-primary)' },
          { label: 'Qualified', value: data?.qualifiedReferrals ?? 0, color: 'var(--success)' },
          { label: 'Pending', value: data?.pendingReferrals ?? 0, color: 'var(--warning)' },
          { label: 'Referral Earnings', value: formatINR(data?.totalEarnings ?? 0), color: 'var(--primary)' },
        ].map((s) => (
          <div key={s.label} className="stat-card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: s.color, marginBottom: 4 }}>{s.value}</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Referral link */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Your Referral Link</h2>
        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          <div
            style={{
              flex: 1,
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: '12px 16px',
              fontSize: 14,
              color: 'var(--text-muted)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {data?.referralLink}
          </div>
          <button onClick={copyLink} className={`btn ${copied ? 'btn-success' : 'btn-primary'}`} style={{ flexShrink: 0 }}>
            {copied ? '✓ Copied!' : 'Copy Link'}
          </button>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginRight: 4, display: 'flex', alignItems: 'center' }}>Share via:</div>
          {[
            { key: 'whatsapp', label: '💬 WhatsApp', color: '#25d366' },
            { key: 'telegram', label: '✈️ Telegram', color: '#2aabee' },
            { key: 'facebook', label: '📘 Facebook', color: '#1877f2' },
          ].map((p) => (
            <button
              key={p.key}
              onClick={() => shareOn(p.key)}
              className="btn btn-ghost btn-sm"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Referral code */}
      <div className="card" style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 20 }}>
        <div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>Your Referral Code</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--primary)', letterSpacing: '0.1em' }}>
            {data?.referralCode}
          </div>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <button onClick={copyLink} className="btn btn-secondary btn-sm">Copy Code</button>
        </div>
      </div>

      {/* How qualification works */}
      <div className="card" style={{ marginBottom: 28, background: 'rgba(245,158,11,0.05)', borderColor: 'rgba(245,158,11,0.2)' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <span style={{ fontSize: 24 }}>ℹ️</span>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>How Referral Qualification Works</h3>
            <p style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--text-secondary)' }}>
              Referral rewards are NOT credited just because someone signs up. Your referred friend must:
              create a verified account → then complete their first eligible sponsored video.
              Only after that is your ₹200 reward credited.
              This prevents fraudulent referrals and fake account abuse.
            </p>
          </div>
        </div>
      </div>

      {/* Referral tree */}
      <div className="card">
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>My Referrals</h2>
        {(data?.referrals ?? []).length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>👥</div>
            <p>No referrals yet. Share your link to start earning!</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Joined</th>
                  <th>Status</th>
                  <th>Reward</th>
                </tr>
              </thead>
              <tbody>
                {data!.referrals.map((r) => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{r.name}</td>
                    <td>{formatDate(r.joinedAt)}</td>
                    <td>
                      <span className={`badge ${r.status === 'REWARDED' || r.status === 'QUALIFIED' ? 'badge-success' : 'badge-warning'}`}>
                        {r.status}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700, color: r.rewardAmount ? 'var(--success)' : 'var(--text-muted)' }}>
                      {r.rewardAmount ? formatINR(r.rewardAmount) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 768px) {
          div[style*="grid-template-columns: repeat(4, 1fr)"] { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
    </div>
  )
}
