import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// GET — user fetches their own deposit request history
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const deposits = await prisma.depositRequest.findMany({
      where: { userId: session.user.id },
      orderBy: { requestedAt: 'desc' },
      take: 50,
    })

    return NextResponse.json({
      success: true,
      data: {
        deposits: deposits.map(d => ({
          id: d.id,
          amount: d.amount,
          status: d.status,
          adminNote: d.adminNote,
          requestedAt: d.requestedAt.toISOString(),
          processedAt: d.processedAt?.toISOString() ?? null,
        })),
      },
    })
  } catch (error) {
    console.error('Deposit GET error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

// POST — user submits a new add-money request
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { amount, note } = await request.json()
    const userId = session.user.id

    if (!amount || typeof amount !== 'number' || amount < 10) {
      return NextResponse.json({ success: false, error: 'Minimum amount is ₹10' }, { status: 400 })
    }
    if (amount > 100000) {
      return NextResponse.json({ success: false, error: 'Maximum amount is ₹1,00,000' }, { status: 400 })
    }

    // Check if user already has a pending request
    const pending = await prisma.depositRequest.findFirst({
      where: { userId, status: 'PENDING' },
    })
    if (pending) {
      return NextResponse.json(
        { success: false, error: 'You already have a pending add money request. Please wait for it to be processed.' },
        { status: 400 }
      )
    }

    const deposit = await prisma.depositRequest.create({
      data: {
        userId,
        amount,
        utrNumber: `REQ-${Date.now()}`, // internal reference
        status: 'PENDING',
        adminNote: note || null,
      },
    })

    // Notify user
    await prisma.notification.create({
      data: {
        userId,
        category: 'ACCOUNT',
        title: '💰 Add Money Request Submitted',
        message: `Your request to add ₹${amount} has been submitted and is under review.`,
        metadata: { depositId: deposit.id, amount } as object,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        id: deposit.id,
        amount: deposit.amount,
        status: deposit.status,
        message: 'Request submitted successfully. Admin will credit your wallet soon.',
      },
    })
  } catch (error) {
    console.error('Deposit POST error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
