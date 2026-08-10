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
  refreshTokenTtlDays: Number(process.env.REFRESH_TOKEN_TTL_DAYS ?? 30),

  loginMaxAttempts: Number(process.env.LOGIN_MAX_ATTEMPTS ?? 5),
  loginLockoutWindowMin: Number(process.env.LOGIN_LOCKOUT_WINDOW_MIN ?? 15),

  secureCookies: bool(process.env.SECURE_COOKIES, false),
}

if (config.isProd && config.jwtAccessSecret.startsWith('dev-')) {
  console.warn(
    '[towerhub-server] WARNING: running with NODE_ENV=production but JWT_ACCESS_SECRET is still the dev default. Set real secrets before deploying.'
  )
}
