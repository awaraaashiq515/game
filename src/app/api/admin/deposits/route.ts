import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { creditWallet } from '@/lib/wallet'
import { TransactionType } from '@/generated/prisma/client'

async function requireAdmin(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'ADMIN') return null
  return session
}

// GET — admin sees all deposit requests
export async function GET(request: NextRequest) {
  const session = await requireAdmin(request)
  if (!session) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') ?? ''
  const page = parseInt(searchParams.get('page') ?? '1')
  const limit = 20

  try {
    const where = status ? { status: status as 'PENDING' | 'APPROVED' | 'REJECTED' } : {}

    const [deposits, total] = await Promise.all([
      prisma.depositRequest.findMany({
        where,
        include: { user: { select: { name: true, email: true } } },
        orderBy: { requestedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.depositRequest.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        deposits: deposits.map(d => ({
          id: d.id,
          user: d.user,
          amount: d.amount,
          status: d.status,
          adminNote: d.adminNote,
          utrNumber: d.utrNumber,
          requestedAt: d.requestedAt.toISOString(),
          processedAt: d.processedAt?.toISOString() ?? null,
        })),
        total,
        page,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Admin deposits GET error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH — admin approves or rejects a deposit request
export async function PATCH(request: NextRequest) {
  const session = await requireAdmin(request)
  if (!session) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })

  try {
    const { depositId, action, adminNote, unlockTimeOption, customUnlockAt } = await request.json()

    const deposit = await prisma.depositRequest.findUnique({
      where: { id: depositId },
      include: { user: true },
    })
    if (!deposit) {
      return NextResponse.json({ success: false, error: 'Deposit request not found' }, { status: 404 })
    }
    if (deposit.status !== 'PENDING') {
      return NextResponse.json({ success: false, error: 'This request has already been processed' }, { status: 400 })
    }

    if (action === 'approve') {
      const isActivationFee = deposit.adminNote?.includes('WITHDRAWAL_ACTIVATION_FEE') ?? false

      if (isActivationFee) {
        // Calculate unlock time based on admin selection
        let unlockDate = new Date()
        if (unlockTimeOption === '30m') {
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

        // ── Activation fee: mark activated and save unlock schedule ─────────
        await Promise.all([
          prisma.systemConfig.upsert({
            where: { key: `withdrawal_activated_${deposit.userId}` },
            update: { value: 'true' },
            create: {
              key: `withdrawal_activated_${deposit.userId}`,
              value: 'true',
              label: `Withdrawal activation for user ${deposit.userId}`,
              group: 'user_activation',
            },
          }),
          prisma.systemConfig.upsert({
            where: { key: `withdrawal_unlock_at_${deposit.userId}` },
            update: { value: unlockDate.toISOString() },
            create: {
              key: `withdrawal_unlock_at_${deposit.userId}`,
              value: unlockDate.toISOString(),
              label: `Withdrawal unlock time for user ${deposit.userId}`,
              group: 'user_activation',
            },
          }),
          prisma.depositRequest.update({
            where: { id: depositId },
            data: { status: 'APPROVED', adminNote: deposit.adminNote, processedAt: new Date() },
          }),
        ])

        // Credit ₹5 to admin pool
        const adminWallet = await prisma.adminWallet.findFirst()
        if (adminWallet) {
          await prisma.adminWallet.update({
            where: { id: adminWallet.id },
            data: { totalFundsAdded: { increment: deposit.amount }, availablePool: { increment: deposit.amount } },
          })
        }

        const isDelayed = unlockDate.getTime() > Date.now()
        const formattedUnlock = unlockDate.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })

        await prisma.notification.create({
          data: {
            userId: deposit.userId,
            category: 'ACCOUNT',
            title: isDelayed ? '⏰ Withdrawal Unlock Scheduled!' : '🎉 Withdrawal Unlocked!',
            message: isDelayed
              ? `Your ₹${deposit.amount} activation payment is verified! Withdrawal will unlock on ${formattedUnlock}.`
              : `Your ₹${deposit.amount} activation payment has been verified. You can now withdraw your earnings!`,
            metadata: { depositId: deposit.id, unlockAt: unlockDate.toISOString() } as object,
          },
        })

        return NextResponse.json({
          success: true,
          message: isDelayed
            ? `Activation approved! Withdrawal scheduled to unlock at ${formattedUnlock} for ${deposit.user.name}`
            : `Activation approved — withdrawal unlocked immediately for ${deposit.user.name}`,
        })
      } else {
        // ── Regular deposit: credit wallet ───────────────────────────────────
        await creditWallet({
          userId: deposit.userId,
          amount: deposit.amount,
          type: TransactionType.BONUS,
          description: `Wallet topped up — ₹${deposit.amount} added by admin`,
          reference: deposit.id,
          metadata: { depositId: deposit.id, adminApproved: true } as Record<string, unknown>,
        })

        await prisma.depositRequest.update({
          where: { id: depositId },
          data: { status: 'APPROVED', adminNote: adminNote ?? null, processedAt: new Date() },
        })

        await prisma.notification.create({
          data: {
            userId: deposit.userId,
            category: 'ACCOUNT',
            title: '🎉 Money Added to Wallet!',
            message: `₹${deposit.amount} has been successfully added to your wallet.`,
            metadata: { depositId: deposit.id, amount: deposit.amount } as object,
          },
        })

        return NextResponse.json({ success: true, message: `₹${deposit.amount} credited to ${deposit.user.name}'s wallet` })
      }


    } else if (action === 'reject') {
      await prisma.depositRequest.update({
        where: { id: depositId },
        data: { status: 'REJECTED', adminNote: adminNote ?? 'Request rejected by admin', processedAt: new Date() },
      })

      // Notify user
      await prisma.notification.create({
        data: {
          userId: deposit.userId,
          category: 'ACCOUNT',
          title: 'Add Money Request Rejected',
          message: `Your request to add ₹${deposit.amount} was rejected. ${adminNote ?? ''}`,
          metadata: { depositId: deposit.id, amount: deposit.amount } as object,
        },
      })

      return NextResponse.json({ success: true, message: 'Request rejected' })

    } else {
      return NextResponse.json({ success: false, error: 'Invalid action. Use approve or reject.' }, { status: 400 })
    }
  } catch (error) {
    console.error('Admin deposit PATCH error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
