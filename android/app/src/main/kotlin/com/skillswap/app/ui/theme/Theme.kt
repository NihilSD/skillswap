package com.skillswap.app.ui.theme

import android.app.Activity
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.SideEffect
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

/**
 * Tokens Material 3's ColorScheme has no slot for — the muted text colour, the
 * hairline border, the second surface tier and the status colours. Exposed the
 * same way the web app exposes CSS variables.
 */
data class SkillSwapColors(
    val muted: Color,
    val line: Color,
    val surface2: Color,
    val brandTint: Color,
    val success: Color,
    val warning: Color,
    val danger: Color,
    val isDark: Boolean,
)

val LocalSkillSwapColors = staticCompositionLocalOf {
    SkillSwapColors(
        muted = LightMuted,
        line = LightLine,
        surface2 = LightSurface2,
        brandTint = LightBrandTint,
        success = SuccessLight,
        warning = WarningLight,
        danger = DangerLight,
        isDark = false,
    )
}

private val LightScheme = lightColorScheme(
    primary = Brand.Indigo600,
    onPrimary = Color.White,
    primaryContainer = LightBrandTint,
    onPrimaryContainer = Brand.Indigo700,
    secondary = Brand.Indigo400,
    onSecondary = Color.White,
    tertiary = Brand.Amber,
    background = LightBg,
    onBackground = LightInk,
    surface = LightSurface,
    onSurface = LightInk,
    surfaceVariant = LightSurface2,
    onSurfaceVariant = LightMuted,
    outline = LightLine,
    outlineVariant = LightLine,
    error = DangerLight,
)

private val DarkScheme = darkColorScheme(
    primary = Brand.Indigo400,
    onPrimary = Color.White,
    primaryContainer = DarkBrandTint,
    onPrimaryContainer = Color.White,
    secondary = Brand.Indigo500,
    onSecondary = Color.White,
    tertiary = Brand.AmberLight,
    background = DarkBg,
    onBackground = DarkInk,
    surface = DarkSurface,
    onSurface = DarkInk,
    surfaceVariant = DarkSurface2,
    onSurfaceVariant = DarkMuted,
    outline = DarkLine,
    outlineVariant = DarkLine,
    error = DangerDark,
)

@Composable
fun SkillSwapTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit,
) {
    val scheme = if (darkTheme) DarkScheme else LightScheme

    val extended = if (darkTheme) {
        SkillSwapColors(DarkMuted, DarkLine, DarkSurface2, DarkBrandTint, SuccessDark, WarningDark, DangerDark, true)
    } else {
        SkillSwapColors(LightMuted, LightLine, LightSurface2, LightBrandTint, SuccessLight, WarningLight, DangerLight, false)
    }

    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as Activity).window
            WindowCompat.getInsetsController(window, view).apply {
                isAppearanceLightStatusBars = !darkTheme
                isAppearanceLightNavigationBars = !darkTheme
            }
        }
    }

    CompositionLocalProvider(LocalSkillSwapColors provides extended) {
        MaterialTheme(
            colorScheme = scheme,
            typography = SkillSwapTypography,
            shapes = SkillSwapShapes,
            content = content,
        )
    }
}

/** Shorthand: `SkillSwapTheme.colors.muted` reads better than the local. */
object SkillSwapTheme {
    val colors: SkillSwapColors
        @Composable get() = LocalSkillSwapColors.current
}
