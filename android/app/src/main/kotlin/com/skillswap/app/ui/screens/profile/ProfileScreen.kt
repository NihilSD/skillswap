package com.skillswap.app.ui.screens.profile

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Add
import androidx.compose.material.icons.outlined.Close
import androidx.compose.material.icons.outlined.Delete
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.skillswap.app.data.*
import com.skillswap.app.data.repo.ProfileRepository
import com.skillswap.app.data.repo.SkillRepository
import com.skillswap.app.ui.components.*
import com.skillswap.app.ui.theme.SkillSwapTheme
import kotlinx.coroutines.launch

@Composable
fun ProfileScreen(
    profile: Profile,
    email: String,
    onProfileChanged: () -> Unit,
    onSignOut: () -> Unit,
    onOpenPricing: () -> Unit,
) {
    val scope = rememberCoroutineScope()

    var listings by remember { mutableStateOf<List<SkillListing>>(emptyList()) }
    var wanted by remember { mutableStateOf<List<WantedSkill>>(emptyList()) }
    var usage by remember { mutableStateOf<PlanUsage?>(null) }
    var error by remember { mutableStateOf<String?>(null) }
    var limitHit by remember { mutableStateOf(false) }
    var loading by remember { mutableStateOf(true) }

    suspend fun reload() {
        runCatching {
            listings = SkillRepository.listings(profile.id)
            wanted = SkillRepository.wanted(profile.id)
            usage = ProfileRepository.planUsage(profile.id)
        }.onFailure { error = it.message }
        loading = false
    }

    LaunchedEffect(profile.id) { reload() }

    /** Translates a Postgres trigger error into copy with an upgrade path. */
    fun report(t: Throwable) {
        val friendly = PlanError.friendlyMessage(t.message, profile.isPremium)
        limitHit = friendly != null
        error = friendly ?: t.message ?: "Something went wrong."
    }

    LazyColumn(
        Modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        item {
            Row(
                Modifier.fillMaxWidth().padding(top = 8.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Column(Modifier.weight(1f)) {
                    Text("Your profile", style = MaterialTheme.typography.headlineMedium)
                    Text(email, style = MaterialTheme.typography.bodySmall, color = SkillSwapTheme.colors.muted)
                }
                PlanBadge(profile.isPremium)
            }
        }

        error?.let { message ->
            item {
                Column {
                    SsBanner(message)
                    if (limitHit && !profile.isPremium) {
                        Spacer(Modifier.height(8.dp))
                        SsSecondaryButton("See Premium", onOpenPricing)
                    }
                }
            }
        }

        usage?.let { item { UsageCard(it, onOpenPricing) } }

        item {
            IdentityCard(profile) { name, emoji, bio ->
                scope.launch {
                    runCatching { ProfileRepository.update(profile.id, name, emoji, bio) }
                        .onSuccess { onProfileChanged() }
                        .onFailure { report(it) }
                }
            }
        }

        item {
            TeachCard(
                profile = profile,
                listings = listings,
                onAdd = { title, category, description ->
                    scope.launch {
                        error = null; limitHit = false
                        runCatching {
                            SkillRepository.addListing(
                                SkillListing(
                                    userId = profile.id,
                                    title = title,
                                    category = category,
                                    description = description,
                                )
                            )
                            reload()
                        }.onFailure { report(it) }
                    }
                },
                onToggle = { listing ->
                    scope.launch {
                        error = null; limitHit = false
                        runCatching {
                            SkillRepository.setActive(listing.id!!, !listing.active)
                            reload()
                        }.onFailure { report(it) }
                    }
                },
                onDelete = { listing ->
                    scope.launch {
                        runCatching {
                            SkillRepository.deleteListing(listing.id!!)
                            reload()
                        }.onFailure { report(it) }
                    }
                },
            )
        }

        item {
            LearnCard(
                wanted = wanted,
                onAdd = { title, category ->
                    scope.launch {
                        runCatching {
                            SkillRepository.addWanted(WantedSkill(userId = profile.id, title = title, category = category))
                            reload()
                        }.onFailure { report(it) }
                    }
                },
                onDelete = { skill ->
                    scope.launch {
                        runCatching {
                            SkillRepository.deleteWanted(skill.id!!)
                            reload()
                        }.onFailure { report(it) }
                    }
                },
            )
        }

        item {
            SsCard {
                Text("Plan", style = MaterialTheme.typography.titleMedium)
                Spacer(Modifier.height(4.dp))
                Text(
                    if (profile.isPremium) "You are on Premium. Billing is managed on the web."
                    else "Upgrade for 3 skills, filters and unlimited messaging.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = SkillSwapTheme.colors.muted,
                )
                Spacer(Modifier.height(14.dp))
                SsSecondaryButton(
                    if (profile.isPremium) "View plans" else "Upgrade to Premium",
                    onOpenPricing,
                    Modifier.fillMaxWidth(),
                )
            }
        }

        item {
            SsSecondaryButton("Sign out", onSignOut, Modifier.fillMaxWidth())
            Spacer(Modifier.height(24.dp))
        }
    }
}

@Composable
private fun UsageCard(usage: PlanUsage, onOpenPricing: () -> Unit) {
    SsCard {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text(
                if (usage.plan == "free") "Free plan usage" else "Premium usage",
                style = MaterialTheme.typography.titleMedium,
                modifier = Modifier.weight(1f),
            )
            if (usage.plan == "free") {
                TextButton(onClick = onOpenPricing) { Text("Upgrade") }
            }
        }
        Spacer(Modifier.height(14.dp))

        Meter("Skills listed", usage.listingsUsed, usage.listingsMax,
            "${usage.activeListingsUsed} of ${usage.activeListingsMax} active")
        Spacer(Modifier.height(12.dp))
        Meter("Requests today", usage.requestsToday, usage.requestsMax,
            formatCountdown(usage.requestsResetAt)?.let { "Resets in $it" } ?: "Rolling 24 hours")
        Spacer(Modifier.height(12.dp))
        Meter("Messages today", usage.messagesToday, usage.messagesMax,
            if (usage.messagesMax == null) "Unlimited on Premium"
            else formatCountdown(usage.messagesResetAt)?.let { "Resets in $it" } ?: "Rolling 24 hours")
    }
}

@Composable
private fun Meter(label: String, used: Int, max: Int?, note: String) {
    val unlimited = max == null
    val atLimit = !unlimited && used >= max!!
    val fraction = if (unlimited) 1f else (used.toFloat() / maxOf(max!!, 1)).coerceIn(0f, 1f)

    Column {
        Row {
            Text(label, style = MaterialTheme.typography.titleSmall, modifier = Modifier.weight(1f))
            Text(
                if (unlimited) "$used sent" else "$used / $max",
                style = MaterialTheme.typography.titleSmall,
                fontWeight = FontWeight.Bold,
            )
        }
        Spacer(Modifier.height(6.dp))
        LinearProgressIndicator(
            progress = { fraction },
            modifier = Modifier.fillMaxWidth().height(6.dp).clip(CircleShape),
            color = if (atLimit) SkillSwapTheme.colors.warning else MaterialTheme.colorScheme.primary,
            trackColor = SkillSwapTheme.colors.line,
            drawStopIndicator = {},
        )
        Spacer(Modifier.height(6.dp))
        Text(note, style = MaterialTheme.typography.bodySmall, color = SkillSwapTheme.colors.muted)
    }
}

@Composable
private fun IdentityCard(profile: Profile, onSave: (String, String, String?) -> Unit) {
    var name by remember(profile.id) { mutableStateOf(profile.name) }
    var bio by remember(profile.id) { mutableStateOf(profile.bio.orEmpty()) }
    var emoji by remember(profile.id) { mutableStateOf(profile.avatarEmoji) }
    var pickerOpen by remember { mutableStateOf(false) }

    val dirty = name != profile.name || bio != profile.bio.orEmpty() || emoji != profile.avatarEmoji

    SsCard {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Box(
                Modifier
                    .size(60.dp)
                    .clip(RoundedCornerShape(18.dp))
                    .background(SkillSwapTheme.colors.surface2)
                    .clickable { pickerOpen = !pickerOpen },
                contentAlignment = Alignment.Center,
            ) { Text(emoji, style = MaterialTheme.typography.headlineSmall) }

            Spacer(Modifier.width(14.dp))
            Column {
                Text("Your avatar", style = MaterialTheme.typography.titleMedium)
                TextButton(onClick = { pickerOpen = !pickerOpen }, contentPadding = PaddingValues(0.dp)) {
                    Text(if (pickerOpen) "Close picker" else "Pick an emoji")
                }
            }
        }

        if (pickerOpen) {
            Spacer(Modifier.height(12.dp))
            LazyVerticalGrid(
                columns = GridCells.Fixed(8),
                modifier = Modifier.height(112.dp),
                horizontalArrangement = Arrangement.spacedBy(6.dp),
                verticalArrangement = Arrangement.spacedBy(6.dp),
            ) {
                items(AVATAR_CHOICES) { choice ->
                    Box(
                        Modifier
                            .aspectRatio(1f)
                            .clip(RoundedCornerShape(10.dp))
                            .background(
                                if (choice == emoji) SkillSwapTheme.colors.brandTint
                                else SkillSwapTheme.colors.surface2
                            )
                            .clickable { emoji = choice; pickerOpen = false },
                        contentAlignment = Alignment.Center,
                    ) { Text(choice) }
                }
            }
        }

        Spacer(Modifier.height(16.dp))
        SsTextField(name, { if (it.length <= 60) name = it }, "Display name")
        Spacer(Modifier.height(12.dp))
        SsTextField(
            bio, { if (it.length <= 280) bio = it }, "Bio",
            placeholder = "What are you into?",
            singleLine = false, minLines = 3,
            supportingText = "${bio.length}/280",
        )
        Spacer(Modifier.height(14.dp))
        SsPrimaryButton(
            "Save changes",
            { onSave(name.trim(), emoji, bio.trim().ifBlank { null }) },
            Modifier.fillMaxWidth(),
            enabled = dirty && name.trim().length >= 2,
        )
    }
}

@Composable
private fun TeachCard(
    profile: Profile,
    listings: List<SkillListing>,
    onAdd: (String, String, String) -> Unit,
    onToggle: (SkillListing) -> Unit,
    onDelete: (SkillListing) -> Unit,
) {
    var adding by remember { mutableStateOf(false) }
    var title by remember { mutableStateOf("") }
    var description by remember { mutableStateOf("") }
    var category by remember { mutableStateOf(CATEGORIES.first()) }

    val max = if (profile.isPremium) PlanLimits.PREMIUM_LISTINGS else PlanLimits.FREE_LISTINGS
    val activeCount = listings.count { it.active }

    SsCard {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Column(Modifier.weight(1f)) {
                Text("Skills I can teach", style = MaterialTheme.typography.titleMedium)
                Text(
                    "${listings.size} of $max listed · $activeCount of $max active",
                    style = MaterialTheme.typography.bodySmall,
                    color = SkillSwapTheme.colors.muted,
                )
            }
            if (!adding) {
                IconButton(onClick = { adding = true }) {
                    Icon(Icons.Outlined.Add, contentDescription = "Add a skill")
                }
            }
        }

        if (adding) {
            Spacer(Modifier.height(14.dp))
            SsTextField(title, { title = it }, "Skill", placeholder = "Fingerstyle guitar")
            Spacer(Modifier.height(10.dp))
            CategoryPicker(category) { category = it }
            Spacer(Modifier.height(10.dp))
            SsTextField(
                description, { description = it }, "What will you teach?",
                singleLine = false, minLines = 2,
                placeholder = "An hour a week, beginner friendly.",
            )
            Spacer(Modifier.height(12.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                SsPrimaryButton(
                    "Add skill",
                    {
                        onAdd(title.trim(), category, description.trim())
                        title = ""; description = ""; adding = false
                    },
                    enabled = title.trim().length >= 2,
                )
                SsSecondaryButton("Cancel", { adding = false })
            }
        }

        Spacer(Modifier.height(14.dp))

        if (listings.isEmpty() && !adding) {
            Text(
                "No skills listed yet. Add the first thing you could teach someone.",
                style = MaterialTheme.typography.bodyMedium,
                color = SkillSwapTheme.colors.muted,
            )
        }

        listings.forEach { listing ->
            Row(
                Modifier
                    .fillMaxWidth()
                    .padding(vertical = 6.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Avatar(categoryEmoji(listing.category), 38)
                Spacer(Modifier.width(12.dp))
                Column(Modifier.weight(1f)) {
                    Text(listing.title, style = MaterialTheme.typography.titleSmall)
                    Text(
                        listing.category + if (listing.active) "" else " · hidden",
                        style = MaterialTheme.typography.bodySmall,
                        color = SkillSwapTheme.colors.muted,
                    )
                }
                Switch(
                    checked = listing.active,
                    onCheckedChange = { onToggle(listing) },
                )
                IconButton(onClick = { onDelete(listing) }) {
                    Icon(Icons.Outlined.Delete, contentDescription = "Delete ${listing.title}", tint = SkillSwapTheme.colors.muted)
                }
            }
        }
    }
}

@Composable
private fun LearnCard(
    wanted: List<WantedSkill>,
    onAdd: (String, String) -> Unit,
    onDelete: (WantedSkill) -> Unit,
) {
    var title by remember { mutableStateOf("") }
    var category by remember { mutableStateOf(CATEGORIES.first()) }

    SsCard {
        Text("Skills I want to learn", style = MaterialTheme.typography.titleMedium)
        Text(
            "No limit here — these power your best-match results in Discover.",
            style = MaterialTheme.typography.bodySmall,
            color = SkillSwapTheme.colors.muted,
        )
        Spacer(Modifier.height(14.dp))

        SsTextField(title, { title = it }, "Skill", placeholder = "Italian cooking")
        Spacer(Modifier.height(10.dp))
        CategoryPicker(category) { category = it }
        Spacer(Modifier.height(12.dp))
        SsSecondaryButton(
            "Add",
            { onAdd(title.trim(), category); title = "" },
            enabled = title.trim().length >= 2,
        )

        if (wanted.isNotEmpty()) {
            Spacer(Modifier.height(14.dp))
            wanted.forEach { skill ->
                Row(Modifier.fillMaxWidth().padding(vertical = 4.dp), verticalAlignment = Alignment.CenterVertically) {
                    SsChip(skill.title, leading = categoryEmoji(skill.category), modifier = Modifier.weight(1f))
                    IconButton(onClick = { onDelete(skill) }) {
                        Icon(Icons.Outlined.Close, contentDescription = "Remove ${skill.title}", tint = SkillSwapTheme.colors.muted)
                    }
                }
            }
        }
    }
}

@Composable
fun CategoryPicker(selected: String, onSelect: (String) -> Unit) {
    var expanded by remember { mutableStateOf(false) }
    Column {
        Text("Category", style = MaterialTheme.typography.titleSmall)
        Spacer(Modifier.height(6.dp))
        Box {
            SsSecondaryButton("${categoryEmoji(selected)}  $selected", { expanded = true }, Modifier.fillMaxWidth())
            DropdownMenu(expanded = expanded, onDismissRequest = { expanded = false }) {
                CATEGORIES.forEach { category ->
                    DropdownMenuItem(
                        text = { Text("${categoryEmoji(category)}  $category") },
                        onClick = { onSelect(category); expanded = false },
                    )
                }
            }
        }
    }
}
