import { Navbar } from '@/components/nav/navbar'
import { requireProfile } from '@/lib/auth'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireProfile()

  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar name={profile.name} avatarEmoji={profile.avatar_emoji} plan={profile.plan} />
      <main className="flex-1 pb-20 pt-8 sm:pt-10">{children}</main>
    </div>
  )
}
