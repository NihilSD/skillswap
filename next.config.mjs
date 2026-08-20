/**
 * Security headers.
 *
 * A full Content-Security-Policy needs a per-request nonce (Next injects
 * inline hydration scripts), which means generating one in middleware and
 * threading it through the document — worth doing, but it is a behavioural
 * change that needs testing against a live Supabase, so it is tracked as a
 * follow-up rather than switched on blind. Everything below is safe today.
 */
const securityHeaders = [
  // Clickjacking: nothing here should ever be framed.
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Content-Security-Policy', value: "frame-ancestors 'none'" },

  // Stop the browser second-guessing declared content types.
  { key: 'X-Content-Type-Options', value: 'nosniff' },

  // Do not leak full URLs (which can carry ids) to third-party sites.
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },

  // No page in this app needs these devices.
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()',
  },

  // HTTPS only, once the domain is live.
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },

  { key: 'X-DNS-Prefetch-Control', value: 'off' },
]

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Do not advertise the framework version to scanners.
  poweredByHeader: false,

  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }]
  },
}

export default nextConfig
