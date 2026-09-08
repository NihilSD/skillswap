package com.skillswap.app.ui.screens.matches

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.unit.dp
import com.skillswap.app.data.*
import com.skillswap.app.data.repo.SwapRepository
import com.skillswap.app.ui.components.*
import com.skillswap.app.ui.theme.SkillSwapTheme
import kotlinx.coroutines.launch

private data class RequestView(
    val request: SwapRequest,
    val incoming: Boolean,
    val otherId: String,
    val otherName: String,
    val otherEmoji: String,
    val skillTitle: String,
    val skillCategory: String?,
    val ratedByViewer: Boolean,
)

@Composable
fun MatchesScreen(
    profile: Profile,
    onOpenDiscover: () -> Unit,
    onMessage: (String) -> Unit,
) {
    val scope = rememberCoroutineScope()
    var views by remember { mutableStateOf<List<RequestView>>(emptyList()) }
    var loading by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf<String?>(null) }
    var ratingFor by remember { mutableStateOf<RequestView?>(null) }

    suspend fun load() {
        runCatching {
            val requests = SwapRepository.forUser(profile.id)
            val otherIds = requests.map {
                if (it.fromUserId == profile.id) it.toUserId else it.fromUserId
            }.distinct()
            val people = SwapRepository.profiles(otherIds).associateBy { it.id }
            val listings = SwapRepository.listings(
                requests.map { it.offeredSkillListingId }.distinct()
            ).associateBy { it.id }
            val rated = SwapRepository.myRatedSwapIds(profile.id)

            requests.map { request ->
                val incoming = request.toUserId == profile.id
                val otherId = if (incoming) request.fromUserId else request.toUserId
                val listing = listings[request.offeredSkillListingId]
                RequestView(
                    request = request,
                    incoming = incoming,
                    otherId = otherId,
                    otherName = people[otherId]?.name ?: "Someone",
                    otherEmoji = people[otherId]?.avatarEmoji ?: "🙂",
                    skillTitle = listing?.title ?: "a skill",
                    skillCategory = listing?.category,
                    ratedByViewer = rated.contains(request.id),
                )
            }
        }.onSuccess { views = it; error = null }
            .onFailure { error = it.message }
        loading = false
    }

    LaunchedEffect(profile.id) { load() }

    val incoming = views.filter { it.incoming }
    val outgoing = views.filterNot { it.incoming }

    LazyColumn(
        Modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        item {
            SectionHeader("Matches", "Swap requests you have received and sent.", Modifier.padding(top = 8.dp))
        }

        error?.let { item { SsBanner(it) } }

        if (loading) {
            item {
                Box(Modifier.fillMaxWidth().padding(40.dp), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator()
                }
            }
        } else {
            item {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text("Incoming", style = MaterialTheme.typography.titleMedium)
                    val waiting = incoming.count { it.request.status == "pending" }
                    if (waiting > 0) {
                        Spacer(Modifier.width(10.dp))
                        SsChip("$waiting waiting on you", tinted = true)
                    }
                }
            }

            if (incoming.isEmpty()) {
                item {
                    EmptyState(
                        "📭", "No incoming requests yet",
                        "When someone asks to learn one of your skills, it shows up here.",
                    )
                }
            } else {
                items(incoming, key = { it.request.id!! }) { view ->
                    RequestCard(view, profile, onMessage, { ratingFor = view }) {
                        scope.launch { load() }
                    }
                }
            }

            item {
                Spacer(Modifier.height(8.dp))
                Text("Sent", style = MaterialTheme.typography.titleMedium)
            }

            if (outgoing.isEmpty()) {
                item {
                    EmptyState(
                        "✈️", "You have not sent any requests",
                        "Browse the marketplace and ask someone to teach you what they know.",
                        action = { SsPrimaryButton("Go to Discover", onOpenDiscover) },
                    )
                }
            } else {
                items(outgoing, key = { it.request.id!! }) { view ->
                    RequestCard(view, profile, onMessage, { ratingFor = view }) {
                        scope.launch { load() }
                    }
                }
            }
        }

        item { Spacer(Modifier.height(24.dp)) }
    }

    ratingFor?.let { view ->
        RatingSheet(
            view = view,
            profile = profile,
            onDismiss = { ratingFor = null },
            onRated = { ratingFor = null; scope.launch { load() } },
        )
    }
}

@Composable
private fun RequestCard(
    view: RequestView,
    profile: Profile,
    onMessage: (String) -> Unit,
    onRate: () -> Unit,
    onChanged: () -> Unit,
) {
    val scope = rememberCoroutineScope()
    var busy by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }
    val status = view.request.status

    fun setStatus(next: String) {
        busy = true; error = null
        scope.launch {
            runCatching { SwapRepository.setStatus(view.request.id!!, next) }
                .onSuccess {
                    onChanged()
                    if (next == "completed") onRate()
                }
                .onFailure { error = it.message }
            busy = false
        }
    }

    SsCard {
        Row(verticalAlignment = Alignment.Top) {
            Avatar(view.otherEmoji)
            Spacer(Modifier.width(12.dp))
            Column(Modifier.weight(1f)) {
                Text(
                    if (view.incoming) "${view.otherName} wants to learn ${view.skillTitle}"
                    else "You asked ${view.otherName} to teach ${view.skillTitle}",
                    style = MaterialTheme.typography.bodyMedium,
                )
                view.skillCategory?.let {
                    Spacer(Modifier.height(6.dp))
                    SsChip(it, leading = categoryEmoji(it))
                }
                Spacer(Modifier.height(6.dp))
                Text(
                    formatDate(view.request.createdAt),
                    style = MaterialTheme.typography.bodySmall,
                    color = SkillSwapTheme.colors.muted,
                )
            }
            StatusChip(status)
        }

        view.request.message?.let {
            Spacer(Modifier.height(10.dp))
            Text(
                "“$it”",
                style = MaterialTheme.typography.bodyMedium,
                color = SkillSwapTheme.colors.muted,
            )
        }

        error?.let {
            Spacer(Modifier.height(10.dp))
            SsBanner(it)
        }

        Spacer(Modifier.height(14.dp))

        when {
            status == "pending" && view.incoming -> Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                SsPrimaryButton("Accept", { setStatus("accepted") }, loading = busy)
                SsSecondaryButton("Decline", { setStatus("declined") }, enabled = !busy)
            }

            status == "pending" -> Text(
                "Waiting for ${view.otherName} to reply.",
                style = MaterialTheme.typography.bodySmall,
                color = SkillSwapTheme.colors.muted,
            )

            status == "accepted" -> Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                SsPrimaryButton("Mark completed", { setStatus("completed") }, loading = busy)
                SsSecondaryButton("Message", { onMessage(view.otherId) })
            }

            status == "completed" && view.ratedByViewer -> Text(
                "⭐ You rated ${view.otherName} for this swap.",
                style = MaterialTheme.typography.bodySmall,
                color = SkillSwapTheme.colors.muted,
            )

            status == "completed" -> SsPrimaryButton("Rate ${view.otherName}", onRate)

            else -> Text(
                "This request was declined.",
                style = MaterialTheme.typography.bodySmall,
                color = SkillSwapTheme.colors.muted,
            )
        }
    }
}

@Composable
private fun StatusChip(status: String) {
    val colors = SkillSwapTheme.colors
    val (label, tint) = when (status) {
        "pending" -> "Pending" to colors.warning
        "accepted" -> "Accepted" to MaterialTheme.colorScheme.primary
        "completed" -> "Completed" to colors.success
        else -> "Declined" to colors.muted
    }
    Surface(
        shape = MaterialTheme.shapes.small,
        color = tint.copy(alpha = 0.12f),
    ) {
        Text(
            label,
            Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
            style = MaterialTheme.typography.bodySmall,
            color = tint,
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun RatingSheet(
    view: RequestView,
    profile: Profile,
    onDismiss: () -> Unit,
    onRated: () -> Unit,
) {
    val scope = rememberCoroutineScope()
    var score by remember { mutableIntStateOf(5) }
    var comment by remember { mutableStateOf("") }
    var busy by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }

    ModalBottomSheet(onDismissRequest = onDismiss, containerColor = MaterialTheme.colorScheme.surface) {
        Column(Modifier.padding(horizontal = 20.dp).padding(bottom = 32.dp)) {
            Text("How did the swap with ${view.otherName} go?", style = MaterialTheme.typography.titleMedium)
            Spacer(Modifier.height(4.dp))
            Text(
                "Ratings are public and feed the leaderboard.",
                style = MaterialTheme.typography.bodySmall,
                color = SkillSwapTheme.colors.muted,
            )
            Spacer(Modifier.height(20.dp))

            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.Center) {
                (1..5).forEach { value ->
                    Text(
                        "⭐",
                        style = MaterialTheme.typography.headlineMedium,
                        modifier = Modifier
                            .padding(horizontal = 6.dp)
                            .clickable { score = value }
                            .alpha(if (value <= score) 1f else 0.3f),
                    )
                }
            }

            Spacer(Modifier.height(20.dp))
            SsTextField(
                comment, { if (it.length <= 280) comment = it }, "Comment (optional)",
                singleLine = false, minLines = 2, placeholder = "What went well?",
            )

            error?.let {
                Spacer(Modifier.height(14.dp))
                SsBanner(it)
            }

            Spacer(Modifier.height(18.dp))
            SsPrimaryButton(
                "Submit rating",
                loading = busy,
                modifier = Modifier.fillMaxWidth(),
                onClick = {
                    busy = true; error = null
                    scope.launch {
                        runCatching {
                            SwapRepository.rate(
                                Rating(
                                    swapRequestId = view.request.id!!,
                                    raterUserId = profile.id,
                                    ratedUserId = view.otherId,
                                    score = score,
                                    comment = comment.trim().ifBlank { null },
                                )
                            )
                        }.onSuccess { onRated() }
                            .onFailure {
                                // 23505 = already rated this swap; treat as done.
                                if (it.message?.contains("23505") == true ||
                                    it.message?.contains("duplicate key") == true
                                ) onRated() else error = it.message
                            }
                        busy = false
                    }
                },
            )
        }
    }
}
