import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { debitWallet } from '@/lib/wallet'
import { adminAddFunds } from '@/lib/adminWallet'

const ACTIVATION_FEE = 5
const MIN_ADS = 5
const MIN_REFERRALS = 7

/**
 * POST /api/withdraw/activate
 * Step 3: User pays ₹5 activation fee → money goes to Super Admin wallet.
 * Prerequisites: Step 1 (5 videos) + Step 2 (7 friends) must be done first.
 */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id

  try {
    // ── Prereq: Step 1 — 5 videos ───────────────────────────────────────────
    const completedAds = await prisma.videoCompletion.count({ where: { userId } })
    if (completedAds < MIN_ADS) {
      return NextResponse.json(
        {
          success: false,
          error: `Watch ${MIN_ADS - completedAds} more video${MIN_ADS - completedAds > 1 ? 's' : ''} first (Step 1).`,
          code: 'ADS_REQUIRED',
        },
        { status: 403 }
      )
    }

    // ── Prereq: Step 2 — 7 friends ──────────────────────────────────────────
    const referralCount = await prisma.referral.count({ where: { referrerId: userId } })
    if (referralCount < MIN_REFERRALS) {
      return NextResponse.json(
        {
          success: false,
          error: `Invite ${MIN_REFERRALS - referralCount} more friend${MIN_REFERRALS - referralCount > 1 ? 's' : ''} first (Step 2).`,
          code: 'FRIENDS_REQUIRED',
        },
        { status: 403 }
      )
    }

    // ── Already activated? ──────────────────────────────────────────────────
    const activationRecord = await prisma.systemConfig.findUnique({
      where: { key: `withdrawal_activated_${userId}` },
    })
    if (activationRecord?.value === 'true') {
      return NextResponse.json({ success: false, error: 'Withdrawal already activated.' }, { status: 400 })
    }

    // ── Check user wallet balance ───────────────────────────────────────────
    const wallet = await prisma.wallet.findUnique({ where: { userId } })
    if (!wallet || wallet.availableBalance < ACTIVATION_FEE) {
      return NextResponse.json(
        {
          success: false,
          error: `Insufficient balance. You need ₹${ACTIVATION_FEE} in your wallet to activate.`,
          code: 'INSUFFICIENT_BALANCE',
        },
        { status: 400 }
      )
    }

    // ── Deduct ₹5 from user wallet → credit to Admin wallet ─────────────────
    await debitWallet({
      userId,
      amount: ACTIVATION_FEE,
      description: `₹${ACTIVATION_FEE} activation fee paid to admin`,
      reference: `ACTIVATION_${userId}`,
    })

    // Credit to Super Admin's pool
    await adminAddFunds(
      ACTIVATION_FEE,
      `Activation fee from user ${userId}`
    )

    // ── Mark user as activated ──────────────────────────────────────────────
    await prisma.systemConfig.upsert({
      where: { key: `withdrawal_activated_${userId}` },
      update: { value: 'true' },
      create: {
        key: `withdrawal_activated_${userId}`,
        value: 'true',
        label: `Withdrawal activation for user ${userId}`,
        group: 'user_activation',
      },
    })

    // ── Notification ────────────────────────────────────────────────────────
    await prisma.notification.create({
      data: {
        userId,
        category: 'ACCOUNT',
        title: '🎉 Withdrawal Unlocked!',
        message: `₹${ACTIVATION_FEE} has been sent to admin. Your withdrawal is now permanently unlocked!`,
        metadata: { activationFee: ACTIVATION_FEE } as object,
      },
    })

    return NextResponse.json({
      success: true,
      message: `₹${ACTIVATION_FEE} sent to admin. Withdrawal is now unlocked — you can withdraw all your earnings!`,
    })
  } catch (error) {
    console.error('Activation error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
