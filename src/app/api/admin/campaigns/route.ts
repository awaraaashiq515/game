import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

async function requireAdmin(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'ADMIN') return null
  return session
}

export async function GET(request: NextRequest) {
  const session = await requireAdmin(request)
  if (!session) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') ?? ''

  try {
    const campaigns = await prisma.videoCampaign.findMany({
      where: status ? { status: status as 'ACTIVE' | 'PAUSED' | 'DRAFT' | 'ENDED' | 'ARCHIVED' } : {},
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      success: true,
      data: campaigns.map((c) => ({
        ...c,
        startDate: c.startDate?.toISOString() ?? null,
        endDate: c.endDate?.toISOString() ?? null,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
      })),
    })
  } catch (error) {
    console.error('Admin campaigns error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await requireAdmin(request)
  if (!session) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })

  try {
    const body = await request.json()
    const { name, sponsor, description, videoUrl, rewardAmount, watchDuration, dailyLimit, totalBudget, startDate, endDate, status } = body

    if (!name || !sponsor || !videoUrl || !totalBudget) {
      return NextResponse.json({ success: false, error: 'Required fields missing' }, { status: 400 })
    }

    const campaign = await prisma.videoCampaign.create({
      data: {
        name,
        sponsor,
        description,
        videoUrl,
        rewardAmount: parseFloat(rewardAmount) || 20,
        watchDuration: parseInt(watchDuration) || 30,
        dailyLimit: parseInt(dailyLimit) || 10,
        totalBudget: parseFloat(totalBudget),
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        status: status || 'DRAFT',
      },
    })

    return NextResponse.json({ success: true, data: campaign })
  } catch (error) {
    console.error('Create campaign error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const session = await requireAdmin(request)
  if (!session) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })

  try {
    const { id, ...updates } = await request.json()
    if (!id) return NextResponse.json({ success: false, error: 'Campaign ID required' }, { status: 400 })

    const campaign = await prisma.videoCampaign.update({
      where: { id },
      data: {
        ...updates,
        startDate: updates.startDate ? new Date(updates.startDate) : undefined,
        endDate: updates.endDate ? new Date(updates.endDate) : undefined,
      },
    })

    return NextResponse.json({ success: true, data: campaign })
  } catch (error) {
    console.error('Update campaign error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const session = await requireAdmin(request)
  if (!session) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ success: false, error: 'ID required' }, { status: 400 })

  try {
    await prisma.videoCampaign.update({
      where: { id },
      data: { status: 'ARCHIVED' },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Archive campaign error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
