/**
 * Next.js Middleware
 * Protects routes and handles authentication
 */

import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    // Allow request to continue
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ req, token }) => {
        // Public paths that don't require auth
        const publicPaths = [
          '/auth/signin',
          '/auth/signout',
          '/auth/error',
          '/api/auth',
        ]

        const path = req.nextUrl.pathname

        // Allow public paths
        if (publicPaths.some(p => path.startsWith(p))) {
          return true
        }

        // Require authentication for all other paths
        return !!token
      },
    },
  }
)

// Configure which routes to protect
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}
