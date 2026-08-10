import { authenticator } from 'otplib'
import QRCode from 'qrcode'

authenticator.options = { window: 1 } // tolerate 1 step (±30s) of clock drift

export function generateTotpSecret() {
  return authenticator.generateSecret()
}

export function totpKeyUri(accountName, secret) {
  return authenticator.keyuri(accountName, 'TowerHub', secret)
}

export function verifyTotp(code, secret) {
  if (!code || !secret) return false
  try {
    return authenticator.check(String(code).trim(), secret)
  } catch {
    return false
  }
}

export function totpQrCodeDataUrl(otpauthUrl) {
  return QRCode.toDataURL(otpauthUrl, { margin: 1, width: 220 })
}
