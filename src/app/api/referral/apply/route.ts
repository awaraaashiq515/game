import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { createReferral } from '@/lib/referral'

// GET: Validate referral code
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')?.trim().toUpperCase()

    if (!code) {
      return NextResponse.json({ success: false, error: 'Referral code is required' }, { status: 400 })
    }

    const referrer = await prisma.user.findUnique({
      where: { referralCode: code },
      select: { name: true, referralCode: true },
    })

    if (!referrer) {
      return NextResponse.json({ success: false, error: 'Invalid referral code' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: {
        code: referrer.referralCode,
        referrerName: referrer.name,
      },
    })
  } catch (error) {
    console.error('Validate referral error:', error)
    return NextResponse.json({ success: false, error: 'Failed to validate referral code' }, { status: 500 })
  }
}

// POST: Apply referral code for authenticated user
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { referralCode } = body

    if (!referralCode || typeof referralCode !== 'string') {
      return NextResponse.json({ success: false, error: 'Referral code is required' }, { status: 400 })
    }

    const result = await createReferral(session.user.id, referralCode.trim().toUpperCase())
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, message: result.message })
  } catch (error) {
    console.error('Apply referral error:', error)
    return NextResponse.json({ success: false, error: 'Failed to apply referral code' }, { status: 500 })
  }
}
