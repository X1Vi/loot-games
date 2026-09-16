function stamp(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

function escapeText(value: string): string {
  return value.replace(/([,;\\])/g, '\\$1').replace(/\n/g, '\\n')
}

export function downloadIcs(title: string, endDate: string, url: string): void {
  const end = new Date(endDate)
  if (isNaN(end.getTime())) return

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//LOOT TERMINAL//EN',
    'BEGIN:VEVENT',
    `UID:${stamp(end)}-${Math.random().toString(36).slice(2)}@loot-terminal`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(end)}`,
    `DTEND:${stamp(new Date(end.getTime() + 30 * 60_000))}`,
    `SUMMARY:${escapeText(`${title} — free until`)}`,
    `DESCRIPTION:${escapeText(url)}`,
    `URL:${url}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ]

  const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar' })
  const href = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = href
  anchor.download = `${title.replace(/[^a-z0-9]+/gi, '-').toLowerCase().slice(0, 40)}.ics`
  anchor.click()
  URL.revokeObjectURL(href)
}
