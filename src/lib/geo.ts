import { getClientIp } from '@/lib/utils'

export interface GeoLocationData {
  ip: string
  city: string
  region: string // State
  country: string
  countryCode: string
  latitude: number | null
  longitude: number | null
  timezone: string
  isp: string
  userAgent: string
  device: string
  mapsUrl: string | null
  createdAt: string
}

/**
 * Parses user-agent to human-readable device name.
 */
export function parseDevice(ua: string): string {
  if (!ua) return 'Unknown Device'
  if (/Android/i.test(ua)) return 'Android Mobile'
  if (/iPhone/i.test(ua)) return 'Apple iPhone'
  if (/iPad/i.test(ua)) return 'Apple iPad'
  if (/Macintosh|Mac OS X/i.test(ua)) return 'Mac OS (Desktop)'
  if (/Windows/i.test(ua)) return 'Windows PC'
  if (/Linux/i.test(ua)) return 'Linux'
  return 'Mobile / Desktop'
}

/**
 * Resolves location from request headers, client info, and IP lookup.
 */
export async function resolveLocation(
  request: Request,
  clientGeo?: {
    latitude?: number | null
    longitude?: number | null
    city?: string
    region?: string
    country?: string
    timezone?: string
  }
): Promise<GeoLocationData> {
  const ip = getClientIp(request)
  const userAgent = request.headers.get('user-agent') || ''
  const device = parseDevice(userAgent)

  // 1. Check cloud hosting headers (Cloudflare, Vercel, AWS)
  const cfCity = request.headers.get('cf-ipcity')
  const cfRegion = request.headers.get('cf-region')
  const cfCountry = request.headers.get('cf-ipcountry')
  const cfLat = request.headers.get('cf-iplatitude')
  const cfLong = request.headers.get('cf-iplongitude')

  const vercelCity = request.headers.get('x-vercel-ip-city')
  const vercelRegion = request.headers.get('x-vercel-ip-country-region')
  const vercelCountry = request.headers.get('x-vercel-ip-country')
  const vercelLat = request.headers.get('x-vercel-ip-latitude')
  const vercelLong = request.headers.get('x-vercel-ip-longitude')

  let city = cfCity || vercelCity || clientGeo?.city || ''
  let region = cfRegion || vercelRegion || clientGeo?.region || ''
  let country = cfCountry || vercelCountry || clientGeo?.country || 'India'
  let countryCode = country === 'India' || country === 'IN' ? 'IN' : country
  let latitude = clientGeo?.latitude ?? (cfLat ? parseFloat(cfLat) : vercelLat ? parseFloat(vercelLat) : null)
  let longitude = clientGeo?.longitude ?? (cfLong ? parseFloat(cfLong) : vercelLong ? parseFloat(vercelLong) : null)
  let timezone = clientGeo?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata'
  let isp = 'Local / Telecom'

  const isLocalIp = ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.')

  // 2. If public IP and missing city, lookup via ip-api
  if (!isLocalIp && (!city || !region)) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 1800)
      const res = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,countryCode,regionName,city,lat,lon,timezone,isp`, {
        signal: controller.signal,
      })
      clearTimeout(timeoutId)
      if (res.ok) {
        const d = await res.json()
        if (d.status === 'success') {
          city = d.city || city
          region = d.regionName || region
          country = d.country || country
          countryCode = d.countryCode || countryCode
          latitude = d.lat ?? latitude
          longitude = d.lon ?? longitude
          timezone = d.timezone || timezone
          isp = d.isp || isp
        }
      }
    } catch {
      // Ignore network timeout
    }
  }

  // 3. Fallbacks for localhost testing
  if (!city) {
    if (isLocalIp) {
      city = clientGeo?.city || 'Local / Development'
      region = clientGeo?.region || 'India'
    } else {
      city = 'New Delhi'
      region = 'Delhi'
    }
  }

  const mapsUrl = latitude && longitude ? `https://www.google.com/maps?q=${latitude},${longitude}` : null

  return {
    ip,
    city,
    region,
    country,
    countryCode,
    latitude,
    longitude,
    timezone,
    isp,
    userAgent,
    device,
    mapsUrl,
    createdAt: new Date().toISOString(),
  }
}
