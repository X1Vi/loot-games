import { describe, expect, it, vi } from 'vitest'
import { SHARE_TARGETS, buildShareUrl, fullShareText, share, shareText } from './share'
import type { SharePayload } from './share'

const payload: SharePayload = {
  title: 'Kingdom Come: Deliverance II',
  url: 'https://loot-games.x1vi.workers.dev/?game=123',
  text: 'Cheapest I found today',
  tags: ['gaming', '#deal', 'pc games'],
  source: 'loot-games',
}

describe('shareText', () => {
  it('combines body and normalized hashtags', () => {
    expect(shareText(payload)).toBe('Cheapest I found today\n\n#gaming #deal #pcgames')
  })

  it('falls back to the title', () => {
    expect(shareText({ title: 'A deal', url: 'https://x.test' })).toBe('A deal')
  })
})

describe('fullShareText', () => {
  it('appends the URL once', () => {
    const text = fullShareText(payload)
    expect(text.indexOf(payload.url)).toBe(text.lastIndexOf(payload.url))
  })
})

describe('buildShareUrl', () => {
  it('offers both Bluesky and Skyforge', () => {
    const ids = SHARE_TARGETS.map((target) => target.id)
    expect(ids).toContain('bluesky')
    expect(ids).toContain('skyforge')
    expect(ids).toContain('copy-link')
  })

  it('builds a direct Bluesky compose URL', () => {
    expect(buildShareUrl('bluesky', payload)).toContain('https://bsky.app/intent/compose?text=')
  })

  it('builds a Skyforge composer URL with tags and source', () => {
    const url = new URL(buildShareUrl('skyforge', payload) ?? '')
    expect(url.origin).toBe('https://skyforge.x1vi.workers.dev')
    expect(url.searchParams.get('text')).toBe('Cheapest I found today\n\n#gaming #deal #pcgames')
    expect(url.searchParams.get('tags')).toBe('gaming,#deal,pc games')
    expect(url.searchParams.get('source')).toBe('loot-games')
  })

  it('rejects a non-https Skyforge URL', () => {
    expect(buildShareUrl('skyforge', payload, { skyforgeUrl: 'http://sf.test/' })).toBeNull()
  })

  it('allows a localhost Skyforge URL for local development', () => {
    const url = buildShareUrl('skyforge', payload, { skyforgeUrl: 'http://localhost:5177/' })
    expect(url).toContain('http://localhost:5177/')
  })

  it('builds WhatsApp, Telegram and Reddit URLs', () => {
    expect(buildShareUrl('whatsapp', payload)).toContain('https://wa.me/?text=')
    expect(buildShareUrl('telegram', payload)).toContain('https://t.me/share/url?url=')
    expect(buildShareUrl('reddit', payload)).toContain('https://www.reddit.com/submit?url=')
  })

  it('returns null for in-page targets', () => {
    expect(buildShareUrl('native', payload)).toBeNull()
    expect(buildShareUrl('copy', payload)).toBeNull()
    expect(buildShareUrl('copy-link', payload)).toBeNull()
  })
})

describe('share', () => {
  it('uses the system share sheet when available', async () => {
    const navigatorShare = vi.fn(async () => {})
    const outcome = await share('native', payload, { navigatorShare })
    expect(outcome.status).toBe('shared')
    expect(navigatorShare).toHaveBeenCalledOnce()
  })

  it('falls back to the clipboard', async () => {
    const writeText = vi.fn(async () => {})
    const outcome = await share('native', payload, { navigatorShare: null, clipboard: { writeText } })
    expect(outcome.status).toBe('copied')
    expect(writeText).toHaveBeenCalledWith(fullShareText(payload))
  })

  it('copies only the link for the copy-link target', async () => {
    const writeText = vi.fn(async () => {})
    const outcome = await share('copy-link', payload, { clipboard: { writeText } })
    expect(outcome.status).toBe('copied')
    expect(writeText).toHaveBeenCalledWith(payload.url)
  })

  it('opens URL targets', async () => {
    const open = vi.fn()
    const outcome = await share('skyforge', payload, { open })
    expect(outcome.status).toBe('opened')
    expect(open).toHaveBeenCalledWith(expect.stringContaining('skyforge'))
  })
})
