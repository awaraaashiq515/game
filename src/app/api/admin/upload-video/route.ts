import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

// Max file size: 500MB
const MAX_SIZE_BYTES = 500 * 1024 * 1024

// Allowed video MIME types
const ALLOWED_TYPES = [
  'video/mp4',
  'video/webm',
  'video/ogg',
  'video/quicktime', // .mov
  'video/x-msvideo', // .avi
]

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('video') as File | null

    if (!file) {
      return NextResponse.json({ success: false, error: 'Koi file nahi mili.' }, { status: 400 })
    }

    // Validate type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: `File type "${file.type}" allowed nahi hai. MP4, WebM, MOV upload karo.` },
        { status: 400 }
      )
    }

    // Validate size
    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { success: false, error: 'File bahut badi hai. Maximum 500MB allowed hai.' },
        { status: 400 }
      )
    }

    // Ensure upload directory exists
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'videos')
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // Generate unique filename
    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'mp4'
    const timestamp = Date.now()
    const random = Math.random().toString(36).slice(2, 8)
    const filename = `video_${timestamp}_${random}.${ext}`
    const filePath = path.join(uploadDir, filename)

    // Write file
    const bytes = await file.arrayBuffer()
    await writeFile(filePath, Buffer.from(bytes))

    // Return public URL
    const publicUrl = `/uploads/videos/${filename}`

    return NextResponse.json({
      success: true,
      data: {
        url: publicUrl,
        filename,
        size: file.size,
        type: file.type,
      },
    })
  } catch (err) {
    console.error('[upload-video] error:', err)
    return NextResponse.json({ success: false, error: 'Upload fail ho gaya. Dobara try karo.' }, { status: 500 })
  }
}
