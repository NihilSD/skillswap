package com.skillswap.app.data

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

/**
 * Mirrors of the Postgres schema. These match lib/database.types.ts in the web
 * app one-for-one — including the deliberate absence of the Stripe columns,
 * which the anon and authenticated roles have no privilege to read.
 */

enum class Plan { free, premium }

enum class SwapStatus { pending, accepted, declined, completed }

@Serializable
data class Profile(
    val id: String,
    val name: String = "",
    @SerialName("avatar_emoji") val avatarEmoji: String = "🙂",
    val bio: String? = null,
    val plan: String = "free",
    @SerialName("created_at") val createdAt: String? = null,
) {
    val isPremium: Boolean get() = plan == "premium"

    companion object {
        /** Never select "*" on profiles — the billing columns are revoked. */
        const val COLUMNS = "id, name, avatar_emoji, bio, plan, created_at"
    }
}

@Serializable
data class SkillListing(
    val id: String? = null,
    @SerialName("user_id") val userId: String,
    val title: String,
    val category: String,
    val description: String = "",
    val active: Boolean = true,
    @SerialName("created_at") val createdAt: String? = null,
)

@Serializable
data class WantedSkill(
    val id: String? = null,
    @SerialName("user_id") val userId: String,
    val title: String,
    val category: String,
    @SerialName("created_at") val createdAt: String? = null,
)

@Serializable
data class SwapRequest(
    val id: String? = null,
    @SerialName("from_user_id") val fromUserId: String,
    @SerialName("to_user_id") val toUserId: String,
    @SerialName("offered_skill_listing_id") val offeredSkillListingId: String,
    val message: String? = null,
    val status: String = "pending",
    @SerialName("created_at") val createdAt: String? = null,
)

@Serializable
data class Message(
    val id: String? = null,
    @SerialName("sender_id") val senderId: String,
    @SerialName("receiver_id") val receiverId: String,
    val content: String,
    @SerialName("created_at") val createdAt: String? = null,
    @SerialName("read_at") val readAt: String? = null,
)

@Serializable
data class Rating(
    val id: String? = null,
    @SerialName("swap_request_id") val swapRequestId: String,
    @SerialName("rater_user_id") val raterUserId: String,
    @SerialName("rated_user_id") val ratedUserId: String,
    val score: Int,
    val comment: String? = null,
    @SerialName("created_at") val createdAt: String? = null,
)

/** Row returned by the discover_listings() function. */
@Serializable
data class DiscoverListing(
    val id: String,
    val title: String,
    val category: String,
    val description: String = "",
    @SerialName("created_at") val createdAt: String? = null,
    @SerialName("teacher_id") val teacherId: String,
    val name: String,
    @SerialName("avatar_emoji") val avatarEmoji: String,
    val bio: String? = null,
    @SerialName("match_score") val matchScore: Int = 0,
)

/** Row returned by get_leaderboard(). */
@Serializable
data class LeaderboardRow(
    val rank: Long,
    @SerialName("user_id") val userId: String,
    val name: String,
    @SerialName("avatar_emoji") val avatarEmoji: String,
    @SerialName("completed_swaps") val completedSwaps: Long,
    @SerialName("avg_rating") val avgRating: Double? = null,
    @SerialName("ratings_count") val ratingsCount: Long = 0,
    val skills: List<String> = emptyList(),
)

/** Row returned by get_plan_usage(). A null max means unlimited. */
@Serializable
data class PlanUsage(
    val plan: String,
    @SerialName("listings_used") val listingsUsed: Int,
    @SerialName("listings_max") val listingsMax: Int,
    @SerialName("active_listings_used") val activeListingsUsed: Int,
    @SerialName("active_listings_max") val activeListingsMax: Int,
    @SerialName("requests_today") val requestsToday: Int,
    @SerialName("requests_max") val requestsMax: Int,
    @SerialName("requests_reset_at") val requestsResetAt: String? = null,
    @SerialName("messages_today") val messagesToday: Int,
    @SerialName("messages_max") val messagesMax: Int? = null,
    @SerialName("messages_reset_at") val messagesResetAt: String? = null,
)
