import prisma from '@/lib/prisma'
import { creditWallet } from '@/lib/wallet'
import { deductFromAdminPoolForReward } from '@/lib/adminWallet'
import { TransactionType, NotificationCategory } from '@/generated/prisma/client'

/**
 * Check if a referral qualifies and credit reward to referrer.
 * Called after the referee completes their first eligible video.
 */
export async function processReferralQualification(refereeId: string): Promise<void> {
  // Find the referral record
  const referral = await prisma.referral.findUnique({
    where: { refereeId },
    include: { referrer: true },
  })

  if (!referral || referral.status !== 'PENDING') return

  // Get referral reward config
  const rewardConfig = await prisma.systemConfig.findUnique({
    where: { key: 'referral_reward_amount' },
  })
  const rewardAmount = parseFloat(rewardConfig?.value ?? '200')

  // Get qualificationtrigger config
  const qualConfig = await prisma.systemConfig.findUnique({
    where: { key: 'referral_qualification' },
  })
  const qualTrigger = qualConfig?.value ?? 'FIRST_VIDEO'

  // Check qualification condition
  if (qualTrigger === 'FIRST_VIDEO') {
    const completions = await prisma.videoCompletion.count({
      where: { userId: refereeId },
    })
    if (completions < 1) return // Not qualified yet
  }

  // Mark referral as qualified
  await prisma.referral.update({
    where: { id: referral.id },
    data: {
      status: 'QUALIFIED',
      qualifiedAt: new Date(),
      rewardAmount,
    },
  })

  // Credit referral reward to referrer
  await creditWallet({
    userId: referral.referrerId,
    amount: rewardAmount,
    type: TransactionType.REFERRAL_REWARD,
    description: `Referral reward — friend completed eligibility`,
    reference: referral.id,
    metadata: { refereeId, referralId: referral.id },
  })

  // Deduct from admin master pool
  await deductFromAdminPoolForReward(
    rewardAmount,
    `Referral reward paid to referrer`,
    referral.id
  )

  // Create referral reward record
  await prisma.referralReward.create({
    data: {
      referralId: referral.id,
      amount: rewardAmount,
    },
  })

  // Mark as rewarded
  await prisma.referral.update({
    where: { id: referral.id },
    data: { status: 'REWARDED' },
  })

  // Send notification to referrer
  await prisma.notification.create({
    data: {
      userId: referral.referrerId,
      category: NotificationCategory.REFERRAL,
      title: 'Referral Qualified! 👥',
      message: `Your friend completed the required activity. ₹${rewardAmount} has been added to your wallet.`,
      metadata: { referralId: referral.id, amount: rewardAmount } as object,
    },
  })
}

/**
 * Create a referral record when a new user signs up or applies a referral code.
 */
export async function createReferral(refereeId: string, referralCode: string): Promise<{ success: boolean; message?: string }> {
  const referrer = await prisma.user.findUnique({
    where: { referralCode },
  })

  if (!referrer) return { success: false, message: 'Invalid referral code' }
  if (referrer.id === refereeId) return { success: false, message: 'Cannot refer yourself' }

  // Check if referral already exists
  const existing = await prisma.referral.findUnique({
    where: { refereeId },
  })
  if (existing) return { success: false, message: 'Referral already applied' }

  await prisma.$transaction([
    prisma.referral.create({
      data: {
        referrerId: referrer.id,
        refereeId,
        status: 'PENDING',
      },
    }),
    prisma.user.update({
      where: { id: refereeId },
      data: { referredById: referrer.id },
    }),
  ])

  return { success: true, message: `Referral applied from ${referrer.name}` }
}
