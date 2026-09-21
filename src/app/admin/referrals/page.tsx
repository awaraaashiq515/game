'use client'
import { useEffect, useState } from 'react'
import { formatDate } from '@/lib/utils'

interface Referral {
  id: string
  referrer: { name: string; email: string }
  referee: { name: string; email: string }
  status: string
  rewardAmount: number | null
  createdAt: string
  qualifiedAt: string | null
}

const STATUS_BADGE: Record<string, string> = {
  PENDING: 'badge-warning',
  QUALIFIED: 'badge-primary',
  REWARDED: 'badge-success',
}

export default function AdminReferralsPage() {
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (statusFilter) params.set('status', statusFilter)
    fetch(`/api/admin/referrals?${params}`)
      .then(r => r.json())
      .then(d => {
        if (d.success) setReferrals(d.data)
        setLoading(false)
      })
  }, [statusFilter])

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800 }}>Referrals</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Track all referral relationships and reward statuses.</p>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['', 'PENDING', 'QUALIFIED', 'REWARDED'].map((s) => (
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
                <th>Referrer</th>
                <th>Referred Friend</th>
                <th>Status</th>
                <th>Reward</th>
                <th>Joined</th>
                <th>Qualified At</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40 }}>Loading...</td></tr>
              ) : referrals.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No referrals found</td></tr>
              ) : referrals.map((r) => (
                <tr key={r.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{r.referrer.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{r.referrer.email}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{r.referee.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{r.referee.email}</div>
                  </td>
                  <td><span className={`badge ${STATUS_BADGE[r.status] ?? 'badge-secondary'}`}>{r.status}</span></td>
                  <td style={{ fontWeight: 700, color: r.rewardAmount ? 'var(--success)' : 'var(--text-muted)' }}>
                    {r.rewardAmount ? `₹${r.rewardAmount}` : '—'}
                  </td>
                  <td style={{ fontSize: 13 }}>{formatDate(r.createdAt)}</td>
                  <td style={{ fontSize: 13 }}>{r.qualifiedAt ? formatDate(r.qualifiedAt) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
