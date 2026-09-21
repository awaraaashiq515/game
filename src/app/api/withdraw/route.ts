import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { debitWallet } from '@/lib/wallet'
import { generateRequestId } from '@/lib/utils'
import { NotificationCategory } from '@/generated/prisma/client'

const MIN_ADS = 5
const MIN_REFERRALS = 7

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { amount, method, accountDetails } = await request.json()
    const userId = session.user.id

    // Validate amount
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json({ success: false, error: 'Invalid amount' }, { status: 400 })
    }

    // Min withdrawal config
    const minWithdrawalConfig = await prisma.systemConfig.findUnique({
      where: { key: 'min_withdrawal' },
    })
    const minWithdrawal = parseFloat(minWithdrawalConfig?.value ?? '1000')

    if (amount < minWithdrawal) {
      return NextResponse.json(
        { success: false, error: `Minimum withdrawal is ₹${minWithdrawal}` },
        { status: 400 }
      )
    }

    // ── STEP 1: 5 videos watched ────────────────────────────────────────────
    const completedAds = await prisma.videoCompletion.count({ where: { userId } })
    if (completedAds < MIN_ADS) {
      return NextResponse.json(
        {
          success: false,
          error: `Watch ${MIN_ADS - completedAds} more video${MIN_ADS - completedAds > 1 ? 's' : ''} to unlock withdrawal.`,
          code: 'ADS_REQUIRED',
        },
        { status: 403 }
      )
    }

    // ── STEP 2: 7 friends joined ────────────────────────────────────────────
    const referralCount = await prisma.referral.count({ where: { referrerId: userId } })
    if (referralCount < MIN_REFERRALS) {
      return NextResponse.json(
        {
          success: false,
          error: `Invite ${MIN_REFERRALS - referralCount} more friend${MIN_REFERRALS - referralCount > 1 ? 's' : ''} to unlock withdrawal.`,
          code: 'FRIENDS_REQUIRED',
        },
        { status: 403 }
      )
    }

    // ── STEP 3: ₹5 activation fee paid to admin ─────────────────────────────
    const activationRecord = await prisma.systemConfig.findUnique({
      where: { key: `withdrawal_activated_${userId}` },
    })
    if (activationRecord?.value !== 'true') {
      return NextResponse.json(
        {
          success: false,
          error: 'Pay ₹5 activation fee to admin to unlock withdrawals (Step 3).',
          code: 'ACTIVATION_REQUIRED',
        },
        { status: 403 }
      )
    }

    // ── STEP 4: Check balance ───────────────────────────────────────────────
    const wallet = await prisma.wallet.findUnique({ where: { userId } })
    if (!wallet || wallet.availableBalance < amount) {
      return NextResponse.json({ success: false, error: 'Insufficient balance' }, { status: 400 })
    }

    // Check no pending withdrawal
    const pendingWithdrawal = await prisma.withdrawal.findFirst({
      where: { userId, status: { in: ['PENDING', 'APPROVED'] } },
    })
    if (pendingWithdrawal) {
      return NextResponse.json(
        { success: false, error: 'You already have a pending withdrawal request' },
        { status: 400 }
      )
    }

    // Validate method
    if (!method || !accountDetails) {
      return NextResponse.json(
        { success: false, error: 'Payment method and account details are required' },
        { status: 400 }
      )
    }

    const requestId = generateRequestId()

    // Debit wallet
    await debitWallet({
      userId,
      amount,
      description: `Withdrawal request — ${method}`,
      reference: requestId,
    })

    // Create withdrawal record
    const withdrawal = await prisma.withdrawal.create({
      data: {
        requestId,
        userId,
        amount,
        method,
        accountDetails: accountDetails as object,
        status: 'PENDING',
      },
    })

    // Notification
    await prisma.notification.create({
      data: {
        userId,
        category: NotificationCategory.WITHDRAWAL,
        title: 'Withdrawal Request Submitted',
        message: `Your withdrawal request of ₹${amount} has been submitted and is under review.`,
        metadata: { withdrawalId: withdrawal.id, amount } as object,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        requestId,
        status: 'PENDING',
        amount,
        message: 'Withdrawal request submitted successfully',
      },
    })
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Insufficient balance') {
      return NextResponse.json({ success: false, error: 'Insufficient balance' }, { status: 400 })
    }
    console.error('Withdrawal error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id

  try {
    const withdrawals = await prisma.withdrawal.findMany({
      where: { userId },
      orderBy: { requestedAt: 'desc' },
    })

    return NextResponse.json({
      success: true,
      data: withdrawals.map((w) => ({
        id: w.id,
        requestId: w.requestId,
        amount: w.amount,
        method: w.method,
        status: w.status,
        requestedAt: w.requestedAt.toISOString(),
        processedAt: w.processedAt?.toISOString() ?? null,
        adminNote: w.adminNote,
      })),
    })
  } catch (error) {
    console.error('Withdrawal history error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
