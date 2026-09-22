import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

async function requireAdmin(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'ADMIN') return null
  return session
}

const DEFAULT_CONFIGS = [
  { key: 'admin_fampay_upi', value: '7876405963@fam', label: 'Admin FamPay UPI ID', group: 'payment' },
  { key: 'admin_fampay_qr_url', value: '', label: 'FamPay QR Code Image URL (Optional)', group: 'payment' },
  { key: 'activation_fee', value: '5', label: 'Activation Fee (₹)', group: 'payment' },
  { key: 'min_ads_for_withdrawal', value: '3', label: 'Videos Required to Unlock Withdrawal', group: 'withdrawal' },
  { key: 'min_referrals_for_withdrawal', value: '7', label: 'Referrals Required to Unlock Withdrawal', group: 'withdrawal' },
]

export async function GET(request: NextRequest) {
  const session = await requireAdmin(request)
  if (!session) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })

  try {
    // Seed defaults if not present
    for (const def of DEFAULT_CONFIGS) {
      const existing = await prisma.systemConfig.findUnique({ where: { key: def.key } })
      if (!existing) {
        await prisma.systemConfig.create({
          data: def,
        })
      }
    }

    const configs = await prisma.systemConfig.findMany({
      orderBy: [{ group: 'asc' }, { key: 'asc' }],
    })
    return NextResponse.json({ success: true, data: configs })
  } catch (error) {
    console.error('Settings GET error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const session = await requireAdmin(request)
  if (!session) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })

  try {
    const { updates } = await request.json() // { key: value }[]
    for (const { key, value } of updates) {
      await prisma.systemConfig.upsert({
        where: { key },
        update: { value: String(value) },
        create: {
          key,
          value: String(value),
          label: key,
          group: key.includes('fampay') || key.includes('activation') ? 'payment' : 'withdrawal',
        },
      })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Settings PATCH error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
