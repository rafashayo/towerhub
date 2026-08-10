function hashSeed(seed: string): number {
  return Array.from(seed).reduce((a, c) => a * 31 + c.charCodeAt(0), 7) >>> 0
}

/**
 * Generates a self-contained SVG "screenshot" so the demo has zero external
 * image dependencies. Stylized as a simplified radar / airfield scene tinted
 * to the brand palette, with the mod title stamped as a HUD-style label.
 */
export function generateScreenshot(seed: string, label: string): string {
  const h = hashSeed(seed)
  const hue = 132 + (h % 30)
  const rings = 3 + (h % 3)
  const runwayRot = (h % 40) - 20
  const blips = Array.from({ length: 5 }, (_, i) => {
    const a = ((h >> i) % 360) * (Math.PI / 180)
    const r = 40 + ((h >> (i + 2)) % 110)
    return { x: 300 + Math.cos(a) * r, y: 190 + Math.sin(a) * r * 0.55 }
  })

  const ringEls = Array.from({ length: rings }, (_, i) => {
    const r = 35 + i * 45
    return `<circle cx="300" cy="190" r="${r}" fill="none" stroke="hsl(${hue},70%,45%)" stroke-width="1" opacity="${0.35 - i * 0.06}"/>`
  }).join('')

  const blipEls = blips
    .map((b) => `<circle cx="${b.x.toFixed(1)}" cy="${b.y.toFixed(1)}" r="3" fill="hsl(${hue},80%,62%)" opacity="0.85"/>`)
    .join('')

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="380" viewBox="0 0 600 380">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="hsl(${hue},30%,7%)"/>
        <stop offset="100%" stop-color="hsl(${hue},35%,4%)"/>
      </linearGradient>
      <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse">
        <path d="M24 0H0V24" fill="none" stroke="hsl(${hue},60%,40%)" stroke-width="0.5" opacity="0.12"/>
      </pattern>
    </defs>
    <rect width="600" height="380" fill="url(#bg)"/>
    <rect width="600" height="380" fill="url(#grid)"/>
    ${ringEls}
    <g transform="rotate(${runwayRot} 300 190)">
      <rect x="270" y="60" width="60" height="260" fill="hsl(${hue},15%,20%)" opacity="0.8"/>
      <rect x="296" y="60" width="8" height="260" fill="hsl(${hue},60%,55%)" opacity="0.5"/>
      ${Array.from({ length: 6 }, (_, i) => `<rect x="292" y="${75 + i * 40}" width="16" height="18" fill="hsl(${hue},20%,10%)"/>`).join('')}
    </g>
    ${blipEls}
    <circle cx="300" cy="190" r="2.5" fill="hsl(${hue},90%,70%)"/>
    <rect x="0" y="330" width="600" height="50" fill="rgba(6,10,8,0.75)"/>
    <text x="24" y="362" font-family="monospace" font-size="15" fill="hsl(${hue},70%,72%)" letter-spacing="1">${label.slice(0, 42).toUpperCase()}</text>
  </svg>`

  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}
