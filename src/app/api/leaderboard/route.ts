import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { maskName } from '@/lib/utils'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)

  try {
    const topWallets = await prisma.wallet.findMany({
      where: {
        user: { status: 'ACTIVE' },
        totalEarned: { gt: 0 },
      },
      orderBy: { totalEarned: 'desc' },
      take: 20,
      include: {
        user: { select: { id: true, name: true } },
      },
    })

    const currentUserId = session?.user?.id

    const entries = topWallets.map((w, i) => ({
      rank: i + 1,
      maskedName: maskName(w.user.name),
      totalEarned: w.totalEarned,
      isCurrentUser: w.user.id === currentUserId,
    }))

    return NextResponse.json({ success: true, data: entries })
  } catch (error) {
    console.error('Leaderboard error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
