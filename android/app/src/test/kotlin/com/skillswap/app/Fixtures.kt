package com.skillswap.app

import com.skillswap.app.data.*

/** Fixture data for the screenshot tests — no network involved. */
object Fixtures {
    /**
     * Every timestamp here is a fixed instant.
     *
     * These fixtures previously used OffsetDateTime.now(), which made the
     * rendered dates change from one day to the next — the screenshots
     * recorded on one date could never match a verification run on another.
     * Screenshot tests have to be deterministic to be worth anything.
     */
    private const val CREATED_AT = "2026-08-14T10:00:00Z"
    val freeProfile = Profile(
        id = "me",
        name = "Mara Ellis",
        avatarEmoji = "🎸",
        bio = "Session guitarist, ten years of teaching beginners. Trying to finally cook something that is not pasta.",
        plan = "free",
    )

    val premiumProfile = freeProfile.copy(plan = "premium")

    val listings = listOf(
        DiscoverListing(
            id = "1", title = "Film photography", category = "Crafts",
            description = "Shooting and developing 35mm at home — we can do a roll together start to finish.",
            teacherId = "a", name = "Devon Park", avatarEmoji = "📷", matchScore = 2,
        ),
        DiscoverListing(
            id = "2", title = "Italian cooking", category = "Cooking",
            description = "Fresh pasta from scratch. Bring an apron, leave with dinner.",
            teacherId = "b", name = "Luca Rossi", avatarEmoji = "🍝", matchScore = 0,
        ),
        DiscoverListing(
            id = "3", title = "Conversational Japanese", category = "Languages",
            description = "Casual practice over coffee, absolute beginners welcome.",
            teacherId = "c", name = "Aiko Tanaka", avatarEmoji = "🍜", matchScore = 0,
        ),
        DiscoverListing(
            id = "4", title = "TypeScript & React", category = "Technology",
            description = "From hooks to state management, with a small project to build together.",
            teacherId = "d", name = "Sam Okafor", avatarEmoji = "🧑‍💻", matchScore = 1,
        ),
    )

    val myListings = listOf(
        SkillListing(
            id = "l1", userId = "me", title = "Fingerstyle guitar", category = "Music",
            description = "An hour a week, beginner friendly, bring your own guitar.", active = true,
        )
    )

    val wanted = listOf(
        WantedSkill(id = "w1", userId = "me", title = "Italian cooking", category = "Cooking"),
        WantedSkill(id = "w2", userId = "me", title = "Film photography", category = "Crafts"),
    )

    val freeUsage = PlanUsage(
        plan = "free",
        listingsUsed = 1, listingsMax = 1,
        activeListingsUsed = 1, activeListingsMax = 1,
        requestsToday = 1, requestsMax = 1,
        // Left null on purpose: a real reset timestamp renders a countdown
        // relative to the current time, which cannot be pixel-stable. The
        // countdown UI is covered by the message-limit shot, which passes a
        // fixed label straight in.
        requestsResetAt = null,
        messagesToday = 7, messagesMax = 10, messagesResetAt = null,
    )

    val leaderboard = listOf(
        LeaderboardRow(1, "a", "Luca Rossi", "🍝", 14, 4.9, 12, listOf("Italian cooking", "Espresso basics")),
        LeaderboardRow(2, "b", "Aiko Tanaka", "🍜", 11, 4.8, 10, listOf("Ramen from scratch", "Conversational Japanese")),
        LeaderboardRow(3, "c", "Devon Park", "📷", 9, 4.5, 8, listOf("Film photography")),
        LeaderboardRow(4, "me", "Mara Ellis", "🎸", 6, 4.7, 5, listOf("Fingerstyle guitar")),
        LeaderboardRow(5, "e", "Nina Berg", "🪴", 3, 4.0, 3, listOf("Urban gardening")),
        LeaderboardRow(6, "f", "Sam Okafor", "🧑‍💻", 1, null, 0, listOf("TypeScript & React")),
    )

    private fun ts(hour: Int, minute: Int) = "2026-08-14T%02d:%02d:00Z".format(hour, minute)

    val thread = listOf(
        Message("1", "a", "me", "Hey Mara! Happy to trade a pasta night for a guitar lesson.", ts(17, 30)),
        Message("2", "me", "a", "Yes please. I have been wanting to learn proper tagliatelle for ages.", ts(17, 42)),
        Message("3", "a", "me", "Bring nothing but an appetite. My kitchen, Thursday?", ts(17, 50)),
        Message("4", "me", "a", "Thursday works. I will bring the guitar and a spare pick for you.", ts(17, 56)),
        Message("5", "a", "me", "Perfect — Thursday at 7 then!", ts(18, 0)),
    )
}
