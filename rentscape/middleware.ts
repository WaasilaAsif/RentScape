// import { createServerClient } from '@supabase/ssr' // Supabase helper for server-side auth with cookie support
// import { NextResponse, type NextRequest } from 'next/server' // Next.js middleware request/response utilities
// import {createMiddlewareClient} from '@supabase/auth-middleware' // Supabase helper to create auth middleware (optional, not used here)
// export async function proxy(request: NextRequest) {
//   // Create a default response object that allows the request to continue
//   // This is also used later to attach updated cookies from Supabase
//   let response = NextResponse.next({ request })

//   // Initialize Supabase server client for middleware
//   // Uses request/response cookies instead of next/headers (middleware runs at edge)
//   const supabase = createServerClient(
//     process.env.NEXT_PUBLIC_SUPABASE_URL!, // Supabase project URL (public env variable)
//     process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, // Supabase anon key (safe for client/server use)
//     {
//       cookies: {
//         // Read all cookies from incoming request (used for auth session)
//         getAll() {
//           return request.cookies.getAll()
//         },

//         // Set cookies on both request and response
//         // Required so Supabase can persist session updates (refresh tokens, etc.)
//         setAll(cookiesToSet) {
//           cookiesToSet.forEach(({ name, value }) =>
//             request.cookies.set(name, value) // update request cookies
//           )
//           response = NextResponse.next({ request }) // recreate response to attach updated cookies
//           cookiesToSet.forEach(({ name, value, options }) =>
//             response.cookies.set(name, value, options) // persist cookies in response
//           )
//         },
//       },
//     }
//   )

//   // Fetch authenticated user from Supabase Auth server (validated, not just local session)
//   const { data: { user } } = await supabase.auth.getUser()

//   // Extract current route path (e.g., /tenant/dashboard)
//   const { pathname } = request.nextUrl

//   // 1. If user is NOT logged in AND trying to access protected routes (/tenant or /landlord)
//   // → redirect them to login page
//   if (!user && (pathname.startsWith('/landlord') || pathname.startsWith('/tenant'))) {
//     return NextResponse.redirect(new URL('/login', request.url)) // construct absolute URL using current request
//   }

//   // 2. If user is logged in → enforce role-based access
//   if (user) {
//     // Fetch user's role from profiles table (RLS ensures they only access their own profile)
//     const { data: profile } = await supabase
//       .from('profiles')
//       .select('role')
//       .eq('id', user.id)
//       .single()

//     const role = profile?.role // extract role (tenant, landlord, admin, etc.)

//     // If a tenant tries to access landlord routes → redirect to tenant dashboard
//     if (role === 'tenant' && pathname.startsWith('/landlord')) {
//       return NextResponse.redirect(new URL('/tenant/dashboard', request.url))
//     }

//     // If a landlord tries to access tenant routes → redirect to landlord dashboard
//     if (role === 'landlord' && pathname.startsWith('/tenant')) {
//       return NextResponse.redirect(new URL('/landlord/dashboard', request.url))
//     }

//     // Admin or undefined role:
//     // No restriction applied here → request proceeds normally
//   }

//   // If none of the conditions triggered → allow request to continue
//   // Response may include updated auth cookies from Supabase
//   return response
// }

// // Proxy configuration: defines which routes this proxy runs on
// // Only applies to landlord and tenant sections (not global, not /login)
// export const config = {
//   matcher: ['/landlord/:path*', '/tenant/:path*'], // wildcard matches all nested routes
// }

// middleware.ts (at project root)

import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: Record<string, unknown>) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options :  Record<string, unknown>) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Get session
  const { data: { session } } = await supabase.auth.getSession()

  const path = request.nextUrl.pathname

  // ========================================
  // Public routes (allow everyone)
  // ========================================
  const publicRoutes = [
    '/login',
    '/signup',
    '/',
    '/_next',
    '/favicon.ico'
  ]

  const isPublicRoute = publicRoutes.some(route => path.startsWith(route))
  
  // Always allow public routes
  if (isPublicRoute) {
    return response
  }

  // Special handling for /api/properties (GET is public, POST/PUT require auth)
  if (path.startsWith('/api/properties')) {
    if (request.method === 'GET') {
      return response // Public browse
    }
    // POST/PUT fall through to auth check below
  }

  // ========================================
  // Protected routes (require login)
  // ========================================
  
  if (!session) {
    if (path.startsWith('/api/')) {
      // API routes return 401
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    } else {
      // Pages redirect to login
      const redirectUrl = new URL('/login', request.url)
      redirectUrl.searchParams.set('redirect', path)
      return NextResponse.redirect(redirectUrl)
    }
  }

  // Get user role from JWT
  const userRole = session.user.app_metadata?.role || session.user.user_metadata?.role

  // ========================================
  // Landlord-only routes
  // ========================================
  const landlordRoutes = ['/landlord']

  const isLandlordRoute = landlordRoutes.some(route => path.startsWith(route))

  if (isLandlordRoute && userRole !== 'landlord') {
    if (path.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Forbidden - Landlord access required' },
        { status: 403 }
      )
    } else {
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }
  }

  // ========================================
  // Tenant-only routes
  // ========================================
  const tenantRoutes = ['/tenant']

  const isTenantRoute = tenantRoutes.some(route => path.startsWith(route))

  if (isTenantRoute && userRole !== 'tenant') {
    if (path.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Forbidden - Tenant access required' },
        { status: 403 }
      )
    } else {
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }
  }

  return response
}


export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images, svgs, etc.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'
  ]
}