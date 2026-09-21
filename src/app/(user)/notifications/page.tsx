'use client'
import { useEffect, useState } from 'react'
import { formatDate } from '@/lib/utils'

interface Notification {
  id: string; category: string; title: string; message: string; isRead: boolean; createdAt: string
}

const CATEGORY_ICONS: Record<string, string> = {
  REWARD: '🎉',
  REFERRAL: '👥',
  WITHDRAWAL: '💰',
  ACCOUNT: '⚠️',
  SYSTEM: '🔔',
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/user/notifications').then(r => r.json()).then(d => {
      if (d.success) {
        setNotifications(d.data.notifications)
        setUnreadCount(d.data.unreadCount)
      }
      setLoading(false)
    })
  }, [])

  async function markAllRead() {
    await fetch('/api/user/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) })
    setNotifications((n) => n.map((notif) => ({ ...notif, isRead: true })))
    setUnreadCount(0)
  }

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>Notifications</h1>
          {unreadCount > 0 && <div className="badge badge-primary">{unreadCount} unread</div>}
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="btn btn-ghost btn-sm">Mark all read</button>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {loading ? (
          [1,2,3].map((i) => <div key={i} className="skeleton" style={{ height: 80, borderRadius: 12 }} />)
        ) : notifications.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '60px 40px' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🔔</div>
            <h2 style={{ marginBottom: 8 }}>No notifications</h2>
            <p style={{ color: 'var(--text-muted)' }}>You&apos;ll see updates about earnings, withdrawals, and referrals here.</p>
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              className="card"
              style={{
                display: 'flex',
                gap: 16,
                alignItems: 'flex-start',
                background: !notif.isRead ? 'rgba(108,71,255,0.06)' : 'var(--bg-card)',
                borderColor: !notif.isRead ? 'rgba(108,71,255,0.25)' : 'var(--border)',
                padding: '18px 20px',
              }}
            >
              <div style={{ fontSize: 28, flexShrink: 0 }}>{CATEGORY_ICONS[notif.category] ?? '🔔'}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4, color: 'var(--text-primary)' }}>{notif.title}</div>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 8 }}>{notif.message}</p>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{formatDate(notif.createdAt)}</div>
              </div>
              {!notif.isRead && (
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--primary)', flexShrink: 0, marginTop: 6 }} />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
