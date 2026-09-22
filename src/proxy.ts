import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

const SECRET_PREFIX = '/M4ster@305'

export async function proxy(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  const rawPath = request.nextUrl.pathname
  const decodedPath = decodeURIComponent(rawPath)

  // ── Secret Admin Routes: /M4ster@305/... ─────────────────────────────────────
  if (decodedPath.startsWith(SECRET_PREFIX) || rawPath.startsWith('/M4ster%40305')) {
    const isLoginPath =
      decodedPath === SECRET_PREFIX ||
      decodedPath === `${SECRET_PREFIX}/` ||
      decodedPath === `${SECRET_PREFIX}/login`

    if (isLoginPath) {
      if (token && token.role === 'ADMIN') {
        return NextResponse.redirect(new URL(`${SECRET_PREFIX}/admin`, request.url))
      }
      const url = request.nextUrl.clone()
      url.pathname = '/secret-admin-login'
      return NextResponse.rewrite(url)
    }

    if (decodedPath.startsWith(`${SECRET_PREFIX}/admin`)) {
      if (!token || token.role !== 'ADMIN') {
        return NextResponse.redirect(new URL(`${SECRET_PREFIX}/login`, request.url))
      }
      // Rewrite /M4ster@305/admin/... to internal /admin/...
      const internalAdminPath = decodedPath.replace(SECRET_PREFIX, '')
      const url = request.nextUrl.clone()
      url.pathname = internalAdminPath
      return NextResponse.rewrite(url)
    }
  }

  // ── Public /admin route access attempt without secret URL ──────────────────
  if (rawPath.startsWith('/admin')) {
    if (!token || token.role !== 'ADMIN') {
      // Hide admin completely from outsiders — redirect to home
      return NextResponse.redirect(new URL('/', request.url))
    }
    // If logged in as admin, redirect to the secret URL
    return NextResponse.redirect(new URL(`${SECRET_PREFIX}${rawPath}`, request.url))
  }

  // ── User routes require authentication ──────────────────────────────────────
  const userRoutes = [
    '/dashboard', '/earn', '/wallet', '/refer',
    '/leaderboard', '/history', '/withdraw',
    '/notifications', '/profile', '/support',
  ]
  if (userRoutes.some((r) => rawPath.startsWith(r))) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    // Redirect admins away from user routes to admin panel
    if (token.role === 'ADMIN') {
      return NextResponse.redirect(new URL(`${SECRET_PREFIX}/admin`, request.url))
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
    '/admin',
    '/M4ster@305/:path*',
    '/M4ster@305',
    '/M4ster%40305/:path*',
    '/M4ster%40305',
  ],
}
