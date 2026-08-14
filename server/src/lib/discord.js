import { config } from '../config.js'

const SIGNAL_GREEN = 0x22b56d // matches the frontend's --signal-500 brand color

function truncate(text, max) {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text
}

/**
 * Posts a "mod approved" embed to the configured Discord webhook — fired
 * when an admin approves a mod, not on upload (a mod might sit pending, or
 * get rejected, and nobody wants a channel full of those). No-ops (and
 * logs why) when DISCORD_WEBHOOK_URL isn't set, same spirit as
 * `simulateSendEmail` — real integration, optional configuration.
 */
export async function sendModApprovedEmbed({ title, description, category, version, authorName, thumbnailUrl, url }) {
  if (!config.discordWebhookUrl) {
    console.log(`[towerhub-server] Discord webhook not configured — would have announced "${title}".`)
    return { sent: false, reason: 'not_configured' }
  }

  const embed = {
    title: truncate(`✅ ${title}`, 256),
    description: truncate(description, 300),
    url,
    color: SIGNAL_GREEN,
    author: { name: authorName },
    thumbnail: thumbnailUrl ? { url: thumbnailUrl } : undefined,
    fields: [
      { name: 'Category', value: category, inline: true },
      { name: 'Version', value: version, inline: true },
    ],
    footer: { text: 'TowerHub · now live in the catalog' },
    timestamp: new Date().toISOString(),
  }

  try {
    const res = await fetch(config.discordWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'TowerHub', embeds: [embed] }),
    })
    if (!res.ok) {
      console.error('[towerhub-server] Discord webhook responded with an error:', res.status, await res.text().catch(() => ''))
      return { sent: false, reason: 'discord_error' }
    }
    return { sent: true }
  } catch (err) {
    console.error('[towerhub-server] Discord webhook request failed:', err)
    return { sent: false, reason: 'network_error' }
  }
}
