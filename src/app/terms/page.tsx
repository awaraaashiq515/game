import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service — Virelo Rewards',
  description: 'Read the Terms of Service for Virelo Rewards platform.',
}

export default function TermsPage() {
  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100vh' }}>
      <div style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)', padding: '16px 0' }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            <div style={{ width: 32, height: 32, background: 'var(--primary-gradient)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>▶</div>
            <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>Virelo Rewards</span>
          </Link>
          <span style={{ color: 'var(--text-muted)' }}>/ Terms of Service</span>
        </div>
      </div>

      <div className="container" style={{ maxWidth: 800, padding: '60px 24px' }}>
        <h1 style={{ fontSize: 36, fontWeight: 900, marginBottom: 8 }}>Terms of Service</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: 40 }}>Last updated: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</p>

        {[
          {
            title: '1. Eligibility',
            content: 'You must be at least 18 years of age and a resident of India to use Virelo Rewards. You may only create one account per person. Multiple accounts from the same device, IP address, or identity may be flagged and suspended.',
          },
          {
            title: '2. Earning Rewards',
            content: 'Rewards are credited only after a video watch session is validated by our server-side system. Simply opening or partially watching a video does not qualify for a reward. The required watch duration is defined per campaign. Daily earning limits apply.',
          },
          {
            title: '3. Referral Program',
            content: 'Referral rewards are credited to the referrer only after the referred user creates a verified account AND completes the first eligible earning activity as defined by the platform. Creating fake accounts or self-referrals is strictly prohibited and will result in immediate suspension.',
          },
          {
            title: '4. Withdrawals',
            content: 'A minimum balance must be maintained before a withdrawal can be requested. The minimum withdrawal amount is configured by the platform and is displayed on the Withdraw page. Withdrawals are subject to manual review and may take 1–3 business days to process.',
          },
          {
            title: '5. Account Suspension',
            content: 'Virelo reserves the right to suspend or terminate accounts that engage in fraud, abuse, manipulation of the earning system, creation of multiple accounts, bot activity, or any activity that violates these terms. Suspended accounts may have their pending earnings reviewed before any final determination.',
          },
          {
            title: '6. Reward Reversal',
            content: 'Rewards credited through fraudulent or invalid activity may be reversed after a review process. You will be notified if your account is under review. We do not confiscate legitimate earnings without a transparent review.',
          },
          {
            title: '7. Campaign Availability',
            content: 'Video campaigns are created by sponsors and may be modified, paused, or ended at any time. Virelo does not guarantee continuous availability of earning campaigns. Campaign budgets are finite.',
          },
          {
            title: '8. Limitation of Liability',
            content: 'Virelo Rewards is not liable for any indirect, incidental, or consequential damages arising from use of the platform. Rewards are subject to campaign budgets and eligibility. We make no guarantee of income.',
          },
          {
            title: '9. Modifications',
            content: 'These Terms may be updated from time to time. Continued use of the platform after changes constitutes acceptance of the revised Terms.',
          },
          {
            title: '10. Contact',
            content: 'For questions about these Terms, please contact us through the Support page.',
          },
        ].map((section) => (
          <div key={section.title} style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 10, color: 'var(--text-primary)' }}>{section.title}</h2>
            <p style={{ lineHeight: 1.8, color: 'var(--text-secondary)' }}>{section.content}</p>
          </div>
        ))}

        <div style={{ marginTop: 48, paddingTop: 24, borderTop: '1px solid var(--border)', display: 'flex', gap: 16 }}>
          <Link href="/privacy" style={{ color: 'var(--primary)' }}>Privacy Policy</Link>
          <Link href="/faq" style={{ color: 'var(--primary)' }}>FAQ</Link>
          <Link href="/" style={{ color: 'var(--text-muted)' }}>Back to Home</Link>
        </div>
      </div>
    </div>
  )
}
