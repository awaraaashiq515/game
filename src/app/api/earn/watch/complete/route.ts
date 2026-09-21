import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { validateWatchCompletion } from '@/lib/fraud'
import { creditWallet } from '@/lib/wallet'
import { deductFromAdminPoolForReward } from '@/lib/adminWallet'
import { processReferralQualification } from '@/lib/referral'
import { TransactionType, NotificationCategory } from '@/generated/prisma/client'
import { getClientIp } from '@/lib/utils'

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { sessionId, campaignId, watchedSeconds } = await request.json()
    const userId = session.user.id
    const ipAddress = getClientIp(request)

    // Validate completion
    const validation = await validateWatchCompletion({
      sessionId,
      userId,
      campaignId,
      watchedSeconds,
      ipAddress,
    })

    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.reason ?? 'Validation failed' },
        { status: 400 }
      )
    }

    // Get campaign reward amount
    const campaign = await prisma.videoCampaign.findUnique({ where: { id: campaignId } })
    if (!campaign) {
      return NextResponse.json({ success: false, error: 'Campaign not found' }, { status: 404 })
    }

    const rewardAmount = campaign.rewardAmount

    // Mark session as completed
    await prisma.videoWatchSession.update({
      where: { id: sessionId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        watchedSeconds,
      },
    })

    // Create completion record
    await prisma.videoCompletion.create({
      data: {
        userId,
        campaignId,
        sessionId,
        rewardAmount,
      },
    })

    // Credit user wallet
    await creditWallet({
      userId,
      amount: rewardAmount,
      type: TransactionType.VIDEO_REWARD,
      description: `Video reward — ${campaign.name}`,
      reference: sessionId,
      metadata: { campaignId, sessionId },
    })

    // Deduct from admin master pool
    await deductFromAdminPoolForReward(
      rewardAmount,
      `Video reward paid to user for campaign: ${campaign.name}`,
      sessionId
    )

    // Update campaign stats and budget
    await prisma.videoCampaign.update({
      where: { id: campaignId },
      data: {
        totalCompletions: { increment: 1 },
        totalViews: { increment: 1 },
        spentBudget: { increment: rewardAmount },
      },
    })

    // Send notification
    await prisma.notification.create({
      data: {
        userId,
        category: NotificationCategory.REWARD,
        title: 'You earned ₹20! 🎉',
        message: `Your video reward has been added to your wallet.`,
        metadata: { amount: rewardAmount, campaignId } as object,
      },
    })

    // Check if this is the referee's first completion → trigger referral qualification
    const totalCompletions = await prisma.videoCompletion.count({ where: { userId } })
    if (totalCompletions === 1) {
      await processReferralQualification(userId)
    }

    return NextResponse.json({
      success: true,
      data: {
        rewardAmount,
        message: `₹${rewardAmount} earned!`,
      },
    })
  } catch (error) {
    console.error('Watch complete error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
