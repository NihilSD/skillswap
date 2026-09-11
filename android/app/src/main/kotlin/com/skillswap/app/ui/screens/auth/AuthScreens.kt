package com.skillswap.app.ui.screens.auth

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.skillswap.app.data.repo.AuthRepository
import com.skillswap.app.ui.components.*
import com.skillswap.app.ui.theme.Brand
import com.skillswap.app.ui.theme.SkillSwapTheme
import kotlinx.coroutines.launch

@Composable
private fun AuthScaffold(
    title: String,
    subtitle: String,
    content: @Composable ColumnScope.() -> Unit,
) {
    Column(
        Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .verticalScroll(rememberScrollState())
            .safeDrawingPadding()
            .padding(horizontal = 24.dp, vertical = 32.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Spacer(Modifier.height(24.dp))
        Box(
            Modifier
                .size(56.dp)
                .clip(RoundedCornerShape(16.dp))
                .background(Brush.linearGradient(listOf(Brand.Indigo600, Brand.Indigo400))),
            contentAlignment = Alignment.Center,
        ) { Text("⇄", style = MaterialTheme.typography.headlineSmall, color = androidx.compose.ui.graphics.Color.White) }

        Spacer(Modifier.height(24.dp))
        Text(title, style = MaterialTheme.typography.headlineMedium, textAlign = TextAlign.Center)
        Spacer(Modifier.height(6.dp))
        Text(
            subtitle,
            style = MaterialTheme.typography.bodyMedium,
            color = SkillSwapTheme.colors.muted,
            textAlign = TextAlign.Center,
        )
        Spacer(Modifier.height(28.dp))
        content()
    }
}

@Composable
fun SignInScreen(onSignedIn: () -> Unit, onGoToSignUp: () -> Unit) {
    val scope = rememberCoroutineScope()
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var error by remember { mutableStateOf<String?>(null) }
    var busy by remember { mutableStateOf(false) }

    AuthScaffold("Welcome back", "Sign in to pick up where you left off.") {
        error?.let {
            SsBanner(it)
            Spacer(Modifier.height(16.dp))
        }

        SsTextField(email, { email = it; error = null }, "Email", placeholder = "you@example.com")
        Spacer(Modifier.height(14.dp))
        SsTextField(password, { password = it; error = null }, "Password", placeholder = "••••••••", isPassword = true)
        Spacer(Modifier.height(22.dp))

        SsPrimaryButton(
            text = "Sign in",
            loading = busy,
            enabled = email.isNotBlank() && password.isNotBlank(),
            modifier = Modifier.fillMaxWidth(),
            onClick = {
                busy = true
                error = null
                scope.launch {
                    runCatching { AuthRepository.signIn(email.trim(), password) }
                        .onSuccess { onSignedIn() }
                        // Deliberately vague: never reveal which field was wrong.
                        .onFailure { error = "That email and password combination did not work." }
                    busy = false
                }
            },
        )

        Spacer(Modifier.height(12.dp))
        TextButton(onClick = onGoToSignUp) { Text("New here? Create an account") }
    }
}

@Composable
fun SignUpScreen(onSignedIn: () -> Unit, onGoToSignIn: () -> Unit) {
    val scope = rememberCoroutineScope()
    var name by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var confirm by remember { mutableStateOf("") }
    var error by remember { mutableStateOf<String?>(null) }
    var checkEmail by remember { mutableStateOf<String?>(null) }
    var busy by remember { mutableStateOf(false) }

    if (checkEmail != null) {
        AuthScaffold("Check your email", "One more step before you can sign in.") {
            SsBanner(
                "We sent a confirmation link to ${checkEmail}. Open it to activate your account, then come back and sign in.",
                BannerKind.Info,
            )
            Spacer(Modifier.height(20.dp))
            SsSecondaryButton("Back to sign in", onGoToSignIn, Modifier.fillMaxWidth())
        }
        return
    }

    AuthScaffold("Create your account", "Free forever for your first skill.") {
        error?.let {
            SsBanner(it)
            Spacer(Modifier.height(16.dp))
        }

        SsTextField(name, { name = it; error = null }, "Display name", placeholder = "Mara")
        Spacer(Modifier.height(14.dp))
        SsTextField(email, { email = it; error = null }, "Email", placeholder = "you@example.com")
        Spacer(Modifier.height(14.dp))
        SsTextField(password, { password = it; error = null }, "Password", placeholder = "8+ characters", isPassword = true)
        Spacer(Modifier.height(14.dp))
        SsTextField(confirm, { confirm = it; error = null }, "Confirm password", placeholder = "Repeat it", isPassword = true)
        Spacer(Modifier.height(22.dp))

        SsPrimaryButton(
            text = "Create account",
            loading = busy,
            modifier = Modifier.fillMaxWidth(),
            onClick = {
                when {
                    name.trim().length < 2 -> error = "Please enter your name."
                    password.length < 8 -> error = "Password must be at least 8 characters."
                    password != confirm -> error = "Those passwords do not match."
                    else -> {
                        busy = true
                        error = null
                        scope.launch {
                            runCatching { AuthRepository.signUp(name.trim(), email.trim(), password) }
                                .onSuccess { hasSession ->
                                    if (hasSession) onSignedIn() else checkEmail = email.trim()
                                }
                                .onFailure { error = it.message ?: "Could not create the account." }
                            busy = false
                        }
                    }
                }
            },
        )

        Spacer(Modifier.height(12.dp))
        TextButton(onClick = onGoToSignIn) { Text("Already have an account? Sign in") }
    }
}
