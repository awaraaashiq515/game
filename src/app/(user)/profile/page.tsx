'use client'
import { useSession } from 'next-auth/react'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'

export default function ProfilePage() {
  const { data: session } = useSession()
  const user = session?.user

  return (
    <div className="animate-fade-in" style={{ maxWidth: 640, margin: '0 auto' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800 }}>Profile</h1>
      </div>

      {/* Avatar & name */}
      <div className="card" style={{ marginBottom: 20, textAlign: 'center', padding: '40px 32px' }}>
        <div
          style={{
            width: 80,
            height: 80,
            background: 'var(--primary-gradient)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 32,
            margin: '0 auto 16px',
            boxShadow: '0 8px 24px var(--primary-glow)',
          }}
        >
          {user?.name?.[0]?.toUpperCase() ?? '?'}
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>{user?.name}</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>{user?.email}</p>
      </div>

      {/* Profile details */}
      <div className="card" style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Account Information</h2>
        {[
          { label: 'Full Name', value: user?.name },
          { label: 'Email Address', value: user?.email },
          { label: 'Account Role', value: user?.role },
        ].map((item) => (
          <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>{item.label}</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{item.value ?? '—'}</span>
          </div>
        ))}
      </div>

      {/* Security */}
      <div className="card" style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Security</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>Email Verification</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Verify your email address</div>
            </div>
            <span className="badge badge-warning">Pending</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>Change Password</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Update your login password</div>
            </div>
            <button className="btn btn-ghost btn-sm">Change</button>
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div className="card">
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Quick Links</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { href: '/wallet', label: '💳 View Wallet', desc: 'Check your balance and transactions' },
            { href: '/withdraw/history', label: '🏧 Withdrawal History', desc: 'View all your withdrawal requests' },
            { href: '/refer', label: '👥 Refer & Earn', desc: 'Share your referral link' },
            { href: '/support', label: '💬 Support', desc: 'Get help with your account' },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '12px 14px',
                background: 'var(--bg-surface)',
                borderRadius: 10,
                textDecoration: 'none',
                transition: 'background 0.2s',
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>{item.label}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.desc}</div>
              </div>
              <span style={{ color: 'var(--text-muted)' }}>→</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
