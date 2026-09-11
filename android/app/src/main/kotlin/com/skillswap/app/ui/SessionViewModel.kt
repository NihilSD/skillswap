package com.skillswap.app.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.skillswap.app.data.Profile
import com.skillswap.app.data.repo.AuthRepository
import io.github.jan.supabase.auth.status.SessionStatus
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

sealed interface AuthState {
    data object Loading : AuthState
    data object SignedOut : AuthState
    data class SignedIn(val profile: Profile, val email: String) : AuthState
}

/**
 * Owns the auth session and the signed-in profile for the whole app, so the
 * plan badge and every plan-dependent screen read one source of truth.
 */
class SessionViewModel : ViewModel() {
    private val _state = MutableStateFlow<AuthState>(AuthState.Loading)
    val state: StateFlow<AuthState> = _state.asStateFlow()

    init {
        viewModelScope.launch {
            AuthRepository.sessionStatus.collect { status ->
                when (status) {
                    is SessionStatus.Authenticated -> refresh()
                    is SessionStatus.NotAuthenticated -> _state.value = AuthState.SignedOut
                    is SessionStatus.Initializing -> _state.value = AuthState.Loading
                    else -> Unit
                }
            }
        }
    }

    /** Re-reads the profile — call after an edit or an upgrade. */
    fun refresh() {
        val userId = AuthRepository.currentUserId() ?: run {
            _state.value = AuthState.SignedOut
            return
        }
        viewModelScope.launch {
            runCatching { AuthRepository.loadProfile(userId) }
                .onSuccess { _state.value = AuthState.SignedIn(it, AuthRepository.currentEmail().orEmpty()) }
                .onFailure { _state.value = AuthState.SignedOut }
        }
    }

    fun signOut() {
        viewModelScope.launch { runCatching { AuthRepository.signOut() } }
    }
}
