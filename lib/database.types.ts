/**
 * Types for the SkillSwap Postgres schema.
 *
 * Regenerate against a live database with:
 *   npx supabase gen types typescript --local > lib/database.types.ts
 */

export type Plan = 'free' | 'premium'
export type SwapStatus = 'pending' | 'accepted' | 'declined' | 'completed'

export interface Profile {
  id: string
  name: string
  avatar_emoji: string
  bio: string | null
  plan: Plan
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  created_at: string
}

export interface SkillListing {
  id: string
  user_id: string
  title: string
  category: string
  description: string
  active: boolean
  created_at: string
}

export interface WantedSkill {
  id: string
  user_id: string
  title: string
  category: string
  created_at: string
}

export interface SwapRequest {
  id: string
  from_user_id: string
  to_user_id: string
  offered_skill_listing_id: string
  message: string | null
  status: SwapStatus
  created_at: string
}

export interface Message {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  created_at: string
  read_at: string | null
}

export interface Rating {
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

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Row<Profile>
        Insert: Insert<Profile, 'name' | 'avatar_emoji' | 'bio' | 'plan' | 'stripe_customer_id' | 'stripe_subscription_id' | 'created_at'>
        Update: Partial<Profile>
      }
      skill_listings: {
        Row: Row<SkillListing>
        Insert: Insert<SkillListing, 'id' | 'description' | 'active' | 'created_at'>
        Update: Partial<SkillListing>
      }
      wanted_skills: {
        Row: Row<WantedSkill>
        Insert: Insert<WantedSkill, 'id' | 'created_at'>
        Update: Partial<WantedSkill>
      }
      swap_requests: {
        Row: Row<SwapRequest>
        Insert: Insert<SwapRequest, 'id' | 'message' | 'status' | 'created_at'>
        Update: Partial<SwapRequest>
      }
      messages: {
        Row: Row<Message>
        Insert: Insert<Message, 'id' | 'created_at' | 'read_at'>
        Update: Partial<Message>
      }
      ratings: {
        Row: Row<Rating>
        Insert: Insert<Rating, 'id' | 'comment' | 'created_at'>
        Update: Partial<Rating>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
