package com.skillswap.app

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onRoot
import com.github.takahirom.roborazzi.captureRoboImage
import com.skillswap.app.data.SwapRequest
import com.skillswap.app.ui.screens.auth.SignInScreen
import com.skillswap.app.ui.screens.auth.SignUpScreen
import com.skillswap.app.ui.screens.discover.DiscoverContent
import com.skillswap.app.ui.screens.leaderboard.LeaderboardContent
import com.skillswap.app.ui.screens.matches.MatchesContent
import com.skillswap.app.ui.screens.matches.RequestView
import com.skillswap.app.ui.screens.messages.Conversation
import com.skillswap.app.ui.screens.messages.ConversationListContent
import com.skillswap.app.ui.screens.messages.ThreadContent
import com.skillswap.app.ui.screens.pricing.PricingScreen
import com.skillswap.app.ui.screens.profile.ProfileContent
import com.skillswap.app.ui.theme.SkillSwapTheme
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode

/**
 * Renders every screen with fixture data and writes a PNG per feature.
 *
 * There is no emulator in CI here, so these run on the JVM through Robolectric
 * in NATIVE graphics mode — real Compose layout and drawing, real theme, real
 * components. Record with:
 *
 *   ./gradlew :app:testDebugUnitTest -Proborazzi.test.record=true
 */
@RunWith(RobolectricTestRunner::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
@Config(sdk = [34], qualifiers = "w411dp-h891dp-xhdpi")
class ScreenshotTest {

    @get:Rule val compose = createComposeRule()

    private fun shot(name: String, dark: Boolean = false, content: @Composable () -> Unit) {
        compose.setContent {
            SkillSwapTheme(darkTheme = dark) {
                Box(Modifier.fillMaxSize().background(MaterialTheme.colorScheme.background)) {
                    content()
                }
            }
        }
        compose.onRoot().captureRoboImage("build/screenshots/$name.png")
    }

    // ---------------------------------------------------------------- auth

    @Test fun signIn() = shot("01-sign-in") {
        SignInScreen(onSignedIn = {}, onGoToSignUp = {})
    }

    @Test fun signUp() = shot("02-sign-up", dark = true) {
        SignUpScreen(onSignedIn = {}, onGoToSignIn = {})
    }

    // ------------------------------------------------------------ discover

    @Test fun discoverFree() = shot("03-discover-free") {
        DiscoverContent(
            profile = Fixtures.freeProfile,
            listings = Fixtures.listings,
            loading = false, error = null,
            search = "", onSearchChange = {},
            category = null, onCategoryChange = {},
            bestMatch = false, onBestMatchChange = {},
            onApply = {}, onClear = {}, onOpenPricing = {}, onRequest = {},
        )
    }

    @Test fun discoverPremium() = shot("04-discover-premium", dark = true) {
        DiscoverContent(
            profile = Fixtures.premiumProfile,
            listings = Fixtures.listings.sortedByDescending { it.matchScore },
            loading = false, error = null,
            search = "", onSearchChange = {},
            category = "Cooking", onCategoryChange = {},
            bestMatch = true, onBestMatchChange = {},
            onApply = {}, onClear = {}, onOpenPricing = {}, onRequest = {},
        )
    }

    // ------------------------------------------------------------- profile

    @Test fun profile() = shot("05-profile") {
        ProfileContent(
            profile = Fixtures.freeProfile,
            email = "mara@example.com",
            listings = Fixtures.myListings,
            wanted = Fixtures.wanted,
            usage = Fixtures.freeUsage,
            error = null, limitHit = false,
            onOpenPricing = {}, onSignOut = {}, onSave = { _, _, _ -> },
            onAddListing = { _, _, _ -> }, onToggleListing = {}, onDeleteListing = {},
            onAddWanted = { _, _ -> }, onDeleteWanted = {},
        )
    }

    /** The database refusing a second skill, translated into readable copy. */
    @Test fun profilePlanLimit() = shot("06-profile-plan-limit") {
        ProfileContent(
            profile = Fixtures.freeProfile,
            email = "mara@example.com",
            listings = Fixtures.myListings,
            wanted = Fixtures.wanted,
            usage = Fixtures.freeUsage,
            error = "Free plan is limited to 1 skill listing — upgrade to list up to 3.",
            limitHit = true,
            onOpenPricing = {}, onSignOut = {}, onSave = { _, _, _ -> },
            onAddListing = { _, _, _ -> }, onToggleListing = {}, onDeleteListing = {},
            onAddWanted = { _, _ -> }, onDeleteWanted = {},
        )
    }

    // ------------------------------------------------------------- matches

    private fun view(
        id: String, incoming: Boolean, status: String, other: String, emoji: String,
        skill: String, category: String, message: String? = null, rated: Boolean = false,
    ) = RequestView(
        request = SwapRequest(
            id = id,
            fromUserId = if (incoming) "other" else "me",
            toUserId = if (incoming) "me" else "other",
            offeredSkillListingId = "l",
            message = message,
            status = status,
            createdAt = "2026-08-14T10:00:00Z",
        ),
        incoming = incoming, otherId = "other", otherName = other, otherEmoji = emoji,
        skillTitle = skill, skillCategory = category, ratedByViewer = rated,
    )

    @Test fun matches() = shot("07-matches") {
        MatchesContent(
            profile = Fixtures.freeProfile,
            views = listOf(
                view("1", true, "pending", "Devon Park", "📷", "Fingerstyle guitar", "Music",
                    "I can trade you a full sourdough masterclass for a guitar lesson!"),
                view("2", true, "accepted", "Aiko Tanaka", "🍜", "Fingerstyle guitar", "Music"),
                view("3", false, "completed", "Luca Rossi", "🍝", "Italian cooking", "Cooking"),
                view("4", false, "declined", "Theo Vance", "🧗", "Bouldering basics", "Fitness"),
            ),
            loading = false, error = null,
            onOpenDiscover = {}, onMessage = {}, onRate = {}, onChanged = {},
        )
    }

    // ------------------------------------------------------------ messages

    private val conversations = listOf(
        Conversation("a", "Luca Rossi", "🍝", "Perfect — Thursday at 7 then!", "2026-09-08T18:00:00Z", true),
        Conversation("b", "Aiko Tanaka", "🍜", "Bring your guitar and I will bring the broth.", "2026-09-07T12:00:00Z", false),
        Conversation("c", "Devon Park", "📷", "Developing tank arrived!", "2026-09-06T09:00:00Z", false),
    )

    @Test fun messageList() = shot("08-messages-list") {
        ConversationListContent(
            conversations = conversations,
            usage = Fixtures.freeUsage,
            error = null,
            onOpen = {},
        )
    }

    @Test fun messageThread() = shot("09-messages-thread", dark = true) {
        ThreadContent(
            profile = Fixtures.freeProfile,
            active = conversations.first(),
            thread = Fixtures.thread,
            draft = "", onDraftChange = {},
            sending = false, limited = false, countdown = null,
            usage = Fixtures.freeUsage, error = null,
            onBack = {}, onOpenPricing = {}, onSend = {},
        )
    }

    /** The free plan's daily message cap, with the draft deliberately kept. */
    @Test fun messageThreadAtLimit() = shot("10-messages-limit") {
        ThreadContent(
            profile = Fixtures.freeProfile,
            active = conversations.first(),
            thread = Fixtures.thread,
            draft = "One more thing before I forget —", onDraftChange = {},
            sending = false, limited = true, countdown = "6h 12m",
            usage = Fixtures.freeUsage.copy(messagesToday = 10), error = null,
            onBack = {}, onOpenPricing = {}, onSend = {},
        )
    }

    // --------------------------------------------------------- leaderboard

    @Test fun leaderboard() = shot("11-leaderboard") {
        LeaderboardContent(
            profile = Fixtures.freeProfile,
            rows = Fixtures.leaderboard,
            ownRank = null,
            loading = false,
            error = null,
        )
    }

    // ------------------------------------------------------------- pricing

    @Test fun pricing() = shot("12-pricing") {
        PricingScreen(profile = Fixtures.freeProfile, onBack = {})
    }

    @Test fun pricingPremium() = shot("13-pricing-premium", dark = true) {
        PricingScreen(profile = Fixtures.premiumProfile, onBack = {})
    }
}
