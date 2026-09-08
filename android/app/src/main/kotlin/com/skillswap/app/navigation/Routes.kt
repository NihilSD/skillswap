package com.skillswap.app.navigation

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.ChatBubbleOutline
import androidx.compose.material.icons.outlined.EmojiEvents
import androidx.compose.material.icons.outlined.Explore
import androidx.compose.material.icons.outlined.Handshake
import androidx.compose.material.icons.outlined.Person
import androidx.compose.ui.graphics.vector.ImageVector

object Routes {
    const val SIGN_IN = "signin"
    const val SIGN_UP = "signup"

    const val DISCOVER = "discover"
    const val MATCHES = "matches"
    const val MESSAGES = "messages"
    const val LEADERBOARD = "leaderboard"
    const val PROFILE = "profile"
    const val PRICING = "pricing"

    /** Deep-links into one conversation from an accepted match. */
    fun thread(partnerId: String) = "$MESSAGES?with=$partnerId"
}

data class BottomTab(val route: String, val label: String, val icon: ImageVector)

/**
 * Five tabs; Pricing is reached from the profile and from upgrade prompts
 * rather than taking a permanent slot.
 */
val BOTTOM_TABS = listOf(
    BottomTab(Routes.DISCOVER, "Discover", Icons.Outlined.Explore),
    BottomTab(Routes.MATCHES, "Matches", Icons.Outlined.Handshake),
    BottomTab(Routes.MESSAGES, "Messages", Icons.Outlined.ChatBubbleOutline),
    BottomTab(Routes.LEADERBOARD, "Ranks", Icons.Outlined.EmojiEvents),
    BottomTab(Routes.PROFILE, "Profile", Icons.Outlined.Person),
)
