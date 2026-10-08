'use client'
import { useEffect, useState, useCallback } from 'react'

interface Config {
  key: string
  value: string
  label: string | null
  group: string | null
}

const GROUP_ORDER = ['earning', 'referral', 'withdrawal', 'payment']

const GROUP_METADATA: Record<string, { title: string; desc: string; icon: string }> = {
  earning: {
    title: 'Video & Earning Rules',
    desc: 'Set video watch duration, rewards per video, and daily limits.',
    icon: '🎬',
  },
  referral: {
    title: 'Referral Rewards Program',
    desc: 'Set cash rewards paid per qualified friend invitation.',
    icon: '👥',
  },
  withdrawal: {
    title: 'Withdrawal Limits & Requirements',
    desc: 'Configure minimum withdrawal limits, ad/referral unlock criteria, and processing days.',
    icon: '🏧',
  },
  payment: {
    title: 'FamPay & Payment Gateway',
    desc: 'Configure UPI payment credentials for activation fees and deposits.',
    icon: '💳',
  },
}

const FIELD_HINTS: Record<string, { hint: string; unit?: string; type?: string }> = {
  min_watch_duration: {
    hint: '⚡ Instantly updates all active video campaigns. Users must watch this long to earn rewards.',
    unit: 'seconds',
    type: 'number',
  },
  video_reward_amount: {
    hint: '💰 Reward amount credited to users for each completed video.',
    unit: '₹',
    type: 'number',
  },
  daily_video_limit: {
    hint: 'Maximum videos a user can watch per day.',
    unit: 'videos',
    type: 'number',
  },
  max_daily_earning: {
    hint: 'Maximum earnings a user can accumulate in 24 hours.',
    unit: '₹',
    type: 'number',
  },
  referral_reward_amount: {
    hint: 'Cash reward credited to referrer when a friend completes their first video.',
    unit: '₹',
    type: 'number',
  },
  referral_qualification: {
    hint: 'Trigger required before referral reward is granted (e.g. FIRST_VIDEO).',
    type: 'text',
  },
  min_withdrawal: {
    hint: 'Minimum wallet balance needed to request a withdrawal.',
    unit: '₹',
    type: 'number',
  },
  min_ads_for_withdrawal: {
    hint: 'Number of videos a user must watch before unlocking withdrawals.',
    unit: 'videos',
    type: 'number',
  },
  min_referrals_for_withdrawal: {
    hint: 'Number of qualified friends a user must refer before unlocking withdrawals.',
    unit: 'friends',
    type: 'number',
  },
  withdrawal_processing_days: {
    hint: 'Expected business days to process and pay withdrawals.',
    unit: 'days',
    type: 'number',
  },
  activation_fee: {
    hint: 'Fee users pay to activate high-value withdrawal channels.',
    unit: '₹',
    type: 'number',
  },
  admin_fampay_upi: {
    hint: 'Users send activation fees to this FamPay UPI ID (e.g. username@fam).',
    type: 'text',
  },
  admin_fampay_qr_url: {
    hint: 'Optional image link to your FamPay QR code.',
    type: 'text',
  },
  admin_upi_id: {
    hint: 'Backup admin UPI address for direct deposits.',
    type: 'text',
  },
}

export default function AdminSettingsPage() {
  const [configs, setConfigs] = useState<Config[]>([])
  const [edited, setEdited] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [savedMessage, setSavedMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [loading, setLoading] = useState(true)

  const fetchSettings = useCallback(() => {
    fetch('/api/admin/settings')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setConfigs(d.data)
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  function handleChange(key: string, value: string) {
    setEdited((e) => ({ ...e, [key]: value }))
    setSavedMessage('')
    setErrorMessage('')
  }

  // Quick preset helper
  function applyPreset(key: string, value: string) {
    handleChange(key, value)
  }

  async function handleSave() {
    if (Object.keys(edited).length === 0) return
    setSaving(true)
    setSavedMessage('')
    setErrorMessage('')

    try {
      const updates = Object.entries(edited).map(([key, value]) => ({ key, value }))
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates }),
      })
      const data = await res.json()
      if (data.success) {
        setSavedMessage('✓ All settings saved and synchronized with active video campaigns!')
        setEdited({})
        fetchSettings()
      } else {
        setErrorMessage(data.error || 'Failed to save settings')
      }
    } catch {
      setErrorMessage('Network error while saving settings')
    } finally {
      setSaving(false)
    }
  }

  // Group items
  const grouped = configs.reduce<Record<string, Config[]>>((acc, cfg) => {
    const g = cfg.group ?? 'earning'
    if (!acc[g]) acc[g] = []
    acc[g].push(cfg)
    return acc
  }, {})

  const orderedGroups = [
    ...GROUP_ORDER.filter((g) => grouped[g] && grouped[g].length > 0),
    ...Object.keys(grouped).filter((g) => !GROUP_ORDER.includes(g)),
  ]

  if (loading) {
    return (
      <div style={{ maxWidth: 840 }}>
        <div className="skeleton" style={{ height: 32, width: 220, borderRadius: 8, marginBottom: 12 }} />
        <div className="skeleton" style={{ height: 16, width: 340, borderRadius: 6, marginBottom: 28 }} />
        <div className="skeleton" style={{ height: 260, borderRadius: 18, marginBottom: 20 }} />
        <div className="skeleton" style={{ height: 220, borderRadius: 18 }} />
      </div>
    )
  }

  const unsavedCount = Object.keys(edited).length

  return (
    <div className="animate-fade-in admin-settings-page" style={{ maxWidth: 840, paddingBottom: 60 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>
            Platform Settings & Rules
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            Configure video watch duration, earning rewards, referral bonuses, and withdrawal limits in real-time.
          </p>
        </div>

        <button
          onClick={fetchSettings}
          className="btn btn-secondary btn-sm"
          type="button"
          disabled={loading}
        >
          🔄 Reload
        </button>
      </div>

      {/* Success Alert */}
      {savedMessage && (
        <div style={{
          background: 'rgba(16,185,129,0.12)',
          border: '1px solid rgba(16,185,129,0.35)',
          borderRadius: 12,
          padding: '14px 18px',
          fontSize: 14,
          color: '#10b981',
          marginBottom: 22,
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          animation: 'fadeIn 0.2s ease',
        }}>
          <span>{savedMessage}</span>
        </div>
      )}

      {/* Error Alert */}
      {errorMessage && (
        <div style={{
          background: 'rgba(239,68,68,0.12)',
          border: '1px solid rgba(239,68,68,0.35)',
          borderRadius: 12,
          padding: '14px 18px',
          fontSize: 14,
          color: 'var(--error)',
          marginBottom: 22,
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <span>⚠️ {errorMessage}</span>
        </div>
      )}

      {/* Settings Groups */}
      {orderedGroups.map((group) => {
        const meta = GROUP_METADATA[group] ?? {
          title: group.toUpperCase(),
          desc: 'Configuration options',
          icon: '⚙️',
        }
        const items = grouped[group]

        return (
          <div key={group} className="card settings-group-card" style={{ marginBottom: 22, padding: 24 }}>
            {/* Group Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18, borderBottom: '1px solid var(--border)', paddingBottom: 14 }}>
              <span style={{ fontSize: 24 }}>{meta.icon}</span>
              <div>
                <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  {meta.title}
                </h2>
                <p style={{ fontSize: 12.5, color: 'var(--text-muted)', margin: 0, marginTop: 2 }}>
                  {meta.desc}
                </p>
              </div>
            </div>

            {/* Group Fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {items.map((cfg) => {
                const hintInfo = FIELD_HINTS[cfg.key]
                const currentValue = edited[cfg.key] ?? cfg.value
                const isEdited = edited[cfg.key] !== undefined

                return (
                  <div
                    key={cfg.key}
                    className="settings-field-row"
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1.2fr 1fr',
                      gap: 20,
                      alignItems: 'start',
                      padding: '12px 14px',
                      borderRadius: 12,
                      background: isEdited ? 'rgba(108,71,255,0.06)' : 'rgba(255,255,255,0.01)',
                      border: isEdited ? '1px solid rgba(108,71,255,0.3)' : '1px solid transparent',
                      transition: 'all 0.2s',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                        <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>
                          {cfg.label ?? cfg.key}
                        </span>
                        {isEdited && (
                          <span style={{ fontSize: 10, background: 'rgba(245,158,11,0.15)', color: '#f59e0b', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>
                            MODIFIED
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace', marginBottom: 4 }}>
                        {cfg.key}
                      </div>

                      {hintInfo?.hint && (
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.45, marginTop: 4 }}>
                          {hintInfo.hint}
                        </div>
                      )}

                      {/* Quick Presets for Video Watch Duration */}
                      {cfg.key === 'min_watch_duration' && (
                        <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)', alignSelf: 'center' }}>Presets:</span>
                          {['5', '10', '15', '30', '60'].map((sec) => (
                            <button
                              key={sec}
                              type="button"
                              onClick={() => applyPreset(cfg.key, sec)}
                              className="btn btn-ghost btn-sm"
                              style={{ padding: '2px 8px', fontSize: 11, borderRadius: 6, height: 24 }}
                            >
                              {sec}s
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Quick Presets for Video Reward */}
                      {cfg.key === 'video_reward_amount' && (
                        <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)', alignSelf: 'center' }}>Presets:</span>
                          {['10', '20', '50', '100'].map((amt) => (
                            <button
                              key={amt}
                              type="button"
                              onClick={() => applyPreset(cfg.key, amt)}
                              className="btn btn-ghost btn-sm"
                              style={{ padding: '2px 8px', fontSize: 11, borderRadius: 6, height: 24 }}
                            >
                              ₹{amt}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Input Control */}
                    <div>
                      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <input
                          type={hintInfo?.type === 'number' ? 'number' : 'text'}
                          className="input"
                          value={currentValue}
                          onChange={(e) => handleChange(cfg.key, e.target.value)}
                          id={`setting-${cfg.key}`}
                          style={{
                            paddingRight: hintInfo?.unit ? 70 : 14,
                            fontWeight: 600,
                            fontFamily: hintInfo?.type === 'number' ? 'monospace' : 'inherit',
                          }}
                        />
                        {hintInfo?.unit && (
                          <span
                            style={{
                              position: 'absolute',
                              right: 12,
                              color: 'var(--text-muted)',
                              fontSize: 12,
                              fontWeight: 600,
                              pointerEvents: 'none',
                            }}
                          >
                            {hintInfo.unit}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      {/* Floating Save Action Bar */}
      <div
        className="settings-save-bar"
        style={{
          position: 'sticky',
          bottom: 20,
          background: 'rgba(17, 29, 53, 0.95)',
          backdropFilter: 'blur(12px)',
          padding: '16px 20px',
          borderRadius: 16,
          border: '1px solid var(--border-bright)',
          boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
          zIndex: 30,
        }}
      >
        <div>
          {unsavedCount > 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} />
              <span style={{ fontSize: 14, fontWeight: 700, color: '#f59e0b' }}>
                {unsavedCount} unsaved change{unsavedCount === 1 ? '' : 's'}
              </span>
            </div>
          ) : (
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              All settings are saved and active.
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          {unsavedCount > 0 && (
            <button
              onClick={() => { setEdited({}); setSavedMessage('') }}
              className="btn btn-ghost btn-sm"
              type="button"
              disabled={saving}
            >
              Discard Changes
            </button>
          )}

          <button
            onClick={handleSave}
            className="btn btn-primary"
            disabled={saving || unsavedCount === 0}
            id="save-settings-btn"
            style={{ minWidth: 140 }}
          >
            {saving ? 'Saving...' : '💾 Save All Changes'}
          </button>
        </div>
      </div>

      <style>{`
        @media (max-width: 640px) {
          .settings-group-card {
            padding: 16px 12px !important;
          }
          .settings-field-row {
            grid-template-columns: 1fr !important;
            gap: 10px !important;
            padding: 10px 8px !important;
          }
          .settings-save-bar {
            bottom: 76px !important;
          }
        }
      `}</style>
    </div>
  )
}
