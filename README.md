# Apple Mike — mobile app (iOS + Android)

Expo (React Native) app for Apple Mike Store. It is a second interface to the **same backend** as the
website in `../applemike-store`: the same Supabase database, user accounts, products, cart, favourites,
addresses and orders. Checkout calls the website's `POST /api/checkout`, so pricing, order records and
confirmation emails are identical on both.

## Run it on your phone (development)

1. Install **Expo Go** on the phone — App Store (iPhone) or Google Play (Android).
2. Make sure the phone and this computer are on the **same Wi-Fi**.
3. In this folder:
   ```bash
   npm install          # first time only
   npx expo start
   ```
4. Scan the QR code shown in the terminal:
   - **iPhone:** open the Camera app and scan it, then tap the Expo Go banner.
   - **Android:** open Expo Go and tap **Scan QR code**.
5. If the phone can't connect (firewall / different network), run `npx expo start --tunnel` instead.

Changes to the code reload on the phone automatically.

## Configuration

`.env.local` (not committed):

| Variable | What it is |
|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | Same Supabase project URL as the website |
| `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable (anon) key — safe in an app; access is enforced by RLS |
| `EXPO_PUBLIC_SITE_URL` | The website (photos + `/api/checkout`), e.g. `https://applemike-store.vercel.app` |

Never put the Supabase **service role / secret** key in the app.

## How data stays in sync with the website

- **Accounts:** Supabase Auth (email + password). The session is stored in the iOS Keychain / Android
  Keystore (`expo-secure-store`) and refreshed automatically.
- **Cart / favourites / addresses / profile:** read and written directly in the shared tables
  (`cart_items`, `wishlist_items`, `addresses`, `profiles`) — owner-only RLS protects them.
  Changes from the website arrive live via Supabase Realtime, and are re-fetched when the app returns to
  the foreground or a screen is opened. Guests keep a device-only cart/favourites that merge into the
  account on sign-in.
- **Products / prices / stock:** always loaded from the database.
- **Orders:** placed via the website's `/api/checkout`; listed from the `orders` table.

## Checks

```bash
npx tsc --noEmit
npx expo lint
```

## Project structure

```
src/app/            screens (Expo Router)  — (tabs): Shop, Favourites, Cart, Account
src/components/     shared UI (buttons, product card, logo, pickers)
src/lib/            Supabase client, secure storage, catalogue, checkout API, orders, realtime helper
src/providers/      app state: auth, catalogue, cart, favourites, addresses
src/theme.ts        brand colours/fonts (mirrors the website)
```
