'use client'
import { useEffect, useState } from 'react'
import { formatINR, formatDate } from '@/lib/utils'

interface UnlockUser {
  id: string
  userId: string
  user: {
    id: string
    name: string
    email: string
    mobile: string | null
    createdAt: string
    wallet: { availableBalance: number; totalEarned: number } | null
  }
  amount: number
  utrNumber: string
  senderUpi: string | null
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  requestedAt: string
  processedAt: string | null
  isActivated: boolean
  unlockAt: string | null
  isUnlocked: boolean
}

const PRESETS = [
  { id: 'instant', label: '⚡ Instant (Right Now)', desc: 'User can withdraw immediately' },
  { id: '30m', label: '⏱️ In 30 Minutes', desc: '+30 minutes from now' },
  { id: '1h', label: '⏱️ In 1 Hour', desc: '+1 hour from now' },
  { id: '2h', label: '⏱️ In 2 Hours', desc: '+2 hours from now' },
  { id: '6h', label: '⏱️ In 6 Hours', desc: '+6 hours from now' },
  { id: '12h', label: '⏱️ In 12 Hours', desc: '+12 hours from now' },
  { id: '24h', label: '⏱️ In 24 Hours (1 Day)', desc: '+24 hours from now' },
  { id: 'custom', label: '📅 Custom Date & Time', desc: 'Pick specific date & time' },
]

export default function AdminWithdrawalUnlocksPage() {
  const [items, setItems] = useState<UnlockUser[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'SCHEDULED' | 'UNLOCKED'>('ALL')
  const [modalUser, setModalUser] = useState<UnlockUser | null>(null)
  const [selectedPreset, setSelectedPreset] = useState('1h')
  const [customDateTime, setCustomDateTime] = useState('')
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')

  function fetchData() {
    setLoading(true)
    fetch('/api/admin/withdrawal-unlocks')
      .then(r => r.json())
      .then(d => {
        if (d.success) setItems(d.data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    fetchData()
  }, [])

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 4000)
  }

  async function handleSaveSchedule() {
    if (!modalUser) return
    setSaving(true)

    try {
      const res = await fetch('/api/admin/withdrawal-unlocks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: modalUser.userId,
          unlockTimeOption: selectedPreset,
          customUnlockAt: selectedPreset === 'custom' ? new Date(customDateTime).toISOString() : null,
          markActivated: true,
        }),
      })
      const d = await res.json()
      if (d.success) {
        showToast(d.message || 'Unlock time saved!')
        setModalUser(null)
        fetchData()
      } else {
        alert(d.error || 'Failed to update')
      }
    } catch {
      alert('Error updating unlock time')
    } finally {
      setSaving(false)
    }
  }

  // Quick instant unlock button
  async function handleQuickInstantUnlock(userId: string) {
    if (!confirm('Unlock withdrawal immediately for this user?')) return
    try {
      const res = await fetch('/api/admin/withdrawal-unlocks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, unlockTimeOption: 'instant', markActivated: true }),
      })
      const d = await res.json()
      if (d.success) {
        showToast('✅ Withdrawal unlocked immediately!')
        fetchData()
      }
    } catch {
      alert('Failed to update')
    }
  }

  const now = Date.now()
  const pendingCount = items.filter(i => i.status === 'PENDING').length
  const scheduledCount = items.filter(i => i.isActivated && i.unlockAt && new Date(i.unlockAt).getTime() > now).length
  const unlockedCount = items.filter(i => i.isActivated && (!i.unlockAt || new Date(i.unlockAt).getTime() <= now)).length

  const filteredItems = items.filter(item => {
    if (filter === 'PENDING') return item.status === 'PENDING'
    if (filter === 'SCHEDULED') return item.isActivated && item.unlockAt && new Date(item.unlockAt).getTime() > now
    if (filter === 'UNLOCKED') return item.isActivated && (!item.unlockAt || new Date(item.unlockAt).getTime() <= now)
    return true
  })

  return (
    <div className="animate-fade-in" style={{ maxWidth: 1100 }}>
      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed', top: 24, right: 24, zIndex: 9999,
          background: '#10b981', color: '#fff', padding: '14px 22px',
          borderRadius: 12, fontWeight: 700, fontSize: 14, boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span>✅</span>
          <span>{toast}</span>
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <h1 style={{ fontSize: 26, fontWeight: 800 }}>⏱️ Withdrawal Unlock Timer</h1>
          <span style={{ fontSize: 13, background: 'rgba(108,71,255,0.1)', color: 'var(--primary)', padding: '4px 12px', borderRadius: 99, fontWeight: 700 }}>
            {items.length} Total Activation Requests
          </span>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
          Control exactly when users can withdraw after paying their ₹5 deposit. Set instant unlock or schedule a delay timer.
        </p>
      </div>

      {/* Overview Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 24 }}>
        <div className="card" style={{ padding: 18, borderLeft: '4px solid #f59e0b' }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 700 }}>⏳ PENDING APPROVAL</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#f59e0b', marginTop: 4 }}>{pendingCount}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Need admin review</div>
        </div>

        <div className="card" style={{ padding: 18, borderLeft: '4px solid #3b82f6' }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 700 }}>⏱️ ACTIVE TIMERS (LOCKED)</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#3b82f6', marginTop: 4 }}>{scheduledCount}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Waiting for unlock time</div>
        </div>

        <div className="card" style={{ padding: 18, borderLeft: '4px solid #10b981' }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 700 }}>🔓 FULLY UNLOCKED</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#10b981', marginTop: 4 }}>{unlockedCount}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Can withdraw anytime</div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { key: 'ALL', label: `All (${items.length})` },
          { key: 'PENDING', label: `⏳ Pending (${pendingCount})` },
          { key: 'SCHEDULED', label: `⏱️ Timers Running (${scheduledCount})` },
          { key: 'UNLOCKED', label: `✅ Unlocked (${unlockedCount})` },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key as any)}
            className={`btn btn-sm ${filter === tab.key ? 'btn-primary' : 'btn-ghost'}`}
            style={{ fontWeight: 700 }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>UTR / Ref</th>
                <th>Deposit</th>
                <th>Status</th>
                <th>Withdrawal Unlock Schedule</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                    Loading activation requests...
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                    No matching requests found
                  </td>
                </tr>
              ) : (
                filteredItems.map(item => {
                  const unlockDate = item.unlockAt ? new Date(item.unlockAt) : null
                  const isFuture = unlockDate ? unlockDate.getTime() > now : false
                  const diffMinutes = unlockDate ? Math.max(0, Math.round((unlockDate.getTime() - now) / 60000)) : 0
                  const diffHours = Math.floor(diffMinutes / 60)
                  const remMins = diffMinutes % 60

                  return (
                    <tr key={item.id} style={{ background: isFuture ? 'rgba(59,130,246,0.03)' : undefined }}>
                      <td>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{item.user.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.user.email}</div>
                        {item.user.wallet && (
                          <div style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 600, marginTop: 2 }}>
                            Balance: {formatINR(item.user.wallet.availableBalance)}
                          </div>
                        )}
                      </td>
                      <td>
                        <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#f59e0b', fontSize: 13, background: 'rgba(245,158,11,0.08)', padding: '2px 8px', borderRadius: 6 }}>
                          {item.utrNumber}
                        </span>
                        {item.senderUpi && (
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{item.senderUpi}</div>
                        )}
                      </td>
                      <td>
                        <span style={{ fontWeight: 800, color: 'var(--success)', fontSize: 14 }}>
                          +{formatINR(item.amount)}
                        </span>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{formatDate(item.requestedAt)}</div>
                      </td>
                      <td>
                        {item.status === 'PENDING' ? (
                          <span className="badge badge-warning" style={{ fontSize: 11, fontWeight: 700 }}>⏳ Pending</span>
                        ) : item.status === 'APPROVED' ? (
                          <span className="badge badge-success" style={{ fontSize: 11, fontWeight: 700 }}>✅ Approved</span>
                        ) : (
                          <span className="badge badge-error" style={{ fontSize: 11, fontWeight: 700 }}>❌ Rejected</span>
                        )}
                      </td>
                      <td>
                        {item.status === 'PENDING' ? (
                          <span style={{ fontSize: 12, color: '#f59e0b', fontWeight: 600 }}>
                            ⚠️ Needs Admin Approval
                          </span>
                        ) : isFuture && unlockDate ? (
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 800, color: '#3b82f6', display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span>⏱️ Locked</span>
                              <span style={{ fontSize: 11, background: 'rgba(59,130,246,0.12)', padding: '2px 8px', borderRadius: 99 }}>
                                {diffHours > 0 ? `${diffHours}h ${remMins}m left` : `${remMins}m left`}
                              </span>
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                              Unlocks: {unlockDate.toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                            </div>
                          </div>
                        ) : item.isActivated ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ color: '#10b981', fontWeight: 800, fontSize: 13 }}>🔓 UNLOCKED</span>
                            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Can withdraw now</span>
                          </div>
                        ) : (
                          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>—</span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          <button
                            onClick={() => {
                              setModalUser(item)
                              setSelectedPreset('1h')
                              setCustomDateTime('')
                            }}
                            className="btn btn-sm"
                            style={{
                              background: isFuture ? 'rgba(59,130,246,0.1)' : 'var(--primary)',
                              color: isFuture ? '#3b82f6' : '#fff',
                              border: isFuture ? '1px solid #3b82f6' : 'none',
                              fontWeight: 700, fontSize: 12,
                            }}
                          >
                            ⏱️ Set Unlock Time
                          </button>

                          {isFuture && (
                            <button
                              onClick={() => handleQuickInstantUnlock(item.userId)}
                              className="btn btn-sm btn-ghost"
                              style={{ color: '#10b981', fontWeight: 700, fontSize: 12 }}
                              title="Unlock instantly now"
                            >
                              ⚡ Unlock Now
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Set Unlock Time Modal */}
      {modalUser && (
        <div className="modal-overlay" onClick={() => setModalUser(null)}>
          <div className="modal animate-fade-in" onClick={e => e.stopPropagation()} style={{ maxWidth: 500, padding: 26 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>⏱️ Set Withdrawal Unlock Time</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: '4px 0 0' }}>
                  Choose when <strong style={{ color: 'var(--text-primary)' }}>{modalUser.user.name}</strong> can withdraw.
                </p>
              </div>
              <button
                onClick={() => setModalUser(null)}
                style={{ background: 'transparent', border: 'none', fontSize: 22, color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {/* User Quick Info */}
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px', marginBottom: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                <span style={{ color: 'var(--text-muted)' }}>User Email:</span>
                <span style={{ fontWeight: 600 }}>{modalUser.user.email}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                <span style={{ color: 'var(--text-muted)' }}>UTR Number:</span>
                <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#f59e0b' }}>{modalUser.utrNumber}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: 'var(--text-muted)' }}>Current Status:</span>
                <span style={{ fontWeight: 700, color: modalUser.isUnlocked ? '#10b981' : '#f59e0b' }}>
                  {modalUser.isUnlocked ? 'Unlocked' : modalUser.unlockAt ? `Scheduled (${formatDate(modalUser.unlockAt)})` : 'Pending'}
                </span>
              </div>
            </div>

            {/* Presets Grid */}
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 10, color: 'var(--text-primary)' }}>
              Select Unlock Delay / Time:
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
              {PRESETS.map(preset => {
                const isSelected = selectedPreset === preset.id
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setSelectedPreset(preset.id)}
                    style={{
                      padding: '12px 10px', borderRadius: 10, textAlign: 'left',
                      background: isSelected ? 'rgba(108,71,255,0.12)' : 'var(--bg-surface)',
                      border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border)',
                      cursor: 'pointer', transition: 'all 0.15s',
                    }}
                  >
                    <div style={{ fontWeight: 800, fontSize: 13, color: isSelected ? 'var(--primary)' : 'var(--text-primary)' }}>
                      {preset.label}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                      {preset.desc}
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Custom Date Time Picker if custom selected */}
            {selectedPreset === 'custom' && (
              <div style={{ marginBottom: 18, background: 'var(--bg-surface)', padding: 14, borderRadius: 10, border: '1px solid var(--border)' }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6, color: 'var(--text-secondary)' }}>
                  Pick Date & Time:
                </label>
                <input
                  type="datetime-local"
                  className="input"
                  value={customDateTime}
                  onChange={e => setCustomDateTime(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button
                type="button"
                className="btn btn-ghost btn-full"
                onClick={() => setModalUser(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary btn-full"
                disabled={saving || (selectedPreset === 'custom' && !customDateTime)}
                onClick={handleSaveSchedule}
                style={{ fontWeight: 800 }}
              >
                {saving ? 'Saving...' : '💾 Save & Schedule Unlock'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
