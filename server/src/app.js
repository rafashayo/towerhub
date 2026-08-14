import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import { config } from './config.js'
import { authRouter } from './routes/auth.routes.js'
import { twoFactorRouter } from './routes/twofactor.routes.js'
import { usersRouter } from './routes/users.routes.js'
import { adminRouter } from './routes/admin.routes.js'
import { uploadsRouter, UPLOADS_DIR } from './routes/uploads.routes.js'
import { notificationsRouter } from './routes/notifications.routes.js'

export const app = express()

app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: { policy: 'cross-origin' } }))
app.use(cors({ origin: config.clientOrigin, credentials: true }))
app.use(cookieParser())
app.use(express.json({ limit: '256kb' })) // real files go through multipart /api/uploads now, not JSON

app.get('/api/health', (_req, res) => res.json({ ok: true }))

app.use('/api/auth/2fa', twoFactorRouter)
app.use('/api/auth', authRouter)
app.use('/api/users', usersRouter)
app.use('/api/admin', adminRouter)
app.use('/api/uploads', uploadsRouter)
app.use('/api/notifications', notificationsRouter)
// Deliberately a sibling path, not a sub-path of /api/uploads — that router
// applies requireAuth to everything under its mount prefix, which would
// otherwise also gate this public, unauthenticated static file serving.
app.use('/api/files', express.static(UPLOADS_DIR, { maxAge: '1y', immutable: true }))

app.use('/api', (_req, res) => res.status(404).json({ message: 'Not found.' }))

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('[towerhub-server] Unhandled error:', err)
  res.status(500).json({ message: 'Internal server error.' })
})
