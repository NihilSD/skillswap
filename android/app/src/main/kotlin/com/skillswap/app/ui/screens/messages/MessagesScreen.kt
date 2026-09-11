package com.skillswap.app.ui.screens.messages

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.ArrowBack
import androidx.compose.material.icons.automirrored.outlined.Send
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.skillswap.app.data.*
import com.skillswap.app.data.repo.MessageRepository
import com.skillswap.app.data.repo.SwapRepository
import com.skillswap.app.ui.components.*
import com.skillswap.app.ui.theme.Brand
import com.skillswap.app.ui.theme.SkillSwapTheme
import io.github.jan.supabase.realtime.PostgresAction
import io.github.jan.supabase.realtime.channel
import io.github.jan.supabase.realtime.postgresChangeFlow
import kotlinx.coroutines.flow.collect
import kotlinx.coroutines.launch
import kotlinx.serialization.json.Json

internal data class Conversation(
    val partnerId: String,
    val name: String,
    val emoji: String,
    val lastMessage: String?,
    val lastAt: String?,
    val unread: Boolean,
)

@Composable
fun MessagesScreen(
    profile: Profile,
    initialPartnerId: String?,
    onOpenPricing: () -> Unit,
    onOpenDiscover: () -> Unit,
) {
    val scope = rememberCoroutineScope()
    var messages by remember { mutableStateOf<List<Message>>(emptyList()) }
    var conversations by remember { mutableStateOf<List<Conversation>>(emptyList()) }
    var activeId by remember { mutableStateOf(initialPartnerId) }
    var loading by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf<String?>(null) }

    var draft by remember { mutableStateOf("") }
    var sending by remember { mutableStateOf(false) }
    var limited by remember { mutableStateOf(false) }
    var countdown by remember { mutableStateOf<String?>(null) }
    var usage by remember { mutableStateOf<PlanUsage?>(null) }

    suspend fun load() {
        runCatching {
            messages = MessageRepository.all()
            val partnerIds = messages
                .map { if (it.senderId == profile.id) it.receiverId else it.senderId }
                .toMutableList()
            initialPartnerId?.let { if (it != profile.id && !partnerIds.contains(it)) partnerIds.add(it) }

            val people = SwapRepository.profiles(partnerIds.distinct()).associateBy { it.id }
            conversations = partnerIds.distinct().mapNotNull { id ->
                val person = people[id] ?: return@mapNotNull null
                val thread = messages.filter { it.senderId == id || it.receiverId == id }
                Conversation(
                    partnerId = id,
                    name = person.name,
                    emoji = person.avatarEmoji,
                    lastMessage = thread.lastOrNull()?.content,
                    lastAt = thread.lastOrNull()?.createdAt,
                    unread = thread.any { it.receiverId == profile.id && it.readAt == null },
                )
            }.sortedByDescending { it.lastAt.orEmpty() }

            usage = com.skillswap.app.data.repo.ProfileRepository.planUsage(profile.id)
            usage?.let { u ->
                limited = u.messagesMax != null && u.messagesToday >= u.messagesMax
                if (limited) countdown = formatCountdown(u.messagesResetAt)
            }
        }.onFailure { error = it.message }
        loading = false
    }

    LaunchedEffect(profile.id) { load() }

    // Realtime: INSERTs addressed to this user arrive without any polling.
    LaunchedEffect(profile.id) {
        runCatching {
            val channel = Supabase.client.channel("messages:${profile.id}")
            val flow = channel.postgresChangeFlow<PostgresAction.Insert>(schema = "public") {
                table = "messages"
                filter("receiver_id", io.github.jan.supabase.postgrest.query.filter.FilterOperator.EQ, profile.id)
            }
            channel.subscribe()
            flow.collect { action ->
                val incoming = Json { ignoreUnknownKeys = true }
                    .decodeFromJsonElement(Message.serializer(), action.record)
                if (messages.none { it.id == incoming.id }) {
                    messages = messages + incoming
                }
            }
        }
    }

    val active = conversations.firstOrNull { it.partnerId == activeId }
    val thread = remember(messages, activeId) {
        activeId?.let { id -> messages.filter { it.senderId == id || it.receiverId == id } } ?: emptyList()
    }

    if (loading) {
        Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) { CircularProgressIndicator() }
        return
    }

    if (conversations.isEmpty()) {
        Column(Modifier.fillMaxSize().padding(16.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
            SectionHeader("Messages", "Private, realtime conversations.", Modifier.padding(top = 8.dp))
            EmptyState(
                "💬", "No conversations yet",
                "Once a swap request is accepted you can message each other here — in realtime, no refreshing.",
                action = { SsPrimaryButton("Find someone to swap with", onOpenDiscover) },
            )
        }
        return
    }

    if (active == null) {
        ConversationListContent(
            conversations = conversations,
            usage = usage,
            error = error,
            onOpen = { activeId = it },
        )
        return
    }

    ThreadContent(
        profile = profile,
        active = active,
        thread = thread,
        draft = draft,
        onDraftChange = { draft = it },
        sending = sending,
        limited = limited,
        countdown = countdown,
        usage = usage,
        error = error,
        onBack = { activeId = null },
        onOpenPricing = onOpenPricing,
        onSend = {
            val body = draft.trim()
            if (body.isNotEmpty()) {
                sending = true; error = null
                scope.launch {
                    runCatching {
                        MessageRepository.send(
                            Message(senderId = profile.id, receiverId = active.partnerId, content = body)
                        )
                    }.onSuccess { sent ->
                        messages = messages + sent
                        // The draft is only cleared once the send worked.
                        draft = ""
                        usage?.let { u ->
                            if (u.messagesMax != null && u.messagesToday + 1 >= u.messagesMax) limited = true
                        }
                    }.onFailure { throwable ->
                        if (throwable.message?.contains(PlanError.MESSAGE_DAILY) == true ||
                            throwable.message?.contains("messages per day") == true
                        ) {
                            limited = true
                            countdown = formatCountdown(
                                runCatching { MessageRepository.resetAt(profile.id) }.getOrNull()
                            )
                            error = "Daily message limit reached — upgrade for unlimited messaging."
                        } else {
                            error = throwable.message
                        }
                    }
                    sending = false
                }
            }
        },
    )
}

/** Data-free conversation list, used by the screenshot tests. */
@Composable
internal fun ConversationListContent(
    conversations: List<Conversation>,
    usage: PlanUsage?,
    error: String?,
    onOpen: (String) -> Unit,
) {
        LazyColumn(
            Modifier.fillMaxSize(),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            item {
                SectionHeader(
                    "Messages",
                    usage?.let { u ->
                        if (u.messagesMax == null) "Unlimited messaging on Premium."
                        else "${u.messagesToday} of ${u.messagesMax} messages sent today."
                    } ?: "Private, realtime conversations.",
                    Modifier.padding(top = 8.dp),
                )
            }
            error?.let { item { SsBanner(it) } }
            items(conversations, key = { it.partnerId }) { conversation ->
                SsCard(
                    Modifier.clickable { onOpen(conversation.partnerId) },
                    contentPadding = PaddingValues(14.dp),
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Avatar(conversation.emoji, 40)
                        Spacer(Modifier.width(12.dp))
                        Column(Modifier.weight(1f)) {
                            Text(conversation.name, style = MaterialTheme.typography.titleSmall)
                            Text(
                                conversation.lastMessage ?: "No messages yet — say hello.",
                                style = MaterialTheme.typography.bodySmall,
                                color = SkillSwapTheme.colors.muted,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis,
                            )
                        }
                        if (conversation.unread) {
                            Box(Modifier.size(9.dp).clip(CircleShape).background(MaterialTheme.colorScheme.primary))
                        }
                    }
                }
            }
            item { Spacer(Modifier.height(24.dp)) }
        }
}

/** Data-free thread view, used by the screenshot tests. */
@Composable
internal fun ThreadContent(
    profile: Profile,
    active: Conversation,
    thread: List<Message>,
    draft: String,
    onDraftChange: (String) -> Unit,
    sending: Boolean,
    limited: Boolean,
    countdown: String?,
    usage: PlanUsage?,
    error: String?,
    onBack: () -> Unit,
    onOpenPricing: () -> Unit,
    onSend: () -> Unit,
) {
    val listState = rememberLazyListState()
    LaunchedEffect(thread.size) {
        if (thread.isNotEmpty()) listState.animateScrollToItem(thread.lastIndex)
    }

    Column(Modifier.fillMaxSize()) {
        Row(
            Modifier
                .fillMaxWidth()
                .background(MaterialTheme.colorScheme.surface)
                .padding(horizontal = 12.dp, vertical = 10.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            IconButton(onClick = onBack) {
                Icon(Icons.AutoMirrored.Outlined.ArrowBack, contentDescription = "Back to conversations")
            }
            Avatar(active.emoji, 36)
            Spacer(Modifier.width(10.dp))
            Text(active.name, style = MaterialTheme.typography.titleSmall, modifier = Modifier.weight(1f))
            SsChip("Live", leading = "🟢")
        }
        HorizontalDivider(color = SkillSwapTheme.colors.line)

        LazyColumn(
            Modifier.weight(1f).fillMaxWidth(),
            state = listState,
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            items(thread, key = { it.id ?: it.createdAt.orEmpty() }) { message ->
                val mine = message.senderId == profile.id
                Row(
                    Modifier.fillMaxWidth(),
                    horizontalArrangement = if (mine) Arrangement.End else Arrangement.Start,
                ) {
                    Column(
                        Modifier
                            .widthIn(max = 280.dp)
                            .clip(RoundedCornerShape(16.dp))
                            .background(
                                if (mine) Brush.linearGradient(listOf(Brand.Indigo600, Brand.Indigo500))
                                else Brush.linearGradient(
                                    listOf(SkillSwapTheme.colors.surface2, SkillSwapTheme.colors.surface2)
                                )
                            )
                            .padding(horizontal = 14.dp, vertical = 10.dp)
                    ) {
                        Text(
                            message.content,
                            style = MaterialTheme.typography.bodyMedium,
                            color = if (mine) Color.White else MaterialTheme.colorScheme.onSurface,
                        )
                        Spacer(Modifier.height(3.dp))
                        Text(
                            formatTime(message.createdAt),
                            style = MaterialTheme.typography.bodySmall,
                            color = if (mine) Color.White.copy(alpha = 0.7f) else SkillSwapTheme.colors.muted,
                        )
                    }
                }
            }
        }

        HorizontalDivider(color = SkillSwapTheme.colors.line)
        Column(Modifier.padding(12.dp)) {
            if (limited) {
                SsBanner(
                    "Daily message limit reached — upgrade for unlimited messaging." +
                        (countdown?.let { " Resets in $it." } ?: ""),
                    BannerKind.Warning,
                )
                Spacer(Modifier.height(8.dp))
                SsSecondaryButton("See Premium", onOpenPricing, Modifier.fillMaxWidth())
                Spacer(Modifier.height(10.dp))
            }
            error?.let {
                SsBanner(it)
                Spacer(Modifier.height(8.dp))
            }
            Row(verticalAlignment = Alignment.CenterVertically) {
                OutlinedTextField(
                    value = draft,
                    onValueChange = { if (it.length <= 2000) onDraftChange(it) },
                    modifier = Modifier.weight(1f),
                    placeholder = {
                        Text(
                            if (limited) "Daily message limit reached" else "Message ${active.name}…",
                            color = SkillSwapTheme.colors.muted,
                        )
                    },
                    shape = MaterialTheme.shapes.small,
                    maxLines = 4,
                    colors = OutlinedTextFieldDefaults.colors(
                        unfocusedBorderColor = SkillSwapTheme.colors.line,
                        focusedBorderColor = MaterialTheme.colorScheme.primary,
                    ),
                )
                Spacer(Modifier.width(8.dp))
                FilledIconButton(
                    onClick = onSend,
                    enabled = !sending && !limited && draft.isNotBlank(),
                ) {
                    Icon(Icons.AutoMirrored.Outlined.Send, contentDescription = "Send")
                }
            }
            usage?.let { u ->
                if (u.messagesMax != null) {
                    Spacer(Modifier.height(6.dp))
                    Text(
                        "${minOf(u.messagesToday, u.messagesMax)} of ${u.messagesMax} messages sent today",
                        style = MaterialTheme.typography.bodySmall,
                        color = SkillSwapTheme.colors.muted,
                    )
                }
            }
        }
    }
}
