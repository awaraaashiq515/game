import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { getClientIp } from '@/lib/utils'
import { checkIpAbuse } from '@/lib/fraud'

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { campaignId } = await request.json()
    const userId = session.user.id
    const ipAddress = getClientIp(request)
    const userAgent = request.headers.get('user-agent') ?? ''

    // Validate campaign exists and is active
    const campaign = await prisma.videoCampaign.findUnique({ where: { id: campaignId } })
    if (!campaign || campaign.status !== 'ACTIVE') {
      return NextResponse.json({ success: false, error: 'Campaign not available' }, { status: 400 })
    }

    // Check budget
    if (campaign.spentBudget >= campaign.totalBudget) {
      return NextResponse.json({ success: false, error: 'Campaign budget exhausted' }, { status: 400 })
    }

    // Check daily limit
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const dailyLimitConfig = await prisma.systemConfig.findUnique({
      where: { key: 'daily_video_limit' },
    })
    const dailyLimit = campaign.dailyLimit || parseInt(dailyLimitConfig?.value ?? '10')

    const todayCount = await prisma.videoCompletion.count({
      where: { userId, completedAt: { gte: today } },
    })

    if (todayCount >= dailyLimit) {
      return NextResponse.json(
        { success: false, error: 'Daily video limit reached. Come back tomorrow!' },
        { status: 400 }
      )
    }

    // IP abuse check (non-blocking, just logs)
    await checkIpAbuse(ipAddress, userId)

    // Check for an existing active session for this campaign
    const existingSession = await prisma.videoWatchSession.findFirst({
      where: {
        userId,
        campaignId,
        status: { in: ['STARTED', 'IN_PROGRESS'] },
        createdAt: { gte: new Date(Date.now() - 2 * 60 * 60 * 1000) }, // Within 2 hours
      },
    })

    if (existingSession) {
      // Return existing session
      return NextResponse.json({
        success: true,
        data: {
          sessionId: existingSession.id,
          sessionToken: existingSession.sessionToken,
          watchDuration: campaign.watchDuration,
          rewardAmount: campaign.rewardAmount,
          watchedSeconds: existingSession.watchedSeconds,
        },
      })
    }

    // Create new watch session
    const watchSession = await prisma.videoWatchSession.create({
      data: {
        userId,
        campaignId,
        status: 'STARTED',
        ipAddress,
        userAgent,
        heartbeatAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        sessionId: watchSession.id,
        sessionToken: watchSession.sessionToken,
        watchDuration: campaign.watchDuration,
        rewardAmount: campaign.rewardAmount,
        watchedSeconds: 0,
      },
    })
  } catch (error) {
    console.error('Watch start error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
