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

  // Unlock thresholds
  const MIN_ADS_FOR_WITHDRAWAL = 5
  const MIN_REFERRALS_FOR_WITHDRAWAL = 7
  const ACTIVATION_FEE = 5

  try {
    const [wallet, transactions, todayEarnings, completedAds, referralCount, activationRecord] = await Promise.all([
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
    ])

    // Step-by-step unlock logic (in order)
    const videosUnlocked = completedAds >= MIN_ADS_FOR_WITHDRAWAL      // Step 1
    const friendsUnlocked = referralCount >= MIN_REFERRALS_FOR_WITHDRAWAL // Step 2
    const activationFeePaid = activationRecord?.value === 'true'          // Step 3
    const withdrawalUnlocked = videosUnlocked && friendsUnlocked && activationFeePaid

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
        adsRequired: MIN_ADS_FOR_WITHDRAWAL,
        referralsRequired: MIN_REFERRALS_FOR_WITHDRAWAL,
        activationFee: ACTIVATION_FEE,
        videosUnlocked,
        friendsUnlocked,
        activationFeePaid,
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
