import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') ?? '1')
  const limit = 20
  const userId = session.user.id
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  try {
    const [wallet, transactions, todayEarnings, completedAds, referralCount, activationRecord, unlockTimeRecord, adsConfig, refConfig, feeConfig] = await Promise.all([
      prisma.wallet.findUnique({ where: { userId } }),
      prisma.walletTransaction.findMany({
        where: { wallet: { userId } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.walletTransaction.aggregate({
        where: {
          wallet: { userId },
          createdAt: { gte: today },
          amount: { gt: 0 },
          status: 'COMPLETED',
        },
        _sum: { amount: true },
      }),
      prisma.videoCompletion.count({ where: { userId } }),
      prisma.referral.count({ where: { referrerId: userId } }),
      prisma.systemConfig.findUnique({ where: { key: `withdrawal_activated_${userId}` } }),
      prisma.systemConfig.findUnique({ where: { key: `withdrawal_unlock_at_${userId}` } }),
      prisma.systemConfig.findUnique({ where: { key: 'min_ads_for_withdrawal' } }),
      prisma.systemConfig.findUnique({ where: { key: 'min_referrals_for_withdrawal' } }),
      prisma.systemConfig.findUnique({ where: { key: 'activation_fee' } }),
    ])

    // Dynamic thresholds (defaults: 3 videos, 7 referrals, ₹5 fee)
    const minAdsRequired = parseInt(adsConfig?.value ?? '3') || 3
    const minRefsRequired = parseInt(refConfig?.value ?? '7') || 7
    const activationFee = parseFloat(feeConfig?.value ?? '5') || 5

    // Check if admin scheduled an unlock time
    const unlockAtStr = unlockTimeRecord?.value ?? null
    let isTimeUnlocked = true
    if (unlockAtStr) {
      const unlockDate = new Date(unlockAtStr)
      if (!isNaN(unlockDate.getTime())) {
        isTimeUnlocked = Date.now() >= unlockDate.getTime()
      }
    }

    // Step-by-step unlock logic (in order)
    const videosUnlocked = completedAds >= minAdsRequired            // Step 1
    const friendsUnlocked = referralCount >= minRefsRequired         // Step 2
    const activationFeePaid = activationRecord?.value === 'true'     // Step 3 (Admin approved ₹5)
    const withdrawalUnlocked = videosUnlocked && friendsUnlocked && activationFeePaid && isTimeUnlocked

    return NextResponse.json({
      success: true,
      data: {
        wallet: {
          availableBalance: wallet?.availableBalance ?? 0,
          pendingBalance: wallet?.pendingBalance ?? 0,
          totalEarned: wallet?.totalEarned ?? 0,
          totalWithdrawn: wallet?.totalWithdrawn ?? 0,
          videoEarnings: wallet?.videoEarnings ?? 0,
          referralEarnings: wallet?.referralEarnings ?? 0,
        },
        todayEarnings: todayEarnings._sum.amount ?? 0,
        completedAds,
        referralCount,
        adsRequired: minAdsRequired,
        referralsRequired: minRefsRequired,
        activationFee: activationFee,
        videosUnlocked,
        friendsUnlocked,
        activationFeePaid,
        unlockAt: unlockAtStr,
        isTimeUnlocked,
        withdrawalUnlocked,
        // Legacy compat
        adsUnlocked: videosUnlocked,
        transactions: transactions.map((t) => ({
          id: t.id,
          type: t.type,
          status: t.status,
          amount: t.amount,
          description: t.description,
          reference: t.reference,
          createdAt: t.createdAt.toISOString(),
        })),
        page,
        hasMore: transactions.length === limit,
      },
    })
  } catch (error) {
    console.error('Wallet error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
