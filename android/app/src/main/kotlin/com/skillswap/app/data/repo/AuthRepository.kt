package com.skillswap.app.data.repo

import com.skillswap.app.data.Profile
import com.skillswap.app.data.Supabase
import io.github.jan.supabase.auth.auth
import io.github.jan.supabase.auth.providers.builtin.Email
import io.github.jan.supabase.auth.status.SessionStatus
import io.github.jan.supabase.postgrest.from
import io.github.jan.supabase.postgrest.query.Columns
import kotlinx.coroutines.flow.StateFlow
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put

/**
 * Supabase Auth handles hashing and tokens; this app never sees a password
 * beyond passing it straight to the SDK.
 */
object AuthRepository {
    val sessionStatus: StateFlow<SessionStatus> get() = Supabase.client.auth.sessionStatus

    fun currentUserId(): String? = Supabase.client.auth.currentUserOrNull()?.id
    fun currentEmail(): String? = Supabase.client.auth.currentUserOrNull()?.email

    /**
     * Returns true when a session exists straight away, false when Supabase is
     * configured to require email confirmation first.
     */
    suspend fun signUp(name: String, email: String, password: String): Boolean {
        Supabase.client.auth.signUpWith(Email) {
            this.email = email
            this.password = password
            // Picked up by the handle_new_user() trigger to seed profiles.name.
            data = buildJsonObject { put("name", name) }
        }
        return Supabase.client.auth.currentSessionOrNull() != null
    }

    suspend fun signIn(email: String, password: String) {
        Supabase.client.auth.signInWith(Email) {
            this.email = email
            this.password = password
        }
    }

    suspend fun signOut() {
        Supabase.client.auth.signOut()
    }

    /** The signed-in user's profile row, created at signup by a DB trigger. */
    suspend fun loadProfile(userId: String): Profile =
        Supabase.client.from("profiles")
            .select(Columns.raw(Profile.COLUMNS)) {
                filter { eq("id", userId) }
            }
            .decodeSingle()
}
