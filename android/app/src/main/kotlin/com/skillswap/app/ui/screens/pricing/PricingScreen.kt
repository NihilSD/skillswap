package com.skillswap.app.ui.screens.pricing

import android.content.Intent
import android.net.Uri
import androidx.browser.customtabs.CustomTabsIntent
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import com.skillswap.app.BuildConfig
import com.skillswap.app.data.Profile
import com.skillswap.app.ui.components.*
import com.skillswap.app.ui.theme.SkillSwapTheme

/**
 * Where the hosted web app lives — Checkout and the billing portal run there.
 * Supplied through local.properties / CI as WEB_ORIGIN; blank means "not
 * configured yet", and the UI says so instead of opening a dead link.
 */
private val WEB_ORIGIN: String get() = BuildConfig.WEB_ORIGIN

@Composable
fun PricingScreen(profile: Profile, onBack: () -> Unit) {
    val context = LocalContext.current
    val primary = MaterialTheme.colorScheme.primary.toArgb()
    val billingConfigured = WEB_ORIGIN.isNotBlank()

    fun openWeb(path: String) {
        if (!billingConfigured) return
        val intent = CustomTabsIntent.Builder()
            .setDefaultColorSchemeParams(
                androidx.browser.customtabs.CustomTabColorSchemeParams.Builder()
                    .setToolbarColor(primary)
                    .build()
            )
            .setShowTitle(true)
            .build()
        runCatching { intent.launchUrl(context, Uri.parse("$WEB_ORIGIN$path")) }
            .onFailure {
                context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse("$WEB_ORIGIN$path")))
            }
    }

    Column(
        Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.padding(top = 8.dp)) {
            TextButton(onClick = onBack) { Text("← Back") }
        }

        SectionHeader(
            "Plans & pricing",
            "Every limit is enforced in the database, so the free tier is honest.",
        )

        SsCard(border = if (!profile.isPremium) MaterialTheme.colorScheme.primary.copy(alpha = 0.4f) else null) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text("Free", style = MaterialTheme.typography.titleMedium, modifier = Modifier.weight(1f))
                if (!profile.isPremium) SsChip("Your plan", tinted = true)
            }
            Spacer(Modifier.height(10.dp))
            Text("$0", style = MaterialTheme.typography.displaySmall)
            Spacer(Modifier.height(14.dp))
            Feature("1 skill listed, 1 active", true)
            Feature("Browse the full marketplace", true)
            Feature("Search, category and best-match filters", false)
            Feature("1 swap request per day", true)
            Feature("10 messages per day", true)
        }

        SsCard(border = MaterialTheme.colorScheme.primary.copy(alpha = 0.4f)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text("Premium", style = MaterialTheme.typography.titleMedium, modifier = Modifier.weight(1f))
                SsChip(if (profile.isPremium) "Your plan" else "Most popular", tinted = true)
            }
            Spacer(Modifier.height(10.dp))
            Row(verticalAlignment = Alignment.Bottom) {
                Text("$9", style = MaterialTheme.typography.displaySmall)
                Text(
                    "/month",
                    style = MaterialTheme.typography.titleSmall,
                    color = SkillSwapTheme.colors.muted,
                    modifier = Modifier.padding(bottom = 6.dp, start = 4.dp),
                )
            }
            Spacer(Modifier.height(14.dp))
            Feature("Up to 3 skills, all active at once", true)
            Feature("Keyword, category and best-match filters", true)
            Feature("3 swap requests per day", true)
            Feature("Unlimited messages", true)
            Spacer(Modifier.height(18.dp))

            if (profile.isPremium) {
                SsSecondaryButton(
                    "Manage billing",
                    { openWeb("/profile") },
                    Modifier.fillMaxWidth(),
                    enabled = billingConfigured,
                )
            } else {
                SsPrimaryButton(
                    "Upgrade to Premium",
                    { openWeb("/pricing") },
                    Modifier.fillMaxWidth(),
                    enabled = billingConfigured,
                )
            }

            if (!billingConfigured) {
                Spacer(Modifier.height(10.dp))
                Text(
                    "Billing is not configured in this build. Set WEB_ORIGIN in local.properties to your deployed site.",
                    style = MaterialTheme.typography.bodySmall,
                    color = SkillSwapTheme.colors.muted,
                )
            }
        }

        SsCard {
            Text("Why checkout opens the web", style = MaterialTheme.typography.titleSmall)
            Spacer(Modifier.height(6.dp))
            Text(
                "Payment runs through Stripe Checkout in a secure browser tab, so this app never handles card details. " +
                    "Your plan updates here automatically once Stripe confirms the subscription.",
                style = MaterialTheme.typography.bodyMedium,
                color = SkillSwapTheme.colors.muted,
            )
        }

        Spacer(Modifier.height(24.dp))
    }
}

@Composable
private fun Feature(text: String, included: Boolean) {
    Row(Modifier.padding(vertical = 5.dp), verticalAlignment = Alignment.Top) {
        Text(
            if (included) "✓" else "✕",
            style = MaterialTheme.typography.bodyMedium,
            color = if (included) MaterialTheme.colorScheme.primary else SkillSwapTheme.colors.muted,
        )
        Spacer(Modifier.width(10.dp))
        Text(
            text,
            style = MaterialTheme.typography.bodyMedium,
            color = if (included) MaterialTheme.colorScheme.onSurface else SkillSwapTheme.colors.muted,
        )
    }
}
