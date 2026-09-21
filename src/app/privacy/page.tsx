import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy — Virelo Rewards',
  description: 'Read the Privacy Policy for Virelo Rewards platform.',
}

export default function PrivacyPage() {
  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100vh' }}>
      <div style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)', padding: '16px 0' }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            <div style={{ width: 32, height: 32, background: 'var(--primary-gradient)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>▶</div>
            <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>Virelo Rewards</span>
          </Link>
          <span style={{ color: 'var(--text-muted)' }}>/ Privacy Policy</span>
        </div>
      </div>

      <div className="container" style={{ maxWidth: 800, padding: '60px 24px' }}>
        <h1 style={{ fontSize: 36, fontWeight: 900, marginBottom: 8 }}>Privacy Policy</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: 40 }}>
          Last updated: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
        </p>

        {[
          {
            title: '1. Information We Collect',
            content: 'We collect information you provide when creating an account: full name, email address, mobile number, and password (stored as a secure hash). We also collect device and session data including IP address, user agent, and watch session timestamps for fraud prevention and reward validation.',
          },
          {
            title: '2. How We Use Your Information',
            content: 'Your information is used to: provide and operate the Virelo Rewards platform, validate video watch sessions and credit rewards, process withdrawal requests, detect and prevent fraud and abuse, send you notifications about your account and earnings, and comply with legal obligations.',
          },
          {
            title: '3. Data Sharing',
            content: 'We do not sell your personal data to third parties. We may share limited information with: payment processors to complete withdrawal transactions, fraud prevention services, and legal authorities when required by law. Sponsors who fund video campaigns do not receive individual user data.',
          },
          {
            title: '4. Wallet and Financial Data',
            content: 'All wallet transactions are recorded in our secure database. Your payment account details (UPI ID, bank account) submitted for withdrawals are stored encrypted and used only for processing your withdrawal requests.',
          },
          {
            title: '5. Leaderboard Privacy',
            content: 'On the Top Earners leaderboard, names are partially masked (e.g., "Ab***sh") to protect user privacy. Full names are never displayed publicly. Your earnings information is not shared with other users.',
          },
          {
            title: '6. Data Retention',
            content: 'We retain your account data for as long as your account is active. If you request account deletion, we will delete your personal data within 30 days, except where retention is required for legal or fraud prevention purposes.',
          },
          {
            title: '7. Security',
            content: 'We use industry-standard security measures including: bcrypt password hashing, secure JWT sessions, HTTPS encryption, server-side session validation, and IP monitoring. However, no system is 100% secure and we cannot guarantee absolute security.',
          },
          {
            title: '8. Cookies',
            content: 'We use session cookies for authentication and to keep you logged in. We do not use tracking cookies for advertising purposes.',
          },
          {
            title: '9. Your Rights',
            content: 'You have the right to: access your personal data, correct inaccurate data, request deletion of your account, and withdraw consent. Contact us through the Support page to exercise these rights.',
          },
          {
            title: '10. Changes to This Policy',
            content: 'We may update this Privacy Policy from time to time. We will notify you of significant changes through in-app notifications. Continued use after changes constitutes acceptance.',
          },
        ].map((section) => (
          <div key={section.title} style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 10, color: 'var(--text-primary)' }}>{section.title}</h2>
            <p style={{ lineHeight: 1.8, color: 'var(--text-secondary)' }}>{section.content}</p>
          </div>
        ))}

        <div style={{ marginTop: 48, paddingTop: 24, borderTop: '1px solid var(--border)', display: 'flex', gap: 16 }}>
          <Link href="/terms" style={{ color: 'var(--primary)' }}>Terms of Service</Link>
          <Link href="/faq" style={{ color: 'var(--primary)' }}>FAQ</Link>
          <Link href="/" style={{ color: 'var(--text-muted)' }}>Back to Home</Link>
        </div>
      </div>
    </div>
  )
}
