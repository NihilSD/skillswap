package com.skillswap.app.ui.screens.discover

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Lock
import androidx.compose.material.icons.outlined.Search
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.skillswap.app.data.*
import com.skillswap.app.data.repo.DiscoverRepository
import com.skillswap.app.data.repo.SwapRepository
import com.skillswap.app.ui.components.*
import com.skillswap.app.ui.screens.profile.CategoryPicker
import com.skillswap.app.ui.theme.SkillSwapTheme
import kotlinx.coroutines.launch

@Composable
fun DiscoverScreen(
    profile: Profile,
    onOpenPricing: () -> Unit,
    onOpenMatches: () -> Unit,
) {
    val scope = rememberCoroutineScope()
    var listings by remember { mutableStateOf<List<DiscoverListing>>(emptyList()) }
    var loading by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf<String?>(null) }

    var search by remember { mutableStateOf("") }
    var category by remember { mutableStateOf<String?>(null) }
    var bestMatch by remember { mutableStateOf(false) }

    var requestTarget by remember { mutableStateOf<DiscoverListing?>(null) }

    suspend fun load() {
        loading = true
        runCatching {
            DiscoverRepository.listings(
                search = search.ifBlank { null },
                category = category,
                sort = if (bestMatch) "match" else "newest",
            )
        }.onSuccess { listings = it; error = null }
            .onFailure { error = it.message }
        loading = false
    }

    LaunchedEffect(Unit) { load() }

    DiscoverContent(
        profile = profile,
        listings = listings,
        loading = loading,
        error = error,
        search = search,
        onSearchChange = { search = it },
        category = category,
        onCategoryChange = { category = it },
        bestMatch = bestMatch,
        onBestMatchChange = { bestMatch = it },
        onApply = { scope.launch { load() } },
        onClear = {
            search = ""; category = null; bestMatch = false
            scope.launch { load() }
        },
        onOpenPricing = onOpenPricing,
        onRequest = { requestTarget = it },
    )

    requestTarget?.let { target ->
        RequestSheet(
            listing = target,
            profile = profile,
            onDismiss = { requestTarget = null },
            onSent = { requestTarget = null; onOpenMatches() },
            onOpenPricing = { requestTarget = null; onOpenPricing() },
        )
    }
}

/**
 * The screen with no data fetching of its own — everything arrives as
 * parameters. This is what the screenshot tests render.
 */
@Composable
internal fun DiscoverContent(
    profile: Profile,
    listings: List<DiscoverListing>,
    loading: Boolean,
    error: String?,
    search: String,
    onSearchChange: (String) -> Unit,
    category: String?,
    onCategoryChange: (String) -> Unit,
    bestMatch: Boolean,
    onBestMatchChange: (Boolean) -> Unit,
    onApply: () -> Unit,
    onClear: () -> Unit,
    onOpenPricing: () -> Unit,
    onRequest: (DiscoverListing) -> Unit,
) {
    LazyColumn(
        Modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        item {
            SectionHeader(
                "Discover",
                "People offering to teach — find someone with what you want to learn.",
                Modifier.padding(top = 8.dp),
            )
        }

        item {
            if (profile.isPremium) {
                SsCard {
                    SsTextField(search, onSearchChange, "Search", placeholder = "Skills, categories or people")
                    Spacer(Modifier.height(10.dp))
                    CategoryPicker(category ?: "Other", onCategoryChange)
                    Spacer(Modifier.height(10.dp))
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Switch(checked = bestMatch, onCheckedChange = onBestMatchChange)
                        Spacer(Modifier.width(10.dp))
                        Text("Sort by best match", style = MaterialTheme.typography.bodyMedium, modifier = Modifier.weight(1f))
                    }
                    Spacer(Modifier.height(12.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        SsPrimaryButton("Search", onApply)
                        SsSecondaryButton("Clear", onClear)
                    }
                }
            } else {
                // Free users see what they are missing rather than nothing at
                // all. The gate itself is inside discover_listings().
                SsCard {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Outlined.Lock, contentDescription = null, tint = SkillSwapTheme.colors.muted)
                        Spacer(Modifier.width(12.dp))
                        Column(Modifier.weight(1f)) {
                            Text("Filters are a Premium feature", style = MaterialTheme.typography.titleSmall)
                            Text(
                                "Search, category filters and best-match sorting.",
                                style = MaterialTheme.typography.bodySmall,
                                color = SkillSwapTheme.colors.muted,
                            )
                        }
                        TextButton(onClick = onOpenPricing) { Text("Upgrade") }
                    }
                }
            }
        }

        error?.let { item { SsBanner(it) } }

        if (loading) {
            item {
                Box(Modifier.fillMaxWidth().padding(40.dp), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator()
                }
            }
        } else if (listings.isEmpty()) {
            item {
                EmptyState(
                    emoji = "🌱",
                    title = "Nothing to show yet",
                    body = "No one else is teaching right now. Add a skill on your profile so people find you.",
                )
            }
        } else {
            item {
                Text(
                    "${listings.size} ${if (listings.size == 1) "skill" else "skills"} available" +
                        if (bestMatch && profile.isPremium) " · sorted by best match" else "",
                    style = MaterialTheme.typography.bodySmall,
                    color = SkillSwapTheme.colors.muted,
                )
            }
            items(listings, key = { it.id }) { listing ->
                ListingCard(
                    listing = listing,
                    showMatch = profile.isPremium && bestMatch,
                    onRequest = { onRequest(listing) },
                )
            }
        }

        item { Spacer(Modifier.height(24.dp)) }
    }
}

@Composable
private fun ListingCard(listing: DiscoverListing, showMatch: Boolean, onRequest: () -> Unit) {
    SsCard {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Avatar(listing.avatarEmoji)
            Spacer(Modifier.width(12.dp))
            Column(Modifier.weight(1f)) {
                Text(listing.name, style = MaterialTheme.typography.titleSmall)
                Text("Teaching", style = MaterialTheme.typography.bodySmall, color = SkillSwapTheme.colors.muted)
            }
            if (showMatch && listing.matchScore > 0) {
                SsChip("Match", leading = "✨", tinted = true)
            }
        }
        Spacer(Modifier.height(14.dp))
        Text(listing.title, style = MaterialTheme.typography.titleMedium)
        Spacer(Modifier.height(8.dp))
        SsChip(listing.category, leading = categoryEmoji(listing.category))
        if (listing.description.isNotBlank()) {
            Spacer(Modifier.height(10.dp))
            Text(
                listing.description,
                style = MaterialTheme.typography.bodyMedium,
                color = SkillSwapTheme.colors.muted,
                maxLines = 3,
                overflow = TextOverflow.Ellipsis,
            )
        }
        Spacer(Modifier.height(16.dp))
        SsPrimaryButton("Request to learn", onRequest, Modifier.fillMaxWidth())
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun RequestSheet(
    listing: DiscoverListing,
    profile: Profile,
    onDismiss: () -> Unit,
    onSent: () -> Unit,
    onOpenPricing: () -> Unit,
) {
    val scope = rememberCoroutineScope()
    var message by remember { mutableStateOf("") }
    var busy by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }
    var limited by remember { mutableStateOf(false) }
    var countdown by remember { mutableStateOf<String?>(null) }

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        containerColor = MaterialTheme.colorScheme.surface,
    ) {
        Column(Modifier.padding(horizontal = 20.dp).padding(bottom = 32.dp)) {
            Text("Request to learn ${listing.title}", style = MaterialTheme.typography.titleMedium)
            Spacer(Modifier.height(4.dp))
            Text(
                "${listing.name} · ${listing.category}",
                style = MaterialTheme.typography.bodySmall,
                color = SkillSwapTheme.colors.muted,
            )
            Spacer(Modifier.height(18.dp))

            SsTextField(
                message, { if (it.length <= 400) message = it }, "Your message",
                singleLine = false, minLines = 3,
                placeholder = "I'd love to learn this — I can teach you something in return.",
            )

            error?.let {
                Spacer(Modifier.height(14.dp))
                SsBanner(
                    if (limited && countdown != null) "$it Resets in $countdown." else it,
                    BannerKind.Error,
                )
                if (limited && !profile.isPremium) {
                    Spacer(Modifier.height(10.dp))
                    SsSecondaryButton("Upgrade for more", onOpenPricing, Modifier.fillMaxWidth())
                }
            }

            Spacer(Modifier.height(18.dp))
            SsPrimaryButton(
                "Send request",
                loading = busy,
                enabled = !limited,
                modifier = Modifier.fillMaxWidth(),
                onClick = {
                    busy = true; error = null
                    scope.launch {
                        runCatching {
                            SwapRepository.send(
                                SwapRequest(
                                    fromUserId = profile.id,
                                    toUserId = listing.teacherId,
                                    offeredSkillListingId = listing.id,
                                    message = message.trim().ifBlank { null },
                                )
                            )
                        }.onSuccess { onSent() }
                            .onFailure { throwable ->
                                val friendly = PlanError.friendlyMessage(throwable.message, profile.isPremium)
                                if (throwable.message?.contains(PlanError.SWAP_REQUEST_DAILY) == true ||
                                    throwable.message?.contains("swap request(s) per day") == true
                                ) {
                                    limited = true
                                    countdown = formatCountdown(
                                        runCatching { SwapRepository.resetAt(profile.id) }.getOrNull()
                                    )
                                }
                                error = friendly ?: throwable.message ?: "Could not send the request."
                            }
                        busy = false
                    }
                },
            )
            Spacer(Modifier.height(10.dp))
            SsSecondaryButton("Cancel", onDismiss, Modifier.fillMaxWidth())
        }
    }
}
