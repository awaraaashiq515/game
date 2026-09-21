import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// ─── POST — Public: Brand application submit karna ──────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { brandName, contactName, email, phone, website, category, budget, message } = body

    if (!brandName || !contactName || !email || !category || !budget || !message) {
      return NextResponse.json({ success: false, error: 'Sab required fields fill karo.' }, { status: 400 })
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ success: false, error: 'Valid email address dalo.' }, { status: 400 })
    }

    const application = await prisma.brandApplication.create({
      data: {
        brandName: brandName.trim(),
        contactName: contactName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone?.trim() || null,
        website: website?.trim() || null,
        category,
        budget,
        message: message.trim(),
      },
    })

    return NextResponse.json({ success: true, data: { id: application.id } })
  } catch (err) {
    console.error('[brand-applications] POST error:', err)
    return NextResponse.json({ success: false, error: 'Server error. Dobara try karo.' }, { status: 500 })
  }
}

// ─── GET — Admin only: Sab applications fetch karna ─────────────────────────
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') // PENDING | APPROVED | REJECTED | null (all)

    const applications = await prisma.brandApplication.findMany({
      where: status ? { status: status as 'PENDING' | 'APPROVED' | 'REJECTED' } : undefined,
      orderBy: { submittedAt: 'desc' },
    })

    return NextResponse.json({ success: true, data: applications })
  } catch (err) {
    console.error('[brand-applications] GET error:', err)
    return NextResponse.json({ success: false, error: 'Server error.' }, { status: 500 })
  }
}

// ─── PATCH — Admin only: Application approve/reject karna ───────────────────
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { id, status, adminNote } = body

    if (!id || !status || !['APPROVED', 'REJECTED'].includes(status)) {
      return NextResponse.json({ success: false, error: 'Invalid request.' }, { status: 400 })
    }

    const updated = await prisma.brandApplication.update({
      where: { id },
      data: {
        status,
        adminNote: adminNote?.trim() || null,
        reviewedAt: new Date(),
      },
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (err) {
    console.error('[brand-applications] PATCH error:', err)
    return NextResponse.json({ success: false, error: 'Server error.' }, { status: 500 })
  }
}
