'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Campaign {
  id: string
  name: string
  sponsor: string
  description: string | null
  rewardAmount: number
  watchDuration: number
  userStatus: 'AVAILABLE' | 'COMPLETED_TODAY' | 'LOCKED' | 'EXPIRED'
  totalCompletions: number
}

export default function EarnPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [todayCount, setTodayCount] = useState(0)
  const [dailyLimit, setDailyLimit] = useState(10)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/earn/campaigns')
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setCampaigns(data.data.campaigns)
          setTodayCount(data.data.todayCount)
          setDailyLimit(data.data.dailyLimit)
        }
        setLoading(false)
      })
  }, [])

  const available = campaigns.filter((c) => c.userStatus === 'AVAILABLE').length
  const completed = campaigns.filter((c) => c.userStatus === 'COMPLETED_TODAY').length

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Watch & Earn</h1>
        <p style={{ color: 'var(--text-muted)' }}>
          Complete sponsored videos and earn ₹20 for every eligible completion.
        </p>
      </div>

      {/* Progress bar */}
      <div className="card" style={{ marginBottom: 28, background: 'linear-gradient(135deg, rgba(108,71,255,0.12) 0%, rgba(168,85,247,0.06) 100%)', borderColor: 'rgba(108,71,255,0.25)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 2 }}>Today&apos;s Progress</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{todayCount} of {dailyLimit} videos watched</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--primary)' }}>₹{todayCount * 20}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>earned today</div>
          </div>
        </div>
        <div className="progress-bar-bg">
          <div className="progress-bar-fill" style={{ width: `${Math.min((todayCount / dailyLimit) * 100, 100)}%` }} />
        </div>
        {todayCount >= dailyLimit && (
          <div style={{ marginTop: 12, fontSize: 13, color: 'var(--warning)', textAlign: 'center' }}>
            🎉 Daily limit reached! Come back tomorrow for more earnings.
          </div>
        )}
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
        {[
          { label: 'Available', value: available, color: 'var(--success)', icon: '▶' },
          { label: 'Completed Today', value: completed, color: 'var(--primary)', icon: '✓' },
          { label: 'Max Daily Earning', value: `₹${dailyLimit * 20}`, color: 'var(--warning)', icon: '💰' },
        ].map((s) => (
          <div key={s.label} className="stat-card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 28, color: s.color, fontWeight: 800 }}>{s.value}</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Campaign grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
          {[1,2,3,4,5,6].map((i) => <div key={i} className="skeleton" style={{ height: 200, borderRadius: 16 }} />)}
        </div>
      ) : campaigns.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 40px' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
          <h2 style={{ fontSize: 20, marginBottom: 8 }}>No campaigns available</h2>
          <p style={{ color: 'var(--text-muted)' }}>Check back soon for new sponsored videos.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
          {campaigns.map((campaign, i) => (
            <CampaignCard key={campaign.id} campaign={campaign} index={i} />
          ))}
        </div>
      )}
    </div>
  )
}

function CampaignCard({ campaign, index }: { campaign: Campaign; index: number }) {
  const statusConfig = {
    AVAILABLE: { label: 'Watch Video', style: 'btn-primary', emoji: '▶' },
    COMPLETED_TODAY: { label: '✓ Completed', style: 'btn-success', emoji: '✅' },
    LOCKED: { label: '🔒 Locked', style: 'btn-ghost', emoji: '🔒' },
    EXPIRED: { label: 'Expired', style: 'btn-ghost', emoji: '⏰' },
  }

  const { label, style: btnStyle } = statusConfig[campaign.userStatus]

  return (
    <div
      className="card"
      style={{
        animationDelay: `${index * 0.05}s`,
        opacity: campaign.userStatus === 'LOCKED' ? 0.6 : 1,
        transition: 'all 0.2s',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Campaign number badge */}
      <div
        style={{
          position: 'absolute',
          top: 16,
          right: 16,
          background: 'rgba(108,71,255,0.15)',
          borderRadius: 6,
          padding: '3px 8px',
          fontSize: 11,
          fontWeight: 700,
          color: 'var(--primary)',
        }}
      >
        VIDEO #{String(index + 1).padStart(2, '0')}
      </div>

      {/* Video preview area */}
      <div
        style={{
          height: 120,
          background: 'var(--bg-surface)',
          borderRadius: 10,
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid var(--border)',
          position: 'relative',
        }}
      >
        <span style={{ fontSize: 40, opacity: campaign.userStatus === 'COMPLETED_TODAY' ? 0.4 : 0.6 }}>▶</span>
        {campaign.userStatus === 'COMPLETED_TODAY' && (
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(16,185,129,0.1)',
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid rgba(16,185,129,0.3)',
          }}>
            <span style={{ fontSize: 48 }}>✅</span>
          </div>
        )}
      </div>

      <div style={{ marginBottom: 4, fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {campaign.sponsor}
      </div>
      <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, lineHeight: 1.3 }}>{campaign.name}</h3>
      {campaign.description && (
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12, lineHeight: 1.5 }}>
          {campaign.description.length > 80 ? campaign.description.slice(0, 80) + '...' : campaign.description}
        </p>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, fontSize: 13, color: 'var(--text-muted)' }}>
        <span>⏱ Watch {campaign.watchDuration}s</span>
        <span>·</span>
        <span style={{ color: 'var(--success)', fontWeight: 600 }}>Reward: ₹{campaign.rewardAmount}</span>
      </div>

      {campaign.userStatus === 'AVAILABLE' ? (
        <Link href={`/earn/${campaign.id}`} className={`btn ${btnStyle} btn-full`}>
          ▶ Watch Video
        </Link>
      ) : (
        <button className={`btn ${btnStyle} btn-full`} disabled>
          {label}
        </button>
      )}
    </div>
  )
}
