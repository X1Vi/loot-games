import type {
  CheapSharkDeal,
  CheapSharkGameDetails,
  CheapSharkGameSearchResult,
  CheapSharkSearchResultWithStore,
} from '../types'
import { fetchWithCorsFallback } from './utils'
import { attachCheapestStores } from '../lib/compare'

const CHEAPSHARK_API = 'https://www.cheapshark.com/api/1.0/deals'
const CHEAPSHARK_GAMES_API = 'https://www.cheapshark.com/api/1.0/games'

export const AFFILIATE_TAG = ''

export function cheapsharkDealUrl(dealID: string): string {
  const base = `https://www.cheapshark.com/redirect?dealID=${dealID}`
  return AFFILIATE_TAG ? `${base}&a=${AFFILIATE_TAG}` : base
}

export async function fetchCheapSharkDeals(params?: {
  storeID?: string
  pageNumber?: number
  pageSize?: number
  sortBy?: string
  desc?: number
  lowerPrice?: number
  upperPrice?: number
  metacritic?: number
  steamRating?: number
  title?: string
  exact?: number
  aaa?: number
  steamworks?: number
  onSale?: number
  output?: string
}): Promise<CheapSharkDeal[]> {
  const url = new URL(CHEAPSHARK_API)
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) url.searchParams.set(key, String(value))
    })
  }

  const res = await fetchWithCorsFallback(url.toString())
  if (!res.ok) throw new Error(`CheapShark API error: ${res.status}`)
  return res.json()
}

export async function fetchCheapSharkStores(): Promise<
  Array<{ storeID: string; storeName: string; isActive: number }>
> {
  const res = await fetchWithCorsFallback('https://www.cheapshark.com/api/1.0/stores')
  if (!res.ok) throw new Error(`CheapShark stores error: ${res.status}`)
  return res.json()
}

export async function searchCheapSharkGames(
  title: string,
  limit = 12,
): Promise<CheapSharkGameSearchResult[]> {
  const url = new URL(CHEAPSHARK_GAMES_API)
  url.searchParams.set('title', title)
  url.searchParams.set('limit', String(limit))
  const res = await fetchWithCorsFallback(url.toString())
  if (!res.ok) throw new Error(`CheapShark game search error: ${res.status}`)
  return res.json()
}

export async function fetchCheapSharkGame(gameID: string): Promise<CheapSharkGameDetails> {
  const url = new URL(CHEAPSHARK_GAMES_API)
  url.searchParams.set('id', gameID)
  const res = await fetchWithCorsFallback(url.toString())
  if (!res.ok) throw new Error(`CheapShark game error: ${res.status}`)
  return res.json()
}

export async function searchCheapSharkGamesWithStores(
  title: string,
  limit = 12,
): Promise<CheapSharkSearchResultWithStore[]> {
  const [results, deals] = await Promise.all([
    searchCheapSharkGames(title, limit),
    fetchCheapSharkDeals({ title, pageSize: 60 }).catch(() => [] as CheapSharkDeal[]),
  ])
  return attachCheapestStores(results, deals)
}
