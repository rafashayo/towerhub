import 'dotenv/config'

function bool(v, fallback) {
  if (v === undefined) return fallback
  return v === 'true' || v === '1'
}

export const config = {
  port: Number(process.env.PORT ?? 4000),
  clientOrigin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173',
  isProd: process.env.NODE_ENV === 'production',

  jwtAccessSecret: process.env.JWT_ACCESS_SECRET ?? 'dev-access-secret-change-me',
  jwtRefreshPepper: process.env.JWT_REFRESH_PEPPER ?? 'dev-refresh-pepper-change-me',
  accessTokenTtl: process.env.ACCESS_TOKEN_TTL ?? '15m',
  // "Remember me" checked: a persistent refresh cookie lasting this many days.
  refreshTokenTtlDays: Number(process.env.REFRESH_TOKEN_TTL_DAYS ?? 30),
  // "Remember me" unchecked: a browser-session cookie (gone when the browser
  // closes), additionally capped server-side at this many hours so a tab
  // left open forever doesn't equal an unbounded session.
  sessionOnlyTtlHours: Number(process.env.SESSION_ONLY_TTL_HOURS ?? 12),

  loginMaxAttempts: Number(process.env.LOGIN_MAX_ATTEMPTS ?? 5),
  loginLockoutWindowMin: Number(process.env.LOGIN_LOCKOUT_WINDOW_MIN ?? 15),

  secureCookies: bool(process.env.SECURE_COOKIES, false),

  // Optional — leave unset to no-op. See lib/discord.js.
  discordWebhookUrl: process.env.DISCORD_WEBHOOK_URL || '',
}

if (config.isProd && config.jwtAccessSecret.startsWith('dev-')) {
  console.warn(
    '[towerhub-server] WARNING: running with NODE_ENV=production but JWT_ACCESS_SECRET is still the dev default. Set real secrets before deploying.'
  )
}
