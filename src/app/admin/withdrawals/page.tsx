'use client'
import { useEffect, useState } from 'react'
import { formatDate, formatINR } from '@/lib/utils'

interface Withdrawal {
  id: string; requestId: string; user: { name: string; email: string }; amount: number; method: string
  accountDetails: Record<string, string>; status: string; requestedAt: string; processedAt: string | null; adminNote: string | null
}

export default function AdminWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('PENDING')
  const [actionModal, setActionModal] = useState<{ withdrawal: Withdrawal; action: 'approve' | 'reject' | 'paid' } | null>(null)
  const [note, setNote] = useState('')
  const [paymentRef, setPaymentRef] = useState('')
  const [processing, setProcessing] = useState(false)

  function fetchWithdrawals() {
    setLoading(true)
    const params = new URLSearchParams()
    if (statusFilter) params.set('status', statusFilter)
    fetch(`/api/admin/withdrawals?${params}`).then(r => r.json()).then(d => {
      if (d.success) setWithdrawals(d.data.withdrawals)
      setLoading(false)
    })
  }

  useEffect(() => { fetchWithdrawals() }, [statusFilter])

  async function submitAction() {
    if (!actionModal) return
    setProcessing(true)
    await fetch('/api/admin/withdrawals', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ withdrawalId: actionModal.withdrawal.id, action: actionModal.action, adminNote: note, paymentRef }),
    })
    setActionModal(null)
    setNote('')
    setPaymentRef('')
    fetchWithdrawals()
    setProcessing(false)
  }

  const STATUS_CONFIG: Record<string, { badge: string }> = {
    PENDING: { badge: 'badge-warning' }, APPROVED: { badge: 'badge-primary' },
    REJECTED: { badge: 'badge-error' }, PAID: { badge: 'badge-success' }, FAILED: { badge: 'badge-error' },
  }

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800 }}>Withdrawals</h1>
      </div>

      {/* Status filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {['PENDING', 'APPROVED', 'PAID', 'REJECTED', ''].map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)} className={`btn btn-sm ${statusFilter === s ? 'btn-primary' : 'btn-ghost'}`}>
            {s || 'All'}
          </button>
        ))}
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Request ID</th>
                <th>User</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40 }}>Loading...</td></tr>
              ) : withdrawals.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No withdrawals found</td></tr>
              ) : withdrawals.map((w) => (
                <tr key={w.id}>
                  <td style={{ fontFamily: 'monospace', color: 'var(--primary)', fontWeight: 600 }}>{w.requestId}</td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{w.user.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{w.user.email}</div>
                  </td>
                  <td style={{ fontWeight: 700, fontSize: 16 }}>{formatINR(w.amount)}</td>
                  <td>{w.method}</td>
                  <td>{formatDate(w.requestedAt)}</td>
                  <td><span className={`badge ${STATUS_CONFIG[w.status]?.badge ?? 'badge-secondary'}`}>{w.status}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {w.status === 'PENDING' && (
                        <>
                          <button onClick={() => setActionModal({ withdrawal: w, action: 'approve' })} className="btn btn-success btn-sm">Approve</button>
                          <button onClick={() => setActionModal({ withdrawal: w, action: 'reject' })} className="btn btn-danger btn-sm">Reject</button>
                        </>
                      )}
                      {w.status === 'APPROVED' && (
                        <button onClick={() => setActionModal({ withdrawal: w, action: 'paid' })} className="btn btn-primary btn-sm">Mark Paid</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action modal */}
      {actionModal && (
        <div className="modal-overlay" onClick={() => setActionModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 style={{ marginBottom: 16, textTransform: 'capitalize' }}>{actionModal.action} Withdrawal</h2>
            <div style={{ padding: 14, background: 'var(--bg-surface)', borderRadius: 10, marginBottom: 16, fontSize: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ color: 'var(--text-muted)' }}>User</span>
                <span style={{ fontWeight: 600 }}>{actionModal.withdrawal.user.name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ color: 'var(--text-muted)' }}>Amount</span>
                <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: 16 }}>{formatINR(actionModal.withdrawal.amount)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Method</span>
                <span>{actionModal.withdrawal.method}</span>
              </div>
            </div>

            {actionModal.action === 'paid' && (
              <div className="input-group" style={{ marginBottom: 14 }}>
                <label className="input-label">Payment Reference / UTR</label>
                <input type="text" className="input" id="admin-payment-ref" placeholder="Enter UTR or transaction reference" value={paymentRef} onChange={(e) => setPaymentRef(e.target.value)} />
              </div>
            )}

            <div className="input-group" style={{ marginBottom: 20 }}>
              <label className="input-label">Admin Note (optional)</label>
              <textarea className="input" id="admin-note" rows={3} placeholder="Note for user or internal record..." value={note} onChange={(e) => setNote(e.target.value)} style={{ resize: 'none' }} />
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-ghost btn-full" onClick={() => setActionModal(null)}>Cancel</button>
              <button
                className={`btn btn-full ${actionModal.action === 'reject' ? 'btn-danger' : 'btn-primary'}`}
                onClick={submitAction}
                disabled={processing}
                id="admin-action-confirm"
              >
                {processing ? 'Processing...' : `Confirm ${actionModal.action}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
