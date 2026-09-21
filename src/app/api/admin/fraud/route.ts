import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

async function requireAdmin(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'ADMIN') return null
  return session
}

export async function GET(request: NextRequest) {
  const session = await requireAdmin(request)
  if (!session) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const resolved = searchParams.get('resolved')
  const severity = searchParams.get('severity')
  const page = parseInt(searchParams.get('page') ?? '1')
  const limit = 20

  try {
    const where = {
      ...(resolved !== null && resolved !== '' ? { resolved: resolved === 'true' } : {}),
      ...(severity ? { severity: severity as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' } : {}),
    }

    const [events, total] = await Promise.all([
      prisma.fraudEvent.findMany({
        where,
        include: {
          user: { select: { name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.fraudEvent.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        events: events.map((e) => ({
          id: e.id,
          type: e.type,
          severity: e.severity,
          description: e.description,
          user: e.user,
          ipAddress: e.ipAddress,
          resolved: e.resolved,
          createdAt: e.createdAt.toISOString(),
        })),
        total,
        page,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Admin fraud error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const session = await requireAdmin(request)
  if (!session) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })

  try {
    const { eventId } = await request.json()
    await prisma.fraudEvent.update({
      where: { id: eventId },
      data: { resolved: true },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
