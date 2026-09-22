import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { resolveLocation } from '@/lib/geo'

const ACTIVATION_AMOUNT = 5
const ACTIVATION_NOTE_TAG = 'WITHDRAWAL_ACTIVATION_FEE'

/**
 * GET /api/withdraw/activation-payment
 * Returns the user's current activation payment status and admin FamPay/UPI details.
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }
  const userId = session.user.id

  try {
    const [adminFampayConfig, adminUpiConfig, adminQrConfig, feeConfig, existingRequest, alreadyActivated, unlockConfig] = await Promise.all([
      prisma.systemConfig.findUnique({ where: { key: 'admin_fampay_upi' } }),
      prisma.systemConfig.findUnique({ where: { key: 'admin_upi_id' } }),
      prisma.systemConfig.findUnique({ where: { key: 'admin_fampay_qr_url' } }),
      prisma.systemConfig.findUnique({ where: { key: 'activation_fee' } }),
      prisma.depositRequest.findFirst({
        where: { userId, adminNote: { contains: ACTIVATION_NOTE_TAG } },
        orderBy: { requestedAt: 'desc' },
      }),
      prisma.systemConfig.findUnique({ where: { key: `withdrawal_activated_${userId}` } }),
      prisma.systemConfig.findUnique({ where: { key: `withdrawal_unlock_at_${userId}` } }),
    ])

    const activationAmount = parseFloat(feeConfig?.value ?? '5') || 5
    const adminUpi = adminFampayConfig?.value?.trim() || adminUpiConfig?.value?.trim() || '7876405963@fam'
    const qrUrl = adminQrConfig?.value?.trim() || null

    const unlockAtStr = unlockConfig?.value ?? null
    let isTimeUnlocked = true
    if (unlockAtStr) {
      const unlockDate = new Date(unlockAtStr)
      if (!isNaN(unlockDate.getTime())) {
        isTimeUnlocked = Date.now() >= unlockDate.getTime()
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        adminUpiId: adminUpi,
        adminFampayUpi: adminUpi,
        adminQrUrl: qrUrl,
        activationAmount,
        activated: alreadyActivated?.value === 'true',
        unlockAt: unlockAtStr,
        isTimeUnlocked,
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
 * User submits UTR proof of ₹5 payment to admin FamPay UPI.
 * Prerequisites: 3 videos + 7 friends.
 */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }
  const userId = session.user.id

  try {
    const { utrNumber, senderUpi, clientGeo } = await request.json()

    if (!utrNumber || typeof utrNumber !== 'string' || utrNumber.trim().length < 6) {
      return NextResponse.json({ success: false, error: 'Valid UTR / Transaction ID is required.' }, { status: 400 })
    }

    // Dynamic thresholds (defaults: 3 videos, 7 referrals, ₹5 fee)
    const [adsConfig, refConfig, feeConfig] = await Promise.all([
      prisma.systemConfig.findUnique({ where: { key: 'min_ads_for_withdrawal' } }),
      prisma.systemConfig.findUnique({ where: { key: 'min_referrals_for_withdrawal' } }),
      prisma.systemConfig.findUnique({ where: { key: 'activation_fee' } }),
    ])
    const minAds = parseInt(adsConfig?.value ?? '3') || 3
    const minRefs = parseInt(refConfig?.value ?? '7') || 7
    const activationAmount = parseFloat(feeConfig?.value ?? '5') || 5

    // ── Prereq: Step 1 — 3 videos ────────────────────────────────────────────
    const completedAds = await prisma.videoCompletion.count({ where: { userId } })
    if (completedAds < minAds) {
      return NextResponse.json(
        { success: false, error: `Complete Step 1 first — watch ${minAds - completedAds} more videos.`, code: 'ADS_REQUIRED' },
        { status: 403 }
      )
    }

    // ── Prereq: Step 2 — 7 friends ───────────────────────────────────────────
    const referralCount = await prisma.referral.count({ where: { referrerId: userId } })
    if (referralCount < minRefs) {
      return NextResponse.json(
        { success: false, error: `Complete Step 2 first — invite ${minRefs - referralCount} more friends.`, code: 'FRIENDS_REQUIRED' },
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

    // ── Resolve location ─────────────────────────────────────────────────────
    const locationData = await resolveLocation(request, clientGeo)

    // ── Create the activation fee request ────────────────────────────────────
    const activationRequest = await prisma.depositRequest.create({
      data: {
        userId,
        amount: activationAmount,
        utrNumber: utrNumber.trim(),
        senderUpi: senderUpi?.trim() ?? null,
        status: 'PENDING',
        adminNote: `${ACTIVATION_NOTE_TAG} — UTR: ${utrNumber.trim()} [Loc: ${locationData.city}, ${locationData.region}]`,
      },
    })

    // Store rich geo metadata
    await Promise.all([
      prisma.systemConfig.upsert({
        where: { key: `deposit_geo_${activationRequest.id}` },
        update: { value: JSON.stringify(locationData) },
        create: {
          key: `deposit_geo_${activationRequest.id}`,
          value: JSON.stringify(locationData),
          label: `Geo info for deposit ${activationRequest.id}`,
          group: 'deposit_location',
        },
      }),
      prisma.user.update({
        where: { id: userId },
        data: { lastLoginIp: locationData.ip },
      }),
    ])

    // Notification
    await prisma.notification.create({
      data: {
        userId,
        category: 'ACCOUNT',
        title: '⏳ Activation Payment Submitted',
        message: `Your ₹${activationAmount} activation payment (UTR: ${utrNumber.trim()}) is under review. Withdrawal will unlock once admin approves.`,
        metadata: { activationRequestId: activationRequest.id } as object,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Payment proof submitted! Admin will verify and unlock your withdrawal within a few hours.',
      data: { id: activationRequest.id, status: 'PENDING', location: locationData },
    })
  } catch (error) {
    console.error('Activation payment POST error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
