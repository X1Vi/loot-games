import type { CheapSharkDeal } from '../types'
import { fetchWithCorsFallback } from './utils'

const CHEAPSHARK_API = 'https://www.cheapshark.com/api/1.0/deals'

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
