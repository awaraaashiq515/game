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
      totalDeposits,
      pendingDeposits,
      activationDeposits,
      pendingDepositsList,
      unapprovedActivationsCount,
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
      // Total approved deposits
      prisma.depositRequest.aggregate({
        where: { status: 'APPROVED' },
        _sum: { amount: true },
        _count: true,
      }),
      // Pending deposit requests
      prisma.depositRequest.aggregate({
        where: { status: 'PENDING' },
        _sum: { amount: true },
        _count: true,
      }),
      // ₹5 activation deposits collected
      prisma.depositRequest.aggregate({
        where: { status: 'APPROVED', adminNote: { contains: 'WITHDRAWAL_ACTIVATION_FEE' } },
        _sum: { amount: true },
        _count: true,
      }),
      // Latest unapproved deposits list (up to 8)
      prisma.depositRequest.findMany({
        where: { status: 'PENDING' },
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { requestedAt: 'desc' },
        take: 8,
      }),
      // Unapproved ₹5 activations count
      prisma.depositRequest.count({
        where: { status: 'PENDING', adminNote: { contains: 'WITHDRAWAL_ACTIVATION_FEE' } },
      }),
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
        totalDeposited: totalDeposits._sum.amount ?? 0,
        totalDepositsCount: totalDeposits._count ?? 0,
        pendingDeposits: pendingDeposits._sum.amount ?? 0,
        pendingDepositsCount: pendingDeposits._count ?? 0,
        unapprovedActivationsCount,
        activationDeposits: activationDeposits._sum.amount ?? 0,
        activationDepositsCount: activationDeposits._count ?? 0,
        pendingDepositsList: pendingDepositsList.map(p => ({
          id: p.id,
          amount: p.amount,
          utrNumber: p.utrNumber,
          senderUpi: p.senderUpi,
          isActivation: p.adminNote?.includes('WITHDRAWAL_ACTIVATION_FEE') ?? false,
          requestedAt: p.requestedAt.toISOString(),
          user: p.user,
        })),
        activeCampaigns,
        totalFraudEvents: fraudEvents,
      },
    })
  } catch (error) {
    console.error('Admin stats error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
