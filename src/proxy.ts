import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function proxy(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  const pathname = request.nextUrl.pathname

  // Admin routes require ADMIN role
  if (pathname.startsWith('/admin')) {
    if (!token || token.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  // User routes require authentication
  const userRoutes = [
    '/dashboard', '/earn', '/wallet', '/refer',
    '/leaderboard', '/history', '/withdraw',
    '/notifications', '/profile', '/support',
  ]
  if (userRoutes.some((r) => pathname.startsWith(r))) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    // Redirect admins away from user routes to admin panel
    if (token.role === 'ADMIN') {
      return NextResponse.redirect(new URL('/admin', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/earn/:path*',
    '/wallet/:path*',
    '/refer/:path*',
    '/leaderboard/:path*',
    '/history/:path*',
    '/withdraw/:path*',
    '/notifications/:path*',
    '/profile/:path*',
    '/support/:path*',
    '/admin/:path*',
  ],
}
