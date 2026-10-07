'use client'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { formatINR, formatDate } from '@/lib/utils'

interface DashboardData {
  wallet: { availableBalance: number; totalEarned: number; referralEarnings: number }
  todayEarnings: number
  transactions: Array<{ id: string; type: string; amount: number; description: string; createdAt: string }>
}

interface CampaignsData {
  campaigns: Array<{ id: string; name: string; sponsor: string; rewardAmount: number; userStatus: string; watchDuration: number }>
  todayCount: number
  dailyLimit: number
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const [walletData, setWalletData] = useState<DashboardData | null>(null)
  const [campaignData, setCampaignData] = useState<CampaignsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/user/wallet').then((r) => r.json()),
      fetch('/api/earn/campaigns').then((r) => r.json()),
    ]).then(([w, c]) => {
      if (w.success) setWalletData(w.data)
      if (c.success) setCampaignData(c.data)
      setLoading(false)
    })
  }, [])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening'
  const firstName = session?.user?.name?.split(' ')[0] ?? 'User'

  if (loading) {
    return (
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div className="skeleton" style={{ height: 40, width: 280, borderRadius: 12, marginBottom: 24 }} />
        <div className="skeleton" style={{ height: 180, borderRadius: 20, marginBottom: 20 }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }} className="dashboard-stats-grid">
          {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton" style={{ height: 130, borderRadius: 18 }} />)}
        </div>
      </div>
    )
  }

  const availableCount = campaignData?.campaigns.filter((c) => c.userStatus === 'AVAILABLE').length ?? 0
  const todayWatchCount = campaignData?.todayCount ?? 0
  const dailyWatchLimit = campaignData?.dailyLimit ?? 10
  const watchProgressPct = Math.min((todayWatchCount / dailyWatchLimit) * 100, 100)

  return (
    <div className="animate-fade-in" style={{ maxWidth: 1100, margin: '0 auto' }}>
      {/* ── Top Header with Greeting & Profile Pill ── */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 22,
        flexWrap: 'wrap',
        gap: 12,
      }}>
        <div>
          <h1 style={{
            fontSize: 'clamp(22px, 5vw, 28px)',
            fontWeight: 800,
            marginBottom: 4,
            color: 'var(--text-primary)',
            letterSpacing: '-0.02em',
          }}>
            {greeting}, {firstName} 👋
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-muted)' }}>
            <span>Here&apos;s your earnings overview</span>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              background: 'rgba(16,185,129,0.12)',
              color: '#10b981',
              padding: '2px 8px',
              borderRadius: 99,
              fontSize: 11,
              fontWeight: 700,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} /> Live
            </span>
          </div>
        </div>

        {/* Profile Chip */}
        <Link
          href="/profile"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid var(--border)',
            padding: '5px 12px 5px 6px',
            borderRadius: 99,
            textDecoration: 'none',
            transition: 'border-color 0.2s',
          }}
        >
          <div style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: 'var(--primary-gradient)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            color: '#fff',
            fontSize: 13,
            boxShadow: '0 2px 8px var(--primary-glow)',
          }}>
            {firstName.charAt(0).toUpperCase()}
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>{firstName}</div>
            <div style={{ fontSize: 10, color: 'var(--primary)', fontWeight: 600 }}>Active Earner</div>
          </div>
        </Link>
      </div>

      {/* ── Featured Hero Wallet Card ── */}
      <div style={{
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, rgba(108,71,255,0.22) 0%, rgba(168,85,247,0.14) 45%, rgba(13,22,40,0.85) 100%)',
        border: '1px solid rgba(168,85,247,0.3)',
        borderRadius: 22,
        padding: '24px 22px',
        marginBottom: 18,
        boxShadow: '0 16px 40px rgba(0,0,0,0.35)',
      }}>
        {/* Decorative background glow */}
        <div style={{
          position: 'absolute',
          top: -30,
          right: -30,
          width: 180,
          height: 180,
          background: 'radial-gradient(circle, rgba(168,85,247,0.35) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              background: 'rgba(108,71,255,0.25)',
              border: '1px solid rgba(108,71,255,0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 17,
            }}>
              💳
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Available Balance
            </span>
          </div>
          <span style={{
            fontSize: 11,
            fontWeight: 700,
            color: '#10b981',
            background: 'rgba(16,185,129,0.12)',
            border: '1px solid rgba(16,185,129,0.3)',
            padding: '3px 10px',
            borderRadius: 99,
          }}>
            ⚡ Ready to Withdraw
          </span>
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          flexWrap: 'wrap',
          gap: 16,
          position: 'relative',
          zIndex: 1,
          marginBottom: 18,
        }}>
          <div>
            <div style={{
              fontSize: 'clamp(32px, 8vw, 42px)',
              fontWeight: 900,
              color: '#fff',
              letterSpacing: '-0.02em',
              lineHeight: 1.1,
            }}>
              {formatINR(walletData?.wallet.availableBalance ?? 0)}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
              Total Earned: <strong style={{ color: 'var(--text-primary)' }}>{formatINR(walletData?.wallet.totalEarned ?? 0)}</strong>
            </div>
          </div>

          <Link
            href="/withdraw"
            className="btn btn-primary"
            style={{
              padding: '11px 22px',
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 700,
              boxShadow: '0 4px 20px var(--primary-glow)',
            }}
          >
            🏧 Withdraw Funds →
          </Link>
        </div>

        {/* Mini quick summary row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 12,
          paddingTop: 14,
          borderTop: '1px solid rgba(255,255,255,0.08)',
          position: 'relative',
          zIndex: 1,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'rgba(16,185,129,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 16,
            }}>
              📈
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Today&apos;s Earnings</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#10b981' }}>
                {formatINR(walletData?.todayEarnings ?? 0)}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'rgba(245,158,11,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 16,
            }}>
              👥
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Referral Earnings</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#f59e0b' }}>
                {formatINR(walletData?.wallet.referralEarnings ?? 0)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── High-Impact "Watch & Earn ₹20" Action Banner ── */}
      <Link
        href="/earn"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 14,
          background: 'linear-gradient(135deg, #6c47ff 0%, #a855f7 100%)',
          borderRadius: 18,
          padding: '16px 20px',
          textDecoration: 'none',
          color: '#fff',
          marginBottom: 14,
          boxShadow: '0 8px 24px rgba(108,71,255,0.3)',
          position: 'relative',
          overflow: 'hidden',
          transition: 'transform 0.2s, box-shadow 0.2s',
        }}
        className="watch-hero-banner"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: 'rgba(255,255,255,0.22)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
            flexShrink: 0,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          }}>
            ▶
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 16, fontWeight: 800 }}>Watch & Earn ₹20</span>
              <span style={{
                background: 'rgba(255,255,255,0.25)',
                fontSize: 11,
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: 99,
              }}>
                ₹20 / Video
              </span>
            </div>
            <div style={{ fontSize: 12, opacity: 0.92, marginTop: 2 }}>
              {todayWatchCount} of {dailyWatchLimit} watched today • Tap to start watching!
            </div>
          </div>
        </div>

        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 34,
          height: 34,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.25)',
          fontSize: 15,
          fontWeight: 800,
          flexShrink: 0,
        }}>
          →
        </div>
      </Link>

      {/* ── Quick Action Row: Invite Friends & Top Earners ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 22 }}>
        <Link
          href="/refer"
          className="card"
          style={{
            padding: '14px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            textDecoration: 'none',
            borderRadius: 16,
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            transition: 'all 0.2s',
          }}
        >
          <div style={{
            width: 38,
            height: 38,
            borderRadius: 11,
            background: 'rgba(245,158,11,0.15)',
            border: '1px solid rgba(245,158,11,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18,
            flexShrink: 0,
          }}>
            👥
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 800, fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.2 }}>Invite Friends</div>
            <div style={{ fontSize: 11, color: '#f59e0b', fontWeight: 600, marginTop: 2 }}>Get ₹200 / friend</div>
          </div>
        </Link>

        <Link
          href="/leaderboard"
          className="card"
          style={{
            padding: '14px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            textDecoration: 'none',
            borderRadius: 16,
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            transition: 'all 0.2s',
          }}
        >
          <div style={{
            width: 38,
            height: 38,
            borderRadius: 11,
            background: 'rgba(56,189,248,0.15)',
            border: '1px solid rgba(56,189,248,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18,
            flexShrink: 0,
          }}>
            🏆
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 800, fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.2 }}>Top Earners</div>
            <div style={{ fontSize: 11, color: '#38bdf8', fontWeight: 600, marginTop: 2 }}>View Leaderboard</div>
          </div>
        </Link>
      </div>

      {/* ── 4-Stats Grid with Glow & Micro Progress ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 14,
        marginBottom: 32,
      }} className="dashboard-stats-grid">
        {[
          {
            label: 'Available Balance',
            value: formatINR(walletData?.wallet.availableBalance ?? 0),
            icon: '💳',
            iconBg: 'rgba(108,71,255,0.15)',
            iconBorder: 'rgba(108,71,255,0.3)',
            color: 'var(--primary)',
            subtitle: 'Ready to withdraw',
          },
          {
            label: "Today's Earnings",
            value: formatINR(walletData?.todayEarnings ?? 0),
            icon: '📈',
            iconBg: 'rgba(16,185,129,0.15)',
            iconBorder: 'rgba(16,185,129,0.3)',
            color: '#10b981',
            subtitle: 'Daily video income',
          },
          {
            label: 'Videos Watched',
            value: `${todayWatchCount} / ${dailyWatchLimit}`,
            icon: '▶',
            iconBg: 'rgba(56,189,248,0.15)',
            iconBorder: 'rgba(56,189,248,0.3)',
            color: '#38bdf8',
            progress: watchProgressPct,
            subtitle: `${Math.max(dailyWatchLimit - todayWatchCount, 0)} videos remaining`,
          },
          {
            label: 'Referral Earnings',
            value: formatINR(walletData?.wallet.referralEarnings ?? 0),
            icon: '👥',
            iconBg: 'rgba(245,158,11,0.15)',
            iconBorder: 'rgba(245,158,11,0.3)',
            color: '#f59e0b',
            subtitle: 'From active invites',
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="stat-card"
            style={{
              padding: '16px 14px',
              background: 'rgba(17,29,53,0.7)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 18,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: stat.iconBg,
                  border: `1px solid ${stat.iconBorder}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 17,
                }}>
                  {stat.icon}
                </div>
              </div>
              <div style={{
                fontSize: 'clamp(20px, 4vw, 24px)',
                fontWeight: 800,
                color: stat.color,
                letterSpacing: '-0.02em',
                marginBottom: 3,
              }}>
                {stat.value}
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
                {stat.label}
              </div>
            </div>

            {stat.progress !== undefined ? (
              <div style={{ marginTop: 10 }}>
                <div style={{ height: 6, background: 'var(--bg-surface)', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${stat.progress}%`,
                    background: 'var(--primary-gradient)',
                    borderRadius: 99,
                    transition: 'width 0.4s ease',
                  }} />
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>
                  {stat.subtitle}
                </div>
              </div>
            ) : (
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 8 }}>
                {stat.subtitle}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── Two-Column Bottom Grid: Available Videos & Recent Transactions ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }} className="dashboard-bottom-grid">
        {/* Available videos */}
        <div className="card" style={{ padding: 22, borderRadius: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 800, marginBottom: 2 }}>Available Videos</h2>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>Watch & receive instant payout</p>
            </div>
            <Link href="/earn" style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 700 }}>
              View all →
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {campaignData?.campaigns.slice(0, 4).map((campaign, i) => (
              <div
                key={campaign.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid var(--border)',
                  borderRadius: 14,
                }}
              >
                <div style={{
                  width: 40,
                  height: 40,
                  background: 'var(--primary-gradient)',
                  borderRadius: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 16,
                  color: '#fff',
                  flexShrink: 0,
                }}>
                  ▶
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontWeight: 700,
                    fontSize: 13,
                    marginBottom: 2,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    color: 'var(--text-primary)',
                  }}>
                    {campaign.name}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {campaign.sponsor} · ⏱️ {campaign.watchDuration}s
                  </div>
                </div>
                <div>
                  {campaign.userStatus === 'AVAILABLE' ? (
                    <Link
                      href={`/earn/${campaign.id}`}
                      className="btn btn-primary btn-sm"
                      style={{ padding: '6px 14px', fontSize: 12, fontWeight: 700 }}
                    >
                      ₹{campaign.rewardAmount}
                    </Link>
                  ) : campaign.userStatus === 'COMPLETED_TODAY' ? (
                    <span className="badge badge-success">✓ Done</span>
                  ) : (
                    <span className="badge badge-secondary">🔒</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {availableCount === 0 && (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px 0', fontSize: 13 }}>
              <div style={{ fontSize: 28, marginBottom: 6 }}>🎉</div>
              All videos watched today! Come back tomorrow for new campaigns.
            </div>
          )}
        </div>

        {/* Recent transactions */}
        <div className="card" style={{ padding: 22, borderRadius: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 800, marginBottom: 2 }}>Recent Activity</h2>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>Latest balance updates</p>
            </div>
            <Link href="/wallet" style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 700 }}>
              View all →
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(walletData?.transactions ?? []).slice(0, 5).map((tx) => (
              <div
                key={tx.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid var(--border)',
                  borderRadius: 14,
                }}
              >
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 16,
                  background: tx.amount > 0 ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                  color: tx.amount > 0 ? '#10b981' : 'var(--error)',
                  fontWeight: 800,
                  flexShrink: 0,
                }}>
                  {tx.amount > 0 ? '↑' : '↓'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontWeight: 700,
                    fontSize: 13,
                    color: 'var(--text-primary)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {tx.description}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{formatDate(tx.createdAt)}</div>
                </div>
                <div style={{
                  fontWeight: 800,
                  fontSize: 13,
                  color: tx.amount > 0 ? '#10b981' : 'var(--error)',
                  whiteSpace: 'nowrap',
                }}>
                  {tx.amount > 0 ? '+' : ''}{formatINR(tx.amount)}
                </div>
              </div>
            ))}
          </div>

          {(walletData?.transactions ?? []).length === 0 && (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px 0', fontSize: 13 }}>
              <div style={{ fontSize: 28, marginBottom: 6 }}>💰</div>
              No transactions yet. Start watching videos to earn!
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .dashboard-stats-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          .dashboard-bottom-grid {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 480px) {
          .watch-hero-banner {
            padding: 14px 16px !important;
          }
        }
      `}</style>
    </div>
  )
}
