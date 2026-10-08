import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'ADMIN') return null
  return session
}

const DEFAULT_CONFIGS = [
  // Earning & Video Settings
  { key: 'min_watch_duration', value: '30', label: 'Video Watch Time (Seconds)', group: 'earning' },
  { key: 'video_reward_amount', value: '20', label: 'Reward Per Video (₹)', group: 'earning' },
  { key: 'daily_video_limit', value: '10', label: 'Daily Video Limit Per User', group: 'earning' },
  { key: 'max_daily_earning', value: '200', label: 'Max Daily Earning Per User (₹)', group: 'earning' },

  // Referral Settings
  { key: 'referral_reward_amount', value: '200', label: 'Referral Reward Per Friend (₹)', group: 'referral' },
  { key: 'referral_qualification', value: 'FIRST_VIDEO', label: 'Referral Qualification Trigger', group: 'referral' },

  // Withdrawal Settings
  { key: 'min_withdrawal', value: '2000', label: 'Minimum Withdrawal Amount (₹)', group: 'withdrawal' },
  { key: 'min_ads_for_withdrawal', value: '3', label: 'Videos Required to Unlock Withdrawal', group: 'withdrawal' },
  { key: 'min_referrals_for_withdrawal', value: '7', label: 'Referrals Required to Unlock Withdrawal', group: 'withdrawal' },
  { key: 'withdrawal_processing_days', value: '3', label: 'Withdrawal Processing Days', group: 'withdrawal' },

  // Payment & Activation Settings
  { key: 'activation_fee', value: '5', label: 'Activation Fee (₹)', group: 'payment' },
  { key: 'admin_fampay_upi', value: '7876405963@fam', label: 'Admin FamPay UPI ID', group: 'payment' },
  { key: 'admin_fampay_qr_url', value: '', label: 'FamPay QR Code Image URL (Optional)', group: 'payment' },
  { key: 'admin_upi_id', value: '7876405963@fam', label: 'Admin Primary UPI ID', group: 'payment' },
]

export async function GET() {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })

  try {
    // Seed and sync default configs
    for (const def of DEFAULT_CONFIGS) {
      const existing = await prisma.systemConfig.findUnique({ where: { key: def.key } })
      if (!existing) {
        await prisma.systemConfig.create({
          data: def,
        })
      } else if (!existing.group || existing.group === 'other' || !existing.label) {
        await prisma.systemConfig.update({
          where: { key: def.key },
          data: { group: def.group, label: def.label },
        })
      }
    }

    // Fetch system configs (exclude per-user dynamic keys)
    const configs = await prisma.systemConfig.findMany({
      where: {
        AND: [
          { key: { not: { startsWith: 'withdrawal_activated_' } } },
          { key: { not: { startsWith: 'withdrawal_unlock_at_' } } },
        ],
      },
      orderBy: [{ group: 'asc' }, { key: 'asc' }],
    })

    return NextResponse.json({ success: true, data: configs })
  } catch (error) {
    console.error('Settings GET error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })

  try {
    const { updates } = await request.json() // { key: string, value: string }[]
    if (!Array.isArray(updates)) {
      return NextResponse.json({ success: false, error: 'Invalid updates format' }, { status: 400 })
    }

    for (const { key, value } of updates) {
      const stringValue = String(value).trim()

      await prisma.systemConfig.upsert({
        where: { key },
        update: { value: stringValue },
        create: {
          key,
          value: stringValue,
          label: key,
          group: key.includes('fampay') || key.includes('activation') || key.includes('upi')
            ? 'payment'
            : key.includes('withdrawal')
            ? 'withdrawal'
            : key.includes('referral')
            ? 'referral'
            : 'earning',
        },
      })

      // When admin changes video watch duration, sync active video campaigns!
      if (key === 'min_watch_duration') {
        const duration = parseInt(stringValue)
        if (!isNaN(duration) && duration > 0) {
          await prisma.videoCampaign.updateMany({
            where: { status: 'ACTIVE' },
            data: { watchDuration: duration },
          })
        }
      }

      // When admin changes video reward amount, sync active video campaigns!
      if (key === 'video_reward_amount') {
        const reward = parseFloat(stringValue)
        if (!isNaN(reward) && reward > 0) {
          await prisma.videoCampaign.updateMany({
            where: { status: 'ACTIVE' },
            data: { rewardAmount: reward },
          })
        }
      }

      // When admin changes daily video limit, sync active video campaigns!
      if (key === 'daily_video_limit') {
        const limit = parseInt(stringValue)
        if (!isNaN(limit) && limit > 0) {
          await prisma.videoCampaign.updateMany({
            where: { status: 'ACTIVE' },
            data: { dailyLimit: limit },
          })
        }
      }
    }

    // Log admin action
    const admin = await prisma.adminUser.findUnique({ where: { email: session.user.email } })
    if (admin) {
      await prisma.adminActionLog.create({
        data: {
          adminId: admin.id,
          action: 'SETTINGS_UPDATE',
          description: `Updated ${updates.length} platform setting(s)`,
        },
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Settings updated and synchronized successfully',
    })
  } catch (error) {
    console.error('Settings PATCH error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
