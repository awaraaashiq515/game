'use client'
import { useEffect, useState } from 'react'
import { formatINR, formatDate } from '@/lib/utils'

interface AdminWalletStats {
  totalFundsAdded: number
  totalDistributed: number
  totalWithdrawnByUsers: number
  availablePool: number
}

interface AdminWalletTx {
  id: string
  type: string
  amount: number
  description: string
  reference: string | null
  createdAt: string
}

const TX_TYPE_CONFIG: Record<string, { label: string; color: string; sign: string }> = {
  FUND_ADD: { label: 'Fund Added', color: 'var(--success)', sign: '+' },
  USER_REWARD: { label: 'User Reward', color: 'var(--error)', sign: '-' },
  USER_WITHDRAWAL: { label: 'User Withdrawal', color: '#f59e0b', sign: '-' },
}

export default function AdminWalletPage() {
  const [wallet, setWallet] = useState<AdminWalletStats | null>(null)
  const [txs, setTxs] = useState<AdminWalletTx[]>([])
  const [loading, setLoading] = useState(true)
  const [addFundsAmount, setAddFundsAmount] = useState('')
  const [addFundsDesc, setAddFundsDesc] = useState('')
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState('')
  const [addSuccess, setAddSuccess] = useState('')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)

  function fetchData(p = 1) {
    setLoading(true)
    fetch(`/api/admin/wallet?page=${p}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setWallet(d.data.wallet)
          if (p === 1) setTxs(d.data.transactions)
          else setTxs((prev) => [...prev, ...d.data.transactions])
          setHasMore(d.data.hasMore)
          setPage(p)
        }
        setLoading(false)
      })
  }

  useEffect(() => { fetchData(1) }, [])

  async function handleAddFunds() {
    setAddError('')
    setAddSuccess('')
    const amount = parseFloat(addFundsAmount)
    if (!amount || amount <= 0) { setAddError('Please enter a valid amount'); return }
    setAdding(true)
    try {
      const res = await fetch('/api/admin/wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, description: addFundsDesc || 'Manual fund addition' }),
      })
      const data = await res.json()
      if (data.success) {
        setAddSuccess(`✅ ₹${amount.toLocaleString('en-IN')} added to master pool!`)
        setAddFundsAmount('')
        setAddFundsDesc('')
        fetchData(1)
      } else {
        setAddError(data.error)
      }
    } catch {
      setAddError('Failed. Try again.')
    } finally {
      setAdding(false)
    }
  }

  const statCards = wallet ? [
    {
      label: 'Total Funds Added',
      value: formatINR(wallet.totalFundsAdded),
      icon: '💰',
      color: 'var(--success)',
      desc: 'Manually added by admin',
    },
    {
      label: 'Total Distributed',
      value: formatINR(wallet.totalDistributed),
      icon: '🎁',
      color: 'var(--primary)',
      desc: 'Paid to users via ads & referrals',
    },
    {
      label: 'Total Withdrawn by Users',
      value: formatINR(wallet.totalWithdrawnByUsers),
      icon: '🏧',
      color: '#f59e0b',
      desc: 'Successfully processed withdrawals',
    },
    {
      label: 'Available Pool',
      value: formatINR(wallet.availablePool),
      icon: '🏦',
      color: wallet.availablePool < 5000 ? 'var(--error)' : 'var(--success)',
      desc: wallet.availablePool < 5000 ? '⚠️ Low — add more funds' : 'Sufficient pool balance',
    },
  ] : []

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>Master Wallet</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
          Platform-level fund pool — no bank linked. All rewards come from this pool.
        </p>
      </div>

      {/* Stat cards */}
      {loading && !wallet ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
          {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 110 }} />)}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
          {statCards.map((s) => (
            <div key={s.label} className="stat-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 26 }}>{s.icon}</span>
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: s.color, marginBottom: 4 }}>{s.value}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>{s.label}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.desc}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: 20 }}>
        {/* Add Funds Panel */}
        <div className="card" style={{ height: 'fit-content' }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>💰 Add Funds to Pool</h2>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 20, lineHeight: 1.5 }}>
            Add money manually to the master pool. This is what users earn from — no payment gateway needed.
          </p>

          {addError && (
            <div style={{ background: 'var(--error-bg)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '12px 14px', fontSize: 13, color: 'var(--error)', marginBottom: 16 }}>
              {addError}
            </div>
          )}
          {addSuccess && (
            <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 10, padding: '12px 14px', fontSize: 13, color: 'var(--success)', marginBottom: 16 }}>
              {addSuccess}
            </div>
          )}

          <div className="input-group" style={{ marginBottom: 14 }}>
            <label className="input-label">Amount (₹)</label>
            <input
              id="admin-wallet-amount"
              type="number"
              className="input"
              placeholder="e.g. 10000"
              value={addFundsAmount}
              onChange={(e) => setAddFundsAmount(e.target.value)}
              min={1}
            />
          </div>
          <div className="input-group" style={{ marginBottom: 20 }}>
            <label className="input-label">Description (optional)</label>
            <input
              id="admin-wallet-desc"
              type="text"
              className="input"
              placeholder="e.g. Initial fund load"
              value={addFundsDesc}
              onChange={(e) => setAddFundsDesc(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {[5000, 10000, 25000, 50000].map((preset) => (
              <button
                key={preset}
                className="btn btn-ghost btn-sm"
                onClick={() => setAddFundsAmount(String(preset))}
              >
                ₹{preset.toLocaleString('en-IN')}
              </button>
            ))}
          </div>

          <button
            id="admin-wallet-add"
            className="btn btn-primary btn-full"
            onClick={handleAddFunds}
            disabled={adding || !addFundsAmount}
          >
            {adding ? 'Adding...' : '+ Add to Pool'}
          </button>
        </div>

        {/* Transaction Ledger */}
        <div className="card">
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>📋 Pool Ledger</h2>
          {txs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
              No transactions yet
            </div>
          ) : (
            <>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Amount</th>
                      <th>Description</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {txs.map((tx) => {
                      const cfg = TX_TYPE_CONFIG[tx.type] ?? { label: tx.type, color: 'var(--text-primary)', sign: '' }
                      return (
                        <tr key={tx.id}>
                          <td>
                            <span
                              className="badge"
                              style={{
                                background: `${cfg.color}22`,
                                color: cfg.color,
                                border: `1px solid ${cfg.color}44`,
                                fontSize: 11,
                                padding: '3px 8px',
                              }}
                            >
                              {cfg.label}
                            </span>
                          </td>
                          <td style={{ fontWeight: 700, color: cfg.color, whiteSpace: 'nowrap' }}>
                            {cfg.sign}₹{tx.amount.toLocaleString('en-IN')}
                          </td>
                          <td style={{ fontSize: 12, color: 'var(--text-muted)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {tx.description}
                          </td>
                          <td style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                            {formatDate(tx.createdAt)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              {hasMore && (
                <div style={{ marginTop: 16, textAlign: 'center' }}>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => fetchData(page + 1)}
                    disabled={loading}
                  >
                    {loading ? 'Loading...' : 'Load More'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 1100px) {
          div[style*="grid-template-columns: repeat(4, 1fr)"] { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 768px) {
          div[style*="grid-template-columns: 1fr 1.6fr"] { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
