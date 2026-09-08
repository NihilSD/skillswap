package com.skillswap.app.data

import com.skillswap.app.BuildConfig
import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.auth.Auth
import io.github.jan.supabase.createSupabaseClient
import io.github.jan.supabase.postgrest.Postgrest
import io.github.jan.supabase.realtime.Realtime

/**
 * The single Supabase client for the app.
 *
 * It uses the anon key, exactly like the web client — every query is still
 * constrained by Row Level Security, and the plan limits are enforced by
 * Postgres triggers. That is why this Android client needs no bespoke backend:
 * the rules live in the database, so a second client inherits all of them.
 *
 * The service-role key is server-only and must never be shipped in this app.
 */
object Supabase {
    val client: SupabaseClient by lazy {
        createSupabaseClient(
            supabaseUrl = BuildConfig.SUPABASE_URL,
            supabaseKey = BuildConfig.SUPABASE_ANON_KEY,
        ) {
            install(Auth) {
                // Session is persisted by supabase-kt in encrypted settings and
                // refreshed automatically.
                alwaysAutoRefresh = true
                autoLoadFromStorage = true
            }
            install(Postgrest)
            install(Realtime)
        }
    }

    val isConfigured: Boolean
        get() = BuildConfig.SUPABASE_URL.isNotBlank() &&
            BuildConfig.SUPABASE_ANON_KEY.isNotBlank() &&
            !BuildConfig.SUPABASE_ANON_KEY.startsWith("replace-with")
}
