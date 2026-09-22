'use client'
import { useEffect, useState } from 'react'
import { formatINR, formatDate } from '@/lib/utils'
import Link from 'next/link'

interface PendingDepositItem {
  id: string
  amount: number
  utrNumber: string
  senderUpi: string | null
  isActivation: boolean
  requestedAt: string
  user: { id: string; name: string; email: string }
}

interface Stats {
  totalUsers: number
  activeUsers: number
  todayVideoEarnings: number
  referralRewards: number
  pendingWithdrawals: number
  totalWithdrawn: number
  totalDeposited: number
  totalDepositsCount: number
  pendingDeposits: number
  pendingDepositsCount: number
  unapprovedActivationsCount: number
  activationDeposits: number
  activationDepositsCount: number
  pendingDepositsList: PendingDepositItem[]
  activeCampaigns: number
  totalFraudEvents: number
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

  const isSecret = typeof window !== 'undefined' && window.location.pathname.includes('M4ster')
  const prefix = isSecret ? '/M4ster@305' : ''

  const statCards = stats ? [
    { label: 'Total Deposited (Approved)', value: formatINR(stats.totalDeposited), sub: `${stats.totalDepositsCount} approved`, icon: '💰', color: '#10b981', href: `${prefix}/admin/deposits` },
    { label: '⚠️ Unapproved Deposits (Waiting)', value: `${stats.pendingDepositsCount} Users Waiting`, sub: `Total: ${formatINR(stats.pendingDeposits)}`, icon: '⏳', color: '#ef4444', href: `${prefix}/admin/deposits?status=PENDING` },
    { label: '₹5 Activation Collected', value: formatINR(stats.activationDeposits), sub: `${stats.activationDepositsCount} users paid`, icon: '🔓', color: '#10b981', href: `${prefix}/admin/withdrawal-unlocks` },
    { label: 'Unapproved ₹5 Activations', value: `${stats.unapprovedActivationsCount} Users Waiting`, sub: 'Needs activation approval', icon: '⏱️', color: '#f59e0b', href: `${prefix}/admin/withdrawal-unlocks` },
    { label: 'Total Users', value: stats.totalUsers.toLocaleString(), sub: 'Registered accounts', icon: '👥', color: 'var(--primary)', href: `${prefix}/admin/users` },
    { label: 'Active Users (7d)', value: stats.activeUsers.toLocaleString(), sub: 'Active recently', icon: '✅', color: 'var(--success)', href: `${prefix}/admin/users` },
    { label: 'Total Withdrawn', value: formatINR(stats.totalWithdrawn), sub: 'Paid out', icon: '🏧', color: 'var(--success)', href: `${prefix}/admin/withdrawals` },
    { label: 'Pending Withdrawals', value: formatINR(stats.pendingWithdrawals), sub: 'Under review', icon: '💳', color: 'var(--warning)', href: `${prefix}/admin/withdrawals` },
  ] : []

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>Admin Dashboard</h1>
        <p style={{ color: 'var(--text-muted)' }}>Platform overview, deposit approvals, and system management</p>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {[1,2,3,4,5,6,7,8].map(i => <div key={i} className="skeleton" style={{ height: 110, borderRadius: 14 }} />)}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
          {statCards.map((s) => (
            <Link key={s.label} href={s.href} style={{ textDecoration: 'none' }}>
              <div className="stat-card" style={{ cursor: 'pointer', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderColor: s.color === '#ef4444' ? 'rgba(239,68,68,0.4)' : undefined, background: s.color === '#ef4444' ? 'rgba(239,68,68,0.04)' : undefined }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <span style={{ fontSize: 24 }}>{s.icon}</span>
                    {s.sub && (
                      <span style={{ fontSize: 11, fontWeight: 700, color: s.color === '#ef4444' ? '#ef4444' : 'var(--text-muted)', background: s.color === '#ef4444' ? 'rgba(239,68,68,0.1)' : 'var(--bg-surface)', padding: '2px 8px', borderRadius: 99 }}>
                        {s.sub}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: s.color, marginBottom: 4 }}>{s.value}</div>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>{s.label}</div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* ── UNAPPROVED DEPOSIT REQUESTS (Pese add kiye par approval nahi mila) ── */}
      <div className="card" style={{ marginBottom: 28, borderColor: stats && stats.pendingDepositsCount > 0 ? 'rgba(245,158,11,0.4)' : 'var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 24 }}>⏳</span>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>
                Users Waiting for Deposit Approval (Pese Add Kiye Par Approval Nahi Mila)
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                Users who sent payment and submitted UTR proof, waiting for admin approval
              </div>
            </div>
          </div>
          {stats && stats.pendingDepositsCount > 0 ? (
            <span className="badge badge-warning" style={{ fontSize: 12, padding: '4px 12px', fontWeight: 700 }}>
              {stats.pendingDepositsCount} Requests Pending ({formatINR(stats.pendingDeposits)})
            </span>
          ) : (
            <span className="badge badge-success" style={{ fontSize: 12, padding: '4px 12px', fontWeight: 700 }}>
              ✅ All Approved (0 Pending)
            </span>
          )}
        </div>

        {stats && stats.pendingDepositsList && stats.pendingDepositsList.length > 0 ? (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>UTR / Transaction ID</th>
                  <th>Submitted At</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {stats.pendingDepositsList.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{item.user.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.user.email}</div>
                    </td>
                    <td>
                      {item.isActivation ? (
                        <span style={{ fontSize: 11, fontWeight: 800, color: '#f59e0b', background: 'rgba(245,158,11,0.12)', padding: '3px 8px', borderRadius: 99 }}>
                          🔓 ₹5 Activation
                        </span>
                      ) : (
                        <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--primary)', background: 'rgba(108,71,255,0.12)', padding: '3px 8px', borderRadius: 99 }}>
                          💰 Wallet Add Money
                        </span>
                      )}
                    </td>
                    <td>
                      <span style={{ fontWeight: 800, color: 'var(--success)', fontSize: 15 }}>
                        +{formatINR(item.amount)}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#f59e0b', background: 'rgba(245,158,11,0.08)', padding: '2px 8px', borderRadius: 6, fontSize: 13 }}>
                        {item.utrNumber}
                      </span>
                      {item.senderUpi && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{item.senderUpi}</div>}
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {formatDate(item.requestedAt)}
                    </td>
                    <td>
                      <Link
                        href={item.isActivation ? `${prefix}/admin/withdrawal-unlocks` : `${prefix}/admin/deposits`}
                        className="btn btn-sm btn-primary"
                        style={{ fontWeight: 700, fontSize: 12, textDecoration: 'none' }}
                      >
                        {item.isActivation ? '⏱️ Set Time & Approve →' : '✅ Approve Now →'}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '24px 16px', color: 'var(--text-muted)', fontSize: 14 }}>
            🎉 Sabhi deposit requests approved hain! Koi bhi user approval ka wait nahi kar raha hai.
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div className="card">
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Quick Actions</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { href: `${prefix}/admin/deposits`, label: '💰 Review Deposit Requests', badge: stats?.pendingDeposits ? formatINR(stats.pendingDeposits) : null },
              { href: `${prefix}/admin/withdrawal-unlocks`, label: '⏱️ Withdrawal Unlock Timer', badge: stats?.activationDepositsCount ? `${stats.activationDepositsCount} Active` : null },
              { href: `${prefix}/admin/withdrawals`, label: '🏧 Review Pending Withdrawals', badge: stats?.pendingWithdrawals ? formatINR(stats.pendingWithdrawals) : null },
              { href: `${prefix}/admin/settings`, label: '⚙️ Platform Settings & UPI', badge: null },
            ].map((item) => (
              <Link key={item.label} href={item.href} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: 'var(--bg-surface)', borderRadius: 10, textDecoration: 'none', color: 'var(--text-primary)', fontSize: 14, fontWeight: 500, transition: 'background 0.2s' }}>
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
