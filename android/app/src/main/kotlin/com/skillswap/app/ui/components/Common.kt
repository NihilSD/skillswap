package com.skillswap.app.ui.components

import androidx.compose.animation.animateColorAsState
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.skillswap.app.ui.theme.Brand
import com.skillswap.app.ui.theme.SkillSwapTheme

/** The web app's `.card`: surface, hairline border, generous rounding. */
@Composable
fun SsCard(
    modifier: Modifier = Modifier,
    contentPadding: PaddingValues = PaddingValues(20.dp),
    border: Color? = null,
    content: @Composable ColumnScope.() -> Unit,
) {
    Surface(
        modifier = modifier.fillMaxWidth(),
        shape = MaterialTheme.shapes.large,
        color = MaterialTheme.colorScheme.surface,
        border = BorderStroke(1.dp, border ?: SkillSwapTheme.colors.line),
        tonalElevation = 0.dp,
    ) {
        Column(Modifier.padding(contentPadding), content = content)
    }
}

/** Gradient pill — the web `.btn-primary`. */
@Composable
fun SsPrimaryButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    loading: Boolean = false,
) {
    // No fillMaxWidth on the inner button: that made this greedy inside a Row
    // and pushed sibling buttons off-screen. The Box takes whatever width the
    // caller's modifier gives it and centres the label.
    Box(
        modifier
            .clip(CircleShape)
            .background(
                if (enabled && !loading) {
                    Brush.linearGradient(listOf(Brand.Indigo600, Brand.Indigo400))
                } else {
                    Brush.linearGradient(
                        listOf(
                            SkillSwapTheme.colors.line,
                            SkillSwapTheme.colors.line,
                        )
                    )
                }
            ),
        contentAlignment = Alignment.Center,
    ) {
        TextButton(
            onClick = onClick,
            enabled = enabled && !loading,
            colors = ButtonDefaults.textButtonColors(
                contentColor = Color.White,
                disabledContentColor = SkillSwapTheme.colors.muted,
            ),
            contentPadding = PaddingValues(horizontal = 20.dp, vertical = 12.dp),
        ) {
            if (loading) {
                CircularProgressIndicator(
                    Modifier.size(16.dp),
                    strokeWidth = 2.dp,
                    color = Color.White,
                )
                Spacer(Modifier.width(10.dp))
            }
            Text(text, style = MaterialTheme.typography.labelLarge)
        }
    }
}

/** Outlined pill — the web `.btn-secondary`. */
@Composable
fun SsSecondaryButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    loading: Boolean = false,
) {
    OutlinedButton(
        onClick = onClick,
        modifier = modifier,
        enabled = enabled && !loading,
        shape = CircleShape,
        border = BorderStroke(1.dp, SkillSwapTheme.colors.line),
        colors = ButtonDefaults.outlinedButtonColors(
            contentColor = MaterialTheme.colorScheme.onSurface,
            containerColor = MaterialTheme.colorScheme.surface,
        ),
        contentPadding = PaddingValues(horizontal = 20.dp, vertical = 12.dp),
    ) {
        if (loading) {
            CircularProgressIndicator(Modifier.size(16.dp), strokeWidth = 2.dp)
            Spacer(Modifier.width(10.dp))
        }
        Text(text, style = MaterialTheme.typography.labelLarge)
    }
}

/** The web `.chip`. */
@Composable
fun SsChip(
    text: String,
    modifier: Modifier = Modifier,
    leading: String? = null,
    tinted: Boolean = false,
) {
    val bg = if (tinted) SkillSwapTheme.colors.brandTint else SkillSwapTheme.colors.surface2
    val fg = if (tinted) MaterialTheme.colorScheme.primary else SkillSwapTheme.colors.muted
    Row(
        modifier
            .clip(CircleShape)
            .background(bg)
            .border(1.dp, if (tinted) MaterialTheme.colorScheme.primary.copy(alpha = 0.3f) else SkillSwapTheme.colors.line, CircleShape)
            .padding(horizontal = 10.dp, vertical = 5.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        if (leading != null) {
            Text(leading, style = MaterialTheme.typography.bodySmall)
            Spacer(Modifier.width(5.dp))
        }
        Text(text, style = MaterialTheme.typography.bodySmall, color = fg, fontWeight = FontWeight.Medium)
    }
}

/** Free / Premium badge. */
@Composable
fun PlanBadge(isPremium: Boolean, modifier: Modifier = Modifier) {
    if (isPremium) {
        Row(
            modifier
                .clip(CircleShape)
                .background(Brush.linearGradient(listOf(Brand.Indigo600, Brand.Indigo400)))
                .padding(horizontal = 9.dp, vertical = 3.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text("★ PREMIUM", style = MaterialTheme.typography.labelSmall, color = Color.White)
        }
    } else {
        Box(
            modifier
                .clip(CircleShape)
                .background(SkillSwapTheme.colors.surface2)
                .border(1.dp, SkillSwapTheme.colors.line, CircleShape)
                .padding(horizontal = 9.dp, vertical = 3.dp)
        ) {
            Text("FREE", style = MaterialTheme.typography.labelSmall, color = SkillSwapTheme.colors.muted)
        }
    }
}

/** Emoji avatar in a soft circle. */
@Composable
fun Avatar(emoji: String, size: Int = 44, modifier: Modifier = Modifier) {
    Box(
        modifier
            .size(size.dp)
            .clip(CircleShape)
            .background(SkillSwapTheme.colors.surface2),
        contentAlignment = Alignment.Center,
    ) {
        Text(emoji, style = MaterialTheme.typography.titleMedium)
    }
}

@Composable
fun SectionHeader(title: String, subtitle: String? = null, modifier: Modifier = Modifier) {
    Column(modifier.fillMaxWidth()) {
        Text(title, style = MaterialTheme.typography.headlineMedium)
        if (subtitle != null) {
            Spacer(Modifier.height(4.dp))
            Text(subtitle, style = MaterialTheme.typography.bodyMedium, color = SkillSwapTheme.colors.muted)
        }
    }
}

@Composable
fun EmptyState(
    emoji: String,
    title: String,
    body: String,
    modifier: Modifier = Modifier,
    action: (@Composable () -> Unit)? = null,
) {
    SsCard(modifier, contentPadding = PaddingValues(horizontal = 24.dp, vertical = 44.dp)) {
        Column(
            Modifier.fillMaxWidth(),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Box(
                Modifier
                    .size(56.dp)
                    .clip(RoundedCornerShape(18.dp))
                    .background(SkillSwapTheme.colors.surface2),
                contentAlignment = Alignment.Center,
            ) { Text(emoji, style = MaterialTheme.typography.headlineSmall) }
            Spacer(Modifier.height(16.dp))
            Text(title, style = MaterialTheme.typography.titleMedium, textAlign = TextAlign.Center)
            Spacer(Modifier.height(6.dp))
            Text(
                body,
                style = MaterialTheme.typography.bodyMedium,
                color = SkillSwapTheme.colors.muted,
                textAlign = TextAlign.Center,
            )
            if (action != null) {
                Spacer(Modifier.height(20.dp))
                action()
            }
        }
    }
}

/** Inline error / info / success banner. */
@Composable
fun SsBanner(text: String, kind: BannerKind = BannerKind.Error, modifier: Modifier = Modifier) {
    val colors = SkillSwapTheme.colors
    val (bg, fg) = when (kind) {
        BannerKind.Error -> colors.danger.copy(alpha = 0.12f) to colors.danger
        BannerKind.Info -> MaterialTheme.colorScheme.primary.copy(alpha = 0.12f) to MaterialTheme.colorScheme.primary
        BannerKind.Success -> colors.success.copy(alpha = 0.12f) to colors.success
        BannerKind.Warning -> colors.warning.copy(alpha = 0.12f) to colors.warning
    }
    Row(
        modifier
            .fillMaxWidth()
            .clip(MaterialTheme.shapes.small)
            .background(bg)
            .border(1.dp, fg.copy(alpha = 0.28f), MaterialTheme.shapes.small)
            .padding(horizontal = 14.dp, vertical = 12.dp),
        verticalAlignment = Alignment.Top,
    ) {
        Text(text, style = MaterialTheme.typography.bodyMedium, color = fg)
    }
}

enum class BannerKind { Error, Info, Success, Warning }

@Composable
fun SsTextField(
    value: String,
    onValueChange: (String) -> Unit,
    label: String,
    modifier: Modifier = Modifier,
    placeholder: String? = null,
    singleLine: Boolean = true,
    minLines: Int = 1,
    enabled: Boolean = true,
    isPassword: Boolean = false,
    supportingText: String? = null,
) {
    val border by animateColorAsState(SkillSwapTheme.colors.line, label = "border")
    Column(modifier.fillMaxWidth()) {
        Text(label, style = MaterialTheme.typography.titleSmall)
        Spacer(Modifier.height(6.dp))
        OutlinedTextField(
            value = value,
            onValueChange = onValueChange,
            modifier = Modifier.fillMaxWidth(),
            enabled = enabled,
            singleLine = singleLine,
            minLines = minLines,
            shape = MaterialTheme.shapes.small,
            placeholder = placeholder?.let {
                { Text(it, color = SkillSwapTheme.colors.muted) }
            },
            visualTransformation = if (isPassword) {
                androidx.compose.ui.text.input.PasswordVisualTransformation()
            } else {
                androidx.compose.ui.text.input.VisualTransformation.None
            },
            colors = OutlinedTextFieldDefaults.colors(
                unfocusedBorderColor = border,
                focusedBorderColor = MaterialTheme.colorScheme.primary,
                unfocusedContainerColor = MaterialTheme.colorScheme.surface,
                focusedContainerColor = MaterialTheme.colorScheme.surface,
            ),
            supportingText = supportingText?.let {
                { Text(it, style = MaterialTheme.typography.bodySmall, color = SkillSwapTheme.colors.muted) }
            },
        )
    }
}
