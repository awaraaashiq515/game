'use client'
import { useEffect, useState } from 'react'
import { formatDate, formatINR } from '@/lib/utils'

interface User {
  id: string; name: string; email: string; mobile: string | null; status: string; createdAt: string; lastLoginAt: string | null
  wallet?: { totalEarned: number; availableBalance: number }
}

const STATUS_ACTIONS: Record<string, { next: string; label: string; style: string }[]> = {
  ACTIVE: [
    { next: 'suspend', label: 'Suspend', style: 'btn-danger' },
    { next: 'review', label: 'Mark Review', style: 'btn-ghost' },
  ],
  SUSPENDED: [{ next: 'restore', label: 'Restore', style: 'btn-success' }],
  UNDER_REVIEW: [
    { next: 'restore', label: 'Restore', style: 'btn-success' },
    { next: 'suspend', label: 'Suspend', style: 'btn-danger' },
  ],
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  function fetchUsers() {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (status) params.set('status', status)
    fetch(`/api/admin/users?${params}`).then(r => r.json()).then(d => {
      if (d.success) { setUsers(d.data.users); setTotal(d.data.total) }
      setLoading(false)
    })
  }

  useEffect(() => { fetchUsers() }, [search, status])

  async function handleAction(userId: string, action: string) {
    setActionLoading(userId + action)
    const res = await fetch('/api/admin/users', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, action }) })
    const data = await res.json()
    if (data.success) fetchUsers()
    setActionLoading(null)
  }

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800 }}>Users</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>{total} total users</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 20, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <input type="search" className="input" placeholder="Search by name, email, mobile..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ maxWidth: 320 }} id="admin-user-search" />
        <select className="input" value={status} onChange={(e) => setStatus(e.target.value)} style={{ maxWidth: 200 }} id="admin-user-status-filter">
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="SUSPENDED">Suspended</option>
          <option value="UNDER_REVIEW">Under Review</option>
        </select>
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Mobile</th>
                <th>Status</th>
                <th>Total Earned</th>
                <th>Balance</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40 }}>Loading...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No users found</td></tr>
              ) : users.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{user.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{user.email}</div>
                  </td>
                  <td>{user.mobile ?? '—'}</td>
                  <td>
                    <span className={`badge ${user.status === 'ACTIVE' ? 'badge-success' : user.status === 'SUSPENDED' ? 'badge-error' : 'badge-warning'}`}>
                      {user.status}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600 }}>{formatINR(user.wallet?.totalEarned ?? 0)}</td>
                  <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{formatINR(user.wallet?.availableBalance ?? 0)}</td>
                  <td>{formatDate(user.createdAt)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {(STATUS_ACTIONS[user.status] ?? []).map((action) => (
                        <button
                          key={action.next}
                          onClick={() => handleAction(user.id, action.next)}
                          className={`btn btn-sm ${action.style}`}
                          disabled={actionLoading === user.id + action.next}
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
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
