import type { Metadata } from 'next'
import { PageHeader } from '@/components/page-header'
import { EmptyState } from '@/components/empty-state'
import { FilterBar } from '@/components/discover/filter-bar'
import { ListingCard } from '@/components/discover/listing-card'
import { requireProfile } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { CATEGORIES } from '@/lib/categories'
import type { DiscoverListing } from '@/lib/database.types'

export const metadata: Metadata = { title: 'Discover · SkillSwap' }

type SearchParams = { q?: string; category?: string; sort?: string }

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const { profile } = await requireProfile()
  const supabase = await createClient()
  const premium = profile.plan === 'premium'

  const category =
    params.category && CATEGORIES.includes(params.category as never)
      ? params.category
      : null
  const sort = params.sort === 'match' ? 'match' : 'newest'
  const q = params.q?.trim() || null

  // The filter gate lives inside discover_listings(): it reads the caller's
  // plan and drops these arguments for free users. Passing them through
  // unconditionally is safe, and means a hand-crafted URL behaves exactly the
  // same as the UI does.
  const { data, error } = await supabase.rpc('discover_listings', {
    p_search: q,
    p_category: category,
    p_sort: sort,
  })

  const listings = (data ?? []) as DiscoverListing[]
  const filtering = premium && (q || category || sort === 'match')

  return (
    <div className="container-page space-y-6">
      <PageHeader
        title="Discover"
        subtitle="People offering to teach — find someone with what you want to learn."
      />

      <FilterBar plan={profile.plan} q={q ?? ''} category={category ?? ''} sort={sort} />

      {error ? (
        <EmptyState
          emoji="⚠️"
          title="Could not load the marketplace"
          body="Something went wrong fetching listings. Refresh to try again."
        />
      ) : listings.length === 0 ? (
        <EmptyState
          emoji={filtering ? '🔎' : '🌱'}
          title={filtering ? 'No skills match those filters' : 'No one else is teaching yet'}
          body={
            filtering
              ? 'Try a broader keyword, or clear the category filter.'
              : 'You are early. Add a skill on your profile so people find you when they arrive.'
          }
        />
      ) : (
        <>
          <p className="text-sm text-muted">
            {listings.length} {listings.length === 1 ? 'skill' : 'skills'} available
            {sort === 'match' && premium && ' · sorted by best match for you'}
          </p>

          <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {listings.map((listing) => (
              <li key={listing.id}>
                <ListingCard
                  listing={listing}
                  showMatch={premium && sort === 'match'}
                  viewerId={profile.id}
                  plan={profile.plan}
                />
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
