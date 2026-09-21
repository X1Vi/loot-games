import type {
  CheapSharkDeal,
  CheapSharkGameSearchResult,
  CheapSharkSearchResultWithStore,
  CheapSharkStoreDeal,
} from '../types'

export interface StorePriceRow {
  storeID: string
  storeName: string
  dealID: string
  price: number
  retailPrice: number
  savingsPct: number
  deltaFromBest: number
  deltaFromBestPct: number
  isCheapest: boolean
}

export interface ComparisonSummary {
  storeCount: number
  cheapest: StorePriceRow | null
  mostExpensive: StorePriceRow | null
  bestSavings: number
  bestSavingsPct: number
  spread: number
  spreadPct: number
  atHistoricLow: boolean
}

export function formatPrice(value: number): string {
  return `$${value.toFixed(2)}`
}

export function attachCheapestStores(
  results: CheapSharkGameSearchResult[],
  deals: CheapSharkDeal[],
): CheapSharkSearchResultWithStore[] {
  const cheapestStoreByGame = new Map<string, { price: number; storeID: string }>()
  for (const deal of deals) {
    const price = Number(deal.salePrice)
    if (!Number.isFinite(price)) continue
    const current = cheapestStoreByGame.get(deal.gameID)
    if (!current || price < current.price) {
      cheapestStoreByGame.set(deal.gameID, { price, storeID: deal.storeID })
    }
  }

  return results.map((result) => ({
    ...result,
    cheapestStoreID: cheapestStoreByGame.get(result.gameID)?.storeID ?? null,
  }))
}

export function buildStoreComparison(
  deals: CheapSharkStoreDeal[],
  storeMap: Record<string, string>,
  activeStoreIds?: Set<string> | null,
): StorePriceRow[] {
  const byStore = new Map<string, CheapSharkStoreDeal>()

  for (const deal of deals) {
    if (activeStoreIds && activeStoreIds.size > 0 && !activeStoreIds.has(deal.storeID)) continue
    const price = Number(deal.price)
    if (!Number.isFinite(price)) continue
    const existing = byStore.get(deal.storeID)
    if (!existing || price < Number(existing.price)) {
      byStore.set(deal.storeID, deal)
    }
  }

  const rows = [...byStore.values()].map((deal) => {
    const price = Number(deal.price)
    const retailPrice = Number(deal.retailPrice)
    return {
      storeID: deal.storeID,
      storeName: storeMap[deal.storeID] ?? `Store ${deal.storeID}`,
      dealID: deal.dealID,
      price,
      retailPrice: Number.isFinite(retailPrice) && retailPrice > 0 ? retailPrice : price,
      savingsPct: Number(deal.savings),
      deltaFromBest: 0,
      deltaFromBestPct: 0,
      isCheapest: false,
    }
  })

  rows.sort((a, b) => a.price - b.price || a.storeName.localeCompare(b.storeName))
  if (rows.length === 0) return rows

  const best = rows[0].price
  rows[0].isCheapest = true
  for (const row of rows) {
    row.deltaFromBest = row.price - best
    row.deltaFromBestPct = best > 0 ? (row.deltaFromBest / best) * 100 : 0
    if (!Number.isFinite(row.savingsPct)) {
      row.savingsPct = row.retailPrice > 0 ? ((row.retailPrice - row.price) / row.retailPrice) * 100 : 0
    }
  }

  return rows
}

export function summarizeComparison(
  rows: StorePriceRow[],
  cheapestPriceEver?: number,
): ComparisonSummary {
  if (rows.length === 0) {
    return {
      storeCount: 0,
      cheapest: null,
      mostExpensive: null,
      bestSavings: 0,
      bestSavingsPct: 0,
      spread: 0,
      spreadPct: 0,
      atHistoricLow: false,
    }
  }

  const cheapest = rows[0]
  const mostExpensive = rows[rows.length - 1]
  const spread = mostExpensive.price - cheapest.price
  const bestSavings = cheapest.retailPrice - cheapest.price

  return {
    storeCount: rows.length,
    cheapest,
    mostExpensive,
    bestSavings,
    bestSavingsPct: cheapest.retailPrice > 0 ? (bestSavings / cheapest.retailPrice) * 100 : 0,
    spread,
    spreadPct: cheapest.price > 0 ? (spread / cheapest.price) * 100 : 0,
    atHistoricLow:
      cheapestPriceEver !== undefined &&
      Number.isFinite(cheapestPriceEver) &&
      cheapest.price <= cheapestPriceEver,
  }
}
