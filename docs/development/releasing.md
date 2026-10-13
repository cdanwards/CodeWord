# Releasing to TestFlight

Codeword ships to iPhones through EAS Build and TestFlight. Real push notifications only arrive on these builds; the simulator can't get a push token.

## Already set up

| Piece | Value | Where |
|---|---|---|
| Bundle ID | `com.cdanwards.codeword` (Android package too) | `app.json` |
| Expo project | `@cdanwards/CodewordApp`, ID `d47fbe77-3096-461f-9a60-2ccf3548f3ca` | `app.json` (`owner`, `extra.eas.projectId`) |
| Backend for builds | Hosted Supabase URL and publishable key, `NETWORK_CHECKS_ENABLED=0` | `eas.json`, production profile `env` (inherited by every profile) |
| Version numbers | EAS keeps the build number and bumps it on each production build | `eas.json` (`appVersionSource: remote`, `autoIncrement`) |
| Export compliance | Declared exempt (only standard HTTPS) so uploads skip the question | `app.json` (`ios.config.usesNonExemptEncryption: false`) |

Cloud builds don't see `.env` or `.env.local` (both gitignored, so EAS never uploads them). That's why the build values live in `eas.json`. The publishable key is meant to be public.

## Once: Apple

1. Join the [Apple Developer Program](https://developer.apple.com/programs/enroll/) as an individual ($99 a year). Approval usually takes a day or two.
2. Nothing else to create by hand. EAS registers the bundle ID, makes the distribution certificate and provisioning profile, and creates the push notification key during the first build.

## Build and upload

```bash
eas build --platform ios --profile production
```

The first run is interactive. Sign in with the Apple ID, pick the team, and say yes when EAS offers to create the certificate, the provisioning profile, and an Apple Push Notifications key. The build runs in Expo's cloud (about 15 to 25 minutes on the free tier, longer when the queue is busy).

```bash
eas submit --platform ios --latest
```

The first submit creates the app in App Store Connect (it asks for a name and an SKU) and uploads the build. Apple then processes it for 10 to 30 minutes.

`yarn build:ios:prod` runs the same build locally (`--local`) instead of in the cloud. It needs Xcode and the same Apple sign-in.

## TestFlight

In [App Store Connect](https://appstoreconnect.apple.com), open the app's TestFlight tab:

- Internal testers are people on your App Store Connect team (up to 100). They get builds as soon as processing finishes, with no review.
- External testers (friends, by email or a public link) need Beta App Review for the first build of each version, usually a day.

Testers install the TestFlight app, accept the invite, then install Codeword.

## Checking a real push

1. Install from TestFlight, sign in, and open any operation. Allow notifications when asked; the app registers the device.
2. Make something happen to that agent from another account, for example join their lobby, start the operation, or report them.
3. If the push doesn't show, look at the outbox in the Supabase SQL editor:

```sql
select n.kind, n.attempts, n.sent_at, n.last_error
from notifications n order by n.id desc limit 10;
select count(*) from push_tokens;
```

`No registered devices` means the phone never registered (permission denied, or the build has no project ID). Other errors come from Expo; see [push notifications](../architecture/push-notifications.md#debugging).

To play the other side from the simulator against the hosted project, start Metro with the hosted values. They take precedence over `.env.local`:

```bash
SUPABASE_URL=https://peuvdwygnzjoexsqildc.supabase.co SUPABASE_ANON_KEY=<publishable key> yarn start
```

`scripts/agent.mjs` and the check scripts only talk to the local stack.

## Shipping an update

Every change, JavaScript included, needs a new build and submit: the app has no over-the-air updates (`expo-updates`) yet. Database changes go out separately with `supabase db push --linked` (see [migrations](../database/migrations-and-seeding.md#deploying)); keep them backward compatible with the build testers already have.

## Not covered yet

- Android (Play Console internal testing). The package name is set; nothing else is.
- The App Store listing itself (screenshots, privacy details, review).
- The home-screen name is still "CodewordApp" (`name` in `app.json`).
