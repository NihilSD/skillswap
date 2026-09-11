package com.skillswap.app.data

import java.time.Duration
import java.time.OffsetDateTime
import java.time.format.DateTimeParseException

/** "3h 24m" / "48m" — the countdown copy used for daily-limit resets. */
fun formatCountdown(isoTimestamp: String?): String? {
    if (isoTimestamp.isNullOrBlank()) return null

    val target = runCatching { OffsetDateTime.parse(isoTimestamp) }
        .recoverCatching { OffsetDateTime.parse(isoTimestamp.replace(" ", "T")) }
        .getOrElse { return null }

    val remaining = Duration.between(OffsetDateTime.now(), target)
    if (remaining.isNegative || remaining.isZero) return "any moment now"

    val totalMinutes = Math.ceil(remaining.toMillis() / 60000.0).toLong()
    val hours = totalMinutes / 60
    val minutes = totalMinutes % 60

    return when {
        hours == 0L && minutes <= 1L -> "under a minute"
        hours == 0L -> "${minutes}m"
        else -> "${hours}h ${minutes}m"
    }
}

/** Short "14:32" style time for message bubbles. */
fun formatTime(isoTimestamp: String?): String {
    if (isoTimestamp.isNullOrBlank()) return ""
    return runCatching {
        val t = OffsetDateTime.parse(isoTimestamp.replace(" ", "T"))
        "%02d:%02d".format(t.hour, t.minute)
    }.getOrDefault("")
}

/** "14 Aug 2026" for request cards. */
fun formatDate(isoTimestamp: String?): String {
    if (isoTimestamp.isNullOrBlank()) return ""
    return runCatching {
        val t = OffsetDateTime.parse(isoTimestamp.replace(" ", "T"))
        val month = listOf("Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec")[t.monthValue - 1]
        "${t.dayOfMonth} $month ${t.year}"
    }.getOrDefault("")
}
