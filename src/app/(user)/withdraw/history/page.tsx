'use client'
import { useEffect, useState } from 'react'
import { formatINR, formatDate } from '@/lib/utils'

interface Withdrawal {
  id: string; requestId: string; amount: number; method: string; status: string; requestedAt: string; processedAt: string | null; adminNote: string | null
}

const STATUS_CONFIG: Record<string, { badge: string; label: string }> = {
  PENDING: { badge: 'badge-warning', label: 'Pending Review' },
  APPROVED: { badge: 'badge-primary', label: 'Approved' },
  REJECTED: { badge: 'badge-error', label: 'Rejected' },
  PAID: { badge: 'badge-success', label: 'Paid' },
  FAILED: { badge: 'badge-error', label: 'Failed' },
}

export default function WithdrawHistoryPage() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/withdraw').then(r => r.json()).then(d => {
      if (d.success) setWithdrawals(d.data)
      setLoading(false)
    })
  }, [])

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800 }}>Withdrawal History</h1>
      </div>

      <div className="card">
        {loading ? (
          <div className="skeleton" style={{ height: 200 }} />
        ) : withdrawals.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🏧</div>
            <p>No withdrawal requests yet.</p>
            <a href="/withdraw" className="btn btn-primary" style={{ marginTop: 16, display: 'inline-flex' }}>Request Withdrawal</a>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Request ID</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Status</th>
                  <th>Note</th>
                </tr>
              </thead>
              <tbody>
                {withdrawals.map((w) => {
                  const cfg = STATUS_CONFIG[w.status] ?? { badge: 'badge-secondary', label: w.status }
                  return (
                    <tr key={w.id}>
                      <td style={{ fontWeight: 600, color: 'var(--primary)', fontFamily: 'monospace' }}>{w.requestId}</td>
                      <td>{formatDate(w.requestedAt)}</td>
                      <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{formatINR(w.amount)}</td>
                      <td>{w.method}</td>
                      <td><span className={`badge ${cfg.badge}`}>{cfg.label}</span></td>
                      <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{w.adminNote ?? '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
