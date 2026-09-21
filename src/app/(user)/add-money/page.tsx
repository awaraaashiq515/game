'use client'
import { useEffect, useState } from 'react'
import { formatINR, formatDate } from '@/lib/utils'
import Link from 'next/link'

interface DepositRequest {
  id: string
  amount: number
  status: string
  adminNote: string | null
  requestedAt: string
  processedAt: string | null
}

const PRESET_AMOUNTS = [100, 250, 500, 1000, 2000, 5000]

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  PENDING:  { label: 'Under Review', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  icon: '⏳' },
  APPROVED: { label: 'Approved',     color: 'var(--success)', bg: 'rgba(16,185,129,0.1)', icon: '✅' },
  REJECTED: { label: 'Rejected',     color: 'var(--error)',   bg: 'rgba(239,68,68,0.1)', icon: '❌' },
}

export default function AddMoneyPage() {
  const [balance, setBalance] = useState(0)
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [history, setHistory] = useState<DepositRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'add' | 'history'>('add')

  function fetchData() {
    Promise.all([
      fetch('/api/user/wallet').then(r => r.json()),
      fetch('/api/user/deposits').then(r => r.json()),
    ]).then(([w, d]) => {
      if (w.success) setBalance(w.data.wallet.availableBalance)
      if (d.success) setHistory(d.data.deposits)
      setLoading(false)
    })
  }

  useEffect(() => { fetchData() }, [])

  async function handleSubmit() {
    setError('')
    const amt = parseFloat(amount)
    if (!amt || amt < 10) { setError('Minimum amount is ₹10'); return }
    if (amt > 100000) { setError('Maximum amount is ₹1,00,000'); return }

    setSubmitting(true)
    try {
      const res = await fetch('/api/user/deposits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: amt, note }),
      })
      const data = await res.json()
      if (data.success) {
        setSuccess(true)
        setAmount('')
        setNote('')
        fetchData()
      } else {
        setError(data.error || 'Something went wrong')
      }
    } catch {
      setError('Request failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="skeleton" style={{ height: 400, borderRadius: 16 }} />

  return (
    <div className="animate-fade-in" style={{ maxWidth: 640, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 6 }}>Add Money</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
          Request to add balance to your wallet. Admin will review and approve.
        </p>
      </div>

      {/* Balance Card */}
      <div className="card" style={{
        marginBottom: 24,
        background: 'linear-gradient(135deg, rgba(108,71,255,0.15) 0%, var(--bg-card) 100%)',
        borderColor: 'rgba(108,71,255,0.3)',
        textAlign: 'center',
        padding: '28px 24px',
      }}>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 6, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Current Balance</div>
        <div style={{ fontSize: 42, fontWeight: 900, color: 'var(--primary)', marginBottom: 4 }}>{formatINR(balance)}</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Virtual Wallet Balance</div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'var(--bg-surface)', borderRadius: 12, padding: 4, border: '1px solid var(--border)' }}>
        {(['add', 'history'] as const).map(t => (
          <button
            key={t}
            onClick={() => { setTab(t); setSuccess(false) }}
            style={{
              flex: 1, padding: '10px 0', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 14,
              background: tab === t ? 'var(--primary)' : 'transparent',
              color: tab === t ? '#fff' : 'var(--text-muted)',
              transition: 'all 0.2s',
            }}
          >
            {t === 'add' ? '➕ Add Money' : '📋 History'}
          </button>
        ))}
      </div>

      {/* ADD MONEY FORM */}
      {tab === 'add' && (
        <>
          {success && (
            <div style={{
              background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.3)',
              borderRadius: 14, padding: '20px 24px', marginBottom: 20, textAlign: 'center',
            }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>✅</div>
              <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 6, color: 'var(--success)' }}>Request Submitted!</div>
              <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.6 }}>
                Your add money request has been sent. Admin will review and credit your wallet soon.
              </p>
              <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => { setSuccess(false); setTab('history') }}>
                View Request History
              </button>
            </div>
          )}

          {!success && (
            <div className="card" style={{ padding: '28px 24px' }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Select Amount</h2>

              {/* Preset amounts */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 }}>
                {PRESET_AMOUNTS.map(preset => (
                  <button
                    key={preset}
                    onClick={() => setAmount(String(preset))}
                    style={{
                      padding: '14px 8px', borderRadius: 12, border: `2px solid ${amount === String(preset) ? 'var(--primary)' : 'var(--border)'}`,
                      background: amount === String(preset) ? 'rgba(108,71,255,0.1)' : 'var(--bg-surface)',
                      cursor: 'pointer', fontWeight: 700, fontSize: 15,
                      color: amount === String(preset) ? 'var(--primary)' : 'var(--text-primary)',
                      transition: 'all 0.2s',
                    }}
                  >
                    ₹{preset.toLocaleString('en-IN')}
                  </button>
                ))}
              </div>

              {/* Custom amount */}
              <div className="input-group" style={{ marginBottom: 16 }}>
                <label className="input-label">Or enter custom amount (₹)</label>
                <input
                  id="deposit-amount"
                  type="number"
                  className="input"
                  placeholder="e.g. 750"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  min={10}
                  max={100000}
                />
              </div>

              {/* Optional note */}
              <div className="input-group" style={{ marginBottom: 24 }}>
                <label className="input-label">Note for admin (optional)</label>
                <input
                  id="deposit-note"
                  type="text"
                  className="input"
                  placeholder="e.g. Topping up wallet"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  maxLength={200}
                />
              </div>

              {error && (
                <div style={{ background: 'var(--error-bg)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '12px 16px', fontSize: 14, color: 'var(--error)', marginBottom: 20 }}>
                  {error}
                </div>
              )}

              {/* Summary */}
              {parseFloat(amount) >= 10 && (
                <div style={{ background: 'var(--bg-surface)', borderRadius: 12, padding: '16px 18px', marginBottom: 20, border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 8 }}>
                    <span style={{ color: 'var(--text-muted)' }}>Requesting amount</span>
                    <span style={{ fontWeight: 800, color: 'var(--primary)', fontSize: 18 }}>₹{parseFloat(amount).toLocaleString('en-IN')}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: 'var(--text-muted)' }}>After approval</span>
                    <span style={{ fontWeight: 600, color: 'var(--success)' }}>+₹{parseFloat(amount).toLocaleString('en-IN')} to wallet</span>
                  </div>
                </div>
              )}

              <button
                id="deposit-submit"
                className="btn btn-primary btn-full btn-lg"
                onClick={handleSubmit}
                disabled={submitting || !amount || parseFloat(amount) < 10}
              >
                {submitting ? 'Submitting...' : '✅ Submit Add Money Request'}
              </button>

              <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', marginTop: 12, lineHeight: 1.6 }}>
                Your request will be reviewed by admin. Balance will be credited to your wallet upon approval.
              </p>
            </div>
          )}
        </>
      )}

      {/* HISTORY TAB */}
      {tab === 'history' && (
        <div className="card">
          {history.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>No requests yet</div>
              <div style={{ fontSize: 13 }}>Your add money requests will appear here</div>
              <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setTab('add')}>Add Money Now</button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {history.map(req => {
                const cfg = STATUS_CONFIG[req.status] ?? STATUS_CONFIG.PENDING
                return (
                  <div key={req.id} style={{
                    background: cfg.bg, border: `1px solid ${cfg.color}44`,
                    borderRadius: 12, padding: '16px 18px',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10,
                  }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 20 }}>{cfg.icon}</span>
                        <span style={{ fontWeight: 800, fontSize: 20, color: cfg.color }}>
                          +₹{req.amount.toLocaleString('en-IN')}
                        </span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: cfg.color, background: `${cfg.color}22`, padding: '2px 8px', borderRadius: 99 }}>
                          {cfg.label}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        Requested: {formatDate(req.requestedAt)}
                        {req.processedAt && ` · Processed: ${formatDate(req.processedAt)}`}
                      </div>
                      {req.adminNote && (
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                          Admin note: {req.adminNote}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      <style>{`
        @media (max-width: 480px) {
          div[style*="grid-template-columns: repeat(3, 1fr)"] { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
    </div>
  )
}
