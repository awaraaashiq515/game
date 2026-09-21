import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

async function requireAdmin(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'ADMIN') {
    return null
  }
  return session
}

export async function GET(request: NextRequest) {
  const session = await requireAdmin(request)
  if (!session) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  try {
    const [
      totalUsers,
      activeUsers,
      todayVideoEarnings,
      referralRewards,
      pendingWithdrawals,
      withdrawalSum,
      activeCampaigns,
      fraudEvents,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: 'ACTIVE', lastLoginAt: { gte: new Date(Date.now() - 7 * 86400000) } } }),
      prisma.walletTransaction.aggregate({
        where: { type: 'VIDEO_REWARD', createdAt: { gte: today }, status: 'COMPLETED' },
        _sum: { amount: true },
      }),
      prisma.walletTransaction.aggregate({
        where: { type: 'REFERRAL_REWARD', status: 'COMPLETED' },
        _sum: { amount: true },
      }),
      prisma.withdrawal.aggregate({
        where: { status: { in: ['PENDING', 'APPROVED'] } },
        _sum: { amount: true },
      }),
      prisma.withdrawal.aggregate({
        where: { status: 'PAID' },
        _sum: { amount: true },
      }),
      prisma.videoCampaign.count({ where: { status: 'ACTIVE' } }),
      prisma.fraudEvent.count({ where: { resolved: false } }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        todayVideoEarnings: todayVideoEarnings._sum.amount ?? 0,
        referralRewards: referralRewards._sum.amount ?? 0,
        pendingWithdrawals: pendingWithdrawals._sum.amount ?? 0,
        totalWithdrawn: withdrawalSum._sum.amount ?? 0,
        activeCampaigns,
        totalFraudEvents: fraudEvents,
      },
    })
  } catch (error) {
    console.error('Admin stats error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
