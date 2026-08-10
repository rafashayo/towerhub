import rateLimit from 'express-rate-limit'

const jsonHandler = (req, res) => {
  res.status(429).json({ message: 'Too many requests. Please slow down and try again shortly.' })
}

// Coarse per-IP guard in front of the DB-backed per-email lockout in auth.routes.js.
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: jsonHandler,
})

export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 15,
  standardHeaders: true,
  legacyHeaders: false,
  handler: jsonHandler,
})

export const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: jsonHandler,
})
