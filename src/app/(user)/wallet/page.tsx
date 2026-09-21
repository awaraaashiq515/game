'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { formatINR, formatDate } from '@/lib/utils'

interface WalletData {
  wallet: { availableBalance: number; pendingBalance: number; totalEarned: number; totalWithdrawn: number; videoEarnings: number; referralEarnings: number }
  todayEarnings: number
  transactions: Array<{ id: string; type: string; status: string; amount: number; description: string; createdAt: string }>
  hasMore: boolean
}

const TX_TYPE_ICONS: Record<string, string> = {
  VIDEO_REWARD: '▶',
  REFERRAL_REWARD: '👥',
  BONUS: '🎁',
  ADJUSTMENT: '🔧',
  WITHDRAWAL_DEBIT: '🏧',
  REVERSAL: '↩',
}

export default function WalletPage() {
  const [data, setData] = useState<WalletData | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('ALL')

  useEffect(() => {
    fetch('/api/user/wallet')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setData(d.data)
        setLoading(false)
      })
  }, [])

  const filteredTx = data?.transactions.filter((tx) => {
    if (filter === 'ALL') return true
    return tx.type === filter
  }) ?? []

  if (loading) {
    return <div className="skeleton" style={{ height: 400, borderRadius: 16 }} />
  }

  const w = data?.wallet

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800 }}>Wallet</h1>
      </div>

      {/* Total Balance Card */}
      <div
        className="card glow-purple"
        style={{
          marginBottom: 24,
          background: 'linear-gradient(135deg, rgba(108,71,255,0.2) 0%, rgba(168,85,247,0.1) 100%)',
          borderColor: 'rgba(108,71,255,0.4)',
          textAlign: 'center',
          padding: '40px 32px',
        }}
      >
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Total Balance
        </div>
        <div style={{ fontSize: 52, fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1, marginBottom: 12 }} className="text-glow-purple">
          {formatINR(w?.availableBalance ?? 0)}
        </div>
        {(w?.pendingBalance ?? 0) > 0 && (
          <div className="badge badge-warning" style={{ marginBottom: 16 }}>
            ₹{w?.pendingBalance} pending withdrawal
          </div>
        )}
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 20 }}>
          <Link href="/withdraw" className="btn btn-primary">🏧 Withdraw</Link>
          <Link href="/earn" className="btn btn-secondary">▶ Earn More</Link>
        </div>
      </div>

      {/* Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
        {[
          { label: 'Total Earned', value: w?.totalEarned ?? 0, icon: '📈', color: 'var(--success)' },
          { label: 'Video Earnings', value: w?.videoEarnings ?? 0, icon: '▶', color: 'var(--primary)' },
          { label: 'Referral Earnings', value: w?.referralEarnings ?? 0, icon: '👥', color: 'var(--warning)' },
          { label: 'Total Withdrawn', value: w?.totalWithdrawn ?? 0, icon: '🏧', color: 'var(--text-secondary)' },
          { label: 'Pending', value: w?.pendingBalance ?? 0, icon: '⏳', color: 'var(--warning)' },
          { label: "Today's Earnings", value: data?.todayEarnings ?? 0, icon: '⚡', color: 'var(--accent)' },
        ].map((s) => (
          <div key={s.label} className="stat-card">
            <div style={{ fontSize: 22, marginBottom: 8 }}>{s.icon}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{formatINR(s.value)}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Transactions */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <h2 style={{ fontSize: 18 }}>Transaction History</h2>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {['ALL', 'VIDEO_REWARD', 'REFERRAL_REWARD', 'WITHDRAWAL_DEBIT'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-ghost'}`}
              >
                {f === 'ALL' ? 'All' : f === 'VIDEO_REWARD' ? 'Videos' : f === 'REFERRAL_REWARD' ? 'Referrals' : 'Withdrawals'}
              </button>
            ))}
          </div>
        </div>

        {filteredTx.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
            No transactions found.
          </div>
        ) : (
          filteredTx.map((tx, i) => (
            <div
              key={tx.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                padding: '14px 0',
                borderBottom: i < filteredTx.length - 1 ? '1px solid var(--border)' : 'none',
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20,
                  background: tx.amount > 0 ? 'var(--success-bg)' : 'var(--error-bg)',
                  flexShrink: 0,
                }}
              >
                {TX_TYPE_ICONS[tx.type] ?? '💰'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{tx.description}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{formatDate(tx.createdAt)}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 700, fontSize: 16, color: tx.amount > 0 ? 'var(--success)' : 'var(--error)' }}>
                  {tx.amount > 0 ? '+' : ''}{formatINR(tx.amount)}
                </div>
                <div>
                  <span className={`badge ${tx.status === 'COMPLETED' ? 'badge-success' : tx.status === 'PENDING' ? 'badge-warning' : 'badge-error'}`} style={{ fontSize: 11 }}>
                    {tx.status}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <style>{`
        @media (max-width: 768px) {
          div[style*="grid-template-columns: repeat(3, 1fr)"] { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
    </div>
  )
}
