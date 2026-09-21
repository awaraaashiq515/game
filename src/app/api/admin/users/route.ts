import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

async function requireAdmin(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'ADMIN') return null
  return session
}

// GET /api/admin/users — list users with filters
export async function GET(request: NextRequest) {
  const session = await requireAdmin(request)
  if (!session) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search') ?? ''
  const status = searchParams.get('status') ?? ''
  const page = parseInt(searchParams.get('page') ?? '1')
  const limit = 20

  try {
    const where = {
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' as const } },
              { email: { contains: search, mode: 'insensitive' as const } },
              { mobile: { contains: search } },
            ],
          }
        : {}),
      ...(status ? { status: status as 'ACTIVE' | 'SUSPENDED' | 'UNDER_REVIEW' } : {}),
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          mobile: true,
          status: true,
          createdAt: true,
          lastLoginAt: true,
          referralCode: true,
          wallet: { select: { totalEarned: true, availableBalance: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        users: users.map((u) => ({
          ...u,
          createdAt: u.createdAt.toISOString(),
          lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
        })),
        total,
        page,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Admin users error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/admin/users — update user status
export async function PATCH(request: NextRequest) {
  const session = await requireAdmin(request)
  if (!session) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })

  try {
    const { userId, action } = await request.json()

    const statusMap: Record<string, 'ACTIVE' | 'SUSPENDED' | 'UNDER_REVIEW'> = {
      suspend: 'SUSPENDED',
      restore: 'ACTIVE',
      review: 'UNDER_REVIEW',
    }

    if (!statusMap[action]) {
      return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })
    }

    await prisma.user.update({
      where: { id: userId },
      data: { status: statusMap[action] },
    })

    // Log admin action
    const admin = await prisma.adminUser.findUnique({ where: { email: session.user.email } })
    if (admin) {
      await prisma.adminActionLog.create({
        data: {
          adminId: admin.id,
          targetUserId: userId,
          action: `USER_${action.toUpperCase()}`,
          description: `User status changed to ${statusMap[action]}`,
        },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin user update error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
