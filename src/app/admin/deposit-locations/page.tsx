'use client'
import { useEffect, useState } from 'react'
import { formatINR, formatDate } from '@/lib/utils'

interface LocationItem {
  id: string
  userId: string
  amount: number
  utrNumber: string
  senderUpi: string | null
  status: string
  requestedAt: string
  isActivation: boolean
  user: {
    id: string
    name: string
    email: string
    mobile: string | null
    lastLoginIp: string | null
  }
  location: {
    ip: string
    city: string
    region: string
    country: string
    countryCode: string
    latitude: number | null
    longitude: number | null
    timezone: string
    isp: string
    device: string
    userAgent: string
    mapsUrl: string | null
  }
}

interface LocationsData {
  items: LocationItem[]
  total: number
  topStates: { name: string; count: number }[]
  topCities: { name: string; count: number }[]
  deviceCountMap: Record<string, number>
}

export default function AdminDepositLocationsPage() {
  const [data, setData] = useState<LocationsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState<'all' | 'activation' | 'wallet'>('all')
  const [search, setSearch] = useState('')

  function fetchData() {
    setLoading(true)
    fetch(`/api/admin/deposit-locations?type=${filterType}`)
      .then(r => r.json())
      .then(d => {
        if (d.success) setData(d.data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    fetchData()
  }, [filterType])

  const filteredItems = data?.items.filter(item => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      item.user.name.toLowerCase().includes(q) ||
      item.user.email.toLowerCase().includes(q) ||
      item.utrNumber.toLowerCase().includes(q) ||
      item.location.city.toLowerCase().includes(q) ||
      item.location.region.toLowerCase().includes(q) ||
      item.location.ip.toLowerCase().includes(q)
    )
  }) ?? []

  return (
    <div className="animate-fade-in" style={{ maxWidth: 1100 }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <h1 style={{ fontSize: 26, fontWeight: 800 }}>📍 Depositor Locations & Geo Tracking</h1>
          <span style={{ fontSize: 13, background: 'rgba(16,185,129,0.1)', color: '#10b981', padding: '4px 12px', borderRadius: 99, fontWeight: 700 }}>
            {data?.total ?? 0} Tracked Payments
          </span>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
          Live geographical tracking of all users who deposited money or paid their ₹5 activation fee.
        </p>
      </div>

      {/* Analytics Summary Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, marginBottom: 26 }}>
        {/* Top States */}
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <span style={{ fontSize: 20 }}>🗺️</span>
            <div style={{ fontWeight: 800, fontSize: 15 }}>Top States / Regions</div>
          </div>
          {data?.topStates && data.topStates.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {data.topStates.map((st, i) => (
                <div key={st.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                    #{i + 1} {st.name}
                  </span>
                  <span style={{ fontWeight: 800, color: 'var(--primary)', background: 'rgba(108,71,255,0.1)', padding: '2px 8px', borderRadius: 99 }}>
                    {st.count} deposits
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>No state data available</div>
          )}
        </div>

        {/* Top Cities */}
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <span style={{ fontSize: 20 }}>🏙️</span>
            <div style={{ fontWeight: 800, fontSize: 15 }}>Top Cities</div>
          </div>
          {data?.topCities && data.topCities.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {data.topCities.map((ct, i) => (
                <div key={ct.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                    📍 {ct.name}
                  </span>
                  <span style={{ fontWeight: 800, color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '2px 8px', borderRadius: 99 }}>
                    {ct.count} users
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>No city data available</div>
          )}
        </div>

        {/* Devices */}
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <span style={{ fontSize: 20 }}>📱</span>
            <div style={{ fontWeight: 800, fontSize: 15 }}>Device Breakdown</div>
          </div>
          {data?.deviceCountMap && Object.keys(data.deviceCountMap).length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {Object.entries(data.deviceCountMap).map(([device, count]) => (
                <div key={device} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                    {device}
                  </span>
                  <span style={{ fontWeight: 800, color: '#f59e0b', background: 'rgba(245,158,11,0.1)', padding: '2px 8px', borderRadius: 99 }}>
                    {count}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>No device data available</div>
          )}
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 14, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { key: 'all', label: 'All Deposits' },
            { key: 'activation', label: '🔓 ₹5 Activation' },
            { key: 'wallet', label: '💰 Wallet Add Money' },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setFilterType(t.key as any)}
              className={`btn btn-sm ${filterType === t.key ? 'btn-primary' : 'btn-ghost'}`}
              style={{ fontWeight: 700 }}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div style={{ minWidth: 260, flex: 1, maxWidth: 360 }}>
          <input
            type="text"
            className="input"
            placeholder="🔍 Search city, state, user, or IP..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ fontSize: 13 }}
          />
        </div>
      </div>

      {/* Depositor Locations Table */}
      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Deposit Amount</th>
                <th>📍 Location (City, State)</th>
                <th>🌐 IP & Device</th>
                <th>🕒 Date & Time</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                    Loading depositor locations...
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                    No matching location records found.
                  </td>
                </tr>
              ) : (
                filteredItems.map(item => {
                  const googleMapsUrl = item.location.mapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${item.location.city}, ${item.location.region}, India`)}`

                  return (
                    <tr key={item.id}>
                      <td>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{item.user.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.user.email}</div>
                        {item.user.mobile && (
                          <div style={{ fontSize: 11, color: 'var(--primary)', marginTop: 2 }}>📞 {item.user.mobile}</div>
                        )}
                      </td>
                      <td>
                        <div style={{ fontWeight: 800, color: 'var(--success)', fontSize: 15 }}>
                          +{formatINR(item.amount)}
                        </div>
                        <div style={{ fontSize: 11, fontFamily: 'monospace', color: '#f59e0b', marginTop: 2 }}>
                          UTR: {item.utrNumber}
                        </div>
                        {item.isActivation && (
                          <span style={{ fontSize: 10, fontWeight: 800, color: '#f59e0b', background: 'rgba(245,158,11,0.1)', padding: '1px 6px', borderRadius: 99 }}>
                            ₹5 Activation
                          </span>
                        )}
                      </td>
                      <td>
                        <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span>📍</span>
                          <span>{item.location.city}, {item.location.region}</span>
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                          🇮🇳 {item.location.country} • {item.location.timezone}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 12, color: 'var(--text-secondary)' }}>
                          {item.location.ip}
                        </div>
                        <div style={{ fontSize: 11, color: '#3b82f6', fontWeight: 600, marginTop: 2 }}>
                          {item.location.device}
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                          {item.location.isp}
                        </div>
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {formatDate(item.requestedAt)}
                      </td>
                      <td>
                        <a
                          href={googleMapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-sm"
                          style={{
                            background: 'rgba(59,130,246,0.1)',
                            color: '#3b82f6',
                            border: '1px solid rgba(59,130,246,0.3)',
                            fontWeight: 700,
                            fontSize: 12,
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          <span>🗺️</span>
                          <span>View on Map</span>
                        </a>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
