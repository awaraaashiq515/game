'use client'
import { useEffect, useRef, useState } from 'react'
import { formatDate } from '@/lib/utils'

interface Campaign {
  id: string; name: string; sponsor: string; rewardAmount: number; watchDuration: number; dailyLimit: number
  totalBudget: number; spentBudget: number; status: string; totalCompletions: number; startDate: string | null; endDate: string | null
}

export default function AdminCampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewForm, setShowNewForm] = useState(false)
  const [form, setForm] = useState({ name: '', sponsor: '', videoUrl: '', rewardAmount: 20, watchDuration: 30, dailyLimit: 10, totalBudget: 10000, status: 'DRAFT', startDate: '', endDate: '', description: '' })
  const [saving, setSaving] = useState(false)

  // ─── Video upload state ─────────────────────────────────────────────────────
  const [videoMode, setVideoMode] = useState<'url' | 'upload'>('url')
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadedFileName, setUploadedFileName] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  function fetchCampaigns() {
    setLoading(true)
    fetch('/api/admin/campaigns').then(r => r.json()).then(d => {
      if (d.success) setCampaigns(d.data)
      setLoading(false)
    })
  }

  useEffect(() => { fetchCampaigns() }, [])

  // ─── Handle file upload ─────────────────────────────────────────────────────
  async function handleFileUpload(file: File) {
    if (!file) return
    setUploading(true)
    setUploadProgress(0)
    setUploadedFileName(file.name)

    const formData = new FormData()
    formData.append('video', file)

    try {
      // Simulate progress (XHR for real progress tracking)
      const xhr = new XMLHttpRequest()
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) setUploadProgress(Math.round((e.loaded / e.total) * 100))
      }

      const result = await new Promise<{ success: boolean; data?: { url: string }; error?: string }>((resolve, reject) => {
        xhr.onload = () => {
          try { resolve(JSON.parse(xhr.responseText)) } catch { reject(new Error('Invalid response')) }
        }
        xhr.onerror = () => reject(new Error('Upload failed'))
        xhr.open('POST', '/api/admin/upload-video')
        xhr.send(formData)
      })

      if (result.success && result.data?.url) {
        setForm(f => ({ ...f, videoUrl: result.data!.url }))
        setUploadProgress(100)
      } else {
        alert(result.error ?? 'Upload fail ho gaya.')
        setUploadedFileName('')
      }
    } catch {
      alert('Upload fail ho gaya. Dobara try karo.')
      setUploadedFileName('')
    } finally {
      setUploading(false)
    }
  }

  async function handleSave() {
    if (!form.videoUrl) { alert('Video URL ya file zaruri hai.'); return }
    setSaving(true)
    await fetch('/api/admin/campaigns', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    setShowNewForm(false)
    setUploadedFileName('')
    setVideoMode('url')
    setForm({ name: '', sponsor: '', videoUrl: '', rewardAmount: 20, watchDuration: 30, dailyLimit: 10, totalBudget: 10000, status: 'DRAFT', startDate: '', endDate: '', description: '' })
    fetchCampaigns()
    setSaving(false)
  }

  async function toggleStatus(id: string, currentStatus: string) {
    const newStatus = currentStatus === 'ACTIVE' ? 'PAUSED' : 'ACTIVE'
    await fetch('/api/admin/campaigns', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status: newStatus }) })
    fetchCampaigns()
  }

  async function archiveCampaign(id: string) {
    if (!confirm('Archive this campaign?')) return
    await fetch(`/api/admin/campaigns?id=${id}`, { method: 'DELETE' })
    fetchCampaigns()
  }

  const STATUS_BADGE: Record<string, string> = { ACTIVE: 'badge-success', PAUSED: 'badge-warning', DRAFT: 'badge-secondary', ENDED: 'badge-error', ARCHIVED: 'badge-error' }

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800 }}>Video Campaigns</h1>
        <button onClick={() => setShowNewForm(true)} className="btn btn-primary" id="new-campaign-btn">+ New Campaign</button>
      </div>

      {/* New campaign form */}
      {showNewForm && (
        <div className="card" style={{ marginBottom: 24, borderColor: 'rgba(108,71,255,0.3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
            <h2 style={{ fontSize: 18 }}>New Campaign</h2>
            <button onClick={() => { setShowNewForm(false); setUploadedFileName(''); setVideoMode('url') }} className="btn btn-ghost btn-sm">✕</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {/* Basic fields */}
            {[
              { key: 'name', label: 'Campaign Name', type: 'text', placeholder: 'Campaign name' },
              { key: 'sponsor', label: 'Sponsor', type: 'text', placeholder: 'Sponsor company name' },
              { key: 'description', label: 'Description', type: 'text', placeholder: 'Brief description' },
            ].map((field) => (
              <div key={field.key} className="input-group">
                <label className="input-label">{field.label}</label>
                <input type={field.type} className="input" placeholder={field.placeholder} value={String((form as Record<string, unknown>)[field.key])} onChange={(e) => setForm(f => ({ ...f, [field.key]: e.target.value }))} id={`campaign-${field.key}`} />
              </div>
            ))}

            {/* ─── Video Source — URL or Upload ─── */}
            <div className="input-group" style={{ gridColumn: '1 / -1' }}>
              <label className="input-label">Video Source</label>

              {/* Toggle tabs */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <button
                  type="button"
                  id="video-mode-url"
                  onClick={() => { setVideoMode('url'); setForm(f => ({ ...f, videoUrl: '' })); setUploadedFileName('') }}
                  style={{
                    padding: '6px 16px',
                    borderRadius: 8,
                    border: `1.5px solid ${videoMode === 'url' ? 'var(--primary)' : 'var(--border)'}`,
                    background: videoMode === 'url' ? 'rgba(108,71,255,0.12)' : 'var(--bg-surface)',
                    color: videoMode === 'url' ? 'var(--primary)' : 'var(--text-secondary)',
                    fontSize: 13, fontWeight: videoMode === 'url' ? 700 : 400,
                    cursor: 'pointer',
                  }}
                >
                  🔗 YouTube / URL
                </button>
                <button
                  type="button"
                  id="video-mode-upload"
                  onClick={() => { setVideoMode('upload'); setForm(f => ({ ...f, videoUrl: '' })); setUploadedFileName('') }}
                  style={{
                    padding: '6px 16px',
                    borderRadius: 8,
                    border: `1.5px solid ${videoMode === 'upload' ? 'var(--primary)' : 'var(--border)'}`,
                    background: videoMode === 'upload' ? 'rgba(108,71,255,0.12)' : 'var(--bg-surface)',
                    color: videoMode === 'upload' ? 'var(--primary)' : 'var(--text-secondary)',
                    fontSize: 13, fontWeight: videoMode === 'upload' ? 700 : 400,
                    cursor: 'pointer',
                  }}
                >
                  📁 Upload File
                </button>
              </div>

              {videoMode === 'url' ? (
                /* ── URL Input ── */
                <div>
                  <input
                    type="url"
                    className="input"
                    id="campaign-videoUrl"
                    placeholder="https://youtube.com/watch?v=...  ya  https://youtu.be/...  ya  https://youtube.com/shorts/..."
                    value={form.videoUrl}
                    onChange={(e) => setForm(f => ({ ...f, videoUrl: e.target.value }))}
                  />
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
                    ✅ Supported: youtube.com/watch?v=, youtu.be/, youtube.com/shorts/, youtube.com/embed/
                  </div>
                </div>
              ) : (
                /* ── File Upload ── */
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/mp4,video/webm,video/ogg,video/quicktime"
                    style={{ display: 'none' }}
                    id="campaign-video-file"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleFileUpload(file)
                    }}
                  />

                  {!uploadedFileName ? (
                    /* Drop zone */
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={(e) => { e.preventDefault(); (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--primary)' }}
                      onDragLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)' }}
                      onDrop={(e) => {
                        e.preventDefault()
                        ;(e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)'
                        const file = e.dataTransfer.files[0]
                        if (file) handleFileUpload(file)
                      }}
                      style={{
                        border: '2px dashed var(--border)',
                        borderRadius: 12,
                        padding: '32px 20px',
                        textAlign: 'center',
                        cursor: 'pointer',
                        transition: 'border-color 0.2s, background 0.2s',
                        background: 'var(--bg-surface)',
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--primary)' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)' }}
                    >
                      <div style={{ fontSize: 36, marginBottom: 10 }}>📹</div>
                      <div style={{ fontWeight: 600, marginBottom: 4 }}>Click to upload or drag & drop</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>MP4, WebM, MOV — Max 500MB</div>
                    </div>
                  ) : (
                    /* Upload progress / success */
                    <div className="card" style={{ padding: 16, background: 'var(--bg-surface)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: uploading ? 12 : 0 }}>
                        <div style={{ fontSize: 24 }}>{uploading ? '⏳' : '✅'}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>
                            {uploadedFileName}
                          </div>
                          {uploading && (
                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                              Uploading... {uploadProgress}%
                            </div>
                          )}
                          {!uploading && form.videoUrl && (
                            <div style={{ fontSize: 11, color: 'var(--success)' }}>
                              ✓ Uploaded — {form.videoUrl}
                            </div>
                          )}
                        </div>
                        {!uploading && (
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() => { setUploadedFileName(''); setForm(f => ({ ...f, videoUrl: '' })); if (fileInputRef.current) fileInputRef.current.value = '' }}
                          >
                            ✕ Remove
                          </button>
                        )}
                      </div>
                      {uploading && (
                        <div className="progress-bar-bg" style={{ height: 6 }}>
                          <div className="progress-bar-fill" style={{ width: `${uploadProgress}%`, transition: 'width 0.3s' }} />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Other numeric fields */}
            <div className="input-group">
              <label className="input-label">Reward Amount (₹)</label>
              <input type="number" className="input" value={form.rewardAmount} onChange={e => setForm(f => ({ ...f, rewardAmount: parseFloat(e.target.value) }))} id="campaign-reward" />
            </div>
            <div className="input-group">
              <label className="input-label">Watch Duration (seconds)</label>
              <input type="number" className="input" value={form.watchDuration} onChange={e => setForm(f => ({ ...f, watchDuration: parseInt(e.target.value) }))} id="campaign-duration" />
            </div>
            <div className="input-group">
              <label className="input-label">Daily Limit (per user)</label>
              <input type="number" className="input" value={form.dailyLimit} onChange={e => setForm(f => ({ ...f, dailyLimit: parseInt(e.target.value) }))} id="campaign-daily-limit" />
            </div>
            <div className="input-group">
              <label className="input-label">Total Budget (₹)</label>
              <input type="number" className="input" value={form.totalBudget} onChange={e => setForm(f => ({ ...f, totalBudget: parseFloat(e.target.value) }))} id="campaign-budget" />
            </div>
            <div className="input-group">
              <label className="input-label">Start Date</label>
              <input type="datetime-local" className="input" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} id="campaign-start" />
            </div>
            <div className="input-group">
              <label className="input-label">End Date</label>
              <input type="datetime-local" className="input" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} id="campaign-end" />
            </div>
            <div className="input-group">
              <label className="input-label">Status</label>
              <select className="input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} id="campaign-status">
                <option value="DRAFT">Draft</option>
                <option value="ACTIVE">Active</option>
                <option value="PAUSED">Paused</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
            <button onClick={() => { setShowNewForm(false); setUploadedFileName(''); setVideoMode('url') }} className="btn btn-ghost">Cancel</button>
            <button onClick={handleSave} className="btn btn-primary" disabled={saving || uploading} id="save-campaign-btn">
              {saving ? 'Saving...' : uploading ? 'Upload ho raha hai...' : 'Create Campaign'}
            </button>
          </div>
        </div>
      )}

      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Campaign</th>
                <th>Reward</th>
                <th>Duration</th>
                <th>Budget</th>
                <th>Completions</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40 }}>Loading...</td></tr>
              ) : campaigns.map((c) => (
                <tr key={c.id}>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{c.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{c.sponsor}</div>
                  </td>
                  <td style={{ fontWeight: 700 }}>₹{c.rewardAmount}</td>
                  <td>{c.watchDuration}s</td>
                  <td>
                    <div style={{ fontWeight: 600 }}>₹{c.spentBudget.toLocaleString()} / ₹{c.totalBudget.toLocaleString()}</div>
                    <div className="progress-bar-bg" style={{ height: 4, marginTop: 4 }}>
                      <div className="progress-bar-fill" style={{ width: `${Math.min((c.spentBudget / c.totalBudget) * 100, 100)}%` }} />
                    </div>
                  </td>
                  <td>{c.totalCompletions.toLocaleString()}</td>
                  <td><span className={`badge ${STATUS_BADGE[c.status] ?? 'badge-secondary'}`}>{c.status}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {c.status !== 'ARCHIVED' && (
                        <>
                          <button onClick={() => toggleStatus(c.id, c.status)} className={`btn btn-sm ${c.status === 'ACTIVE' ? 'btn-ghost' : 'btn-success'}`}>
                            {c.status === 'ACTIVE' ? 'Pause' : 'Activate'}
                          </button>
                          <button onClick={() => archiveCampaign(c.id)} className="btn btn-sm btn-danger">Archive</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
