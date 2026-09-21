import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { creditWallet, debitWallet } from '@/lib/wallet'
import { TransactionType } from '@/generated/prisma/client'

async function requireAdmin(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'ADMIN') return null
  return session
}

// POST /api/admin/users/balance
// Admin directly credits or debits a user's virtual wallet balance
export async function POST(request: NextRequest) {
  const session = await requireAdmin(request)
  if (!session) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })

  try {
    const { userId, amount, type, description } = await request.json()

    if (!userId || !amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json({ success: false, error: 'Invalid userId or amount' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    if (type === 'CREDIT') {
      // Add virtual balance to user wallet
      await creditWallet({
        userId,
        amount,
        type: TransactionType.BONUS,
        description: description || `Admin credited ₹${amount} to your wallet`,
        reference: `admin-credit-${Date.now()}`,
        metadata: { adminAction: true, adminId: session.user.id },
      })

      // Notify user
      await prisma.notification.create({
        data: {
          userId,
          category: 'ACCOUNT',
          title: '💰 Balance Added!',
          message: description || `₹${amount} has been added to your wallet by admin.`,
          metadata: { amount, type: 'ADMIN_CREDIT' } as object,
        },
      })
    } else if (type === 'DEBIT') {
      await debitWallet({
        userId,
        amount,
        description: description || `Admin debited ₹${amount} from your wallet`,
        reference: `admin-debit-${Date.now()}`,
      })

      await prisma.notification.create({
        data: {
          userId,
          category: 'ACCOUNT',
          title: '💳 Balance Adjusted',
          message: description || `₹${amount} has been deducted from your wallet by admin.`,
          metadata: { amount, type: 'ADMIN_DEBIT' } as object,
        },
      })
    } else {
      return NextResponse.json({ success: false, error: 'type must be CREDIT or DEBIT' }, { status: 400 })
    }

    const updatedWallet = await prisma.wallet.findUnique({ where: { userId } })

    return NextResponse.json({
      success: true,
      data: {
        userId,
        userName: user.name,
        action: type,
        amount,
        newBalance: updatedWallet?.availableBalance ?? 0,
      },
    })
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Insufficient balance') {
      return NextResponse.json({ success: false, error: 'User has insufficient balance to debit' }, { status: 400 })
    }
    console.error('Admin balance adjustment error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
