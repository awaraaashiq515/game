'use client'
import { useEffect, useState } from 'react'
import { formatINR, formatDate } from '@/lib/utils'

interface Transaction {
  id: string
  type: string
  status: string
  amount: number
  description: string
  createdAt: string
}

const FILTER_OPTIONS = [
  { label: 'All Time', value: 'all' },
  { label: 'Today', value: 'today' },
  { label: 'This Week', value: 'week' },
  { label: 'This Month', value: 'month' },
]

const TYPE_FILTER = [
  { label: 'All', value: 'ALL' },
  { label: 'Video Reward', value: 'VIDEO_REWARD' },
  { label: 'Referral', value: 'REFERRAL_REWARD' },
  { label: 'Bonus', value: 'BONUS' },
]

export default function HistoryPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('all')
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [totalEarned, setTotalEarned] = useState(0)

  useEffect(() => {
    fetch('/api/user/wallet')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setTransactions(d.data.transactions)
          setTotalEarned(d.data.wallet.totalEarned)
        }
        setLoading(false)
      })
  }, [])

  function filterByPeriod(tx: Transaction) {
    const date = new Date(tx.createdAt)
    const now = new Date()
    if (period === 'today') {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      return date >= today
    }
    if (period === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 86400000)
      return date >= weekAgo
    }
    if (period === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 86400000)
      return date >= monthAgo
    }
    return true
  }

  const filtered = transactions.filter((tx) => {
    if (tx.amount <= 0) return false // Only show earnings
    if (typeFilter !== 'ALL' && tx.type !== typeFilter) return false
    return filterByPeriod(tx)
  })

  const periodEarnings = filtered.reduce((sum, tx) => sum + tx.amount, 0)

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Earnings History</h1>
        <p style={{ color: 'var(--text-muted)' }}>Track all your verified earnings in one place.</p>
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 28 }}>
        <div className="stat-card" style={{ borderColor: 'rgba(108,71,255,0.3)' }}>
          <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 6 }}>Total Earned (All Time)</div>
          <div style={{ fontSize: 32, fontWeight: 900, color: 'var(--primary)' }}>{formatINR(totalEarned)}</div>
        </div>
        <div className="stat-card">
          <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 6 }}>Earnings in Selected Period</div>
          <div style={{ fontSize: 32, fontWeight: 900, color: 'var(--success)' }}>{formatINR(periodEarnings)}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>Period</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {FILTER_OPTIONS.map((f) => (
                <button key={f.value} onClick={() => setPeriod(f.value)} className={`btn btn-sm ${period === f.value ? 'btn-primary' : 'btn-ghost'}`}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>Type</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {TYPE_FILTER.map((f) => (
                <button key={f.value} onClick={() => setTypeFilter(f.value)} className={`btn btn-sm ${typeFilter === f.value ? 'btn-primary' : 'btn-ghost'}`}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Transactions */}
      <div className="card">
        {loading ? (
          <div className="skeleton" style={{ height: 200, borderRadius: 8 }} />
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
            <p>No earnings found for this period.</p>
          </div>
        ) : (
          filtered.map((tx, i) => (
            <div
              key={tx.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                padding: '14px 0',
                borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none',
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
                  background: 'var(--success-bg)',
                  flexShrink: 0,
                }}
              >
                {tx.type === 'VIDEO_REWARD' ? '▶' : tx.type === 'REFERRAL_REWARD' ? '👥' : '🎁'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{tx.description}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{formatDate(tx.createdAt)}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--success)' }}>+{formatINR(tx.amount)}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{tx.type.replace('_', ' ')}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
