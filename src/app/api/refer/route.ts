import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        referralsMade: {
          include: {
            referee: {
              select: { name: true, createdAt: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        wallet: {
          select: { referralEarnings: true },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    const appUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'
    const referralLink = `${appUrl}/signup?ref=${user.referralCode}`
    const referrals = user.referralsMade ?? []

    const totalReferrals = referrals.length
    const qualifiedReferrals = referrals.filter(
      (r: { status: string }) => r.status === 'QUALIFIED' || r.status === 'REWARDED'
    ).length

    return NextResponse.json({
      success: true,
      data: {
        referralCode: user.referralCode,
        referralLink,
        totalReferrals,
        qualifiedReferrals,
        pendingReferrals: referrals.filter((r: { status: string }) => r.status === 'PENDING').length,
        totalEarnings: user.wallet?.referralEarnings ?? 0,
        referrals: referrals.map((r: { id: string; referee: { name: string; createdAt: Date }; status: string; rewardAmount: number | null; qualifiedAt: Date | null }) => ({
          id: r.id,
          name: r.referee.name,
          joinedAt: r.referee.createdAt.toISOString(),
          status: r.status,
          rewardAmount: r.rewardAmount,
          qualifiedAt: r.qualifiedAt?.toISOString() ?? null,
        })),
      },
    })
  } catch (error) {
    console.error('Referral error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
