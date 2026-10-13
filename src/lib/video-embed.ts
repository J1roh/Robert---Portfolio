// Turns a pasted YouTube/Vimeo link into an embed URL, or null if it isn't one.
// The iframe only ever gets a URL rebuilt from the extracted ID, never the pasted string.
export function embedUrl(url: string): string | null {
  let u: URL
  try {
    u = new URL(url.trim())
  } catch {
    return null
  }
  const host = u.hostname.replace(/^(www\.|m\.)/, '')
  const parts = u.pathname.split('/').filter(Boolean)
  let id: string | null | undefined
  if (host === 'youtu.be') id = parts[0]
  else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    id = parts[0] === 'watch' ? u.searchParams.get('v') : ['shorts', 'embed', 'live'].includes(parts[0]) ? parts[1] : null
  } else if (host === 'vimeo.com' || host === 'player.vimeo.com') {
    id = parts.find((p) => /^\d+$/.test(p))
    return id ? `https://player.vimeo.com/video/${id}` : null
  }
  return id && /^[\w-]{11}$/.test(id) ? `https://www.youtube-nocookie.com/embed/${id}` : null
}
