package com.skillswap.app.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.skillswap.app.data.Supabase
import com.skillswap.app.ui.theme.Brand
import com.skillswap.app.ui.theme.SkillSwapTheme

/**
 * Stage A0 placeholder root. Navigation and the real screens land in the next
 * stages; this exists so the scaffold, theme and Supabase wiring can be built
 * and run end to end first.
 */
@Composable
fun SkillSwapApp() {
    Surface(modifier = Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
        Column(
            modifier = Modifier.fillMaxSize().padding(32.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center,
        ) {
            Spacer(
                Modifier
                    .size(72.dp)
                    .clip(RoundedCornerShape(20.dp))
                    .background(Brush.linearGradient(listOf(Brand.Indigo600, Brand.Indigo400)))
            )
            Spacer(Modifier.height(20.dp))
            Text("SkillSwap", style = MaterialTheme.typography.displaySmall)
            Spacer(Modifier.height(8.dp))
            Text(
                "Trade what you know for what you want to learn.",
                style = MaterialTheme.typography.bodyMedium,
                color = SkillSwapTheme.colors.muted,
                textAlign = TextAlign.Center,
            )
            Spacer(Modifier.height(24.dp))
            Text(
                if (Supabase.isConfigured) "Supabase configured ✓"
                else "Add SUPABASE_URL and SUPABASE_ANON_KEY to local.properties",
                style = MaterialTheme.typography.bodySmall,
                color = SkillSwapTheme.colors.muted,
                textAlign = TextAlign.Center,
            )
        }
    }
}
