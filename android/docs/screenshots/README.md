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

**Verification is machine-specific.** Roborazzi renders through Robolectric's
native graphics, and the output is not byte-identical across environments —
the JDK and font stack that recorded a baseline and the one verifying it
produce slightly different text anti-aliasing, which fails every image no
matter how generous the threshold. Verify against baselines you recorded on
the same machine. CI therefore *records* instead of comparing: that still
fails if a composable throws, and the renders are uploaded as an artifact for
a human to look at. Gating on pixels in CI would need the baselines recorded
inside the same container image the job runs in.

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

Determinism still matters for the local workflow: without it, `verify` fails
against your own baselines a day later.
