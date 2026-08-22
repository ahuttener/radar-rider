<p align="center">
  <img src="./assets/banner.jpg" alt="Radar Rider — real-time hazard alerts for riders" width="340" />
</p>

# Radar Rider

Community safety PWA for delivery riders in Ireland and the United Kingdom.
A rider posts a hazard alert; whoever is nearby sees it on the map and confirms
it. Location is always disclosed as an approximation.

**Next.js 16 (App Router) + Prisma + MySQL + NextAuth.** It builds.

> Until mid-2026 this was a static site + Supabase, and this README described
> that: `index.html`, `config.js`, `supabase.sql`, RLS, database functions. None
> of it exists any more. If you find an instruction mentioning Supabase
> somewhere in the repository, it is leftover — the database is MySQL, and
> access rules are enforced by the server, not by the database.

## Structure

| Path | What it is |
|---|---|
| `src/app/` | routes: pages and `api/` |
| `src/components/` | `RadarApp` (the app), map, modals, country picker and legal documents |
| `src/lib/` | `alert-visibility` (privacy), `geo`, `auth`, `mailer`, `prisma`, `push` |
| `prisma/` | schema and migrations |
| `public/` | PWA manifest, service worker and icons |
| `emails/` | how to wire up SMTP + email previews |
| `app.js` | entry point on Hostinger — it starts from a file, not from a command |
| `t/` | tests (`npm test`) |

## Running locally

```bash
npm install
cp .env.example .env    # then fill it in
npx prisma migrate dev
npm run dev
```

Only `DATABASE_URL` and `NEXTAUTH_SECRET` are required to boot. Without SMTP the
app **does not break**: it stops sending email and writes the confirmation link
to the console, which lets you test the whole sign-up flow with no mailbox.

To compile with no database at all (useful in CI, or to check types):

```bash
DATABASE_URL="mysql://u:p@127.0.0.1:3306/db" NEXTAUTH_SECRET="x" npx next build
```

`npm run build` runs `prisma migrate deploy` first and does require a real
database.

## Testing

```bash
npm run check
```

The command runs tests, ESLint and TypeScript. `t/geo.test.mjs` covers the
Ireland/UK split by coordinate, position blurring and distance calculation.
`t/auth-timing.test.mjs` covers the throwaway hash on login — the protection
against finding out who has an account by measuring response time.
`t/alert-visibility.test.mjs` makes sure the author and the exact coordinate
never reach a public response.

## Deploying

Environment variables go in hPanel (**Websites → radarrider.com → Environment
variables**), following `.env.example`, and then **restart the application** — a
new variable only exists in the next process.

Before opening to the public, set `LEGAL_CONTROLLER_NAME` and
`LEGAL_CONTROLLER_ADDRESS` with the legal name and postal address of the data
controller. The support button uses `NEXT_PUBLIC_SUPPORT_URL`.

Push notifications need `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` and
`VAPID_SUBJECT`. When an alert is created, `notificarPais()` pushes it to the
subscribers of that country. Without the keys the feature becomes a no-op and
nothing else breaks.

When touching `public/service-worker.js`, **bump the cache number**
(`radar-rider-vX`). Without that, anyone who already installed the app keeps the
old files.

### Traps specific to this hosting

- **`DATABASE_URL` uses `127.0.0.1`, never `localhost`.** With `localhost` the
  driver tries a unix socket instead of TCP and fails without saying why.
- **`experimental.cpus: 1` in `next.config.ts` is mandatory** so the build fits
  within the plan's limits.
- **`app.js` at the root** is how Hostinger starts the application. Do not
  remove it.

## Decisions that look odd and are deliberate

- **The exact coordinate never leaves in an HTTP response.** Every route that
  returns an alert goes through `src/lib/alert-visibility.ts`. On Supabase this
  was guaranteed by RLS; here Prisma returns everything the row holds, so the
  rule moved to the server and lives in that file. **Do not hand-assemble an
  alert object inside a route.**
- **Position blurring happens on the server, not on the client.** If it arrived
  ready-made from the browser, someone could tamper with the app and post an
  alert pointing at somebody's front door.
- **The `userId` does not travel with the alert.** That is what keeps alerts
  anonymous; hence "my alerts" has its own route (`/api/alerts/mine`) instead of
  being a filter on the client.
- **Confirming requires being nearby** (2 km). From far away it is not
  testimony, it is opinion.
- **The expiry window is whatever the author picked** (1 h to 12 h), not one
  fixed deadline for everyone.
- **The cookie notice has no "reject" button.** The app only uses the login
  session cookie, which under ePrivacy does not require consent. A button that
  switches nothing off is theatre. If analytics ever land, that becomes a real
  opt-in.
- **Flags are SVG, not emoji.** Windows has no flag font, so the buttons were
  showing raw "IE" and "GB" letters.
- **No identity verification.** The product does not ask anyone for documents.

## Known limits

- The country (IE/GB) comes from a coordinate box with an approximate outline of
  Northern Ireland. It is good enough to group users and pick km/miles — it does
  not stand as jurisdiction.
- Map tiles come from CARTO over OpenStreetMap data, on the free public layer.
  For real volume, buy a plan — the attribution in the map footer is mandatory
  and must not be removed.

## What does not exist yet

Things the static version had that were **not ported** — these are not bugs,
they are known gaps:

- **Image upload and profile pictures.** The current product is deliberately
  text and approximate location only.
- **Analytics and ads.** They are not loaded; if they land, they require a new
  consent flow and updated policies.

The moderation panel lives at `/moderacao` for `moderator` or `admin` accounts.
Export and deletion live under "Profile → My data and rights". The retention
routine deletes expired records opportunistically, at most once a day per
process.
