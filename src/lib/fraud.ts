import prisma from '@/lib/prisma'
import { FraudSeverity } from '@/generated/prisma/client'

const FAST_COMPLETION_THRESHOLD = 0.8 // Must watch at least 80% of required duration

/**
 * Validate a video watch session before crediting reward.
 * Returns { valid: boolean, reason?: string }
 */
export async function validateWatchCompletion(params: {
  sessionId: string
  userId: string
  campaignId: string
  watchedSeconds: number
  ipAddress?: string
}): Promise<{ valid: boolean; reason?: string }> {
  const { sessionId, userId, campaignId, watchedSeconds, ipAddress } = params

  // 1. Get campaign config
  const campaign = await prisma.videoCampaign.findUnique({
    where: { id: campaignId },
  })
  if (!campaign || campaign.status !== 'ACTIVE') {
    return { valid: false, reason: 'Campaign is not active' }
  }

  // 2. Check campaign budget
  if (campaign.spentBudget + campaign.rewardAmount > campaign.totalBudget) {
    return { valid: false, reason: 'Campaign budget exhausted' }
  }

  // 3. Check campaign date validity
  const now = new Date()
  if (campaign.startDate && now < campaign.startDate) {
    return { valid: false, reason: 'Campaign has not started' }
  }
  if (campaign.endDate && now > campaign.endDate) {
    return { valid: false, reason: 'Campaign has ended' }
  }

  // 4. Check minimum watch duration
  const requiredSeconds = campaign.watchDuration
  const watchedRatio = watchedSeconds / requiredSeconds
  if (watchedRatio < FAST_COMPLETION_THRESHOLD) {
    await logFraudEvent({
      userId,
      type: 'FAST_COMPLETION',
      severity: FraudSeverity.MEDIUM,
      description: `User completed video in ${watchedSeconds}s (required: ${requiredSeconds}s)`,
      metadata: { sessionId, campaignId, watchedSeconds, requiredSeconds },
      ipAddress,
    })
    return { valid: false, reason: 'Watch duration insufficient' }
  }

  // 5. Check duplicate completion for this session
  const existingCompletion = await prisma.videoCompletion.findUnique({
    where: { sessionId },
  })
  if (existingCompletion) {
    await logFraudEvent({
      userId,
      type: 'DUPLICATE_COMPLETION',
      severity: FraudSeverity.HIGH,
      description: 'Duplicate completion attempt for same session',
      metadata: { sessionId, campaignId },
      ipAddress,
    })
    return { valid: false, reason: 'Session already completed' }
  }

  // 6. Check daily limit for this user + campaign
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  // Get system config for daily limit
  const dailyLimitConfig = await prisma.systemConfig.findUnique({
    where: { key: 'daily_video_limit' },
  })
  const dailyLimit = campaign.dailyLimit || parseInt(dailyLimitConfig?.value ?? '10')

  const todayCompletions = await prisma.videoCompletion.count({
    where: {
      userId,
      completedAt: { gte: todayStart },
    },
  })

  if (todayCompletions >= dailyLimit) {
    return { valid: false, reason: `Daily limit of ${dailyLimit} videos reached` }
  }

  // 7. Validate the session belongs to this user
  const session = await prisma.videoWatchSession.findUnique({
    where: { id: sessionId },
  })
  if (!session || session.userId !== userId || session.campaignId !== campaignId) {
    await logFraudEvent({
      userId,
      type: 'SESSION_MISMATCH',
      severity: FraudSeverity.HIGH,
      description: 'Session mismatch — possible tampering',
      metadata: { sessionId, campaignId },
      ipAddress,
    })
    return { valid: false, reason: 'Invalid session' }
  }

  if (session.status === 'COMPLETED' || session.status === 'FLAGGED') {
    return { valid: false, reason: 'Session already processed' }
  }

  // 8. Check user account status
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user || user.status !== 'ACTIVE') {
    return { valid: false, reason: 'Account is not active' }
  }

  return { valid: true }
}

/**
 * Check if an IP address has suspicious activity.
 */
export async function checkIpAbuse(ipAddress: string, userId: string): Promise<boolean> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
  const sessionsFromIp = await prisma.videoWatchSession.count({
    where: {
      ipAddress,
      createdAt: { gte: oneHourAgo },
      userId: { not: userId },
    },
  })

  if (sessionsFromIp > 20) {
    await logFraudEvent({
      userId,
      type: 'IP_ABUSE',
      severity: FraudSeverity.HIGH,
      description: `High session volume from IP: ${ipAddress}`,
      metadata: { ipAddress, count: sessionsFromIp },
      ipAddress,
    })
    return true
  }
  return false
}

/**
 * Log a fraud event.
 */
export async function logFraudEvent(params: {
  userId?: string
  type: string
  severity: FraudSeverity
  description: string
  metadata?: Record<string, unknown>
  ipAddress?: string
}) {
  try {
    await prisma.fraudEvent.create({
      data: {
        userId: params.userId,
        type: params.type,
        severity: params.severity,
        description: params.description,
        metadata: params.metadata as object,
        ipAddress: params.ipAddress,
      },
    })
  } catch {
    console.error('Failed to log fraud event:', params)
  }
}
