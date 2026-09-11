package com.skillswap.app.data.repo

import com.skillswap.app.data.*
import io.github.jan.supabase.postgrest.from
import io.github.jan.supabase.postgrest.postgrest
import io.github.jan.supabase.postgrest.query.Columns
import io.github.jan.supabase.postgrest.query.Order
import kotlinx.serialization.json.JsonNull
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put

/**
 * Thin wrappers over PostgREST. There is no business logic here on purpose —
 * the limits and access rules live in Postgres, so this layer only shapes
 * queries and lets database errors bubble up to be translated for the user.
 */

object ProfileRepository {
    suspend fun update(userId: String, name: String, avatarEmoji: String, bio: String?) {
        Supabase.client.from("profiles").update({
            set("name", name)
            set("avatar_emoji", avatarEmoji)
            set("bio", bio)
        }) {
            filter { eq("id", userId) }
        }
    }

    suspend fun planUsage(userId: String): PlanUsage? =
        Supabase.client.postgrest
            .rpc("get_plan_usage", buildJsonObject { put("p_user_id", userId) })
            .decodeList<PlanUsage>()
            .firstOrNull()
}

object SkillRepository {
    suspend fun listings(userId: String): List<SkillListing> =
        Supabase.client.from("skill_listings").select {
            filter { eq("user_id", userId) }
            order("created_at", Order.ASCENDING)
        }.decodeList()

    suspend fun addListing(listing: SkillListing) {
        Supabase.client.from("skill_listings").insert(listing)
    }

    suspend fun setActive(id: String, active: Boolean) {
        Supabase.client.from("skill_listings").update({ set("active", active) }) {
            filter { eq("id", id) }
        }
    }

    suspend fun deleteListing(id: String) {
        Supabase.client.from("skill_listings").delete { filter { eq("id", id) } }
    }

    suspend fun wanted(userId: String): List<WantedSkill> =
        Supabase.client.from("wanted_skills").select {
            filter { eq("user_id", userId) }
            order("created_at", Order.ASCENDING)
        }.decodeList()

    suspend fun addWanted(skill: WantedSkill) {
        Supabase.client.from("wanted_skills").insert(skill)
    }

    suspend fun deleteWanted(id: String) {
        Supabase.client.from("wanted_skills").delete { filter { eq("id", id) } }
    }
}

object DiscoverRepository {
    /**
     * The filter arguments are passed unconditionally — discover_listings()
     * drops them itself for free accounts, so this client cannot bypass the
     * gate any more than a crafted URL can on the web.
     */
    suspend fun listings(search: String?, category: String?, sort: String): List<DiscoverListing> =
        Supabase.client.postgrest.rpc(
            "discover_listings",
            buildJsonObject {
                if (search.isNullOrBlank()) put("p_search", JsonNull) else put("p_search", search)
                if (category.isNullOrBlank()) put("p_category", JsonNull) else put("p_category", category)
                put("p_sort", sort)
            },
        ).decodeList()
}

object SwapRepository {
    suspend fun send(request: SwapRequest) {
        Supabase.client.from("swap_requests").insert(request)
    }

    suspend fun forUser(userId: String): List<SwapRequest> =
        Supabase.client.from("swap_requests").select {
            filter { or { eq("from_user_id", userId); eq("to_user_id", userId) } }
            order("created_at", Order.DESCENDING)
        }.decodeList()

    suspend fun setStatus(id: String, status: String) {
        Supabase.client.from("swap_requests").update({ set("status", status) }) {
            filter { eq("id", id) }
        }
    }

    suspend fun resetAt(userId: String): String? =
        Supabase.client.postgrest
            .rpc("swap_request_reset_at", buildJsonObject { put("p_user_id", userId) })
            .decodeAsOrNull<String>()

    suspend fun profiles(ids: List<String>): List<Profile> {
        if (ids.isEmpty()) return emptyList()
        return Supabase.client.from("profiles")
            .select(Columns.raw(Profile.COLUMNS)) { filter { isIn("id", ids) } }
            .decodeList()
    }

    suspend fun listings(ids: List<String>): List<SkillListing> {
        if (ids.isEmpty()) return emptyList()
        return Supabase.client.from("skill_listings")
            .select { filter { isIn("id", ids) } }
            .decodeList()
    }

    suspend fun myRatedSwapIds(userId: String): Set<String> =
        Supabase.client.from("ratings")
            .select(Columns.raw("swap_request_id, rater_user_id, rated_user_id, score, id, comment, created_at")) {
                filter { eq("rater_user_id", userId) }
            }
            .decodeList<Rating>()
            .map { it.swapRequestId }
            .toSet()

    suspend fun rate(rating: Rating) {
        Supabase.client.from("ratings").insert(rating)
    }
}

object MessageRepository {
    /** RLS already limits this to threads the viewer is part of. */
    suspend fun all(): List<Message> =
        Supabase.client.from("messages").select {
            order("created_at", Order.ASCENDING)
        }.decodeList()

    suspend fun send(message: Message): Message =
        Supabase.client.from("messages").insert(message) { select() }.decodeSingle()

    suspend fun resetAt(userId: String): String? =
        Supabase.client.postgrest
            .rpc("message_reset_at", buildJsonObject { put("p_user_id", userId) })
            .decodeAsOrNull<String>()
}

object LeaderboardRepository {
    suspend fun top(limit: Int = 50): List<LeaderboardRow> =
        Supabase.client.postgrest
            .rpc("get_leaderboard", buildJsonObject { put("p_limit", limit) })
            .decodeList()

    suspend fun rankOf(userId: String): LeaderboardRow? =
        Supabase.client.postgrest
            .rpc("get_user_rank", buildJsonObject { put("p_user_id", userId) })
            .decodeList<UserRankRow>()
            .firstOrNull()
            ?.let {
                LeaderboardRow(
                    rank = it.rank,
                    userId = userId,
                    name = "",
                    avatarEmoji = "",
                    completedSwaps = it.completedSwaps,
                    avgRating = it.avgRating,
                    ratingsCount = it.ratingsCount,
                )
            }
}
