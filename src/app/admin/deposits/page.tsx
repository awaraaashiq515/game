'use client'
import { useEffect, useState } from 'react'
import { formatINR, formatDate } from '@/lib/utils'

interface DepositRequest {
  id: string
  user: { name: string; email: string }
  amount: number
  status: string
  adminNote: string | null
  utrNumber: string | null
  requestedAt: string
  processedAt: string | null
  isActivation: boolean
}

const STATUS_BADGE: Record<string, string> = {
  PENDING: 'badge-warning',
  APPROVED: 'badge-success',
  REJECTED: 'badge-error',
}

export default function AdminDepositsPage() {
  const [deposits, setDeposits] = useState<DepositRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('PENDING')
  const [actionModal, setActionModal] = useState<{ deposit: DepositRequest; action: 'approve' | 'reject' } | null>(null)
  const [adminNote, setAdminNote] = useState('')
  const [processing, setProcessing] = useState(false)
  const [toast, setToast] = useState('')

  function fetchDeposits() {
    setLoading(true)
    const params = new URLSearchParams()
    if (statusFilter) params.set('status', statusFilter)
    fetch(`/api/admin/deposits?${params}`)
      .then(r => r.json())
      .then(d => {
        if (d.success) setDeposits(d.data.deposits.map((dep: DepositRequest & { adminNote: string | null }) => ({
          ...dep,
          isActivation: dep.adminNote?.includes('WITHDRAWAL_ACTIVATION_FEE') ?? false,
        })))
        setLoading(false)
      })
  }

  useEffect(() => { fetchDeposits() }, [statusFilter])

  async function submitAction() {
    if (!actionModal) return
    setProcessing(true)
    const res = await fetch('/api/admin/deposits', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ depositId: actionModal.deposit.id, action: actionModal.action, adminNote }),
    })
    const data = await res.json()
    if (data.success) {
      setToast(data.message || 'Done!')
      setTimeout(() => setToast(''), 3000)
    }
    setActionModal(null)
    setAdminNote('')
    fetchDeposits()
    setProcessing(false)
  }

  const pendingCount = deposits.filter(d => d.status === 'PENDING').length

  return (
    <div className="animate-fade-in">
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 24, right: 24, zIndex: 9999,
          background: 'var(--success)', color: '#fff', padding: '14px 20px',
          borderRadius: 12, fontWeight: 700, fontSize: 14, boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          animation: 'fadeIn 0.3s ease',
        }}>
          ✅ {toast}
        </div>
      )}

      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800 }}>Add Money Requests</h1>
          {pendingCount > 0 && statusFilter === 'PENDING' && (
            <span className="badge badge-warning" style={{ fontSize: 13, padding: '4px 12px' }}>{pendingCount} pending</span>
          )}
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
          Review and approve user wallet top-up requests
        </p>
      </div>

      {/* Status Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { key: 'PENDING', label: '⏳ Pending' },
          { key: 'APPROVED', label: '✅ Approved' },
          { key: 'REJECTED', label: '❌ Rejected' },
          { key: '', label: 'All' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setStatusFilter(key)}
            className={`btn btn-sm ${statusFilter === key ? 'btn-primary' : 'btn-ghost'}`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Amount / Type</th>
                <th>UTR / Ref</th>
                <th>Status</th>
                <th>Requested</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40 }}>Loading...</td></tr>
              ) : deposits.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No requests found</td></tr>
              ) : deposits.map(d => (
                <tr key={d.id} style={{ background: d.isActivation ? 'rgba(245,158,11,0.04)' : undefined }}>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{d.user.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{d.user.email}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 800, color: d.isActivation ? '#f59e0b' : 'var(--success)', fontSize: 16 }}>
                      +{formatINR(d.amount)}
                    </div>
                    {d.isActivation && (
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#f59e0b', background: 'rgba(245,158,11,0.12)', padding: '1px 6px', borderRadius: 99 }}>
                        🔓 ACTIVATION FEE
                      </span>
                    )}
                  </td>
                  <td style={{ fontSize: 13 }}>
                    {d.utrNumber ? (
                      <span style={{ fontFamily: 'monospace', color: 'var(--text-primary)', fontWeight: 600 }}>{d.utrNumber}</span>
                    ) : '—'}
                  </td>
                  <td>
                    <span className={`badge ${STATUS_BADGE[d.status] ?? 'badge-warning'}`}>{d.status}</span>
                  </td>
                  <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{formatDate(d.requestedAt)}</td>
                  <td>
                    {d.status === 'PENDING' ? (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          className="btn btn-sm"
                          onClick={() => { setActionModal({ deposit: d, action: 'approve' }); setAdminNote('') }}
                          id={`deposit-approve-${d.id}`}
                          style={{ background: 'var(--success)', color: '#fff', border: 'none' }}
                        >
                          ✅ Approve
                        </button>
                        <button
                          className="btn btn-sm btn-ghost"
                          onClick={() => { setActionModal({ deposit: d, action: 'reject' }); setAdminNote('') }}
                          id={`deposit-reject-${d.id}`}
                          style={{ color: 'var(--error)' }}
                        >
                          ❌ Reject
                        </button>
                      </div>
                    ) : (
                      <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{d.processedAt ? formatDate(d.processedAt) : '—'}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Modal */}
      {actionModal && (
        <div className="modal-overlay" onClick={() => setActionModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>
              {actionModal.action === 'approve' ? '✅ Approve Request' : '❌ Reject Request'}
            </h2>

            <div style={{ background: 'var(--bg-surface)', borderRadius: 12, padding: '16px', marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14 }}>
                <span style={{ color: 'var(--text-muted)' }}>User</span>
                <span style={{ fontWeight: 700 }}>{actionModal.deposit.user.name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                <span style={{ color: 'var(--text-muted)' }}>Amount</span>
                <span style={{ fontWeight: 800, fontSize: 20, color: actionModal.action === 'approve' ? 'var(--success)' : 'var(--error)' }}>
                  {formatINR(actionModal.deposit.amount)}
                </span>
              </div>
            </div>

            {actionModal.action === 'approve' && (
              <div style={{
                background: actionModal.deposit.isActivation ? 'rgba(245,158,11,0.08)' : 'rgba(16,185,129,0.08)',
                border: `1px solid ${actionModal.deposit.isActivation ? 'rgba(245,158,11,0.3)' : 'rgba(16,185,129,0.3)'}`,
                borderRadius: 10, padding: '12px 14px', fontSize: 13,
                color: actionModal.deposit.isActivation ? '#f59e0b' : 'var(--success)', marginBottom: 20,
              }}>
                {actionModal.deposit.isActivation
                  ? `🔓 Approving will unlock withdrawal for ${actionModal.deposit.user.name}. ₹${actionModal.deposit.amount} added to admin pool.`
                  : `💡 Approving will instantly add ${formatINR(actionModal.deposit.amount)} to ${actionModal.deposit.user.name}'s wallet.`
                }
              </div>
            )}

            <div className="input-group" style={{ marginBottom: 24 }}>
              <label className="input-label">Admin Note (optional)</label>
              <input
                type="text"
                className="input"
                placeholder={actionModal.action === 'approve' ? 'e.g. Verified and credited' : 'Reason for rejection'}
                value={adminNote}
                onChange={e => setAdminNote(e.target.value)}
                id="deposit-admin-note"
              />
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-ghost btn-full" onClick={() => setActionModal(null)}>Cancel</button>
              <button
                className={`btn btn-full ${actionModal.action === 'approve' ? 'btn-primary' : ''}`}
                style={actionModal.action === 'reject' ? { background: 'var(--error)', color: '#fff', border: 'none' } : {}}
                onClick={submitAction}
                disabled={processing}
                id="deposit-confirm"
              >
                {processing ? 'Processing...' : actionModal.action === 'approve' ? '✅ Confirm Approve' : '❌ Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
