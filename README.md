# TowerHub

Mod hub for the **Tower Simulator 3** community, inspired by Flightsim.to.
React + TypeScript + Vite + Tailwind on the frontend, with a **real Express +
SQLite backend** handling accounts/authentication and a **real file server**
handling uploads (screenshots, mod packages, avatars all leave the browser
and land on disk). The mod/comment/rating *records* (title, description,
category, star ratings, comment text) are still a browser-side simulation —
see [What's simulated vs. production](#whats-simulated-vs-production) below
for exactly where that line is drawn.

## Running it

This is now two processes: the Vite frontend and the Express API. `npm run
dev` at the root starts both together (via `concurrently`) and the Vite dev
server proxies `/api/*` to the backend, so the browser only ever talks to
`http://localhost:5173`.

```bash
npm install
npm run install:server   # installs server/ dependencies separately
npm run dev               # runs client (5173) + server (4000) together
npm run build              # production build of the frontend to /dist
```

The backend reads config from `server/.env` (copied from `server/.env.example`
on first setup — do this once):

```bash
cp server/.env.example server/.env
```

Its SQLite file lives at `server/data/towerhub.sqlite` and is created (and
seeded with the demo accounts below) automatically on first run.

Demo account (real account in the SQLite database, seeded by `server/src/db.js`
with `email_verified` already set — see below for why that matters):

| Role  | Email               | Password   |
|-------|---------------------|------------|
| Admin | admin@towerhub.io   | admin123   |

Any other account is one you registered yourself — and per the section
below, it needs to be verified before it can sign in.

## Structure

```
src/                    frontend (Vite/React)
  types/                 shared types for mods/comments/ratings
  types/auth.ts           types for what the backend returns (SafeUser, PublicUser, AdminUser…)
  data/seed.ts            demo mod/comment/rating records (still simulated, see below)
  lib/api.ts               fetch wrapper: access token in memory, auto-refresh-on-401,
                            + apiUpload/apiUploadWithProgress for real multipart uploads
  services/authService.ts  calls the real backend for everything account-related
  services/userService.ts  public profile lookups
  services/adminService.ts user management + login-attempt audit log
  services/uploadService.ts uploads real files to the backend (images, mod packages)
  services/modService.ts,commentService.ts,ratingService.ts   record metadata only (localStorage)
  context/                AuthContext (session) and ToastContext (notifications)
  components/              reusable UI, incl. components/account/SecuritySettings.tsx
  pages/                   one per route

server/                 backend (Express + SQLite + real file storage)
  src/db.js               schema + seed (better-sqlite3)
  src/lib/                 hashing, JWT/refresh tokens, TOTP, cookies, mailer stub
  src/middleware/          requireAuth/requireAdmin, rate limiters
  src/routes/               auth.routes.js, twofactor.routes.js, users.routes.js,
                            admin.routes.js, uploads.routes.js
  uploads/                 real uploaded files land here (images/, mods/) — gitignored
```

## The authentication system

This is a real implementation, not a mock — every piece below is backed by
actual database rows, actual cryptography, and actual expiring tokens:

- **Password hashing** — bcrypt (`bcryptjs`, 12 rounds). Plaintext passwords
  are never stored or logged.
- **Access + refresh tokens** — short-lived JWT access token (15 min) kept
  **in memory only** on the client (never localStorage, so it isn't readable
  by an XSS payload), paired with a long-lived refresh token in an `httpOnly`
  cookie scoped to `/api/auth`. Refresh tokens are rotated on every use and
  stored server-side only as a salted hash — a stolen DB row alone can't be
  replayed.
- **Real TOTP two-factor authentication** — `POST /api/auth/2fa/setup`
  generates an actual TOTP secret and a scannable QR code (`otplib` +
  `qrcode`). It works with a real authenticator app (Google Authenticator,
  Authy, 1Password, etc.), not a fake code.
- **Account lockout** — 5 failed logins for the same email within 15 minutes
  locks that email out, independent of per-IP rate limiting (`express-rate-limit`)
  on `/login`, `/register`, and `/forgot-password`.
- **Session management** — every refresh token is a listed "session" the
  account owner can see (device/created/expires, and whether it's
  "remembered" or session-only) and revoke individually, or all at once
  ("sign out of all devices"), from Profile → Security. Changing your
  password automatically revokes every *other* session.
- **"Remember me"** — the login form's checkbox controls both how long the
  refresh token is valid server-side (30 days vs `SESSION_ONLY_TTL_HOURS`,
  12h by default) *and* whether the cookie itself is written to disk: with
  it unchecked, `Set-Cookie` carries no `Expires`/`Max-Age`, so the browser
  treats `refresh_token` as a session cookie and drops it the moment the
  browser closes — not just a shorter timer while the tab stays open. The
  choice is stored per-token (`remember_me` on `refresh_tokens`) and
  survives refresh-token rotation, so it doesn't reset every 15 minutes when
  the access token renews.
- **Email verification is required to sign in** — `POST /register` creates
  the account and emails a verification link, but does **not** start a
  session: `POST /login` responds `403 EMAIL_NOT_VERIFIED` for an unverified
  email, even with the correct password. The login form surfaces this with
  an inline "Resend verification email" action instead of a dead-end error.
  Opening the verification link (`GET /verify-email?token=…`) both marks the
  address verified *and* signs the browser in on the spot, so the link
  itself is the last step. Retrying a login before verifying doesn't count
  toward the account-lockout threshold — correct credentials aren't a failed
  guess.
- **Password reset** — same real, expiring, single-use, SHA-256-hashed-at-rest
  token pattern as verification.
- **Email delivery is simulated** — the only deliberately fake part of the
  whole system. There's no SMTP provider configured, so
  `simulateSendEmail()` logs the email to the server console and the API
  hands the link back to the client directly (`devPreviewUrl` / `devVerifyUrl`,
  clearly labeled, and only when `NODE_ENV !== 'production'`). Swap in a real
  provider (Postmark, SES, Resend…) and delete that field — nothing else
  about either flow changes, since the token/expiry/enforcement logic is
  already real.
- **Audit trail** — every login attempt (success or failure, with a reason
  and IP) is logged and visible to admins under Admin panel → Login activity.

## File storage

Screenshots, mod packages, and avatars are real uploads, not base64 blobs
stuffed into `localStorage`:

- `POST /api/uploads/images` and `POST /api/uploads/mods` (both
  `requireAuth`) accept real `multipart/form-data`, handled by `multer`,
  and write to `server/uploads/images/` and `server/uploads/mods/` with
  randomly-generated filenames (the original filename is preserved
  separately as metadata, so downloads still show the real name).
- Files are served back publicly from `/api/files/…` (a deliberate sibling
  of `/api/uploads`, not a sub-path of it — otherwise it would inherit that
  router's `requireAuth`) — no auth required to view/download, matching a
  public mod catalog.
- Limits are enforced server-side by `multer`'s `limits.fileSize` (20MB per
  image, 2GB per mod file) — not just a client-side check that a modified
  request could bypass.
- The mod file upload uses `XMLHttpRequest` (`apiUploadWithProgress` in
  `lib/api.ts`) instead of `fetch`, specifically to get real
  `upload.onprogress` events for the progress bar — `fetch` has no
  browser-standard way to report upload progress.
- **What this isn't:** a cloud object store. It's real disk storage on
  *this* server, which is genuinely "external" to the browser (files
  survive a refresh, a new tab, another device) but is not S3/R2/GCS. There's
  no CDN, no per-user storage quota, and no antivirus/content scanning.
  Swapping in real object storage later means changing `multer.diskStorage`
  to `multer-s3` (or uploading straight from the client to a signed URL) in
  `server/src/routes/uploads.routes.js` — the rest of the app (which only
  ever deals with the returned `url` string) doesn't change.

## What's simulated vs. production

### Accounts & authentication — **real**, see above
The one deliberate gap is **email delivery** (no SMTP configured, see above).
Also worth knowing for a production deploy:
- `server/.env` ships with placeholder dev secrets (`JWT_ACCESS_SECRET`,
  `JWT_REFRESH_PEPPER`). Generate real random values before deploying —
  the server warns on boot if it detects the defaults under
  `NODE_ENV=production`.
- Cookies are set without `Secure` in dev (`SECURE_COOKIES=false`) since
  localhost isn't HTTPS. Set `SECURE_COOKIES=true` behind HTTPS in production.
- SQLite is fine for a demo/small deployment; a multi-instance production
  deployment would want Postgres instead (the query layer in `server/src/db.js`
  and `routes/*.js` is small enough to port directly).

### File uploads (images, mod packages, avatars) — **real**, see above

### Mod/comment/rating *records* — **still simulated in the browser**
The actual files are real now (see above); what's still simulated is the
*metadata* — title, description, category, star ratings, comment text. This
part intentionally wasn't moved to the backend (the ask was real auth + real
file storage, not a full backend migration):
- **Now:** `localStorage` via `src/services/db.ts`, behind `modService.ts` /
  `commentService.ts` / `ratingService.ts`, which already look and behave
  like a real async API (`Promise`, typed `ApiError`s, simulated latency in
  `services/http.ts`). Mods reference `authorId`s that match the real
  backend users seeded above, so profiles/uploads line up correctly. A
  `Mod`'s `screenshots[]` and `fileMeta.url` are real `/api/files/…` URLs —
  only the surrounding record (title, description, status…) lives in
  localStorage.
- **Production:** replace `db.ts`'s mod/comment/rating collections with
  real backend tables (the same way accounts and file storage were just
  moved) — components and pages don't need to change, since they already
  consume `services/*` as an async API.

## Visual identity

A palette of greens over near-pure black (`ink` + `signal` in
`tailwind.config.js`), with amber accents reserved for alerts (moderation).
**Space Grotesk** for headings, **Inter** for body text, and **IBM Plex
Mono** for data/labels (version, size, categories) — aiming for a control
tower HUD/radar feel rather than a generic SaaS dashboard look. The logo and
mod screenshots are code-generated SVGs (`lib/placeholder.ts`,
`RadarMark.tsx`), so the demo doesn't depend on any external image.

## Categories

Schedules · Liveries · Traffic · Airports · Tools · Misc · Instruments · Utility
