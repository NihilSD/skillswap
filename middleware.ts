import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Builds a strict Content-Security-Policy for one request.
 *
 * Next injects its own inline hydration scripts, so a nonce is the only way to
 * get a real script-src without 'unsafe-inline'. Next picks the nonce up from
 * the request header automatically and stamps it on the scripts it emits; our
 * own inline theme script reads it in app/layout.tsx.
 *
 * connect-src has to name Supabase explicitly, including the wss:// origin the
 * Realtime socket uses, or messaging silently stops working.
 */
function buildCsp(nonce: string): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const supabaseWs = supabaseUrl.replace(/^http/, 'ws')
  const isDev = process.env.NODE_ENV === 'development'

  return [
    "default-src 'self'",
    // 'strict-dynamic' lets the nonced Next bootstrap load its own chunks.
    // In development Next needs eval for React Refresh.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ''}`,
    // Tailwind and next/font emit inline styles; there is no nonce path for
    // those, so styles keep 'unsafe-inline'. That is a far smaller risk than
    // inline script execution.
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob:",
    `connect-src 'self' ${supabaseUrl} ${supabaseWs} https://api.stripe.com`.trim(),
    "frame-src https://js.stripe.com https://hooks.stripe.com",
    "form-action 'self' https://checkout.stripe.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "object-src 'none'",
    'upgrade-insecure-requests',
  ].join('; ')
}

/**
 * Routes that require a signed-in user. Doing the check here keeps it in one
 * place rather than repeating it in every page's server component.
 */
const PROTECTED_PREFIXES = [
  '/profile',
  '/discover',
  '/matches',
  '/messages',
  '/leaderboard',
  '/pricing',
]

/**
 * Refreshes the Supabase auth session on every request so Server Components
 * always see a valid (non-expired) session cookie.
 */
export async function middleware(request: NextRequest) {
  // One nonce per request, handed to Next through the request headers.
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64')
  const csp = buildCsp(nonce)

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-nonce', nonce)
  requestHeaders.set('content-security-policy', csp)

  let response = NextResponse.next({ request: { headers: requestHeaders } })
  response.headers.set('content-security-policy', csp)

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({ request: { headers: requestHeaders } })
          response.headers.set('content-security-policy', csp)
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({ request: { headers: requestHeaders } })
          response.headers.set('content-security-policy', csp)
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  // Touching getUser() is what actually performs the refresh.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Signed-out users are bounced off the app to /signin, with the page they
  // were after preserved so we can send them back once they're in.
  if (!user && PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    const url = request.nextUrl.clone()
    url.pathname = '/signin'
    url.search = ''
    url.searchParams.set('next', pathname)
    const redirect = NextResponse.redirect(url)
    redirect.headers.set('content-security-policy', csp)
    return redirect
  }

  // Signed-in users have no business on the auth screens.
  if (user && (pathname === '/signin' || pathname === '/signup')) {
    const url = request.nextUrl.clone()
    url.pathname = '/discover'
    url.search = ''
    const redirect = NextResponse.redirect(url)
    redirect.headers.set('content-security-policy', csp)
    return redirect
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Run on every path except static assets and image files.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
