function parseFavorites(json) {
  try {
    const arr = JSON.parse(json ?? '[]')
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

/** Full self-view — returned only to the account owner (/me, login, register, refresh). */
export function toPrivateUser(row) {
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    avatarUrl: row.avatar_url,
    bio: row.bio,
    role: row.role,
    status: row.status,
    favoriteModIds: parseFavorites(row.favorite_mod_ids),
    createdAt: row.created_at,
    emailVerified: !!row.email_verified,
    totpEnabled: !!row.totp_enabled,
  }
}

/** What anyone can see on a public profile page — no email, no security flags. */
export function toPublicUser(row) {
  return {
    id: row.id,
    username: row.username,
    avatarUrl: row.avatar_url,
    bio: row.bio,
    role: row.role,
    createdAt: row.created_at,
  }
}

/** Admin user-management listing — includes moderation-relevant fields, never the TOTP secret. */
export function toAdminUser(row) {
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    avatarUrl: row.avatar_url,
    role: row.role,
    status: row.status,
    emailVerified: !!row.email_verified,
    twoFactorEnabled: !!row.totp_enabled,
    createdAt: row.created_at,
  }
}
