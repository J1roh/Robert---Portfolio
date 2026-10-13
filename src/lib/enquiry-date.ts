// CMS inbox dates as in the owner's design: "Today · 09:42", "Yesterday · 16:18", "18 Sep · 11:03",
// plus the year once it isn't the current one ("18 Sep 2025 · 11:03"). Local time.
export function formatEnquiryDate(iso: string, now = new Date()): string {
  const date = new Date(iso)
  const time = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  const days = Math.round((startOfDay(now) - startOfDay(date)) / 864e5)
  if (days === 0) return `Today · ${time}`
  if (days === 1) return `Yesterday · ${time}`
  const sameYear = date.getFullYear() === now.getFullYear()
  const day = date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', ...(sameYear ? {} : { year: 'numeric' }) })
  return `${day} · ${time}`
}
