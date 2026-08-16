/**
 * Types for the SkillSwap Postgres schema.
 *
 * Regenerate against a live database with:
 *   npx supabase gen types typescript --local > lib/database.types.ts
 */

export type Plan = 'free' | 'premium'
export type SwapStatus = 'pending' | 'accepted' | 'declined' | 'completed'

export type Profile = {
  id: string
  name: string
  avatar_emoji: string
  bio: string | null
  plan: Plan
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  created_at: string
}

export type SkillListing = {
  id: string
  user_id: string
  title: string
  category: string
  description: string
  active: boolean
  created_at: string
}

export type WantedSkill = {
  id: string
  user_id: string
  title: string
  category: string
  created_at: string
}

export type SwapRequest = {
  id: string
  from_user_id: string
  to_user_id: string
  offered_skill_listing_id: string
  message: string | null
  status: SwapStatus
  created_at: string
}

export type Message = {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  created_at: string
  read_at: string | null
}

export type Rating = {
  id: string
  swap_request_id: string
  rater_user_id: string
  rated_user_id: string
  score: number
  comment: string | null
  created_at: string
}

type Row<T> = T
type Insert<T, Optional extends keyof T> = Omit<T, Optional> & Partial<Pick<T, Optional>>

/** A row returned by the discover_listings() Postgres function. */
export type DiscoverListing = {
  id: string
  title: string
  category: string
  description: string
  created_at: string
  teacher_id: string
  name: string
  avatar_emoji: string
  bio: string | null
  match_score: number
}

/** A row returned by get_plan_usage(). A null max means unlimited. */
export type PlanUsage = {
  plan: 'free' | 'premium'
  listings_used: number
  listings_max: number
  active_listings_used: number
  active_listings_max: number
  requests_today: number
  requests_max: number
  requests_reset_at: string | null
  messages_today: number
  messages_max: number | null
  messages_reset_at: string | null
}

/** A row returned by get_leaderboard(). */
export type LeaderboardRow = {
  rank: number
  user_id: string
  name: string
  avatar_emoji: string
  completed_swaps: number
  avg_rating: number | null
  ratings_count: number
  skills: string[]
}

/** A row returned by get_user_rank(). */
export type UserRank = {
  rank: number
  completed_swaps: number
  avg_rating: number | null
  ratings_count: number
}

/** supabase-js expects every table to declare its relationships. */
type Rel = []

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Row<Profile>
        Insert: Insert<Profile, 'name' | 'avatar_emoji' | 'bio' | 'plan' | 'stripe_customer_id' | 'stripe_subscription_id' | 'created_at'>
        Update: Partial<Profile>
        Relationships: Rel
      }
      skill_listings: {
        Row: Row<SkillListing>
        Insert: Insert<SkillListing, 'id' | 'description' | 'active' | 'created_at'>
        Update: Partial<SkillListing>
        Relationships: Rel
      }
      wanted_skills: {
        Row: Row<WantedSkill>
        Insert: Insert<WantedSkill, 'id' | 'created_at'>
        Update: Partial<WantedSkill>
        Relationships: Rel
      }
      swap_requests: {
        Row: Row<SwapRequest>
        Insert: Insert<SwapRequest, 'id' | 'message' | 'status' | 'created_at'>
        Update: Partial<SwapRequest>
        Relationships: Rel
      }
      messages: {
        Row: Row<Message>
        Insert: Insert<Message, 'id' | 'created_at' | 'read_at'>
        Update: Partial<Message>
        Relationships: Rel
      }
      ratings: {
        Row: Row<Rating>
        Insert: Insert<Rating, 'id' | 'comment' | 'created_at'>
        Update: Partial<Rating>
        Relationships: Rel
      }
    }
    Views: Record<string, never>
    Functions: {
      discover_listings: {
        Args: { p_search?: string | null; p_category?: string | null; p_sort?: string | null }
        Returns: DiscoverListing[]
      }
      swap_requests_sent_today: { Args: { p_user_id: string }; Returns: number }
      max_swap_requests_per_day: { Args: { p_user_id: string }; Returns: number }
      swap_request_reset_at: { Args: { p_user_id: string }; Returns: string | null }
      messages_sent_today: { Args: { p_user_id: string }; Returns: number }
      max_messages_per_day: { Args: { p_user_id: string }; Returns: number | null }
      message_reset_at: { Args: { p_user_id: string }; Returns: string | null }
      can_send_message: { Args: { p_user_id: string }; Returns: boolean }
      get_plan_usage: { Args: { p_user_id: string }; Returns: PlanUsage[] }
      get_leaderboard: { Args: { p_limit?: number }; Returns: LeaderboardRow[] }
      get_user_rank: { Args: { p_user_id: string }; Returns: UserRank[] }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
