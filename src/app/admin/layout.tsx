'use client'
import { useSession, signOut } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'
import SessionProvider from '@/components/SessionProvider'

const ADMIN_NAV = [
  { href: '/admin', icon: '⊞', label: 'Dashboard' },
  { href: '/admin/deposits', icon: '💰', label: 'Deposits' },
  { href: '/admin/withdrawal-unlocks', icon: '⏱️', label: 'Unlock Timer' },
  { href: '/admin/deposit-locations', icon: '📍', label: 'User Locations' },
  { href: '/admin/wallet', icon: '🏦', label: 'Master Wallet' },
  { href: '/admin/users', icon: '👥', label: 'Users' },
  { href: '/admin/campaigns', icon: '▶', label: 'Video Campaigns' },
  { href: '/admin/withdrawals', icon: '🏧', label: 'Withdrawals' },
  { href: '/admin/referrals', icon: '🔗', label: 'Referrals' },
  { href: '/admin/transactions', icon: '💳', label: 'Transactions' },
  { href: '/admin/fraud', icon: '🛡', label: 'Fraud & Risk' },
  { href: '/admin/brand-applications', icon: '📢', label: 'Brand Applications' },
  { href: '/admin/settings', icon: '⚙️', label: 'Settings' },
]

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()

  const isSecretPrefix = pathname.includes('M4ster')
  const prefix = isSecretPrefix ? '/M4ster@305' : ''

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/M4ster@305/login')
    if (status === 'authenticated' && session?.user?.role !== 'ADMIN') router.push('/dashboard')
  }, [status, session, router])

  if (status === 'loading') {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="animate-spin" style={{ width: 40, height: 40, border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%' }} />
      </div>
    )
  }
  if (!session || session.user.role !== 'ADMIN') return null

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)' }}>
      <aside style={{ width: 240, background: 'var(--bg-surface)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, height: '100vh', zIndex: 30, overflowY: 'auto' }}>
        <div style={{ padding: '20px 16px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, background: 'var(--primary-gradient)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>▶</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>Virelo Admin</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Management Panel</div>
            </div>
          </div>
        </div>

        <nav style={{ padding: '12px 8px', flex: 1 }}>
          {ADMIN_NAV.map((item) => {
            const targetHref = `${prefix}${item.href}`
            const isActive = pathname === targetHref || pathname === item.href
            return (
              <Link key={item.href} href={targetHref} className={`sidebar-link ${isActive ? 'active' : ''}`}>
                <span style={{ fontSize: 16 }}>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div style={{ padding: '12px 8px', borderTop: '1px solid var(--border)' }}>
          <div style={{ padding: '10px 12px', background: 'var(--bg-card)', borderRadius: 10, marginBottom: 8 }}>
            <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>{session.user.name}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Administrator</div>
          </div>
          <button onClick={() => signOut({ callbackUrl: '/M4ster@305/login' })} className="sidebar-link" style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--error)' }}>
            <span>↩</span><span>Logout</span>
          </button>
        </div>
      </aside>

      <main style={{ flex: 1, marginLeft: 240, padding: '28px 32px', minHeight: '100vh' }}>
        {children}
      </main>
    </div>
  )
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <SessionProvider><AdminLayoutInner>{children}</AdminLayoutInner></SessionProvider>
}
