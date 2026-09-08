package com.skillswap.app.ui.screens.leaderboard

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.skillswap.app.data.LeaderboardRow
import com.skillswap.app.data.Profile
import com.skillswap.app.data.repo.LeaderboardRepository
import com.skillswap.app.ui.components.*
import com.skillswap.app.ui.theme.SkillSwapTheme

private val MEDALS = listOf("🥇", "🥈", "🥉")

@Composable
fun LeaderboardScreen(profile: Profile) {
    var rows by remember { mutableStateOf<List<LeaderboardRow>>(emptyList()) }
    var ownRank by remember { mutableStateOf<LeaderboardRow?>(null) }
    var loading by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(profile.id) {
        runCatching {
            rows = LeaderboardRepository.top(50)
            ownRank = LeaderboardRepository.rankOf(profile.id)
        }.onFailure { error = it.message }
        loading = false
    }

    val inTable = rows.any { it.userId == profile.id }

    LazyColumn(
        Modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        item {
            SectionHeader(
                "Leaderboard",
                "Ranked by completed swaps, then average rating.",
                Modifier.padding(top = 8.dp),
            )
        }

        error?.let { item { SsBanner(it) } }

        when {
            loading -> item {
                Box(Modifier.fillMaxWidth().padding(40.dp), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator()
                }
            }

            rows.isEmpty() -> item {
                EmptyState(
                    "🏆", "Nobody has completed a swap yet",
                    "Complete and rate a swap and you will be the first name on this board.",
                )
            }

            else -> {
                items(rows, key = { it.userId }) { row ->
                    val isViewer = row.userId == profile.id
                    SsCard(
                        contentPadding = PaddingValues(14.dp),
                        border = if (isViewer) MaterialTheme.colorScheme.primary.copy(alpha = 0.4f) else null,
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Box(Modifier.width(36.dp), contentAlignment = Alignment.Center) {
                                Text(
                                    if (row.rank <= 3) MEDALS[(row.rank - 1).toInt()] else "${row.rank}",
                                    style = MaterialTheme.typography.titleMedium,
                                    color = SkillSwapTheme.colors.muted,
                                )
                            }
                            Spacer(Modifier.width(6.dp))
                            Avatar(row.avatarEmoji, 40)
                            Spacer(Modifier.width(12.dp))
                            Column(Modifier.weight(1f)) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Text(row.name, style = MaterialTheme.typography.titleSmall)
                                    if (isViewer) {
                                        Spacer(Modifier.width(8.dp))
                                        SsChip("You", tinted = true)
                                    }
                                }
                                Spacer(Modifier.height(4.dp))
                                Text(
                                    "${row.completedSwaps} completed",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = SkillSwapTheme.colors.muted,
                                )
                                if (row.skills.isNotEmpty()) {
                                    Spacer(Modifier.height(6.dp))
                                    Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                        row.skills.take(2).forEach { SsChip(it) }
                                    }
                                }
                            }
                            Stars(row.avgRating, row.ratingsCount)
                        }
                    }
                }

                if (!inTable && ownRank != null) {
                    item {
                        Spacer(Modifier.height(6.dp))
                        SsCard(border = MaterialTheme.colorScheme.primary.copy(alpha = 0.4f)) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Text("#${ownRank!!.rank}", style = MaterialTheme.typography.titleMedium)
                                Spacer(Modifier.width(12.dp))
                                Avatar(profile.avatarEmoji, 40)
                                Spacer(Modifier.width(12.dp))
                                Column(Modifier.weight(1f)) {
                                    Text(profile.name, style = MaterialTheme.typography.titleSmall)
                                    Text(
                                        "${ownRank!!.completedSwaps} completed",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = SkillSwapTheme.colors.muted,
                                    )
                                }
                                Stars(ownRank!!.avgRating, ownRank!!.ratingsCount)
                            }
                        }
                    }
                }
            }
        }

        item { Spacer(Modifier.height(24.dp)) }
    }
}

@Composable
private fun Stars(score: Double?, count: Long) {
    if (score == null) {
        Text("Not rated", style = MaterialTheme.typography.bodySmall, color = SkillSwapTheme.colors.muted)
        return
    }
    val rounded = Math.round(score).toInt().coerceIn(0, 5)
    Column(horizontalAlignment = Alignment.End) {
        Text("★".repeat(rounded), style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.tertiary)
        Text(
            "%.1f (%d)".format(score, count),
            style = MaterialTheme.typography.bodySmall,
            color = SkillSwapTheme.colors.muted,
        )
    }
}
