'use client'
import { useSession, signOut } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'
import SessionProvider from '@/components/SessionProvider'

const NAV_ITEMS = [
  { href: '/dashboard', icon: '⊞', label: 'Dashboard' },
  { href: '/earn', icon: '▶', label: 'Watch & Earn' },
  { href: '/wallet', icon: '💳', label: 'Wallet' },
  { href: '/add-money', icon: '💰', label: 'Add Money' },
  { href: '/refer', icon: '👥', label: 'Refer & Earn' },
  { href: '/leaderboard', icon: '🏆', label: 'Top Earners' },
  { href: '/history', icon: '📋', label: 'Earnings History' },
  { href: '/withdraw', icon: '🏧', label: 'Withdraw' },
  { href: '/notifications', icon: '🔔', label: 'Notifications' },
]

const MOBILE_NAV = [
  { href: '/dashboard', icon: '⊞', label: 'Home' },
  { href: '/earn', icon: '▶', label: 'Earn' },
  { href: '/wallet', icon: '💳', label: 'Wallet' },
  { href: '/refer', icon: '👥', label: 'Refer' },
  { href: '/profile', icon: '👤', label: 'Profile' },
]

function UserLayoutInner({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
    if (status === 'authenticated' && session?.user?.role === 'ADMIN') router.push('/admin')
  }, [status, session, router])

  if (status === 'loading') {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="animate-spin" style={{ width: 40, height: 40, border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%' }} />
      </div>
    )
  }

  if (!session) return null

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)' }}>
      {/* Sidebar */}
      <aside
        style={{
          width: 256,
          background: 'var(--bg-surface)',
          borderRight: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          top: 0,
          left: 0,
          height: '100vh',
          zIndex: 30,
          overflowY: 'auto',
        }}
        className="desktop-sidebar"
      >
        {/* Logo */}
        <div style={{ padding: '24px 20px', borderBottom: '1px solid var(--border)' }}>
          <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{ width: 36, height: 36, background: 'var(--primary-gradient)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>▶</div>
            <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>Virelo<span style={{ color: 'var(--primary)' }}>.</span></span>
          </Link>
        </div>

        {/* Nav items */}
        <nav style={{ padding: '16px 12px', flex: 1 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`sidebar-link ${pathname === item.href ? 'active' : ''}`}
              >
                <span style={{ fontSize: 18 }}>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </div>

          <div className="divider" style={{ margin: '20px 4px' }} />

          <Link href="/profile" className={`sidebar-link ${pathname === '/profile' ? 'active' : ''}`}>
            <span style={{ fontSize: 18 }}>👤</span>
            <span>Profile</span>
          </Link>
          <Link href="/support" className={`sidebar-link ${pathname === '/support' ? 'active' : ''}`}>
            <span style={{ fontSize: 18 }}>💬</span>
            <span>Support</span>
          </Link>
        </nav>

        {/* User info + logout */}
        <div style={{ padding: '16px 12px', borderTop: '1px solid var(--border)' }}>
          <div style={{ padding: '12px 14px', background: 'var(--bg-card)', borderRadius: 12, marginBottom: 8 }}>
            <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', marginBottom: 2 }}>
              {session.user.name}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{session.user.email}</div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="sidebar-link"
            style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--error)' }}
          >
            <span style={{ fontSize: 18 }}>↩</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, marginLeft: 256, padding: '32px', paddingBottom: 100 }} className="main-content">
        {children}
      </main>

      {/* Mobile bottom nav */}
      <nav className="mobile-nav">
        {MOBILE_NAV.map((item) => (
          <Link key={item.href} href={item.href} className={`mobile-nav-item ${pathname === item.href ? 'active' : ''}`}>
            <span style={{ fontSize: 20 }}>{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      <style>{`
        @media (max-width: 768px) {
          .desktop-sidebar { display: none !important; }
          .main-content { margin-left: 0 !important; padding: 20px 16px !important; }
        }
      `}</style>
    </div>
  )
}

export default function UserLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <UserLayoutInner>{children}</UserLayoutInner>
    </SessionProvider>
  )
}
