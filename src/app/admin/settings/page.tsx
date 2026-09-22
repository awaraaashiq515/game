'use client'
import { useEffect, useState } from 'react'

interface Config {
  key: string; value: string; label: string | null; group: string | null
}

const GROUPS: Record<string, string> = {
  payment: '💳 FamPay & Payment Gateway Settings',
  withdrawal: '🏧 Withdrawal Settings',
  earning: '🎬 Earning Settings',
  referral: '👥 Referral Settings',
}

export default function AdminSettingsPage() {
  const [configs, setConfigs] = useState<Config[]>([])
  const [edited, setEdited] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/settings').then(r => r.json()).then(d => {
      if (d.success) setConfigs(d.data)
      setLoading(false)
    })
  }, [])

  function handleChange(key: string, value: string) {
    setEdited(e => ({ ...e, [key]: value }))
    setSaved(false)
  }

  async function handleSave() {
    setSaving(true)
    const updates = Object.entries(edited).map(([key, value]) => ({ key, value }))
    const res = await fetch('/api/admin/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ updates }),
    })
    const data = await res.json()
    if (data.success) {
      // Update local configs
      setConfigs(c => c.map(cfg => edited[cfg.key] !== undefined ? { ...cfg, value: edited[cfg.key] } : cfg))
      setEdited({})
      setSaved(true)
    }
    setSaving(false)
  }

  const grouped = configs.reduce<Record<string, Config[]>>((acc, cfg) => {
    const g = cfg.group ?? 'other'
    if (!acc[g]) acc[g] = []
    acc[g].push(cfg)
    return acc
  }, {})

  if (loading) return <div className="skeleton" style={{ height: 400, borderRadius: 16 }} />

  return (
    <div className="animate-fade-in" style={{ maxWidth: 720 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800 }}>Platform Settings</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Configure earning rules, referral rewards, and withdrawal limits.</p>
      </div>

      {saved && (
        <div style={{ background: 'var(--success-bg)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 10, padding: '12px 16px', fontSize: 14, color: 'var(--success)', marginBottom: 20 }}>
          ✓ Settings saved successfully
        </div>
      )}

      {Object.entries(grouped).map(([group, items]) => (
        <div key={group} className="card" style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>
            {GROUPS[group] ?? group}
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {items.map((cfg) => (
              <div key={cfg.key} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{cfg.label ?? cfg.key}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{cfg.key}</div>
                  {cfg.key === 'admin_fampay_upi' && (
                    <div style={{ fontSize: 12, color: 'var(--primary)', marginTop: 4 }}>
                      💡 Users will send ₹5 to this FamPay UPI ID (e.g. <code>username@fam</code>)
                    </div>
                  )}
                  {cfg.key === 'admin_fampay_qr_url' && (
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                      Optional: Paste a link to your FamPay QR code image
                    </div>
                  )}
                </div>
                <input
                  type="text"
                  className="input"
                  value={edited[cfg.key] ?? cfg.value}
                  placeholder={cfg.key === 'admin_fampay_upi' ? 'e.g. username@fam' : undefined}
                  onChange={(e) => handleChange(cfg.key, e.target.value)}
                  id={`setting-${cfg.key}`}
                />
              </div>
            ))}
          </div>
        </div>
      ))}

      <div style={{ position: 'sticky', bottom: 24, background: 'var(--bg-base)', padding: '16px 0', borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {Object.keys(edited).length > 0 && (
            <span style={{ fontSize: 13, color: 'var(--warning)' }}>
              ⚠ {Object.keys(edited).length} unsaved change(s)
            </span>
          )}
          <button
            onClick={handleSave}
            className="btn btn-primary"
            disabled={saving || Object.keys(edited).length === 0}
            id="save-settings-btn"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  )
}
