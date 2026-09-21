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
  const userId = session.user.id
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  try {
    // Get all active campaigns
    const campaigns = await prisma.videoCampaign.findMany({
      where: {
        status: 'ACTIVE',
        OR: [{ startDate: null }, { startDate: { lte: new Date() } }],
        AND: [{ OR: [{ endDate: null }, { endDate: { gte: new Date() } }] }],
      },
      orderBy: { createdAt: 'desc' },
    })

    // Get today's completions for this user
    const todayCompletions = await prisma.videoCompletion.findMany({
      where: { userId, completedAt: { gte: today } },
      select: { campaignId: true },
    })
    const completedCampaignIds = new Set(todayCompletions.map((c) => c.campaignId))

    // Get daily limit
    const dailyLimitConfig = await prisma.systemConfig.findUnique({
      where: { key: 'daily_video_limit' },
    })
    const globalDailyLimit = parseInt(dailyLimitConfig?.value ?? '10')
    const todayCount = todayCompletions.length

    const campaignsWithStatus = campaigns.map((campaign) => {
      let userStatus: 'AVAILABLE' | 'COMPLETED_TODAY' | 'LOCKED' | 'EXPIRED' = 'AVAILABLE'

      if (todayCount >= globalDailyLimit) {
        userStatus = 'LOCKED'
      } else if (completedCampaignIds.has(campaign.id)) {
        userStatus = 'COMPLETED_TODAY'
      }

      return {
        id: campaign.id,
        name: campaign.name,
        sponsor: campaign.sponsor,
        description: campaign.description,
        thumbnailUrl: campaign.thumbnailUrl,
        videoUrl: campaign.videoUrl,
        rewardAmount: campaign.rewardAmount,
        watchDuration: campaign.watchDuration,
        status: campaign.status,
        userStatus,
        totalCompletions: campaign.totalCompletions,
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        campaigns: campaignsWithStatus,
        todayCount,
        dailyLimit: globalDailyLimit,
      },
    })
  } catch (error) {
    console.error('Campaigns error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
