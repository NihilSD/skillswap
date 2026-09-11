import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'
import nextTypeScript from 'eslint-config-next/typescript'

// ESLint 9 flat config. eslint-config-next ships native flat arrays as of
// Next 16, so no FlatCompat bridge is needed.
const config = [
  {
    ignores: ['.next/**', 'node_modules/**', 'android/**', 'supabase/**', 'next-env.d.ts'],
  },
  ...nextCoreWebVitals,
  ...nextTypeScript,
]

export default config
