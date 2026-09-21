import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { finalizeWithdrawal, reverseWithdrawalDebit } from '@/lib/wallet'
import { recordUserWithdrawalInAdminWallet } from '@/lib/adminWallet'
import { NotificationCategory } from '@/generated/prisma/client'

async function requireAdmin(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'ADMIN') return null
  return session
}

export async function GET(request: NextRequest) {
  const session = await requireAdmin(request)
  if (!session) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') ?? ''
  const page = parseInt(searchParams.get('page') ?? '1')
  const limit = 20

  try {
    const where = status ? { status: status as 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAID' | 'FAILED' } : {}

    const [withdrawals, total] = await Promise.all([
      prisma.withdrawal.findMany({
        where,
        include: {
          user: { select: { name: true, email: true } },
        },
        orderBy: { requestedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.withdrawal.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        withdrawals: withdrawals.map((w) => ({
          id: w.id,
          requestId: w.requestId,
          user: w.user,
          amount: w.amount,
          method: w.method,
          accountDetails: w.accountDetails,
          status: w.status,
          adminNote: w.adminNote,
          paymentRef: w.paymentRef,
          requestedAt: w.requestedAt.toISOString(),
          processedAt: w.processedAt?.toISOString() ?? null,
        })),
        total,
        page,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Admin withdrawals error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const session = await requireAdmin(request)
  if (!session) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })

  try {
    const { withdrawalId, action, adminNote, paymentRef } = await request.json()

    const withdrawal = await prisma.withdrawal.findUnique({
      where: { id: withdrawalId },
      include: { user: true },
    })
    if (!withdrawal) {
      return NextResponse.json({ success: false, error: 'Withdrawal not found' }, { status: 404 })
    }

    let newStatus: 'APPROVED' | 'REJECTED' | 'PAID' | 'PENDING' = withdrawal.status as 'APPROVED' | 'REJECTED' | 'PAID' | 'PENDING'
    let notifTitle = ''
    let notifMsg = ''

    if (action === 'approve') {
      newStatus = 'APPROVED'
      notifTitle = 'Withdrawal Approved'
      notifMsg = `Your withdrawal of ₹${withdrawal.amount} has been approved and is being processed.`
    } else if (action === 'reject') {
      newStatus = 'REJECTED'
      notifTitle = 'Withdrawal Rejected'
      notifMsg = `Your withdrawal request of ₹${withdrawal.amount} has been rejected. ${adminNote ?? ''}`
      // Reverse the wallet debit
      await reverseWithdrawalDebit(withdrawal.userId, withdrawal.amount, withdrawal.requestId)
    } else if (action === 'paid') {
      newStatus = 'PAID'
      notifTitle = 'Withdrawal Processed 💰'
      notifMsg = `Your withdrawal of ₹${withdrawal.amount} has been successfully processed.`
      await finalizeWithdrawal(withdrawal.userId, withdrawal.amount)
      await recordUserWithdrawalInAdminWallet(
        withdrawal.amount,
        withdrawal.requestId,
        `Withdrawal paid to user (${withdrawal.method})`
      )
    } else {
      return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })
    }

    await prisma.withdrawal.update({
      where: { id: withdrawalId },
      data: {
        status: newStatus,
        adminNote,
        paymentRef,
        processedAt: new Date(),
      },
    })

    // Notify user
    await prisma.notification.create({
      data: {
        userId: withdrawal.userId,
        category: NotificationCategory.WITHDRAWAL,
        title: notifTitle,
        message: notifMsg,
        metadata: { withdrawalId, amount: withdrawal.amount } as object,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin withdrawal action error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
