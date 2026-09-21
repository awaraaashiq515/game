'use client'
import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

interface Campaign {
  id: string
  name: string
  sponsor: string
  videoUrl: string
  rewardAmount: number
  watchDuration: number
}

// ─── YouTube URL → proper embed URL ─────────────────────────────────────────
// Handles: youtube.com/watch?v=, youtu.be/, youtube.com/shorts/, youtube.com/embed/
function isLocalVideo(url: string): boolean {
  return url.startsWith('/uploads/') || url.startsWith('/videos/') || /\.(mp4|webm|ogg|mov)$/i.test(url)
}

function toYouTubeEmbedUrl(url: string, autoplay = false): string {
  if (!url) return ''

  let videoId = ''

  try {
    const u = new URL(url)

    if (u.hostname.includes('youtu.be')) {
      // https://youtu.be/VIDEO_ID
      videoId = u.pathname.replace(/^\//, '').split('?')[0]
    } else if (u.hostname.includes('youtube.com') || u.hostname.includes('youtube-nocookie.com')) {
      if (u.pathname.includes('/embed/')) {
        // Already embed format
        videoId = u.pathname.split('/embed/')[1]?.split('?')[0] ?? ''
      } else if (u.pathname.includes('/shorts/')) {
        // ✅ YouTube Shorts: https://youtube.com/shorts/VIDEO_ID
        videoId = u.pathname.split('/shorts/')[1]?.split('?')[0] ?? ''
      } else {
        // https://www.youtube.com/watch?v=VIDEO_ID
        videoId = u.searchParams.get('v') ?? ''
      }
    }
  } catch {
    // Not a valid URL — could be a raw video ID or local path
    videoId = url
  }

  if (!videoId) return url

  const params = new URLSearchParams({
    autoplay: autoplay ? '1' : '0',
    rel: '0',
    modestbranding: '1',
    enablejsapi: '1',
  })

  // youtube-nocookie.com — works on localhost without X-Frame-Options issues
  return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`
}

export default function WatchPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [watchedSeconds, setWatchedSeconds] = useState(0)
  const [phase, setPhase] = useState<'loading' | 'watching' | 'completed' | 'error'>('loading')
  const [error, setError] = useState('')
  const [isPlaying, setIsPlaying] = useState(false)
  const [rewardAmount, setRewardAmount] = useState(20)
  const [confirmed, setConfirmed] = useState(false)

  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null)
  const localSeconds = useRef(0)

  // Load campaign info
  useEffect(() => {
    fetch('/api/earn/campaigns')
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          const c = data.data.campaigns.find((c: Campaign) => c.id === id)
          if (!c) {
            setError('Campaign not found or not available.')
            setPhase('error')
            return
          }
          setCampaign(c)
          setRewardAmount(c.rewardAmount)
          // Start session
          return fetch('/api/earn/watch/start', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ campaignId: id }),
          }).then((r) => r.json())
        }
      })
      .then((data) => {
        if (data?.success) {
          setSessionId(data.data.sessionId)
          localSeconds.current = data.data.watchedSeconds ?? 0
          setWatchedSeconds(data.data.watchedSeconds ?? 0)
          setPhase('watching')
        } else if (data?.error) {
          setError(data.error)
          setPhase('error')
        }
      })
      .catch(() => {
        setError('Failed to start watch session.')
        setPhase('error')
      })
  }, [id])

  // Timer: increment watch time
  function startTimer() {
    if (timerRef.current) return
    timerRef.current = setInterval(() => {
      localSeconds.current += 1
      setWatchedSeconds(localSeconds.current)
    }, 1000)

    // Heartbeat every 5 seconds
    heartbeatRef.current = setInterval(() => {
      if (!sessionId) return
      fetch('/api/earn/watch/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, watchedSeconds: localSeconds.current }),
      })
    }, 5000)

    setIsPlaying(true)
  }

  function pauseTimer() {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    if (heartbeatRef.current) { clearInterval(heartbeatRef.current); heartbeatRef.current = null }
    setIsPlaying(false)
  }

  // Complete video
  async function completeVideo() {
    if (!sessionId || !campaign) return
    pauseTimer()

    const res = await fetch('/api/earn/watch/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, campaignId: id, watchedSeconds: localSeconds.current }),
    })
    const data = await res.json()
    if (data.success) {
      setRewardAmount(data.data.rewardAmount)
      setPhase('completed')
    } else {
      setError(data.error ?? 'Failed to complete video.')
      setPhase('error')
    }
  }

  useEffect(() => {
    if (campaign && watchedSeconds >= campaign.watchDuration && phase === 'watching' && isPlaying) {
      completeVideo()
    }
  }, [watchedSeconds, campaign, phase, isPlaying])

  useEffect(() => {
    return () => { pauseTimer() }
  }, [])

  const progress = campaign ? Math.min((watchedSeconds / campaign.watchDuration) * 100, 100) : 0
  const remaining = campaign ? Math.max(campaign.watchDuration - watchedSeconds, 0) : 0

  if (phase === 'loading') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="animate-spin" style={{ width: 48, height: 48, border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--text-muted)' }}>Starting your session...</p>
        </div>
      </div>
    )
  }

  if (phase === 'error') {
    return (
      <div className="card" style={{ maxWidth: 480, margin: '60px auto', textAlign: 'center', padding: '48px 36px' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
        <h2 style={{ marginBottom: 12 }}>Cannot Watch</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: 28 }}>{error}</p>
        <button onClick={() => router.push('/earn')} className="btn btn-primary">Back to Earn</button>
      </div>
    )
  }

  if (phase === 'completed') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div className="card animate-fade-in" style={{ maxWidth: 440, width: '100%', textAlign: 'center', padding: '56px 40px', borderColor: 'rgba(16,185,129,0.4)', background: 'linear-gradient(135deg, rgba(16,185,129,0.08) 0%, var(--bg-card) 100%)' }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
          <h2 style={{ fontSize: 28, fontWeight: 900, marginBottom: 8 }}>Congratulations!</h2>
          <div style={{ fontSize: 48, fontWeight: 900, color: 'var(--success)', marginBottom: 8, lineHeight: 1 }} className="text-glow-purple">
            +₹{rewardAmount}
          </div>
          <p style={{ color: 'var(--text-muted)', marginBottom: 32, fontSize: 15 }}>
            Reward added to your wallet successfully!
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button onClick={() => router.push('/earn')} className="btn btn-primary">
              Watch Next Video
            </button>
            <button onClick={() => router.push('/wallet')} className="btn btn-ghost">
              View Wallet
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Watching phase
  if (!confirmed) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div className="card animate-fade-in" style={{ maxWidth: 520, width: '100%', padding: '40px' }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Ready to watch?</h2>
          <div style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>
            <strong style={{ color: 'var(--text-primary)' }}>{campaign?.name}</strong>
            <br />Sponsor: {campaign?.sponsor}
          </div>

          <div className="card" style={{ background: 'var(--bg-surface)', marginBottom: 24, padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 8 }}>
              <span style={{ color: 'var(--text-muted)' }}>Watch duration required</span>
              <span style={{ fontWeight: 700 }}>{campaign?.watchDuration}s</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 8 }}>
              <span style={{ color: 'var(--text-muted)' }}>Reward on completion</span>
              <span style={{ fontWeight: 700, color: 'var(--success)' }}>₹{campaign?.rewardAmount}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
              <span style={{ color: 'var(--text-muted)' }}>Skipping</span>
              <span style={{ fontWeight: 700, color: 'var(--error)' }}>Not allowed</span>
            </div>
          </div>

          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24, lineHeight: 1.6 }}>
            Watch the full video for at least {campaign?.watchDuration} seconds. Do not close or minimize the window. Your session is tracked server-side.
          </p>

          <button onClick={() => setConfirmed(true)} className="btn btn-primary btn-full btn-lg">
            ▶ Start Watching
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="animate-fade-in" style={{ maxWidth: 800, margin: '0 auto' }}>
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => router.push('/earn')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 14 }}>
          ← Back
        </button>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700 }}>{campaign?.name}</h1>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{campaign?.sponsor}</div>
        </div>
        <div className="badge badge-success" style={{ marginLeft: 'auto' }}>Reward: ₹{rewardAmount}</div>
      </div>

      {/* Video */}
      <div className="video-container" style={{ marginBottom: 24 }}>
        {campaign && isLocalVideo(campaign.videoUrl) ? (
          /* ── Local uploaded video file ── */
          <video
            src={campaign.videoUrl}
            style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#000' }}
            controls={isPlaying}
            autoPlay={isPlaying}
            onPlay={startTimer}
            onPause={pauseTimer}
            title={campaign.name}
          />
        ) : (
          /* ── YouTube / external embed ── */
          <iframe
            src={toYouTubeEmbedUrl(campaign?.videoUrl ?? '', isPlaying)}
            style={{ width: '100%', height: '100%', border: 'none' }}
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            title={campaign?.name}
          />
        )}
        {!isPlaying && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0,0,0,0.7)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 16,
              cursor: 'pointer',
            }}
            onClick={startTimer}
          >
            <div style={{ width: 72, height: 72, background: 'var(--primary-gradient)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, boxShadow: '0 0 40px var(--primary-glow)' }}>▶</div>
            <p style={{ color: 'white', fontSize: 15, fontWeight: 600 }}>Click to start watching</p>
          </div>
        )}
      </div>

      {/* Progress */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>
              {isPlaying ? '● Watching...' : '⏸ Paused'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {watchedSeconds}s watched of {campaign?.watchDuration}s required
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: remaining === 0 ? 'var(--success)' : 'var(--primary)' }}>
              {remaining === 0 ? '✓ Done' : `${remaining}s left`}
            </div>
          </div>
        </div>

        <div className="progress-bar-bg" style={{ height: 10, marginBottom: 16 }}>
          <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          {!isPlaying ? (
            <button onClick={startTimer} className="btn btn-primary">▶ Resume</button>
          ) : (
            <button onClick={pauseTimer} className="btn btn-ghost">⏸ Pause</button>
          )}
        </div>

        <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', marginTop: 12 }}>
          ⚠ Do not close this window. Your progress is saved every 5 seconds.
        </p>
      </div>
    </div>
  )
}
