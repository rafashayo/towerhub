// Node port of the frontend's src/lib/utils.ts#avatarFor, kept visually
// consistent with client-generated avatars. Used both to seed demo users
// and as the default avatar assigned to every newly registered account
// (see routes/auth.routes.js `register`).
const BLOB_PATHS = [
  'M40,15 C55,15 65,25 65,40 C65,55 55,65 40,65 C25,65 15,55 15,40 C15,25 25,15 40,15 Z',
  'M40,14 C58,15 66,28 62,44 C59,58 46,66 32,63 C18,60 12,46 16,32 C20,18 30,13 40,14 Z',
  'M40,15 C56,14 65,27 63,42 C61,57 48,65 34,62 C21,59 14,47 17,33 C20,19 28,16 40,15 Z',
  'M38,14 C54,12 67,24 65,40 C64,54 52,66 37,64 C22,62 14,50 16,35 C18,21 26,16 38,14 Z',
]

/**
 * Default avatar: a friendly rounded "blob" face wearing an ATC-style
 * headset (headband + ear cups + boom mic), tinted to the brand's green
 * palette and varied deterministically by seed (username) so the same
 * person always gets the same face.
 */
export function avatarFor(seed) {
  const sum = Array.from(seed).reduce((a, c) => a + c.charCodeAt(0), 0)
  const hue = 120 + (sum % 60)
  const blob = BLOB_PATHS[sum % BLOB_PATHS.length]

  const bg = `hsl(${hue},25%,9%)`
  const face = `hsl(${hue},42%,56%)`
  const headset = `hsl(${hue},20%,15%)`
  const accent = `hsl(${hue},75%,60%)`

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">
    <rect width="80" height="80" fill="${bg}"/>
    <path d="${blob}" fill="${face}"/>
    <path d="M13,36 Q40,4 67,36" stroke="${headset}" stroke-width="5" stroke-linecap="round" fill="none"/>
    <rect x="4" y="30" width="13" height="20" rx="6.5" fill="${headset}" stroke="${accent}" stroke-width="1.5"/>
    <rect x="63" y="30" width="13" height="20" rx="6.5" fill="${headset}" stroke="${accent}" stroke-width="1.5"/>
    <ellipse cx="31" cy="38" rx="3.2" ry="4.2" fill="#12181a"/>
    <ellipse cx="49" cy="38" rx="3.2" ry="4.2" fill="#12181a"/>
    <circle cx="24" cy="46" r="3.2" fill="#ffffff" opacity="0.22"/>
    <circle cx="56" cy="46" r="3.2" fill="#ffffff" opacity="0.22"/>
    <path d="M31,49 Q40,54 49,49" stroke="#12181a" stroke-width="2.2" stroke-linecap="round" fill="none"/>
    <path d="M10,48 Q6,60 28,58" stroke="${headset}" stroke-width="2.2" stroke-linecap="round" fill="none"/>
    <circle cx="28" cy="58" r="2.8" fill="${accent}"/>
  </svg>`

  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}
