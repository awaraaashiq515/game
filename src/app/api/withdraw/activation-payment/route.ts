import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

const ACTIVATION_AMOUNT = 5
const MIN_ADS = 5
const MIN_REFERRALS = 7
const ACTIVATION_NOTE_TAG = 'WITHDRAWAL_ACTIVATION_FEE'

/**
 * GET /api/withdraw/activation-payment
 * Returns the user's current activation payment status and admin UPI details.
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }
  const userId = session.user.id

  try {
    const [adminUpiConfig, existingRequest, alreadyActivated] = await Promise.all([
      prisma.systemConfig.findUnique({ where: { key: 'admin_upi_id' } }),
      prisma.depositRequest.findFirst({
        where: { userId, adminNote: { contains: ACTIVATION_NOTE_TAG } },
        orderBy: { requestedAt: 'desc' },
      }),
      prisma.systemConfig.findUnique({ where: { key: `withdrawal_activated_${userId}` } }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        adminUpiId: adminUpiConfig?.value ?? 'admin@virelo',
        activationAmount: ACTIVATION_AMOUNT,
        activated: alreadyActivated?.value === 'true',
        request: existingRequest
          ? {
              id: existingRequest.id,
              status: existingRequest.status,
              utrNumber: existingRequest.utrNumber,
              requestedAt: existingRequest.requestedAt.toISOString(),
            }
          : null,
      },
    })
  } catch (error) {
    console.error('Activation payment GET error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/withdraw/activation-payment
 * User submits UTR proof of ₹5 payment to admin UPI.
 * Prerequisites: 5 videos + 7 friends.
 */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }
  const userId = session.user.id

  try {
    const { utrNumber, senderUpi } = await request.json()

    if (!utrNumber || typeof utrNumber !== 'string' || utrNumber.trim().length < 6) {
      return NextResponse.json({ success: false, error: 'Valid UTR / Transaction ID is required.' }, { status: 400 })
    }

    // ── Prereq: Step 1 — 5 videos ────────────────────────────────────────────
    const completedAds = await prisma.videoCompletion.count({ where: { userId } })
    if (completedAds < MIN_ADS) {
      return NextResponse.json(
        { success: false, error: `Complete Step 1 first — watch ${MIN_ADS - completedAds} more videos.`, code: 'ADS_REQUIRED' },
        { status: 403 }
      )
    }

    // ── Prereq: Step 2 — 7 friends ───────────────────────────────────────────
    const referralCount = await prisma.referral.count({ where: { referrerId: userId } })
    if (referralCount < MIN_REFERRALS) {
      return NextResponse.json(
        { success: false, error: `Complete Step 2 first — invite ${MIN_REFERRALS - referralCount} more friends.`, code: 'FRIENDS_REQUIRED' },
        { status: 403 }
      )
    }

    // ── Already activated? ───────────────────────────────────────────────────
    const alreadyActivated = await prisma.systemConfig.findUnique({
      where: { key: `withdrawal_activated_${userId}` },
    })
    if (alreadyActivated?.value === 'true') {
      return NextResponse.json({ success: false, error: 'Withdrawal already activated.' }, { status: 400 })
    }

    // ── Already has a pending/approved request? ──────────────────────────────
    const existingRequest = await prisma.depositRequest.findFirst({
      where: { userId, adminNote: { contains: ACTIVATION_NOTE_TAG }, status: { in: ['PENDING', 'APPROVED'] } },
    })
    if (existingRequest) {
      return NextResponse.json(
        { success: false, error: existingRequest.status === 'APPROVED' ? 'Already approved.' : 'Request already submitted. Please wait for admin approval.' },
        { status: 400 }
      )
    }

    // ── Create the activation fee request ────────────────────────────────────
    const activationRequest = await prisma.depositRequest.create({
      data: {
        userId,
        amount: ACTIVATION_AMOUNT,
        utrNumber: utrNumber.trim(),
        senderUpi: senderUpi?.trim() ?? null,
        status: 'PENDING',
        adminNote: `${ACTIVATION_NOTE_TAG} — UTR: ${utrNumber.trim()}`,
      },
    })

    // Notification
    await prisma.notification.create({
      data: {
        userId,
        category: 'ACCOUNT',
        title: '⏳ Activation Payment Submitted',
        message: `Your ₹${ACTIVATION_AMOUNT} activation payment (UTR: ${utrNumber.trim()}) is under review. Withdrawal will unlock once admin approves.`,
        metadata: { activationRequestId: activationRequest.id } as object,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Payment proof submitted! Admin will verify and unlock your withdrawal within a few hours.',
      data: { id: activationRequest.id, status: 'PENDING' },
    })
  } catch (error) {
    console.error('Activation payment POST error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
