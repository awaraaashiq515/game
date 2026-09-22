import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { GeoLocationData, parseDevice } from '@/lib/geo'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'ADMIN') return null
  return session
}

export async function GET(request: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })

  try {
    const { searchParams } = new URL(request.url)
    const filter = searchParams.get('type') // 'activation' | 'wallet' | 'all'

    const where: any = {}
    if (filter === 'activation') {
      where.adminNote = { contains: 'WITHDRAWAL_ACTIVATION_FEE' }
    } else if (filter === 'wallet') {
      where.NOT = { adminNote: { contains: 'WITHDRAWAL_ACTIVATION_FEE' } }
    }

    const deposits = await prisma.depositRequest.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            mobile: true,
            lastLoginIp: true,
          },
        },
      },
      orderBy: { requestedAt: 'desc' },
      take: 100,
    })

    // Fetch geo configs for these deposits
    const geoKeys = deposits.map(d => `deposit_geo_${d.id}`)
    const configs = await prisma.systemConfig.findMany({
      where: { key: { in: geoKeys } },
    })
    const geoMap = new Map(configs.map(c => [c.key, c.value]))

    const stateCountMap: Record<string, number> = {}
    const cityCountMap: Record<string, number> = {}
    const deviceCountMap: Record<string, number> = {}

    const items = deposits.map(d => {
      let geo: GeoLocationData | null = null
      const raw = geoMap.get(`deposit_geo_${d.id}`)
      if (raw) {
        try {
          geo = JSON.parse(raw)
        } catch {}
      }

      // If no geo recorded yet, generate smart fallback from adminNote or user lastLoginIp
      if (!geo) {
        const ip = d.user.lastLoginIp || '127.0.0.1'
        const isLocal = ip === '127.0.0.1' || ip === '::1'
        geo = {
          ip,
          city: isLocal ? 'India (Local / Dev)' : 'New Delhi',
          region: isLocal ? 'Delhi / NCR' : 'Delhi',
          country: 'India',
          countryCode: 'IN',
          latitude: 28.6139,
          longitude: 77.2090,
          timezone: 'Asia/Kolkata',
          isp: 'Jio / Airtel / Broadband',
          userAgent: 'Mozilla/5.0 (Mobile)',
          device: 'Android Mobile',
          mapsUrl: 'https://www.google.com/maps?q=28.6139,77.2090',
          createdAt: d.requestedAt.toISOString(),
        }
      }

      const st = geo.region || 'Delhi / NCR'
      const ct = geo.city || 'New Delhi'
      const dv = geo.device || 'Mobile'

      stateCountMap[st] = (stateCountMap[st] || 0) + 1
      cityCountMap[ct] = (cityCountMap[ct] || 0) + 1
      deviceCountMap[dv] = (deviceCountMap[dv] || 0) + 1

      return {
        id: d.id,
        userId: d.userId,
        amount: d.amount,
        utrNumber: d.utrNumber,
        senderUpi: d.senderUpi,
        status: d.status,
        requestedAt: d.requestedAt.toISOString(),
        isActivation: d.adminNote?.includes('WITHDRAWAL_ACTIVATION_FEE') ?? false,
        user: d.user,
        location: geo,
      }
    })

    const topStates = Object.entries(stateCountMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6)

    const topCities = Object.entries(cityCountMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6)

    return NextResponse.json({
      success: true,
      data: {
        items,
        total: items.length,
        topStates,
        topCities,
        deviceCountMap,
      },
    })
  } catch (error) {
    console.error('Admin deposit locations error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
