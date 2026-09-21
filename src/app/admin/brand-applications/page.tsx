'use client'
import { useEffect, useState } from 'react'

interface BrandApplication {
  id: string
  brandName: string
  contactName: string
  email: string
  phone: string | null
  website: string | null
  category: string
  budget: string
  message: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  adminNote: string | null
  submittedAt: string
  reviewedAt: string | null
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'badge-warning',
  APPROVED: 'badge-success',
  REJECTED: 'badge-error',
}

export default function AdminBrandApplicationsPage() {
  const [applications, setApplications] = useState<BrandApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [selected, setSelected] = useState<BrandApplication | null>(null)
  const [adminNote, setAdminNote] = useState('')
  const [acting, setActing] = useState(false)

  function fetchApplications(status?: string) {
    setLoading(true)
    const url = status && status !== 'all' ? `/api/brand-applications?status=${status}` : '/api/brand-applications'
    fetch(url)
      .then(r => r.json())
      .then(d => {
        if (d.success) setApplications(d.data)
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchApplications(filterStatus)
  }, [filterStatus])

  async function handleAction(id: string, status: 'APPROVED' | 'REJECTED') {
    setActing(true)
    const res = await fetch('/api/brand-applications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status, adminNote }),
    })
    const data = await res.json()
    if (data.success) {
      setSelected(null)
      setAdminNote('')
      fetchApplications(filterStatus)
    }
    setActing(false)
  }

  const counts = {
    all: applications.length,
    pending: applications.filter(a => a.status === 'PENDING').length,
    approved: applications.filter(a => a.status === 'APPROVED').length,
    rejected: applications.filter(a => a.status === 'REJECTED').length,
  }

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>Brand Applications</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
          Brands jo apna ad Virelo pe lagwana chahte hain unki applications yahan aayengi.
        </p>
      </div>

      {/* ─── Stats Row ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total', value: counts.all, color: 'var(--text-primary)' },
          { label: 'Pending', value: counts.pending, color: '#f59e0b' },
          { label: 'Approved', value: counts.approved, color: 'var(--success)' },
          { label: 'Rejected', value: counts.rejected, color: 'var(--error)' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ─── Filter Tabs ─── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['all', 'PENDING', 'APPROVED', 'REJECTED'].map(s => (
          <button
            key={s}
            id={`brand-filter-${s.toLowerCase()}`}
            onClick={() => setFilterStatus(s)}
            className={`btn btn-sm ${filterStatus === s ? 'btn-primary' : 'btn-ghost'}`}
          >
            {s === 'all' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* ─── Table ─── */}
      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Brand</th>
                <th>Contact</th>
                <th>Category</th>
                <th>Budget</th>
                <th>Status</th>
                <th>Submitted</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>
                    Loading applications…
                  </td>
                </tr>
              ) : applications.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>
                    Koi application nahi mili.
                  </td>
                </tr>
              ) : (
                applications.map(app => (
                  <tr key={app.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{app.brandName}</div>
                      {app.website && (
                        <a href={app.website} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: 'var(--primary)' }}>
                          {app.website.replace(/^https?:\/\//, '')}
                        </a>
                      )}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{app.contactName}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{app.email}</div>
                      {app.phone && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{app.phone}</div>}
                    </td>
                    <td style={{ fontSize: 13 }}>{app.category}</td>
                    <td>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--success)' }}>{app.budget}</span>
                    </td>
                    <td>
                      <span className={`badge ${STATUS_COLORS[app.status]}`}>{app.status}</span>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {new Date(app.submittedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td>
                      <button
                        id={`brand-view-${app.id}`}
                        className="btn btn-sm btn-ghost"
                        onClick={() => { setSelected(app); setAdminNote(app.adminNote ?? '') }}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Detail Modal ─── */}
      {selected && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(4px)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
          onClick={e => { if (e.target === e.currentTarget) setSelected(null) }}
        >
          <div
            className="card animate-fade-in"
            style={{ width: '100%', maxWidth: 600, maxHeight: '90vh', overflowY: 'auto', borderColor: 'rgba(108,71,255,0.3)' }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 800 }}>{selected.brandName}</h2>
                <span className={`badge ${STATUS_COLORS[selected.status]}`} style={{ marginTop: 6 }}>{selected.status}</span>
              </div>
              <button onClick={() => setSelected(null)} className="btn btn-ghost btn-sm">✕</button>
            </div>

            {/* Details grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
              {[
                { label: 'Contact Person', value: selected.contactName },
                { label: 'Email', value: selected.email },
                { label: 'Phone', value: selected.phone ?? '—' },
                { label: 'Website', value: selected.website ?? '—' },
                { label: 'Category', value: selected.category },
                { label: 'Monthly Budget', value: selected.budget },
              ].map(item => (
                <div key={item.label}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.label}</div>
                  <div style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 500 }}>{item.value}</div>
                </div>
              ))}
            </div>

            {/* Campaign message */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Campaign Description</div>
              <div
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                  padding: '12px 14px',
                  fontSize: 14,
                  lineHeight: 1.7,
                  color: 'var(--text-secondary)',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {selected.message}
              </div>
            </div>

            {/* Admin note */}
            <div className="input-group" style={{ marginBottom: 20 }}>
              <label className="input-label" htmlFor="admin-note-input">Admin Note (optional)</label>
              <textarea
                id="admin-note-input"
                className="input"
                rows={3}
                placeholder="Reason for approval/rejection or any internal notes…"
                value={adminNote}
                onChange={e => setAdminNote(e.target.value)}
                style={{ resize: 'vertical' }}
              />
            </div>

            {/* Action buttons */}
            {selected.status === 'PENDING' ? (
              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  id="brand-approve-btn"
                  className="btn btn-success"
                  style={{ flex: 1 }}
                  disabled={acting}
                  onClick={() => handleAction(selected.id, 'APPROVED')}
                >
                  {acting ? '…' : '✅ Approve'}
                </button>
                <button
                  id="brand-reject-btn"
                  className="btn btn-danger"
                  style={{ flex: 1 }}
                  disabled={acting}
                  onClick={() => handleAction(selected.id, 'REJECTED')}
                >
                  {acting ? '…' : '✕ Reject'}
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ flex: 1, fontSize: 13, color: 'var(--text-muted)' }}>
                  Reviewed on {selected.reviewedAt ? new Date(selected.reviewedAt).toLocaleDateString('en-IN') : '—'}
                </div>
                <button onClick={() => setSelected(null)} className="btn btn-ghost">Close</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
