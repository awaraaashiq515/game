'use client'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { formatINR, formatDate } from '@/lib/utils'

interface DashboardData {
  wallet: { availableBalance: number; totalEarned: number; referralEarnings: number }
  todayEarnings: number
  transactions: Array<{ id: string; type: string; amount: number; description: string; createdAt: string }>
}

interface CampaignsData {
  campaigns: Array<{ id: string; name: string; sponsor: string; rewardAmount: number; userStatus: string; watchDuration: number }>
  todayCount: number
  dailyLimit: number
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const [walletData, setWalletData] = useState<DashboardData | null>(null)
  const [campaignData, setCampaignData] = useState<CampaignsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/user/wallet').then((r) => r.json()),
      fetch('/api/earn/campaigns').then((r) => r.json()),
    ]).then(([w, c]) => {
      if (w.success) setWalletData(w.data)
      if (c.success) setCampaignData(c.data)
      setLoading(false)
    })
  }, [])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening'
  const firstName = session?.user?.name?.split(' ')[0] ?? 'User'

  if (loading) {
    return (
      <div>
        <div className="skeleton" style={{ height: 32, width: 300, marginBottom: 32 }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
          {[1,2,3,4].map((i) => <div key={i} className="skeleton" style={{ height: 100 }} />)}
        </div>
      </div>
    )
  }

  const availableCount = campaignData?.campaigns.filter((c) => c.userStatus === 'AVAILABLE').length ?? 0

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 6 }}>
          {greeting}, {firstName} 👋
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>Here&apos;s your earnings overview</p>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }} className="stats-grid">
        {[
          {
            label: 'Available Balance',
            value: formatINR(walletData?.wallet.availableBalance ?? 0),
            icon: '💳',
            color: 'var(--primary)',
            glow: true,
          },
          {
            label: "Today's Earnings",
            value: formatINR(walletData?.todayEarnings ?? 0),
            icon: '📈',
            color: 'var(--success)',
          },
          {
            label: 'Videos Watched',
            value: `${campaignData?.todayCount ?? 0} / ${campaignData?.dailyLimit ?? 10}`,
            icon: '▶',
            color: 'var(--accent)',
          },
          {
            label: 'Referral Earnings',
            value: formatINR(walletData?.wallet.referralEarnings ?? 0),
            icon: '👥',
            color: 'var(--warning)',
          },
        ].map((stat) => (
          <div key={stat.label} className={`stat-card ${stat.glow ? 'glow-purple' : ''}`} style={{ borderColor: stat.glow ? 'rgba(108,71,255,0.3)' : undefined }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <span style={{ fontSize: 28 }}>{stat.icon}</span>
            </div>
            <div className="stat-value" style={{ color: stat.color }}>{stat.value}</div>
            <div className="stat-label">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* CTAs */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 40, flexWrap: 'wrap' }}>
        <Link href="/earn" className="btn btn-primary" style={{ fontSize: 16, padding: '14px 28px' }}>
          ▶ Watch & Earn ₹20
        </Link>
        <Link href="/refer" className="btn btn-secondary" style={{ fontSize: 16, padding: '14px 28px' }}>
          👥 Invite Friends
        </Link>
        <Link href="/withdraw" className="btn btn-ghost" style={{ fontSize: 16, padding: '14px 28px' }}>
          🏧 Withdraw
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Available videos */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ fontSize: 18 }}>Available Videos</h2>
            <Link href="/earn" style={{ fontSize: 13, color: 'var(--primary)' }}>View all →</Link>
          </div>

          {campaignData?.campaigns.slice(0, 4).map((campaign, i) => (
            <div
              key={campaign.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '12px 0',
                borderBottom: i < 3 ? '1px solid var(--border)' : 'none',
              }}
            >
              <div style={{ width: 44, height: 44, background: 'var(--primary-gradient)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>▶</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{campaign.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{campaign.sponsor} · {campaign.watchDuration}s</div>
              </div>
              <div>
                {campaign.userStatus === 'AVAILABLE' ? (
                  <Link href={`/earn/${campaign.id}`} className="btn btn-primary btn-sm">₹{campaign.rewardAmount}</Link>
                ) : campaign.userStatus === 'COMPLETED_TODAY' ? (
                  <span className="badge badge-success">✓ Done</span>
                ) : (
                  <span className="badge badge-secondary">🔒</span>
                )}
              </div>
            </div>
          ))}

          {availableCount === 0 && (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px 0', fontSize: 14 }}>
              All videos watched today! Come back tomorrow 🎉
            </p>
          )}
        </div>

        {/* Recent transactions */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ fontSize: 18 }}>Recent Transactions</h2>
            <Link href="/wallet" style={{ fontSize: 13, color: 'var(--primary)' }}>View all →</Link>
          </div>

          {(walletData?.transactions ?? []).slice(0, 5).map((tx, i) => (
            <div key={tx.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0', borderBottom: i < 4 ? '1px solid var(--border)' : 'none' }}>
              <div style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
                background: tx.amount > 0 ? 'var(--success-bg)' : 'var(--error-bg)',
              }}>
                {tx.amount > 0 ? '↑' : '↓'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{tx.description}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{formatDate(tx.createdAt)}</div>
              </div>
              <div style={{ fontWeight: 700, color: tx.amount > 0 ? 'var(--success)' : 'var(--error)' }}>
                {tx.amount > 0 ? '+' : ''}{formatINR(tx.amount)}
              </div>
            </div>
          ))}

          {(walletData?.transactions ?? []).length === 0 && (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px 0', fontSize: 14 }}>
              No transactions yet. Start watching videos!
            </p>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
          div[style*="grid-template-columns: 1fr 1fr"] { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
