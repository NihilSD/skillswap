/**
 * Static security headers. The Content-Security-Policy is not here — it needs
 * a per-request nonce, so middleware.ts builds and attaches it.
 */
const securityHeaders = [
  // Clickjacking: nothing here should ever be framed. The full
  // Content-Security-Policy (including frame-ancestors) is set per request in
  // middleware.ts, because script-src needs a fresh nonce each time.
  { key: 'X-Frame-Options', value: 'DENY' },

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
