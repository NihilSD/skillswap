import type { Metadata, Viewport } from 'next'
import { headers } from 'next/headers'
import { Inter, Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-display',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'SkillSwap — Trade what you know for what you want to learn',
  description:
    'SkillSwap is a marketplace for skill exchange. Teach what you are good at, learn what you are curious about, and swap directly with people near you.',
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f8fafc' },
    { media: '(prefers-color-scheme: dark)', color: '#080911' },
  ],
}

/** Applies the saved/system theme before paint so there is no flash. */
const themeScript = `
try {
  var s = localStorage.getItem('skillswap-theme');
  var d = s ? s === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  document.documentElement.classList.toggle('dark', d);
} catch (e) {}
`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Set per-request by middleware; required for the inline script below to run
  // under the Content-Security-Policy.
  const nonce = headers().get('x-nonce') ?? undefined

  return (
    <html lang="en" className={`${inter.variable} ${jakarta.variable}`} suppressHydrationWarning>
      <head>
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-dvh font-sans antialiased">{children}</body>
    </html>
  )
}
