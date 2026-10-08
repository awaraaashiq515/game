'use client'
import { useEffect, useState, useCallback } from 'react'
import { formatDate, formatINR } from '@/lib/utils'

interface User {
  id: string
  name: string
  email: string
  mobile: string | null
  status: string
  referralCode?: string
  createdAt: string
  lastLoginAt: string | null
  wallet?: {
    totalEarned: number
    availableBalance: number
    totalWithdrawn?: number
  }
}

const STATUS_ACTIONS: Record<string, { next: string; label: string; style: string }[]> = {
  ACTIVE: [
    { next: 'suspend', label: 'Suspend', style: 'btn-danger' },
  ],
  SUSPENDED: [
    { next: 'restore', label: 'Restore', style: 'btn-success' },
  ],
  UNDER_REVIEW: [
    { next: 'restore', label: 'Restore', style: 'btn-success' },
    { next: 'suspend', label: 'Suspend', style: 'btn-danger' },
  ],
  DELETED: [
    { next: 'restore', label: 'Restore', style: 'btn-success' },
  ],
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Edit Modal State
  const [editUser, setEditUser] = useState<User | null>(null)
  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editMobile, setEditMobile] = useState('')
  const [editStatus, setEditStatus] = useState('ACTIVE')
  const [editBalance, setEditBalance] = useState<string>('0')
  const [editPassword, setEditPassword] = useState('')
  const [editSubmitting, setEditSubmitting] = useState(false)
  const [editError, setEditError] = useState('')

  // Delete Modal State
  const [deleteUser, setDeleteUser] = useState<User | null>(null)
  const [deleteMode, setDeleteMode] = useState<'permanent' | 'soft'>('permanent')
  const [deleteSubmitting, setDeleteSubmitting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  // Toast Notification
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }, [])

  const fetchUsers = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (status) params.set('status', status)
    fetch(`/api/admin/users?${params}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setUsers(d.data.users)
          setTotal(d.data.total)
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [search, status])

  useEffect(() => {
    let ignore = false
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (status) params.set('status', status)

    fetch(`/api/admin/users?${params}`)
      .then((r) => r.json())
      .then((d) => {
        if (!ignore) {
          if (d.success) {
            setUsers(d.data.users)
            setTotal(d.data.total)
          }
          setLoading(false)
        }
      })
      .catch(() => {
        if (!ignore) setLoading(false)
      })

    return () => {
      ignore = true
    }
  }, [search, status])

  // Quick Status Action (Suspend / Restore)
  async function handleAction(userId: string, action: string) {
    setActionLoading(userId + action)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action }),
      })
      const data = await res.json()
      if (data.success) {
        showToast(data.message || 'Status updated')
        fetchUsers()
      } else {
        showToast(data.error || 'Failed to update status', 'error')
      }
    } catch {
      showToast('Action failed', 'error')
    }
    setActionLoading(null)
  }

  // Open Edit Modal
  function openEditModal(user: User) {
    setEditUser(user)
    setEditName(user.name)
    setEditEmail(user.email)
    setEditMobile(user.mobile ?? '')
    setEditStatus(user.status)
    setEditBalance(String(user.wallet?.availableBalance ?? 0))
    setEditPassword('')
    setEditError('')
  }

  // Submit Edit User
  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editUser) return
    setEditSubmitting(true)
    setEditError('')

    try {
      const parsedBalance = parseFloat(editBalance)
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: editUser.id,
          name: editName.trim(),
          email: editEmail.trim(),
          mobile: editMobile.trim() || null,
          status: editStatus,
          availableBalance: isNaN(parsedBalance) ? undefined : parsedBalance,
          password: editPassword.trim() || undefined,
        }),
      })

      const data = await res.json()
      if (data.success) {
        showToast(`User ${editName} updated successfully!`)
        setEditUser(null)
        fetchUsers()
      } else {
        setEditError(data.error || 'Failed to update user')
      }
    } catch {
      setEditError('Network error while updating user')
    } finally {
      setEditSubmitting(false)
    }
  }

  // Open Delete Modal
  function openDeleteModal(user: User) {
    setDeleteUser(user)
    setDeleteMode('permanent')
    setDeleteError('')
  }

  // Submit Delete User
  async function handleConfirmDelete() {
    if (!deleteUser) return
    setDeleteSubmitting(true)
    setDeleteError('')

    try {
      const res = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: deleteUser.id,
          mode: deleteMode,
        }),
      })

      const data = await res.json()
      if (data.success) {
        showToast(data.message || `User deleted successfully`)
        setDeleteUser(null)
        fetchUsers()
      } else {
        setDeleteError(data.error || 'Failed to delete user')
      }
    } catch {
      setDeleteError('Network error while deleting user')
    } finally {
      setDeleteSubmitting(false)
    }
  }

  return (
    <div className="animate-fade-in admin-users-page">
      {/* Toast Notification */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            top: 24,
            right: 24,
            zIndex: 100,
            background: toast.type === 'success' ? '#10b981' : '#ef4444',
            color: '#fff',
            padding: '12px 20px',
            borderRadius: 12,
            fontWeight: 700,
            fontSize: 14,
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
            animation: 'fadeIn 0.2s ease',
          }}
        >
          {toast.type === 'success' ? '✓ ' : '⚠️ '} {toast.message}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)' }}>Users Management</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            {total} registered users • Edit profiles, adjust balances, and delete accounts
          </p>
        </div>
        <button
          onClick={fetchUsers}
          className="btn btn-secondary btn-sm"
          type="button"
          disabled={loading}
        >
          🔄 Refresh Users
        </button>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 20, display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="search"
          className="input"
          placeholder="Search name, email, mobile, ref code..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 340 }}
          id="admin-user-search"
        />
        <select
          className="input"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          style={{ maxWidth: 200 }}
          id="admin-user-status-filter"
        >
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="SUSPENDED">Suspended</option>
          <option value="UNDER_REVIEW">Under Review</option>
          <option value="DELETED">Deleted</option>
        </select>
        {(search || status) && (
          <button
            onClick={() => { setSearch(''); setStatus('') }}
            className="btn btn-ghost btn-sm"
            type="button"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Users Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-wrapper">
          <table style={{ width: '100%', minWidth: 700 }}>
            <thead>
              <tr>
                <th>User Details</th>
                <th>Mobile</th>
                <th>Status</th>
                <th>Wallet Balance</th>
                <th>Total Earned</th>
                <th>Joined</th>
                <th style={{ textAlign: 'center' }}>Management Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>
                    <div className="animate-spin" style={{ width: 28, height: 28, border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', margin: '0 auto 10px' }} />
                    Loading users...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>
                    No users matching criteria
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: '50%',
                            background: 'var(--primary-gradient)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            color: '#fff',
                            fontSize: 13,
                            flexShrink: 0,
                          }}
                        >
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span>{user.name}</span>
                            {user.referralCode && (
                              <span style={{ fontSize: 10, background: 'rgba(255,255,255,0.06)', padding: '1px 6px', borderRadius: 4, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                                {user.referralCode}
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize: 13 }}>{user.mobile ?? '—'}</td>
                    <td>
                      <span
                        className={`badge ${
                          user.status === 'ACTIVE'
                            ? 'badge-success'
                            : user.status === 'SUSPENDED'
                            ? 'badge-error'
                            : user.status === 'UNDER_REVIEW'
                            ? 'badge-warning'
                            : 'badge-secondary'
                        }`}
                      >
                        {user.status}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--primary)', fontSize: 14 }}>
                      {formatINR(user.wallet?.availableBalance ?? 0)}
                    </td>
                    <td style={{ fontWeight: 600, fontSize: 13 }}>
                      {formatINR(user.wallet?.totalEarned ?? 0)}
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{formatDate(user.createdAt)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'center', alignItems: 'center' }}>
                        {/* Edit Button */}
                        <button
                          onClick={() => openEditModal(user)}
                          className="btn btn-secondary btn-sm"
                          type="button"
                          style={{ padding: '6px 12px', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                          title="Edit user details"
                        >
                          <span>✏️</span>
                          <span>Edit</span>
                        </button>

                        {/* Quick Status Action */}
                        {(STATUS_ACTIONS[user.status] ?? []).map((action) => (
                          <button
                            key={action.next}
                            onClick={() => handleAction(user.id, action.next)}
                            className={`btn btn-sm ${action.style}`}
                            disabled={actionLoading === user.id + action.next}
                            type="button"
                            style={{ padding: '6px 10px', fontSize: 12 }}
                          >
                            {actionLoading === user.id + action.next ? '...' : action.label}
                          </button>
                        ))}

                        {/* Delete Button */}
                        <button
                          onClick={() => openDeleteModal(user)}
                          className="btn btn-danger btn-sm"
                          type="button"
                          style={{ padding: '6px 12px', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                          title="Delete user"
                        >
                          <span>🗑️</span>
                          <span>Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Edit User Modal ── */}
      {editUser && (
        <div className="modal-overlay" onClick={() => setEditUser(null)}>
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 520, maxHeight: '90vh', overflowY: 'auto' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 24 }}>✏️</span>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>Edit User Profile</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditUser(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 20, cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {editError && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: 'var(--error)', padding: '10px 14px', borderRadius: 10, fontSize: 13, marginBottom: 16 }}>
                ⚠️ {editError}
              </div>
            )}

            <form onSubmit={handleSaveEdit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Name */}
                <div className="input-group">
                  <label className="input-label">Full Name *</label>
                  <input
                    type="text"
                    className="input"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                  />
                </div>

                {/* Email */}
                <div className="input-group">
                  <label className="input-label">Email Address *</label>
                  <input
                    type="email"
                    className="input"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    required
                  />
                </div>

                {/* Mobile */}
                <div className="input-group">
                  <label className="input-label">Mobile Number</label>
                  <input
                    type="tel"
                    className="input"
                    placeholder="10-digit number"
                    value={editMobile}
                    onChange={(e) => setEditMobile(e.target.value)}
                  />
                </div>

                {/* Status & Available Balance Row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="input-group">
                    <label className="input-label">Account Status</label>
                    <select
                      className="input"
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="SUSPENDED">SUSPENDED</option>
                      <option value="UNDER_REVIEW">UNDER_REVIEW</option>
                      <option value="DELETED">DELETED</option>
                    </select>
                  </div>

                  <div className="input-group">
                    <label className="input-label">Wallet Balance (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="input"
                      value={editBalance}
                      onChange={(e) => setEditBalance(e.target.value)}
                    />
                  </div>
                </div>

                {/* Password Reset */}
                <div className="input-group">
                  <label className="input-label">Reset Password (Optional)</label>
                  <input
                    type="password"
                    className="input"
                    placeholder="Leave blank to keep existing password"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    Only fill this if you want to override and set a new password. Minimum 6 characters.
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setEditUser(null)}
                  className="btn btn-ghost"
                  disabled={editSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={editSubmitting}
                >
                  {editSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ── */}
      {deleteUser && (
        <div className="modal-overlay" onClick={() => setDeleteUser(null)}>
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 460 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <span style={{ fontSize: 26 }}>⚠️</span>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--error)' }}>Delete User Account</h3>
            </div>

            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.5 }}>
              Are you sure you want to delete user <strong style={{ color: 'var(--text-primary)' }}>{deleteUser.name}</strong> ({deleteUser.email})?
            </p>

            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 14, marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>User Summary</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                <span>Wallet Balance:</span>
                <strong style={{ color: 'var(--primary)' }}>{formatINR(deleteUser.wallet?.availableBalance ?? 0)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span>Total Earned:</span>
                <strong>{formatINR(deleteUser.wallet?.totalEarned ?? 0)}</strong>
              </div>
            </div>

            {/* Deletion Mode Radio */}
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>Deletion Type:</div>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: 'var(--text-secondary)', cursor: 'pointer', marginBottom: 8 }}>
                <input
                  type="radio"
                  name="deleteMode"
                  checked={deleteMode === 'permanent'}
                  onChange={() => setDeleteMode('permanent')}
                  style={{ marginTop: 2 }}
                />
                <div>
                  <strong style={{ color: 'var(--error)' }}>Permanent Delete (Recommended)</strong>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Completely wipes the user and associated records from the database.</div>
                </div>
              </label>

              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="deleteMode"
                  checked={deleteMode === 'soft'}
                  onChange={() => setDeleteMode('soft')}
                  style={{ marginTop: 2 }}
                />
                <div>
                  <strong style={{ color: 'var(--text-primary)' }}>Soft Delete (Mark as DELETED)</strong>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Sets user status to DELETED. User cannot log in, but history remains.</div>
                </div>
              </label>
            </div>

            {deleteError && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: 'var(--error)', padding: '10px 14px', borderRadius: 10, fontSize: 13, marginBottom: 16 }}>
                ⚠️ {deleteError}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setDeleteUser(null)}
                className="btn btn-ghost"
                disabled={deleteSubmitting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="btn btn-danger"
                disabled={deleteSubmitting}
              >
                {deleteSubmitting ? 'Deleting...' : deleteMode === 'permanent' ? 'Delete Permanently' : 'Soft Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
