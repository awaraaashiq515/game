'use client'
import { useEffect, useState } from 'react'
import { formatINR } from '@/lib/utils'
import Link from 'next/link'

interface Stats {
  totalUsers: number; activeUsers: number; todayVideoEarnings: number; referralRewards: number
  pendingWithdrawals: number; totalWithdrawn: number; activeCampaigns: number; totalFraudEvents: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/stats').then(r => r.json()).then(d => {
      if (d.success) setStats(d.data)
      setLoading(false)
    })
  }, [])

  const statCards = stats ? [
    { label: 'Total Users', value: stats.totalUsers.toLocaleString(), icon: '👥', color: 'var(--primary)', href: '/admin/users' },
    { label: 'Active Users (7d)', value: stats.activeUsers.toLocaleString(), icon: '✅', color: 'var(--success)', href: '/admin/users' },
    { label: "Today's Video Earnings", value: formatINR(stats.todayVideoEarnings), icon: '▶', color: 'var(--accent)', href: '/admin/transactions' },
    { label: 'Referral Rewards', value: formatINR(stats.referralRewards), icon: '👥', color: 'var(--warning)', href: '/admin/referrals' },
    { label: 'Pending Withdrawals', value: formatINR(stats.pendingWithdrawals), icon: '⏳', color: 'var(--warning)', href: '/admin/withdrawals' },
    { label: 'Total Withdrawn', value: formatINR(stats.totalWithdrawn), icon: '🏧', color: 'var(--success)', href: '/admin/withdrawals' },
    { label: 'Active Campaigns', value: stats.activeCampaigns.toLocaleString(), icon: '📺', color: 'var(--primary)', href: '/admin/campaigns' },
    { label: 'Open Fraud Events', value: stats.totalFraudEvents.toLocaleString(), icon: '🛡', color: stats.totalFraudEvents > 0 ? 'var(--error)' : 'var(--success)', href: '/admin/fraud' },
  ] : []

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>Admin Dashboard</h1>
        <p style={{ color: 'var(--text-muted)' }}>Platform overview and management</p>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {[1,2,3,4,5,6,7,8].map(i => <div key={i} className="skeleton" style={{ height: 100 }} />)}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
          {statCards.map((s) => (
            <Link key={s.label} href={s.href} style={{ textDecoration: 'none' }}>
              <div className="stat-card" style={{ cursor: 'pointer' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ fontSize: 24 }}>{s.icon}</span>
                </div>
                <div style={{ fontSize: 22, fontWeight: 800, color: s.color, marginBottom: 4 }}>{s.value}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.label}</div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Quick actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div className="card">
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Quick Actions</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { href: '/admin/withdrawals', label: '🏧 Review Pending Withdrawals', badge: stats?.pendingWithdrawals ? formatINR(stats.pendingWithdrawals) : null },
              { href: '/admin/campaigns/new', label: '📺 Create New Campaign', badge: null },
              { href: '/admin/fraud', label: '🛡 Review Fraud Events', badge: stats?.totalFraudEvents ? String(stats.totalFraudEvents) : null },
              { href: '/admin/settings', label: '⚙️ Platform Settings', badge: null },
            ].map((item) => (
              <Link key={item.href} href={item.href} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: 'var(--bg-surface)', borderRadius: 10, textDecoration: 'none', color: 'var(--text-primary)', fontSize: 14, fontWeight: 500, transition: 'background 0.2s' }}>
                {item.label}
                {item.badge && <span className="badge badge-warning">{item.badge}</span>}
              </Link>
            ))}
          </div>
        </div>

        <div className="card">
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Platform Health</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { label: 'Database', status: 'operational' },
              { label: 'Video campaigns', status: stats?.activeCampaigns ? 'operational' : 'warning' },
              { label: 'Fraud detection', status: 'operational' },
              { label: 'Wallet system', status: 'operational' },
            ].map((item) => (
              <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 14 }}>{item.label}</span>
                <span className={`badge ${item.status === 'operational' ? 'badge-success' : 'badge-warning'}`}>
                  {item.status === 'operational' ? '✓ OK' : '⚠ Check'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 1024px) {
          div[style*="grid-template-columns: repeat(4, 1fr)"] { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
    </div>
  )
}
