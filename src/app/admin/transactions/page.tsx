'use client'
import { useEffect, useState } from 'react'
import { formatDate, formatINR } from '@/lib/utils'

interface Transaction {
  id: string; type: string; status: string; amount: number; description: string
  createdAt: string; walletId: string
}

const TX_TYPE_ICONS: Record<string, string> = {
  VIDEO_REWARD: '▶',
  REFERRAL_REWARD: '👥',
  BONUS: '🎁',
  ADJUSTMENT: '🔧',
  WITHDRAWAL_DEBIT: '🏧',
  REVERSAL: '↩',
}

export default function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState('')

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (typeFilter) params.set('type', typeFilter)
    fetch(`/api/admin/transactions?${params}`)
      .then(r => r.json())
      .then(d => {
        if (d.success) setTransactions(d.data)
        setLoading(false)
      })
  }, [typeFilter])

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800 }}>Wallet Transactions</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>All platform wallet activity</p>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { label: 'All', value: '' },
          { label: 'Video Rewards', value: 'VIDEO_REWARD' },
          { label: 'Referral Rewards', value: 'REFERRAL_REWARD' },
          { label: 'Withdrawals', value: 'WITHDRAWAL_DEBIT' },
          { label: 'Reversals', value: 'REVERSAL' },
        ].map((f) => (
          <button key={f.value} onClick={() => setTypeFilter(f.value)} className={`btn btn-sm ${typeFilter === f.value ? 'btn-primary' : 'btn-ghost'}`}>
            {f.label}
          </button>
        ))}
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Type</th>
                <th>Description</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40 }}>Loading...</td></tr>
              ) : transactions.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No transactions found</td></tr>
              ) : transactions.map((tx) => (
                <tr key={tx.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 18 }}>{TX_TYPE_ICONS[tx.type] ?? '💰'}</span>
                      <span style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--text-muted)' }}>{tx.type}</span>
                    </div>
                  </td>
                  <td style={{ maxWidth: 300 }}>{tx.description}</td>
                  <td>
                    <span style={{ fontWeight: 700, color: tx.amount > 0 ? 'var(--success)' : 'var(--error)', fontSize: 15 }}>
                      {tx.amount > 0 ? '+' : ''}{formatINR(tx.amount)}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${tx.status === 'COMPLETED' ? 'badge-success' : tx.status === 'PENDING' ? 'badge-warning' : 'badge-error'}`}>
                      {tx.status}
                    </span>
                  </td>
                  <td style={{ fontSize: 13 }}>{formatDate(tx.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
