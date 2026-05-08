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
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Use getUser() not getSession() — validated server-side
  const { data: { user } } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname

  const publicRoutes = ['/login', '/signup', '/', '/_next', '/favicon.ico','form']
  const isPublicRoute = publicRoutes.some(route => path.startsWith(route))

  if (isPublicRoute) return response

  if (path.startsWith('/api/properties') && request.method === 'GET') {
    return response
  }

  if (!user) {
    if (path.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('redirect', path)
    return NextResponse.redirect(redirectUrl)
  }

  const userRole = user.app_metadata?.role || user.user_metadata?.role

  if (path.startsWith('/landlord') && userRole !== 'landlord') {
    return path.startsWith('/api/')
      ? NextResponse.json({ error: 'Forbidden - Landlord access required' }, { status: 403 })
      : NextResponse.redirect(new URL('/unauthorized', request.url))
  }

  if (path.startsWith('/tenant') && userRole !== 'tenant') {
    return path.startsWith('/api/')
      ? NextResponse.json({ error: 'Forbidden - Tenant access required' }, { status: 403 })
      : NextResponse.redirect(new URL('/unauthorized', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'
  ]
}