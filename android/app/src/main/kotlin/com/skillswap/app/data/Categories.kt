package com.skillswap.app.data

/** Mirrors lib/categories.ts so both clients offer the same taxonomy. */
val CATEGORIES = listOf(
    "Music", "Cooking", "Languages", "Technology", "Design",
    "Fitness", "Crafts", "Business", "Academics", "Outdoors", "Other",
)

val CATEGORY_EMOJI = mapOf(
    "Music" to "🎵",
    "Cooking" to "🍳",
    "Languages" to "🗣️",
    "Technology" to "💻",
    "Design" to "🎨",
    "Fitness" to "🏋️",
    "Crafts" to "🧵",
    "Business" to "📈",
    "Academics" to "📚",
    "Outdoors" to "🏕️",
    "Other" to "✨",
)

fun categoryEmoji(category: String): String = CATEGORY_EMOJI[category] ?: "✨"

val AVATAR_CHOICES = listOf(
    "🙂", "😎", "🤓", "🧑‍🎓", "🧑‍🍳", "🧑‍💻", "🧑‍🎨", "🧑‍🔧",
    "🧑‍🚀", "🎸", "🎹", "🎤", "📚", "🧶", "🪴", "🍜",
    "🏋️", "🚴", "🎯", "🐙", "🦊", "🐝", "🌵", "⭐",
)
