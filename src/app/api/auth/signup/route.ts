import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'
import { generateReferralCode, isValidEmail, isValidMobile } from '@/lib/utils'
import { createReferral } from '@/lib/referral'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, mobile, password, confirmPassword, referralCode } = body

    // Validation
    if (!name || !email || !mobile || !password) {
      return NextResponse.json(
        { success: false, error: 'All fields are required' },
        { status: 400 }
      )
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ success: false, error: 'Invalid email address' }, { status: 400 })
    }

    if (!isValidMobile(mobile)) {
      return NextResponse.json(
        { success: false, error: 'Invalid mobile number (10 digits, starting with 6-9)' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }

    if (password !== confirmPassword) {
      return NextResponse.json({ success: false, error: 'Passwords do not match' }, { status: 400 })
    }

    // Check existing user
    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { mobile }] },
    })

    if (existingUser) {
      if (existingUser.email === email) {
        return NextResponse.json(
          { success: false, error: 'Email already registered' },
          { status: 409 }
        )
      }
      return NextResponse.json(
        { success: false, error: 'Mobile number already registered' },
        { status: 409 }
      )
    }

    // Generate unique referral code
    let userReferralCode = generateReferralCode()
    let attempts = 0
    while (attempts < 10) {
      const existing = await prisma.user.findUnique({
        where: { referralCode: userReferralCode },
      })
      if (!existing) break
      userReferralCode = generateReferralCode()
      attempts++
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12)

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        mobile,
        passwordHash,
        referralCode: userReferralCode,
        status: 'ACTIVE',
      },
    })

    // Create wallet
    await prisma.wallet.create({
      data: { userId: user.id },
    })

    // Process referral if code provided
    if (referralCode && referralCode.trim()) {
      await createReferral(user.id, referralCode.trim().toUpperCase())
    }

    return NextResponse.json({
      success: true,
      message: 'Account created successfully! Please login.',
      data: { email: user.email },
    })
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
