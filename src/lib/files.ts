// Client-side pre-checks only — the backend enforces the real limits too
// (server/src/routes/uploads.routes.js), these just fail fast before a
// pointless upload attempt.
export const MAX_IMAGE_BYTES = 20 * 1024 * 1024 // 20MB — real server-side file now, not base64-in-localStorage
export const MAX_MOD_FILE_BYTES = 2 * 1024 * 1024 * 1024 // 2GB — real disk storage on the backend
