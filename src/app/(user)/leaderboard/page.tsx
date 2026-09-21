'use client'
import { useEffect, useState } from 'react'
import { formatINR } from '@/lib/utils'

interface LeaderboardEntry {
  rank: number
  maskedName: string
  totalEarned: number
  isCurrentUser: boolean
}

const MEDALS: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' }
const MEDAL_COLORS: Record<number, string> = {
  1: 'var(--gold)',
  2: 'var(--silver)',
  3: 'var(--bronze)',
}

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/leaderboard').then(r => r.json()).then(d => {
      if (d.success) setEntries(d.data)
      setLoading(false)
    })
  }, [])

  const top3 = entries.slice(0, 3)
  const rest = entries.slice(3)

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: 32, textAlign: 'center' }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>🏆 Top Earners</h1>
        <p style={{ color: 'var(--text-muted)' }}>Verified earnings leaderboard — names are partially masked for privacy.</p>
      </div>

      {loading ? (
        <div className="skeleton" style={{ height: 400, borderRadius: 16 }} />
      ) : entries.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 40px' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
          <h2 style={{ marginBottom: 8 }}>No data yet</h2>
          <p style={{ color: 'var(--text-muted)' }}>Be the first to earn and appear on the leaderboard!</p>
        </div>
      ) : (
        <>
          {/* Top 3 Podium */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 32 }}>
            {[
              top3[1] ? { ...top3[1], displayRank: 2 } : null,
              top3[0] ? { ...top3[0], displayRank: 1 } : null,
              top3[2] ? { ...top3[2], displayRank: 3 } : null,
            ].map((entry, colIndex) => {
              if (!entry) return <div key={colIndex} />
              const rank = entry.displayRank
              return (
                <div
                  key={entry.rank}
                  className="card"
                  style={{
                    textAlign: 'center',
                    padding: '32px 20px',
                    borderColor: `${MEDAL_COLORS[rank]}40`,
                    background: `linear-gradient(135deg, ${MEDAL_COLORS[rank]}12 0%, var(--bg-card) 100%)`,
                    transform: rank === 1 ? 'scale(1.04)' : 'none',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {entry.isCurrentUser && (
                    <div className="badge badge-primary" style={{ position: 'absolute', top: 12, right: 12, fontSize: 11 }}>You</div>
                  )}
                  <div style={{ fontSize: 48, marginBottom: 8 }}>{MEDALS[rank]}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 }}>#{rank}</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>{entry.maskedName}</div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: MEDAL_COLORS[rank] }}>{formatINR(entry.totalEarned)}</div>
                </div>
              )
            })}
          </div>

          {/* Rest of leaderboard */}
          {rest.length > 0 && (
            <div className="card">
              <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Full Rankings</h2>
              {rest.map((entry) => (
                <div
                  key={entry.rank}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    padding: '14px 0',
                    borderBottom: entry.rank < entries.length ? '1px solid var(--border)' : 'none',
                    background: entry.isCurrentUser ? 'rgba(108,71,255,0.05)' : 'transparent',
                    borderRadius: entry.isCurrentUser ? 8 : 0,
                    paddingLeft: entry.isCurrentUser ? 12 : 0,
                  }}
                >
                  <div style={{ width: 36, textAlign: 'center', fontSize: 14, fontWeight: 700, color: 'var(--text-muted)' }}>
                    #{entry.rank}
                  </div>
                  <div style={{ flex: 1, fontWeight: 600, fontSize: 15 }}>
                    {entry.maskedName}
                    {entry.isCurrentUser && <span className="badge badge-primary" style={{ marginLeft: 8, fontSize: 11 }}>You</span>}
                  </div>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 16 }}>
                    {formatINR(entry.totalEarned)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <div style={{ textAlign: 'center', marginTop: 24, padding: 16, background: 'rgba(148,163,184,0.05)', borderRadius: 12, border: '1px solid var(--border)', fontSize: 13, color: 'var(--text-muted)' }}>
        🔒 Names are partially masked for privacy. Rankings are based on verified earnings only.
      </div>

      <style>{`
        @media (max-width: 768px) {
          div[style*="grid-template-columns: repeat(3, 1fr)"] { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
