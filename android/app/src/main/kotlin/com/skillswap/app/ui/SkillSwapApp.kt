package com.skillswap.app.ui

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavDestination.Companion.hierarchy
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.skillswap.app.data.Supabase
import com.skillswap.app.navigation.BOTTOM_TABS
import com.skillswap.app.navigation.Routes
import com.skillswap.app.ui.components.EmptyState
import com.skillswap.app.ui.screens.auth.SignInScreen
import com.skillswap.app.ui.screens.auth.SignUpScreen
import com.skillswap.app.ui.screens.discover.DiscoverScreen
import com.skillswap.app.ui.screens.leaderboard.LeaderboardScreen
import com.skillswap.app.ui.screens.matches.MatchesScreen
import com.skillswap.app.ui.screens.messages.MessagesScreen
import com.skillswap.app.ui.screens.pricing.PricingScreen
import com.skillswap.app.ui.screens.profile.ProfileScreen
import com.skillswap.app.ui.theme.SkillSwapTheme

@Composable
fun SkillSwapApp(session: SessionViewModel = viewModel()) {
    if (!Supabase.isConfigured) {
        ConfigurationNeeded()
        return
    }

    when (val state = session.state.collectAsState().value) {
        is AuthState.Loading -> LoadingScreen()
        is AuthState.SignedOut -> AuthFlow()
        is AuthState.SignedIn -> SignedInApp(state, session)
    }
}

@Composable
private fun LoadingScreen() {
    Box(
        Modifier.fillMaxSize().background(MaterialTheme.colorScheme.background),
        contentAlignment = Alignment.Center,
    ) { CircularProgressIndicator() }
}

@Composable
private fun ConfigurationNeeded() {
    Box(
        Modifier.fillMaxSize().background(MaterialTheme.colorScheme.background).safeDrawingPadding().padding(24.dp),
        contentAlignment = Alignment.Center,
    ) {
        EmptyState(
            emoji = "🔌",
            title = "Supabase is not configured",
            body = "Add SUPABASE_URL and SUPABASE_ANON_KEY to android/local.properties, then rebuild.",
        )
    }
}

/** Sign in / sign up, kept in its own tiny nav graph. */
@Composable
private fun AuthFlow() {
    val nav = rememberNavController()
    NavHost(nav, startDestination = Routes.SIGN_IN) {
        composable(Routes.SIGN_IN) {
            SignInScreen(
                onSignedIn = { /* sessionStatus drives the switch */ },
                onGoToSignUp = { nav.navigate(Routes.SIGN_UP) },
            )
        }
        composable(Routes.SIGN_UP) {
            SignUpScreen(
                onSignedIn = { },
                onGoToSignIn = { nav.popBackStack(Routes.SIGN_IN, inclusive = false) },
            )
        }
    }
}

@Composable
private fun SignedInApp(state: AuthState.SignedIn, session: SessionViewModel) {
    val nav = rememberNavController()
    val backStack by nav.currentBackStackEntryAsState()
    val currentRoute = backStack?.destination?.route

    // The bottom bar is hidden on screens reached from within a tab.
    val showBottomBar = BOTTOM_TABS.any { tab ->
        backStack?.destination?.hierarchy?.any { it.route?.startsWith(tab.route) == true } == true
    } || currentRoute == null

    Scaffold(
        containerColor = MaterialTheme.colorScheme.background,
        bottomBar = {
            AnimatedVisibility(visible = showBottomBar) {
                NavigationBar(
                    containerColor = MaterialTheme.colorScheme.surface,
                    tonalElevation = 0.dp,
                ) {
                    BOTTOM_TABS.forEach { tab ->
                        val selected = backStack?.destination?.hierarchy?.any {
                            it.route?.startsWith(tab.route) == true
                        } == true

                        NavigationBarItem(
                            selected = selected,
                            onClick = {
                                nav.navigate(tab.route) {
                                    popUpTo(nav.graph.findStartDestination().id) { saveState = true }
                                    launchSingleTop = true
                                    restoreState = true
                                }
                            },
                            icon = { Icon(tab.icon, contentDescription = tab.label) },
                            label = { Text(tab.label, style = MaterialTheme.typography.labelSmall) },
                            colors = NavigationBarItemDefaults.colors(
                                selectedIconColor = MaterialTheme.colorScheme.primary,
                                selectedTextColor = MaterialTheme.colorScheme.primary,
                                indicatorColor = SkillSwapTheme.colors.brandTint,
                                unselectedIconColor = SkillSwapTheme.colors.muted,
                                unselectedTextColor = SkillSwapTheme.colors.muted,
                            ),
                        )
                    }
                }
            }
        },
    ) { padding ->
        NavHost(
            navController = nav,
            startDestination = Routes.DISCOVER,
            modifier = Modifier.padding(padding),
        ) {
            composable(Routes.DISCOVER) {
                DiscoverScreen(
                    profile = state.profile,
                    onOpenPricing = { nav.navigate(Routes.PRICING) },
                    onOpenMatches = { nav.navigate(Routes.MATCHES) },
                )
            }
            composable(Routes.MATCHES) {
                MatchesScreen(
                    profile = state.profile,
                    onOpenDiscover = { nav.navigate(Routes.DISCOVER) },
                    onMessage = { partnerId -> nav.navigate(Routes.thread(partnerId)) },
                )
            }
            composable("${Routes.MESSAGES}?with={with}") { entry ->
                MessagesScreen(
                    profile = state.profile,
                    initialPartnerId = entry.arguments?.getString("with"),
                    onOpenPricing = { nav.navigate(Routes.PRICING) },
                    onOpenDiscover = { nav.navigate(Routes.DISCOVER) },
                )
            }
            composable(Routes.MESSAGES) {
                MessagesScreen(
                    profile = state.profile,
                    initialPartnerId = null,
                    onOpenPricing = { nav.navigate(Routes.PRICING) },
                    onOpenDiscover = { nav.navigate(Routes.DISCOVER) },
                )
            }
            composable(Routes.LEADERBOARD) {
                LeaderboardScreen(profile = state.profile)
            }
            composable(Routes.PROFILE) {
                ProfileScreen(
                    profile = state.profile,
                    email = state.email,
                    onProfileChanged = { session.refresh() },
                    onSignOut = { session.signOut() },
                    onOpenPricing = { nav.navigate(Routes.PRICING) },
                )
            }
            composable(Routes.PRICING) {
                PricingScreen(
                    profile = state.profile,
                    onBack = { nav.popBackStack() },
                )
            }
        }
    }
}
