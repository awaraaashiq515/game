import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { isValidEmail } from '@/lib/utils'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'ADMIN') return null
  return session
}

// GET /api/admin/users — list users with filters
export async function GET(request: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search') ?? ''
  const status = searchParams.get('status') ?? ''
  const page = parseInt(searchParams.get('page') ?? '1')
  const limit = 50

  try {
    const where = {
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' as const } },
              { email: { contains: search, mode: 'insensitive' as const } },
              { mobile: { contains: search } },
              { referralCode: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
      ...(status ? { status: status as 'ACTIVE' | 'SUSPENDED' | 'UNDER_REVIEW' | 'DELETED' } : {}),
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          mobile: true,
          status: true,
          createdAt: true,
          lastLoginAt: true,
          referralCode: true,
          wallet: {
            select: {
              totalEarned: true,
              availableBalance: true,
              totalWithdrawn: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        users: users.map((u) => ({
          ...u,
          createdAt: u.createdAt.toISOString(),
          lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
        })),
        total,
        page,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Admin users GET error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/admin/users — edit user details (name, email, mobile, status, password, balance)
export async function PUT(request: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })

  try {
    const body = await request.json()
    const { userId, name, email, mobile, status, password, availableBalance } = body

    if (!userId) {
      return NextResponse.json({ success: false, error: 'userId is required' }, { status: 400 })
    }

    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { wallet: true },
    })

    if (!existingUser) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    // Validation
    const trimmedName = typeof name === 'string' ? name.trim() : existingUser.name
    if (!trimmedName) {
      return NextResponse.json({ success: false, error: 'Name cannot be empty' }, { status: 400 })
    }

    const trimmedEmail = typeof email === 'string' ? email.trim().toLowerCase() : existingUser.email
    if (!isValidEmail(trimmedEmail)) {
      return NextResponse.json({ success: false, error: 'Invalid email address' }, { status: 400 })
    }

    // Check if new email is taken by another user
    if (trimmedEmail !== existingUser.email) {
      const emailConflict = await prisma.user.findUnique({ where: { email: trimmedEmail } })
      if (emailConflict && emailConflict.id !== userId) {
        return NextResponse.json({ success: false, error: 'Email is already taken by another user' }, { status: 400 })
      }
    }

    // Check mobile if provided
    const trimmedMobile = typeof mobile === 'string' && mobile.trim() ? mobile.trim() : null
    if (trimmedMobile && trimmedMobile !== existingUser.mobile) {
      const mobileConflict = await prisma.user.findUnique({ where: { mobile: trimmedMobile } })
      if (mobileConflict && mobileConflict.id !== userId) {
        return NextResponse.json({ success: false, error: 'Mobile number is already registered to another user' }, { status: 400 })
      }
    }

    // Check status
    const allowedStatuses = ['ACTIVE', 'SUSPENDED', 'UNDER_REVIEW', 'DELETED']
    const newStatus = status && allowedStatuses.includes(status) ? status : existingUser.status

    // Prepare update data
    const updateData: {
      name: string
      email: string
      mobile: string | null
      status: 'ACTIVE' | 'SUSPENDED' | 'UNDER_REVIEW' | 'DELETED'
      passwordHash?: string
    } = {
      name: trimmedName,
      email: trimmedEmail,
      mobile: trimmedMobile,
      status: newStatus as 'ACTIVE' | 'SUSPENDED' | 'UNDER_REVIEW' | 'DELETED',
    }

    // Password reset if provided
    if (typeof password === 'string' && password.trim().length >= 6) {
      updateData.passwordHash = await bcrypt.hash(password.trim(), 12)
    }

    // Execute update
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        mobile: true,
        status: true,
        updatedAt: true,
      },
    })

    // Update wallet balance if specified
    if (typeof availableBalance === 'number' && !isNaN(availableBalance) && availableBalance >= 0) {
      const currentBalance = existingUser.wallet?.availableBalance ?? 0
      const diff = availableBalance - currentBalance

      if (existingUser.wallet) {
        await prisma.wallet.update({
          where: { userId },
          data: { availableBalance },
        })

        if (diff !== 0) {
          await prisma.walletTransaction.create({
            data: {
              walletId: existingUser.wallet.id,
              amount: diff,
              type: 'ADJUSTMENT',
              status: 'COMPLETED',
              description: `Admin manual adjustment (${diff > 0 ? '+' : ''}${diff})`,
              reference: `admin-edit-${Date.now()}`,
            },
          })
        }
      } else {
        const newWallet = await prisma.wallet.create({
          data: {
            userId,
            availableBalance,
            totalEarned: availableBalance,
          },
        })

        await prisma.walletTransaction.create({
          data: {
            walletId: newWallet.id,
            amount: availableBalance,
            type: 'ADJUSTMENT',
            status: 'COMPLETED',
            description: 'Initial wallet balance set by Admin',
            reference: `admin-edit-${Date.now()}`,
          },
        })
      }
    }

    // Log admin action
    const admin = await prisma.adminUser.findUnique({ where: { email: session.user.email } })
    if (admin) {
      await prisma.adminActionLog.create({
        data: {
          adminId: admin.id,
          targetUserId: userId,
          action: 'USER_EDIT',
          description: `Updated user profile (${trimmedEmail})`,
        },
      })
    }

    return NextResponse.json({
      success: true,
      data: updatedUser,
      message: 'User updated successfully',
    })
  } catch (error) {
    console.error('Admin user edit error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/admin/users — update user status (quick actions: suspend, restore, review)
export async function PATCH(request: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })

  try {
    const { userId, action } = await request.json()

    const statusMap: Record<string, 'ACTIVE' | 'SUSPENDED' | 'UNDER_REVIEW' | 'DELETED'> = {
      suspend: 'SUSPENDED',
      restore: 'ACTIVE',
      review: 'UNDER_REVIEW',
      delete: 'DELETED',
    }

    if (!statusMap[action]) {
      return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })
    }

    await prisma.user.update({
      where: { id: userId },
      data: { status: statusMap[action] },
    })

    // Log admin action
    const admin = await prisma.adminUser.findUnique({ where: { email: session.user.email } })
    if (admin) {
      await prisma.adminActionLog.create({
        data: {
          adminId: admin.id,
          targetUserId: userId,
          action: `USER_${action.toUpperCase()}`,
          description: `User status changed to ${statusMap[action]}`,
        },
      })
    }

    return NextResponse.json({ success: true, message: `User marked as ${statusMap[action]}` })
  } catch (error) {
    console.error('Admin user update error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/admin/users — permanently or soft delete a user
export async function DELETE(request: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })

  try {
    let userId: string | null = null
    let mode: 'permanent' | 'soft' = 'permanent'

    const { searchParams } = new URL(request.url)
    const paramId = searchParams.get('userId')
    const paramMode = searchParams.get('mode')

    if (paramId) {
      userId = paramId
      if (paramMode === 'soft') mode = 'soft'
    } else {
      const body = await request.json().catch(() => ({}))
      userId = body.userId ?? null
      if (body.mode === 'soft') mode = 'soft'
    }

    if (!userId) {
      return NextResponse.json({ success: false, error: 'userId is required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true },
    })

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    const admin = await prisma.adminUser.findUnique({ where: { email: session.user.email } })

    if (mode === 'soft') {
      // Soft delete: update status to DELETED
      await prisma.user.update({
        where: { id: userId },
        data: { status: 'DELETED' },
      })

      if (admin) {
        await prisma.adminActionLog.create({
          data: {
            adminId: admin.id,
            targetUserId: userId,
            action: 'USER_SOFT_DELETE',
            description: `Soft deleted user (${user.email})`,
          },
        })
      }

      return NextResponse.json({
        success: true,
        message: `User ${user.name} has been soft deleted`,
      })
    }

    // Permanent delete: cascading cleanup in transaction
    await prisma.$transaction(async (tx) => {
      // 1. Delete Wallet transactions and Wallet
      const wallet = await tx.wallet.findUnique({ where: { userId } })
      if (wallet) {
        await tx.walletTransaction.deleteMany({ where: { walletId: wallet.id } })
        await tx.wallet.delete({ where: { id: wallet.id } })
      }

      // 2. Referrals & Referral Rewards
      const referrals = await tx.referral.findMany({
        where: { OR: [{ referrerId: userId }, { refereeId: userId }] },
        select: { id: true },
      })
      const referralIds = referrals.map((r) => r.id)
      if (referralIds.length > 0) {
        await tx.referralReward.deleteMany({ where: { referralId: { in: referralIds } } })
        await tx.referral.deleteMany({ where: { id: { in: referralIds } } })
      }

      // 3. Video sessions and completions
      await tx.videoWatchSession.deleteMany({ where: { userId } })
      await tx.videoCompletion.deleteMany({ where: { userId } })

      // 4. Financial requests and logs
      await tx.withdrawal.deleteMany({ where: { userId } })
      await tx.depositRequest.deleteMany({ where: { userId } })
      await tx.fraudEvent.deleteMany({ where: { userId } })
      await tx.notification.deleteMany({ where: { userId } })

      // 5. Clear relations on other models
      await tx.user.updateMany({
        where: { referredById: userId },
        data: { referredById: null },
      })

      // 6. Set targetUserId to null in AdminActionLog to maintain audit integrity
      await tx.adminActionLog.updateMany({
        where: { targetUserId: userId },
        data: { targetUserId: null },
      })

      // 7. Delete the User record
      await tx.user.delete({ where: { id: userId } })

      // 8. Log deletion
      if (admin) {
        await tx.adminActionLog.create({
          data: {
            adminId: admin.id,
            action: 'USER_PERMANENT_DELETE',
            description: `Permanently deleted user: ${user.name} (${user.email})`,
          },
        })
      }
    })

    return NextResponse.json({
      success: true,
      message: `User ${user.name} permanently deleted`,
    })
  } catch (error) {
    console.error('Admin user delete error:', error)
    return NextResponse.json({ success: false, error: 'Failed to delete user' }, { status: 500 })
  }
}
