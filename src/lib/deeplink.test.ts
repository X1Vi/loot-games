import { describe, expect, it } from 'vitest'
import {
  buildGameLink,
  buildGameSearchLink,
  parseDeepLink,
  pickGameMatch,
  tabForDeepLink,
} from './deeplink'
import type { GameSearchMatch } from './deeplink'

const BASE = 'https://loot.test/'

const RESULTS: GameSearchMatch[] = [
  { gameID: '111', external: 'Star Wars Jedi: Survivor' },
  { gameID: '222', external: 'STAR WARS Outlaws' },
  { gameID: '333', external: 'STAR WARS Battlefront II' },
]

describe('buildGameLink', () => {
  it('encodes the game id into a shareable link', () => {
    expect(buildGameLink('12345', BASE)).toBe('https://loot.test/?game=12345')
  })

  it('drops stale query params and hashes', () => {
    expect(buildGameLink('12345', 'https://loot.test/?tab=deals#x')).toBe(
      'https://loot.test/?game=12345',
    )
  })

  it('encodes unsafe characters', () => {
    expect(buildGameLink('a b/c', BASE)).toContain('game=a+b%2Fc')
  })
})

describe('buildGameSearchLink', () => {
  it('carries the title as a fallback query', () => {
    expect(buildGameSearchLink('Control Ultimate Edition', BASE)).toBe(
      'https://loot.test/?q=Control+Ultimate+Edition',
    )
  })
})

describe('parseDeepLink', () => {
  it('parses a game id link', () => {
    expect(parseDeepLink('?game=222')).toEqual({ gameID: '222', query: null })
  })

  it('parses a title query link', () => {
    expect(parseDeepLink('?q=Star%20Wars%20Outlaws')).toEqual({
      gameID: null,
      query: 'Star Wars Outlaws',
    })
  })

  it('falls back to the query when the game id is invalid', () => {
    expect(parseDeepLink('?game=<script>&q=Hades')).toEqual({ gameID: null, query: 'Hades' })
  })

  it('returns null when nothing usable is present', () => {
    expect(parseDeepLink('')).toBeNull()
    expect(parseDeepLink('?game=')).toBeNull()
    expect(parseDeepLink('?q=%20%20')).toBeNull()
    expect(parseDeepLink('?game=<script>')).toBeNull()
  })
})

describe('tabForDeepLink', () => {
  it('routes game links to the compare tab', () => {
    expect(tabForDeepLink('?game=222')).toBe('compare')
    expect(tabForDeepLink('?q=Hades')).toBe('compare')
  })

  it('leaves plain visits alone', () => {
    expect(tabForDeepLink('')).toBeNull()
  })
})

describe('pickGameMatch', () => {
  it('finds an exact title match', () => {
    expect(pickGameMatch('star wars outlaws', RESULTS)).toBe('222')
  })

  it('normalizes punctuation and case', () => {
    expect(pickGameMatch('STAR WARS - Outlaws!', RESULTS)).toBe('222')
  })

  it('matches a multi-token query to a longer edition title', () => {
    expect(
      pickGameMatch('star wars outlaws', [
        { gameID: '222', external: 'STAR WARS Outlaws Deluxe Edition' },
      ]),
    ).toBe('222')
  })

  it('does not match a single-word query to a longer title', () => {
    expect(pickGameMatch('Hades', [{ gameID: '9', external: 'Hades II' }])).toBeNull()
  })

  it('rejects unrelated results instead of guessing', () => {
    expect(pickGameMatch('Metroid Prime', RESULTS)).toBeNull()
    expect(pickGameMatch('Battlefront', RESULTS)).toBeNull()
  })

  it('returns null without usable input', () => {
    expect(pickGameMatch('  ', RESULTS)).toBeNull()
    expect(pickGameMatch('Hades', [])).toBeNull()
  })
})

describe('share link back test', () => {
  it('round-trips a deal share into the right game', () => {
    const deal = { dealID: 'deal-1', gameID: '222', title: 'STAR WARS Outlaws' }
    const link = buildGameLink(deal.gameID, BASE)
    const search = new URL(link).search

    expect(tabForDeepLink(search)).toBe('compare')

    const parsed = parseDeepLink(search)
    expect(parsed?.gameID).toBe(deal.gameID)

    const resolved = pickGameMatch(deal.title, RESULTS)
    expect(resolved).toBe(parsed?.gameID)
  })

  it('round-trips a title-only share through the local query', () => {
    const deal = { dealID: 'deal-2', gameID: '0', title: 'Star Wars Outlaws' }
    const link =
      deal.gameID && deal.gameID !== '0'
        ? buildGameLink(deal.gameID, BASE)
        : buildGameSearchLink(deal.title, BASE)
    const parsed = parseDeepLink(new URL(link).search)

    expect(parsed?.query).toBe(deal.title)
    expect(pickGameMatch(parsed?.query ?? '', RESULTS)).toBe('222')
  })
})
