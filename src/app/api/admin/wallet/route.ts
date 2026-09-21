import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { getAdminWallet, adminAddFunds } from '@/lib/adminWallet'

async function requireAdmin(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'ADMIN') return null
  return session
}

// GET — fetch admin master wallet stats + recent transactions
export async function GET(request: NextRequest) {
  const session = await requireAdmin(request)
  if (!session) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })

  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') ?? '1')
    const limit = 20

    const [wallet, transactions, totalTxCount] = await Promise.all([
      getAdminWallet(),
      prisma.adminWalletTransaction.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.adminWalletTransaction.count(),
    ])

    return NextResponse.json({
      success: true,
      data: {
        wallet: {
          totalFundsAdded: wallet.totalFundsAdded,
          totalDistributed: wallet.totalDistributed,
          totalWithdrawnByUsers: wallet.totalWithdrawnByUsers,
          availablePool: wallet.availablePool,
        },
        transactions: transactions.map((t) => ({
          id: t.id,
          type: t.type,
          amount: t.amount,
          description: t.description,
          reference: t.reference,
          createdAt: t.createdAt.toISOString(),
        })),
        page,
        hasMore: page * limit < totalTxCount,
        total: totalTxCount,
      },
    })
  } catch (error) {
    console.error('Admin wallet GET error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

// POST — admin manually adds funds to the master pool
export async function POST(request: NextRequest) {
  const session = await requireAdmin(request)
  if (!session) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })

  try {
    const { amount, description } = await request.json()

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json({ success: false, error: 'Invalid amount' }, { status: 400 })
    }

    const updated = await adminAddFunds(amount, description ?? 'Manual fund addition by admin')

    return NextResponse.json({
      success: true,
      data: {
        availablePool: updated.availablePool,
        totalFundsAdded: updated.totalFundsAdded,
      },
    })
  } catch (error) {
    console.error('Admin wallet POST error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
