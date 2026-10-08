'use client'
import { useEffect, useState } from 'react'
import { formatINR, formatDate } from '@/lib/utils'

interface ReferralData {
  referralCode: string
  referralLink: string
  referralRewardAmount?: number
  totalReferrals: number
  qualifiedReferrals: number
  pendingReferrals: number
  totalEarnings: number
  referrals: Array<{
    id: string
    name: string
    joinedAt: string
    status: string
    rewardAmount: number | null
    qualifiedAt: string | null
  }>
}

export default function ReferPage() {
  const [data, setData] = useState<ReferralData | null>(null)
  const [loading, setLoading] = useState(true)
  const [copiedLink, setCopiedLink] = useState(false)
  const [copiedCode, setCopiedCode] = useState(false)
  const [activeTab, setActiveTab] = useState<'ALL' | 'QUALIFIED' | 'PENDING'>('ALL')

  useEffect(() => {
    fetch('/api/refer')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setData(d.data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  async function copyToClipboard(text: string, type: 'link' | 'code') {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text)
      } else {
        const textArea = document.createElement('textarea')
        textArea.value = text
        textArea.style.position = 'fixed'
        textArea.style.left = '-999999px'
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        document.execCommand('copy')
        textArea.remove()
      }

      if (type === 'link') {
        setCopiedLink(true)
        setTimeout(() => setCopiedLink(false), 2200)
      } else {
        setCopiedCode(true)
        setTimeout(() => setCopiedCode(false), 2200)
      }
    } catch (err) {
      console.error('Failed to copy', err)
    }
  }

  function handleNativeShare() {
    if (!data) return
    const text = `Join Virelo Rewards and earn real money watching short videos! Use my link to get started: ${data.referralLink}`
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({
        title: 'Earn with Virelo Rewards',
        text: text,
        url: data.referralLink,
      }).catch(() => {})
    } else {
      copyToClipboard(data.referralLink, 'link')
    }
  }

  function shareOn(platform: string) {
    if (!data) return
    const text = `🔥 Watch videos & earn money with Virelo Rewards! Sign up using my referral link: ${data.referralLink}`
    const urls: Record<string, string> = {
      whatsapp: `https://wa.me/?text=${encodeURIComponent(text)}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(data.referralLink)}&text=${encodeURIComponent('Join Virelo Rewards and start earning!')}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(data.referralLink)}`,
    }
    if (urls[platform]) window.open(urls[platform], '_blank')
  }

  if (loading) {
    return (
      <div className="refer-page-container">
        {/* Skeleton Header */}
        <div style={{ marginBottom: 16 }}>
          <div className="skeleton" style={{ height: 26, width: 170, borderRadius: 8, marginBottom: 8 }} />
          <div className="skeleton" style={{ height: 16, width: '80%', maxWidth: 340, borderRadius: 6 }} />
        </div>

        {/* Skeleton Hero Card */}
        <div className="skeleton" style={{ height: 180, borderRadius: 18, marginBottom: 16 }} />

        {/* Skeleton Stats Grid */}
        <div className="refer-stats-grid" style={{ marginBottom: 18 }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton" style={{ height: 75, borderRadius: 14 }} />
          ))}
        </div>

        {/* Skeleton Referral Box */}
        <div className="skeleton" style={{ height: 140, borderRadius: 16, marginBottom: 16 }} />

        {/* Skeleton Referral Code */}
        <div className="skeleton" style={{ height: 80, borderRadius: 16 }} />
      </div>
    )
  }

  const allReferrals = data?.referrals ?? []
  const filteredReferrals = allReferrals.filter((r) => {
    if (activeTab === 'QUALIFIED') return r.status === 'QUALIFIED' || r.status === 'REWARDED'
    if (activeTab === 'PENDING') return r.status === 'PENDING'
    return true
  })

  return (
    <div className="animate-fade-in refer-page-container">
      {/* ── Page Header ── */}
      <div className="refer-header">
        <div className="refer-header-badge">
          <span>🎁</span>
          <span>Earn Unlimited Cash</span>
        </div>
        <h1 className="refer-title">Refer & Earn</h1>
        <p className="refer-subtitle">
          Invite friends & family. Earn <strong style={{ color: 'var(--text-primary)' }}>₹{data?.referralRewardAmount ?? 200}</strong> directly in your wallet when they complete their first video!
        </p>
      </div>

      {/* ── Reward Hero Card ── */}
      <div className="card glow-purple refer-hero-card">
        <div className="refer-hero-pill">
          <span className="live-dot" />
          <span>INSTANT WALLET CREDIT</span>
        </div>

        <div className="refer-reward-amount-row">
          <span className="refer-reward-currency">₹</span>
          <span className="refer-reward-number">{data?.referralRewardAmount ?? 200}</span>
          <span className="refer-reward-unit">/ friend</span>
        </div>

        <p className="refer-hero-desc">
          Get ₹{data?.referralRewardAmount ?? 200} credited to your available balance for every friend who signs up with your link and watches their first eligible video.
        </p>

        <div className="refer-hero-features">
          <div className="refer-hero-feature-item">
            <span>✨</span>
            <span>No limit on invites</span>
          </div>
          <div className="refer-hero-feature-item">
            <span>⚡</span>
            <span>Instant wallet credit</span>
          </div>
          <div className="refer-hero-feature-item">
            <span>💳</span>
            <span>Withdraw anytime</span>
          </div>
        </div>
      </div>

      {/* ── Stats Grid ── */}
      <div className="refer-stats-grid">
        <div className="refer-stat-card">
          <div className="refer-stat-icon-wrap" style={{ background: 'rgba(148,163,184,0.12)', color: 'var(--text-primary)' }}>
            👥
          </div>
          <div className="refer-stat-content">
            <div className="refer-stat-value" style={{ color: 'var(--text-primary)' }}>
              {data?.totalReferrals ?? 0}
            </div>
            <div className="refer-stat-label">Friends Joined</div>
          </div>
        </div>

        <div className="refer-stat-card">
          <div className="refer-stat-icon-wrap" style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>
            ✅
          </div>
          <div className="refer-stat-content">
            <div className="refer-stat-value" style={{ color: 'var(--success)' }}>
              {data?.qualifiedReferrals ?? 0}
            </div>
            <div className="refer-stat-label">Qualified</div>
          </div>
        </div>

        <div className="refer-stat-card">
          <div className="refer-stat-icon-wrap" style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b' }}>
            ⏳
          </div>
          <div className="refer-stat-content">
            <div className="refer-stat-value" style={{ color: 'var(--warning)' }}>
              {data?.pendingReferrals ?? 0}
            </div>
            <div className="refer-stat-label">Pending</div>
          </div>
        </div>

        <div className="refer-stat-card refer-stat-card-highlight">
          <div className="refer-stat-icon-wrap" style={{ background: 'rgba(108,71,255,0.15)', color: 'var(--primary)' }}>
            💰
          </div>
          <div className="refer-stat-content">
            <div className="refer-stat-value" style={{ color: 'var(--primary)' }}>
              {formatINR(data?.totalEarnings ?? 0)}
            </div>
            <div className="refer-stat-label">Total Earned</div>
          </div>
        </div>
      </div>

      {/* ── Referral Link & Quick Sharing ── */}
      <div className="card refer-link-card">
        <div className="refer-card-header">
          <div className="refer-card-icon">🔗</div>
          <div className="refer-card-title-wrap">
            <h2 className="refer-card-title">Your Referral Link</h2>
            <p className="refer-card-subtitle">Share this link directly with friends</p>
          </div>
        </div>

        {/* Link Input Row */}
        <div className="refer-link-input-row">
          <div className="refer-link-input-box">
            <span className="refer-link-prefix">https://</span>
            <span className="refer-link-text">{data?.referralLink ? data.referralLink.replace(/^https?:\/\//, '') : ''}</span>
          </div>
          <button
            onClick={() => copyToClipboard(data?.referralLink ?? '', 'link')}
            className={`btn refer-copy-btn ${copiedLink ? 'btn-success' : 'btn-primary'}`}
            type="button"
          >
            {copiedLink ? (
              <>
                <span>✓</span>
                <span>Copied!</span>
              </>
            ) : (
              <>
                <span>📋</span>
                <span>Copy Link</span>
              </>
            )}
          </button>
        </div>

        {/* Mobile Branded Share Buttons */}
        <div className="refer-share-actions">
          <span className="refer-share-label">Quick Share:</span>
          <div className="refer-share-buttons-grid">
            <button
              onClick={() => shareOn('whatsapp')}
              className="refer-social-btn refer-btn-whatsapp"
              type="button"
            >
              <span className="refer-social-icon">💬</span>
              <span>WhatsApp</span>
            </button>

            <button
              onClick={() => shareOn('telegram')}
              className="refer-social-btn refer-btn-telegram"
              type="button"
            >
              <span className="refer-social-icon">✈️</span>
              <span>Telegram</span>
            </button>

            <button
              onClick={() => shareOn('facebook')}
              className="refer-social-btn refer-btn-facebook"
              type="button"
            >
              <span className="refer-social-icon">📘</span>
              <span>Facebook</span>
            </button>

            <button
              onClick={handleNativeShare}
              className="refer-social-btn refer-btn-more"
              type="button"
            >
              <span className="refer-social-icon">📲</span>
              <span>Share App</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Referral Code Box ── */}
      <div className="card refer-code-card">
        <div className="refer-code-left">
          <div className="refer-code-caption">Your Unique Referral Code</div>
          <div className="refer-code-value">{data?.referralCode}</div>
          <div className="refer-code-hint">Friends can also enter this during signup</div>
        </div>
        <div className="refer-code-right">
          <button
            onClick={() => copyToClipboard(data?.referralCode ?? '', 'code')}
            className={`btn btn-sm ${copiedCode ? 'btn-success' : 'btn-secondary'} refer-code-copy-btn`}
            type="button"
          >
            {copiedCode ? '✓ Code Copied!' : '📋 Copy Code'}
          </button>
        </div>
      </div>

      {/* ── How It Works (Visual 3-Step Guide) ── */}
      <div className="card refer-steps-card">
        <div className="refer-steps-header">
          <h3 className="refer-steps-title">How Referral Rewards Work</h3>
          <p className="refer-steps-subtitle">Simple, transparent, and fair rewards in 3 easy steps</p>
        </div>

        <div className="refer-steps-grid">
          <div className="refer-step-item">
            <div className="refer-step-top">
              <span className="refer-step-badge">Step 1</span>
              <span className="refer-step-icon">🔗</span>
            </div>
            <div className="refer-step-content">
              <div className="refer-step-name">Share Your Link</div>
              <p className="refer-step-text">
                Invite friends via WhatsApp, Telegram, or social media using your unique invite link.
              </p>
            </div>
          </div>

          <div className="refer-step-connector" />

          <div className="refer-step-item">
            <div className="refer-step-top">
              <span className="refer-step-badge">Step 2</span>
              <span className="refer-step-icon">▶️</span>
            </div>
            <div className="refer-step-content">
              <div className="refer-step-name">Friend Watches Video</div>
              <p className="refer-step-text">
                Friend signs up & completes watching their 1st eligible sponsored video to verify.
              </p>
            </div>
          </div>

          <div className="refer-step-connector" />

          <div className="refer-step-item">
            <div className="refer-step-top">
              <span className="refer-step-badge refer-step-badge-success">Step 3</span>
              <span className="refer-step-icon">💰</span>
            </div>
            <div className="refer-step-content">
              <div className="refer-step-name">Get ₹200 Cash</div>
              <p className="refer-step-text">
                ₹200 is instantly credited to your wallet balance. Withdraw to your bank or UPI!
              </p>
            </div>
          </div>
        </div>

        <div className="refer-steps-notice">
          <span style={{ fontSize: 16 }}>🛡️</span>
          <span>
            <strong>Anti-Fraud Protection:</strong> Verification requires completing 1 video to prevent fake accounts.
          </span>
        </div>
      </div>

      {/* ── My Referrals List / Table ── */}
      <div className="card refer-history-card">
        <div className="refer-history-header">
          <div className="refer-history-title-wrap">
            <h2 className="refer-card-title">My Referrals</h2>
            <p className="refer-card-subtitle">
              {allReferrals.length} {allReferrals.length === 1 ? 'friend' : 'friends'} invited so far
            </p>
          </div>

          {/* Filter Pills */}
          {allReferrals.length > 0 && (
            <div className="refer-filter-pills">
              <button
                type="button"
                className={`refer-filter-pill ${activeTab === 'ALL' ? 'active' : ''}`}
                onClick={() => setActiveTab('ALL')}
              >
                All ({allReferrals.length})
              </button>
              <button
                type="button"
                className={`refer-filter-pill ${activeTab === 'QUALIFIED' ? 'active' : ''}`}
                onClick={() => setActiveTab('QUALIFIED')}
              >
                Qualified ({data?.qualifiedReferrals ?? 0})
              </button>
              <button
                type="button"
                className={`refer-filter-pill ${activeTab === 'PENDING' ? 'active' : ''}`}
                onClick={() => setActiveTab('PENDING')}
              >
                Pending ({data?.pendingReferrals ?? 0})
              </button>
            </div>
          )}
        </div>

        {allReferrals.length === 0 ? (
          <div className="refer-empty-state">
            <div className="refer-empty-icon">👥</div>
            <h4 style={{ fontSize: 15, fontWeight: 700, marginBottom: 6, color: 'var(--text-primary)' }}>
              No Referrals Yet
            </h4>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 320, margin: '0 auto 16px', lineHeight: 1.5 }}>
              You haven&apos;t invited anyone yet. Share your referral link to start earning ₹200 for every friend!
            </p>
            <button
              onClick={() => copyToClipboard(data?.referralLink ?? '', 'link')}
              className="btn btn-primary btn-sm"
              type="button"
              style={{ minHeight: 40, padding: '0 18px' }}
            >
              {copiedLink ? '✓ Link Copied!' : '🚀 Share Your Link Now'}
            </button>
          </div>
        ) : filteredReferrals.length === 0 ? (
          <div className="refer-empty-state" style={{ padding: '24px 12px' }}>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              No referrals found under &quot;{activeTab.toLowerCase()}&quot;.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table View (>= 640px) */}
            <div className="refer-desktop-table table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Friend</th>
                    <th>Joined</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Reward</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReferrals.map((r) => {
                    const isQualified = r.status === 'REWARDED' || r.status === 'QUALIFIED'
                    return (
                      <tr key={r.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div className="refer-user-avatar">
                              {r.name?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{r.name}</span>
                          </div>
                        </td>
                        <td style={{ fontSize: 13 }}>{formatDate(r.joinedAt)}</td>
                        <td>
                          <span className={`badge ${isQualified ? 'badge-success' : 'badge-warning'}`}>
                            {isQualified ? 'QUALIFIED' : 'PENDING'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 700 }}>
                          {isQualified ? (
                            <span style={{ color: 'var(--success)' }}>+{formatINR(r.rewardAmount || 200)}</span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Pending Video</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List View (< 640px) */}
            <div className="refer-mobile-list">
              {filteredReferrals.map((r) => {
                const isQualified = r.status === 'REWARDED' || r.status === 'QUALIFIED'
                return (
                  <div key={r.id} className="refer-mobile-item">
                    <div className="refer-mobile-item-top">
                      <div className="refer-mobile-item-user">
                        <div className="refer-user-avatar">
                          {r.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div className="refer-mobile-user-name">{r.name}</div>
                          <div className="refer-mobile-date">{formatDate(r.joinedAt)}</div>
                        </div>
                      </div>

                      <span className={`badge ${isQualified ? 'badge-success' : 'badge-warning'}`} style={{ flexShrink: 0 }}>
                        {isQualified ? 'QUALIFIED' : 'PENDING'}
                      </span>
                    </div>

                    <div className="refer-mobile-item-bottom">
                      <span className="refer-mobile-reward-label">Reward Status:</span>
                      <span className="refer-mobile-reward-value">
                        {isQualified ? (
                          <span style={{ color: 'var(--success)', fontWeight: 800 }}>+{formatINR(r.rewardAmount || 200)}</span>
                        ) : (
                          <span style={{ color: 'var(--warning)', fontWeight: 600 }}>Awaiting 1st Video</span>
                        )}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      {/* ── Page Styles with Full Mobile Responsiveness ── */}
      <style>{`
        /* Root container constraints */
        .refer-page-container {
          width: 100%;
          max-width: 860px;
          margin: 0 auto;
          box-sizing: border-box;
          overflow-x: hidden;
          padding-bottom: 24px;
        }

        .refer-header {
          margin-bottom: 20px;
          width: 100%;
          box-sizing: border-box;
        }

        .refer-header-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(108, 71, 255, 0.12);
          border: 1px solid rgba(108, 71, 255, 0.25);
          color: var(--primary);
          padding: 4px 10px;
          border-radius: 99px;
          font-size: 11px;
          font-weight: 700;
          margin-bottom: 8px;
        }

        .refer-title {
          font-size: clamp(22px, 5vw, 28px);
          font-weight: 800;
          color: var(--text-primary);
          margin-bottom: 6px;
          letter-spacing: -0.02em;
          line-height: 1.2;
          overflow-wrap: break-word;
          word-break: break-word;
        }

        .refer-subtitle {
          font-size: clamp(12.5px, 3.2vw, 14px);
          color: var(--text-muted);
          line-height: 1.5;
          max-width: 580px;
          overflow-wrap: break-word;
          word-break: break-word;
        }

        /* ── Hero Reward Card ── */
        .refer-hero-card {
          margin-bottom: 16px;
          background: linear-gradient(135deg, rgba(108,71,255,0.18) 0%, rgba(168,85,247,0.1) 100%);
          border: 1px solid rgba(108,71,255,0.35);
          text-align: center;
          padding: 24px 16px;
          border-radius: 18px;
          position: relative;
          width: 100%;
          box-sizing: border-box;
          overflow: hidden;
        }

        .refer-hero-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(108, 71, 255, 0.2);
          border: 1px solid rgba(108, 71, 255, 0.4);
          color: #c4b5fd;
          padding: 4px 10px;
          border-radius: 99px;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.08em;
          margin-bottom: 10px;
        }

        .live-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #10b981;
          display: inline-block;
          box-shadow: 0 0 6px #10b981;
        }

        .refer-reward-amount-row {
          display: flex;
          align-items: baseline;
          justify-content: center;
          gap: 3px;
          margin-bottom: 8px;
          width: 100%;
        }

        .refer-reward-currency {
          font-size: clamp(24px, 5.5vw, 36px);
          font-weight: 800;
          color: var(--primary);
        }

        .refer-reward-number {
          font-size: clamp(38px, 9.5vw, 58px);
          font-weight: 900;
          color: var(--primary);
          line-height: 1;
          text-shadow: 0 0 25px rgba(108, 71, 255, 0.4);
          letter-spacing: -0.02em;
        }

        .refer-reward-unit {
          font-size: clamp(12px, 3.2vw, 15px);
          font-weight: 600;
          color: var(--text-muted);
          margin-left: 4px;
        }

        .refer-hero-desc {
          font-size: clamp(12px, 3.2vw, 13.5px);
          color: var(--text-secondary);
          max-width: 480px;
          margin: 0 auto 16px;
          line-height: 1.55;
          overflow-wrap: break-word;
          word-break: break-word;
        }

        .refer-hero-features {
          display: flex;
          justify-content: center;
          gap: 8px;
          flex-wrap: wrap;
          width: 100%;
          box-sizing: border-box;
        }

        .refer-hero-feature-item {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 11px;
          font-weight: 600;
          color: var(--text-primary);
          background: rgba(255, 255, 255, 0.05);
          padding: 5px 10px;
          border-radius: 99px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          max-width: 100%;
          box-sizing: border-box;
          white-space: nowrap;
        }

        /* ── Stats Grid (using minmax(0, 1fr) to prevent overflow) ── */
        .refer-stats-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 10px;
          margin-bottom: 16px;
          width: 100%;
          box-sizing: border-box;
        }

        .refer-stat-card {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 14px 12px;
          display: flex;
          align-items: center;
          gap: 10px;
          transition: all 0.2s;
          min-width: 0;
          width: 100%;
          box-sizing: border-box;
          overflow: hidden;
        }

        .refer-stat-card:hover {
          border-color: var(--border-bright);
          transform: translateY(-1px);
        }

        .refer-stat-card-highlight {
          background: linear-gradient(135deg, var(--bg-card) 0%, rgba(108,71,255,0.08) 100%);
          border-color: rgba(108,71,255,0.3);
        }

        .refer-stat-icon-wrap {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          flex-shrink: 0;
        }

        .refer-stat-content {
          min-width: 0;
          flex: 1;
          overflow: hidden;
        }

        .refer-stat-value {
          font-size: clamp(16px, 4vw, 22px);
          font-weight: 800;
          line-height: 1.1;
          margin-bottom: 2px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .refer-stat-label {
          font-size: 11px;
          color: var(--text-muted);
          font-weight: 500;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        /* ── Link Card ── */
        .refer-link-card {
          margin-bottom: 16px;
          padding: 20px 16px;
          width: 100%;
          box-sizing: border-box;
          overflow: hidden;
        }

        .refer-card-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 14px;
          width: 100%;
        }

        .refer-card-icon {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: rgba(108, 71, 255, 0.12);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 17px;
          flex-shrink: 0;
        }

        .refer-card-title-wrap {
          min-width: 0;
          flex: 1;
        }

        .refer-card-title {
          font-size: 15px;
          font-weight: 700;
          color: var(--text-primary);
          line-height: 1.2;
          overflow-wrap: break-word;
        }

        .refer-card-subtitle {
          font-size: 11.5px;
          color: var(--text-muted);
          margin-top: 2px;
          overflow-wrap: break-word;
        }

        .refer-link-input-row {
          display: flex;
          gap: 8px;
          margin-bottom: 16px;
          width: 100%;
          box-sizing: border-box;
        }

        .refer-link-input-box {
          flex: 1;
          min-width: 0;
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 10px 12px;
          display: flex;
          align-items: center;
          gap: 4px;
          overflow: hidden;
          box-sizing: border-box;
          width: 100%;
        }

        .refer-link-prefix {
          font-size: 12px;
          color: var(--primary);
          font-weight: 600;
          flex-shrink: 0;
        }

        .refer-link-text {
          font-size: 12px;
          color: var(--text-primary);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-family: monospace;
          min-width: 0;
          flex: 1;
        }

        .refer-copy-btn {
          flex-shrink: 0;
          min-width: 110px;
          height: 42px;
          padding: 0 16px;
          font-size: 13px;
        }

        .refer-share-actions {
          display: flex;
          flex-direction: column;
          gap: 8px;
          width: 100%;
          box-sizing: border-box;
        }

        .refer-share-label {
          font-size: 12px;
          color: var(--text-muted);
          font-weight: 600;
        }

        .refer-share-buttons-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 8px;
          width: 100%;
          box-sizing: border-box;
        }

        .refer-social-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          padding: 8px 10px;
          border-radius: 10px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          border: 1px solid transparent;
          transition: all 0.2s;
          text-decoration: none;
          min-height: 40px;
          min-width: 0;
          width: 100%;
          box-sizing: border-box;
          overflow: hidden;
          white-space: nowrap;
        }

        .refer-social-icon {
          flex-shrink: 0;
          font-size: 14px;
        }

        .refer-btn-whatsapp {
          background: rgba(37, 211, 102, 0.12);
          color: #25d366;
          border-color: rgba(37, 211, 102, 0.3);
        }
        .refer-btn-whatsapp:hover {
          background: rgba(37, 211, 102, 0.22);
          border-color: #25d366;
        }

        .refer-btn-telegram {
          background: rgba(34, 158, 217, 0.12);
          color: #38bdf8;
          border-color: rgba(34, 158, 217, 0.3);
        }
        .refer-btn-telegram:hover {
          background: rgba(34, 158, 217, 0.22);
          border-color: #38bdf8;
        }

        .refer-btn-facebook {
          background: rgba(24, 119, 242, 0.12);
          color: #60a5fa;
          border-color: rgba(24, 119, 242, 0.3);
        }
        .refer-btn-facebook:hover {
          background: rgba(24, 119, 242, 0.22);
          border-color: #60a5fa;
        }

        .refer-btn-more {
          background: rgba(108, 71, 255, 0.12);
          color: #a78bfa;
          border-color: rgba(108, 71, 255, 0.3);
        }
        .refer-btn-more:hover {
          background: rgba(108, 71, 255, 0.22);
          border-color: #a78bfa;
        }

        /* ── Code Box ── */
        .refer-code-card {
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          background: var(--bg-card);
          border: 1px dashed rgba(108, 71, 255, 0.4);
          gap: 14px;
          width: 100%;
          box-sizing: border-box;
          overflow: hidden;
        }

        .refer-code-left {
          min-width: 0;
          flex: 1;
        }

        .refer-code-caption {
          font-size: 11px;
          color: var(--text-muted);
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 3px;
        }

        .refer-code-value {
          font-size: clamp(20px, 5vw, 26px);
          font-weight: 900;
          color: var(--primary);
          letter-spacing: 0.1em;
          font-family: monospace;
          line-height: 1.1;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .refer-code-hint {
          font-size: 11.5px;
          color: var(--text-muted);
          margin-top: 3px;
        }

        .refer-code-right {
          flex-shrink: 0;
        }

        .refer-code-copy-btn {
          min-width: 100px;
          height: 38px;
        }

        /* ── Steps Card ── */
        .refer-steps-card {
          margin-bottom: 18px;
          padding: 20px 16px;
          background: rgba(245, 158, 11, 0.03);
          border: 1px solid rgba(245, 158, 11, 0.2);
          width: 100%;
          box-sizing: border-box;
          overflow: hidden;
        }

        .refer-steps-header {
          margin-bottom: 16px;
          width: 100%;
        }

        .refer-steps-title {
          font-size: 15px;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 3px;
        }

        .refer-steps-subtitle {
          font-size: 12px;
          color: var(--text-muted);
        }

        .refer-steps-grid {
          display: grid;
          grid-template-columns: 1fr auto 1fr auto 1fr;
          align-items: center;
          gap: 8px;
          margin-bottom: 16px;
          width: 100%;
          box-sizing: border-box;
        }

        .refer-step-item {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 14px 10px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          min-width: 0;
          width: 100%;
          box-sizing: border-box;
        }

        .refer-step-top {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          margin-bottom: 6px;
        }

        .refer-step-badge {
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: var(--text-muted);
          background: var(--bg-surface);
          border: 1px solid var(--border);
          padding: 2px 7px;
          border-radius: 99px;
        }

        .refer-step-badge-success {
          color: var(--success);
          border-color: rgba(16, 185, 129, 0.3);
          background: rgba(16, 185, 129, 0.1);
        }

        .refer-step-icon {
          font-size: 22px;
        }

        .refer-step-name {
          font-size: 12.5px;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 4px;
        }

        .refer-step-text {
          font-size: 11.5px;
          color: var(--text-muted);
          line-height: 1.45;
          overflow-wrap: break-word;
        }

        .refer-step-connector {
          width: 16px;
          height: 2px;
          background: var(--border-bright);
          flex-shrink: 0;
        }

        .refer-steps-notice {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          padding: 10px 12px;
          background: rgba(245, 158, 11, 0.08);
          border-radius: 10px;
          font-size: 11.5px;
          color: var(--text-secondary);
          line-height: 1.5;
          width: 100%;
          box-sizing: border-box;
        }

        /* ── Referral History Card ── */
        .refer-history-card {
          padding: 20px 16px;
          width: 100%;
          box-sizing: border-box;
          overflow: hidden;
        }

        .refer-history-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 10px;
          margin-bottom: 16px;
          width: 100%;
        }

        .refer-history-title-wrap {
          min-width: 0;
        }

        .refer-filter-pills {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }

        .refer-filter-pill {
          padding: 5px 10px;
          border-radius: 99px;
          font-size: 11px;
          font-weight: 600;
          background: var(--bg-surface);
          border: 1px solid var(--border);
          color: var(--text-muted);
          cursor: pointer;
          transition: all 0.2s;
        }

        .refer-filter-pill:hover {
          color: var(--text-primary);
          border-color: var(--border-bright);
        }

        .refer-filter-pill.active {
          background: rgba(108, 71, 255, 0.15);
          color: var(--primary);
          border-color: rgba(108, 71, 255, 0.4);
        }

        .refer-empty-state {
          text-align: center;
          padding: 32px 12px;
          width: 100%;
          box-sizing: border-box;
        }

        .refer-empty-icon {
          font-size: 38px;
          margin-bottom: 10px;
          opacity: 0.8;
        }

        .refer-user-avatar {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: var(--primary-gradient);
          color: white;
          font-size: 12px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .refer-desktop-table {
          display: block;
          width: 100%;
          box-sizing: border-box;
        }

        .refer-mobile-list {
          display: none;
          width: 100%;
          box-sizing: border-box;
        }

        /* ── Breakpoints ── */
        @media (max-width: 768px) {
          .refer-stats-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 8px;
          }

          .refer-stat-card {
            padding: 10px 8px;
            gap: 8px;
          }

          .refer-stat-icon-wrap {
            width: 32px;
            height: 32px;
            font-size: 15px;
          }

          .refer-steps-grid {
            grid-template-columns: 1fr;
            gap: 8px;
          }

          .refer-step-connector {
            display: none;
          }

          .refer-step-item {
            padding: 12px 10px;
            flex-direction: row;
            text-align: left;
            align-items: flex-start;
            gap: 10px;
          }

          .refer-step-top {
            flex-direction: column;
            align-items: center;
            gap: 4px;
            flex-shrink: 0;
            margin-bottom: 0;
          }

          .refer-step-content {
            min-width: 0;
            flex: 1;
          }
        }

        @media (max-width: 640px) {
          /* Switch Table to Mobile Card List */
          .refer-desktop-table {
            display: none;
          }

          .refer-mobile-list {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }

          .refer-mobile-item {
            background: rgba(255, 255, 255, 0.02);
            border: 1px solid var(--border);
            border-radius: 12px;
            padding: 12px;
            width: 100%;
            box-sizing: border-box;
          }

          .refer-mobile-item-top {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
            margin-bottom: 8px;
          }

          .refer-mobile-item-user {
            display: flex;
            align-items: center;
            gap: 8px;
            min-width: 0;
            flex: 1;
          }

          .refer-mobile-user-name {
            font-size: 13.5px;
            font-weight: 700;
            color: var(--text-primary);
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .refer-mobile-date {
            font-size: 11px;
            color: var(--text-muted);
            margin-top: 1px;
          }

          .refer-mobile-item-bottom {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding-top: 8px;
            border-top: 1px solid rgba(255, 255, 255, 0.05);
            font-size: 11.5px;
          }

          .refer-mobile-reward-label {
            color: var(--text-muted);
          }

          /* Small screens: Link Input Wrap */
          .refer-link-input-row {
            flex-direction: column;
            gap: 8px;
          }

          .refer-copy-btn {
            width: 100%;
            height: 42px;
          }

          /* Mobile 2x2 grid for social share */
          .refer-share-buttons-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 8px;
          }

          .refer-code-card {
            flex-direction: column;
            align-items: stretch;
            text-align: center;
            gap: 12px;
            padding: 16px 14px;
          }

          .refer-code-right {
            width: 100%;
          }

          .refer-code-copy-btn {
            width: 100%;
            height: 40px;
          }
        }

        /* Ultra small phones (< 380px) */
        @media (max-width: 380px) {
          .refer-hero-card {
            padding: 20px 12px;
          }

          .refer-hero-features {
            flex-direction: column;
            align-items: center;
            gap: 5px;
          }

          .refer-hero-feature-item {
            width: 100%;
            justify-content: center;
          }

          .refer-stat-card {
            padding: 8px 6px;
            gap: 6px;
          }

          .refer-stat-icon-wrap {
            width: 28px;
            height: 28px;
            font-size: 13px;
          }

          .refer-stat-value {
            font-size: 15px;
          }

          .refer-stat-label {
            font-size: 10px;
          }
        }
      `}</style>
    </div>
  )
}
