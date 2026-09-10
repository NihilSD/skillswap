# Screenshots

Rendered from the real Compose composables — same theme, same components, same
layout code as the shipping app — using Robolectric in NATIVE graphics mode via
Roborazzi. Fixture data stands in for the network so each feature can be shown
in a meaningful state.

Regenerate after a UI change:

```bash
./gradlew :app:testDebugUnitTest -Proborazzi.test.record=true
cp app/build/screenshots/*.png docs/screenshots/
```

Verify nothing changed unintentionally (compares against these files):

```bash
./gradlew :app:testDebugUnitTest -Proborazzi.test.verify=true
```

| File | Feature |
| --- | --- |
| `01-sign-in.png` | Sign in |
| `02-sign-up.png` | Sign up (dark) |
| `03-discover-free.png` | Discover, free plan — filters locked |
| `04-discover-premium.png` | Discover, premium — filters and best-match (dark) |
| `05-profile.png` | Profile with the plan usage widget |
| `06-profile-plan-limit.png` | The database refusing a second skill, translated for a person |
| `07-matches.png` | Swap requests: pending, accepted, completed, declined |
| `08-messages-list.png` | Conversation list |
| `09-messages-thread.png` | Realtime thread (dark) |
| `10-messages-limit.png` | Daily message cap reached — draft preserved |
| `11-leaderboard.png` | Leaderboard |
| `12-pricing.png` | Pricing, free |
| `13-pricing-premium.png` | Pricing, premium (dark) |

These caught a real bug: `SsPrimaryButton` forced `fillMaxWidth` internally,
which pushed the sibling Decline / Message buttons off-screen inside a Row.

## Fixtures must be deterministic

Every timestamp in `Fixtures.kt` is a fixed instant. An earlier version used
`OffsetDateTime.now()`, so the Matches card rendered a date that changed from
one day to the next — screenshots recorded on one day could never pass
verification on another, and CI failed exactly one day after they were
committed. `PlanUsage.requestsResetAt` is deliberately null for the same
reason: it renders a countdown relative to the current time. The countdown UI
is covered instead by the message-limit shot, which passes a fixed label in.

CI verifies with `-Proborazzi.compare.changeThreshold=0.01` so anti-aliasing
differences between machines do not fail the build, while real layout or text
changes still do.
