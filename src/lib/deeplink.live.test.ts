import { describe, expect, it } from 'vitest'
import { fetchWithCorsFallback } from '../api/utils'
import { buildGameLink, parseDeepLink, pickGameMatch } from './deeplink'
import type { CheapSharkDeal, CheapSharkGameSearchResult, CheapSharkGameDetails } from '../types'

const LIVE =
  (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env
    ?.LIVE_BACKTEST === '1'

const HEADERS = {
  'User-Agent': 'loot-terminal-backtest/1.0 (https://github.com/X1Vi/loot-games)',
}

describe.runIf(LIVE)('live share back test', () => {
  it('resolves a real CheapShark deal through its shared link', async () => {
    const dealsRes = await fetchWithCorsFallback(
      'https://www.cheapshark.com/api/1.0/deals?pageSize=20&onSale=1',
      { headers: HEADERS },
    )
    expect(dealsRes.ok).toBe(true)
    const deals = (await dealsRes.json()) as CheapSharkDeal[]
    const deal = deals.find((d) => d.gameID && d.gameID !== '0')
    expect(deal).toBeDefined()
    if (!deal) return

    const link = buildGameLink(deal.gameID, 'https://loot-games.x1vi.workers.dev/')
    const parsed = parseDeepLink(new URL(link).search)
    expect(parsed?.gameID).toBe(deal.gameID)

    const searchRes = await fetchWithCorsFallback(
      `https://www.cheapshark.com/api/1.0/games?title=${encodeURIComponent(deal.title)}&limit=12`,
      { headers: HEADERS },
    )
    expect(searchRes.ok).toBe(true)
    const results = (await searchRes.json()) as CheapSharkGameSearchResult[]
    const resolved = pickGameMatch(deal.title, results)
    expect(resolved).not.toBeNull()

    const detailsRes = await fetchWithCorsFallback(
      `https://www.cheapshark.com/api/1.0/games?id=${resolved}`,
      { headers: HEADERS },
    )
    expect(detailsRes.ok).toBe(true)
    const details = (await detailsRes.json()) as CheapSharkGameDetails
    expect(details.deals.length).toBeGreaterThan(0)

    console.log(
      `[back test] deal="${deal.title}" gameID=${deal.gameID} -> resolved=${resolved} "${details.info.title}" (${details.deals.length} store deals)`,
    )
  }, 60_000)
})
