import { config } from '../config.js'

/**
 * There is no real SMTP/email provider configured in this environment, so
 * "sending" an email just logs it to the server console and returns the
 * action URL so routes can optionally hand it back to the client in dev
 * mode. In production, replace this with a real provider (Postmark, SES,
 * Resend, etc.) and stop returning `devPreviewUrl` from the API responses.
 */
export function simulateSendEmail({ to, subject, actionUrl }) {
  console.log(
    `\n[towerhub-server] ✉️  Simulated email\n  To: ${to}\n  Subject: ${subject}\n  Link: ${actionUrl}\n`
  )
  return { devPreviewUrl: config.isProd ? undefined : actionUrl }
}
