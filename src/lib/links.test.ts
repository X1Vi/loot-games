import { describe, expect, it } from 'vitest'
import { FEEDBACK_URL, feedbackUrl } from './links'

describe('feedbackUrl', () => {
  it('keeps the loot-terminal site tag', () => {
    const url = new URL(feedbackUrl('https://example.test/?game=1'))
    expect(url.origin + url.pathname).toBe(new URL(FEEDBACK_URL).origin + new URL(FEEDBACK_URL).pathname)
    expect(url.searchParams.get('site')).toBe('loot-terminal')
  })

  it('adds the page when provided', () => {
    const url = new URL(feedbackUrl('https://example.test/?game=1'))
    expect(url.searchParams.get('page')).toBe('https://example.test/?game=1')
  })

  it('omits the page when none is available', () => {
    expect(new URL(feedbackUrl('')).searchParams.has('page')).toBe(false)
  })
})
