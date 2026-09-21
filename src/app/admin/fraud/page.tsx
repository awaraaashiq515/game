'use client'
import { useEffect, useState } from 'react'
import { formatDate } from '@/lib/utils'

interface FraudEvent {
  id: string; type: string; severity: string; description: string; user: { name: string; email: string } | null
  ipAddress: string | null; resolved: boolean; createdAt: string
}

const SEVERITY_BADGE: Record<string, string> = { LOW: 'badge-secondary', MEDIUM: 'badge-warning', HIGH: 'badge-error', CRITICAL: 'badge-error' }

export default function AdminFraudPage() {
  const [events, setEvents] = useState<FraudEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [resolved, setResolved] = useState('false')
  const [severity, setSeverity] = useState('')

  function fetchEvents() {
    setLoading(true)
    const params = new URLSearchParams({ resolved })
    if (severity) params.set('severity', severity)
    fetch(`/api/admin/fraud?${params}`).then(r => r.json()).then(d => {
      if (d.success) setEvents(d.data.events)
      setLoading(false)
    })
  }

  useEffect(() => { fetchEvents() }, [resolved, severity])

  async function resolveEvent(eventId: string) {
    await fetch('/api/admin/fraud', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ eventId }) })
    fetchEvents()
  }

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800 }}>Fraud & Risk</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Monitor and manage suspicious activity</p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {[{ label: 'Open', value: 'false' }, { label: 'Resolved', value: 'true' }, { label: 'All', value: '' }].map((f) => (
            <button key={f.value} onClick={() => setResolved(f.value)} className={`btn btn-sm ${resolved === f.value ? 'btn-primary' : 'btn-ghost'}`}>{f.label}</button>
          ))}
        </div>
        <select className="input" value={severity} onChange={e => setSeverity(e.target.value)} style={{ maxWidth: 160 }} id="fraud-severity-filter">
          <option value="">All Severities</option>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
          <option value="CRITICAL">Critical</option>
        </select>
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Type</th>
                <th>Severity</th>
                <th>User</th>
                <th>Description</th>
                <th>IP</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40 }}>Loading...</td></tr>
              ) : events.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No fraud events found 🎉</td></tr>
              ) : events.map((e) => (
                <tr key={e.id}>
                  <td style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 600 }}>{e.type}</td>
                  <td><span className={`badge ${SEVERITY_BADGE[e.severity] ?? 'badge-secondary'}`}>{e.severity}</span></td>
                  <td>
                    {e.user ? (
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{e.user.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{e.user.email}</div>
                      </div>
                    ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                  </td>
                  <td style={{ maxWidth: 280, fontSize: 13 }}>{e.description}</td>
                  <td style={{ fontSize: 12, fontFamily: 'monospace' }}>{e.ipAddress ?? '—'}</td>
                  <td style={{ fontSize: 13 }}>{formatDate(e.createdAt)}</td>
                  <td>
                    {!e.resolved && (
                      <button onClick={() => resolveEvent(e.id)} className="btn btn-success btn-sm">Resolve</button>
                    )}
                    {e.resolved && <span className="badge badge-success">Resolved</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
