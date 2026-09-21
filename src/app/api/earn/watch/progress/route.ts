import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { sessionId, watchedSeconds } = await request.json()
    const userId = session.user.id

    const watchSession = await prisma.videoWatchSession.findUnique({
      where: { id: sessionId },
    })

    if (!watchSession || watchSession.userId !== userId) {
      return NextResponse.json({ success: false, error: 'Invalid session' }, { status: 400 })
    }

    if (watchSession.status === 'COMPLETED' || watchSession.status === 'FLAGGED') {
      return NextResponse.json({ success: false, error: 'Session already ended' }, { status: 400 })
    }

    // Update progress
    await prisma.videoWatchSession.update({
      where: { id: sessionId },
      data: {
        watchedSeconds: Math.max(watchSession.watchedSeconds, watchedSeconds ?? 0),
        heartbeatAt: new Date(),
        status: 'IN_PROGRESS',
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Watch progress error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
