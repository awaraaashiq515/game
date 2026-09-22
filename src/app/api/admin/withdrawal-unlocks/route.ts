import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'ADMIN') return null
  return session
}

/**
 * GET /api/admin/withdrawal-unlocks
 * Lists all users with ₹5 activation requests and their current unlock schedule.
 */
export async function GET(request: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })

  try {
    // Find all activation deposit requests
    const activationRequests = await prisma.depositRequest.findMany({
      where: { adminNote: { contains: 'WITHDRAWAL_ACTIVATION_FEE' } },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            mobile: true,
            createdAt: true,
            wallet: { select: { availableBalance: true, totalEarned: true } },
          },
        },
      },
      orderBy: { requestedAt: 'desc' },
    })

    // Fetch unlock config and activation status for each user
    const userIds = Array.from(new Set(activationRequests.map(r => r.userId)))

    const configKeys = [
      ...userIds.map(id => `withdrawal_activated_${id}`),
      ...userIds.map(id => `withdrawal_unlock_at_${id}`),
    ]

    const configs = await prisma.systemConfig.findMany({
      where: { key: { in: configKeys } },
    })
    const configMap = new Map(configs.map(c => [c.key, c.value]))

    const now = Date.now()

    const data = activationRequests.map(req => {
      const isActivated = configMap.get(`withdrawal_activated_${req.userId}`) === 'true'
      const unlockAtStr = configMap.get(`withdrawal_unlock_at_${req.userId}`) || null
      let isUnlocked = false
      let unlockAtDate: Date | null = null

      if (isActivated) {
        if (!unlockAtStr) {
          isUnlocked = true
        } else {
          unlockAtDate = new Date(unlockAtStr)
          isUnlocked = now >= unlockAtDate.getTime()
        }
      }

      return {
        id: req.id,
        userId: req.userId,
        user: req.user,
        amount: req.amount,
        utrNumber: req.utrNumber,
        senderUpi: req.senderUpi,
        status: req.status,
        requestedAt: req.requestedAt.toISOString(),
        processedAt: req.processedAt?.toISOString() ?? null,
        isActivated,
        unlockAt: unlockAtDate ? unlockAtDate.toISOString() : null,
        isUnlocked,
      }
    })

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Admin withdrawal unlocks GET error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PATCH /api/admin/withdrawal-unlocks
 * Admin sets or modifies the unlock date/time for a user's withdrawal.
 */
export async function PATCH(request: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })

  try {
    const { userId, unlockTimeOption, customUnlockAt, markActivated = true } = await request.json()

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 })
    }

    let unlockDate = new Date()
    if (unlockTimeOption === 'instant') {
      unlockDate = new Date()
    } else if (unlockTimeOption === '30m') {
      unlockDate = new Date(Date.now() + 30 * 60 * 1000)
    } else if (unlockTimeOption === '1h') {
      unlockDate = new Date(Date.now() + 60 * 60 * 1000)
    } else if (unlockTimeOption === '2h') {
      unlockDate = new Date(Date.now() + 2 * 60 * 60 * 1000)
    } else if (unlockTimeOption === '6h') {
      unlockDate = new Date(Date.now() + 6 * 60 * 60 * 1000)
    } else if (unlockTimeOption === '12h') {
      unlockDate = new Date(Date.now() + 12 * 60 * 60 * 1000)
    } else if (unlockTimeOption === '24h') {
      unlockDate = new Date(Date.now() + 24 * 60 * 60 * 1000)
    } else if (unlockTimeOption === 'custom' && customUnlockAt) {
      const parsed = new Date(customUnlockAt)
      if (!isNaN(parsed.getTime())) unlockDate = parsed
    }

    const updates: Promise<any>[] = [
      prisma.systemConfig.upsert({
        where: { key: `withdrawal_unlock_at_${userId}` },
        update: { value: unlockDate.toISOString() },
        create: {
          key: `withdrawal_unlock_at_${userId}`,
          value: unlockDate.toISOString(),
          label: `Withdrawal unlock time for user ${userId}`,
          group: 'user_activation',
        },
      }),
    ]

    if (markActivated) {
      updates.push(
        prisma.systemConfig.upsert({
          where: { key: `withdrawal_activated_${userId}` },
          update: { value: 'true' },
          create: {
            key: `withdrawal_activated_${userId}`,
            value: 'true',
            label: `Withdrawal activation for user ${userId}`,
            group: 'user_activation',
          },
        })
      )
    }

    await Promise.all(updates)

    const isDelayed = unlockDate.getTime() > Date.now()
    const formattedUnlock = unlockDate.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })

    await prisma.notification.create({
      data: {
        userId,
        category: 'ACCOUNT',
        title: isDelayed ? '⏰ Withdrawal Unlock Time Updated!' : '🎉 Withdrawal Unlocked!',
        message: isDelayed
          ? `Admin updated your unlock time. Your withdrawal will unlock on ${formattedUnlock}.`
          : 'Admin has unlocked your withdrawal immediately. You can now withdraw anytime!',
      },
    })

    return NextResponse.json({
      success: true,
      message: isDelayed
        ? `Withdrawal unlock time updated to ${formattedUnlock}`
        : 'Withdrawal unlocked immediately for user!',
      data: { unlockAt: unlockDate.toISOString() },
    })
  } catch (error) {
    console.error('Admin withdrawal unlock PATCH error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
