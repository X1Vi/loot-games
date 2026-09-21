import { describe, it, expect } from 'vitest'
import { attachCheapestStores, buildStoreComparison, summarizeComparison } from './compare'
import type { CheapSharkDeal, CheapSharkGameSearchResult, CheapSharkStoreDeal } from '../types'

function deal(storeID: string, price: string, retailPrice = '59.99', savings = '0'): CheapSharkStoreDeal {
  return {
    storeID,
    dealID: `deal-${storeID}`,
    price,
    retailPrice,
    savings,
  }
}

function searchDeal(gameID: string, storeID: string, salePrice: string): CheapSharkDeal {
  return {
    internalName: gameID,
    title: gameID,
    metacriticLink: null,
    dealID: `d-${gameID}-${storeID}`,
    storeID,
    gameID,
    salePrice,
    normalPrice: salePrice,
    isOnSale: '0',
    savings: '0',
    metacriticScore: '0',
    steamRatingText: null,
    steamRatingPercent: '0',
    steamRatingCount: '0',
    steamAppID: null,
    releaseDate: 0,
    lastChange: 0,
    dealRating: '0',
    thumb: '',
  }
}

function searchResult(gameID: string): CheapSharkGameSearchResult {
  return {
    gameID,
    steamAppID: null,
    cheapest: '0',
    cheapestDealID: 'x',
    external: gameID,
    internalName: gameID,
    thumb: '',
  }
}

const STORES = { '1': 'Steam', '2': 'GOG', '3': 'Fanatical' }

describe('buildStoreComparison', () => {
  it('sorts stores by price ascending and flags the cheapest', () => {
    const rows = buildStoreComparison(
      [deal('2', '34.99'), deal('1', '29.99'), deal('3', '26.99')],
      STORES,
    )
    expect(rows.map((r) => r.storeName)).toEqual(['Fanatical', 'Steam', 'GOG'])
    expect(rows[0].isCheapest).toBe(true)
    expect(rows.filter((r) => r.isCheapest)).toHaveLength(1)
  })

  it('computes delta from best price in dollars and percent', () => {
    const rows = buildStoreComparison([deal('2', '20'), deal('1', '25')], STORES)
    const steam = rows.find((r) => r.storeName === 'Steam')!
    expect(steam.deltaFromBest).toBeCloseTo(5)
    expect(steam.deltaFromBestPct).toBeCloseTo(25)
    expect(rows[0].deltaFromBest).toBe(0)
  })

  it('filters out inactive stores when given an active set', () => {
    const rows = buildStoreComparison(
      [deal('1', '10'), deal('2', '12'), deal('3', '15')],
      STORES,
      new Set(['1', '3']),
    )
    expect(rows.map((r) => r.storeName)).toEqual(['Steam', 'Fanatical'])
  })

  it('keeps the lowest price when a store appears twice', () => {
    const rows = buildStoreComparison([deal('1', '19.99'), deal('1', '9.99')], STORES)
    expect(rows).toHaveLength(1)
    expect(rows[0].price).toBe(9.99)
  })

  it('flags only the first row when multiple stores tie for cheapest', () => {
    const rows = buildStoreComparison([deal('1', '10'), deal('2', '10'), deal('3', '12')], STORES)
    expect(rows.filter((r) => r.isCheapest)).toHaveLength(1)
    expect(rows[0].storeName).toBe('GOG')
    expect(rows[1].deltaFromBest).toBe(0)
    expect(rows[2].deltaFromBest).toBe(2)
  })

  it('falls back to a store label for unknown store ids', () => {
    const rows = buildStoreComparison([deal('99', '5')], STORES)
    expect(rows[0].storeName).toBe('Store 99')
  })

  it('derives savings percent from retail when the API omits it', () => {
    const rows = buildStoreComparison([deal('1', '30', '60', 'not-a-number')], STORES)
    expect(rows[0].savingsPct).toBeCloseTo(50)
  })

  it('returns an empty list for no deals', () => {
    expect(buildStoreComparison([], STORES)).toEqual([])
  })
})

describe('summarizeComparison', () => {
  it('summarizes cheapest, spread and savings', () => {
    const rows = buildStoreComparison(
      [deal('1', '20', '50'), deal('2', '25', '50'), deal('3', '30', '50')],
      STORES,
    )
    const summary = summarizeComparison(rows)
    expect(summary.storeCount).toBe(3)
    expect(summary.cheapest?.storeName).toBe('Steam')
    expect(summary.mostExpensive?.storeName).toBe('Fanatical')
    expect(summary.bestSavings).toBeCloseTo(30)
    expect(summary.spread).toBeCloseTo(10)
    expect(summary.spreadPct).toBeCloseTo(50)
  })

  it('flags a historic low when the best price is at or below it', () => {
    const rows = buildStoreComparison([deal('1', '10')], STORES)
    expect(summarizeComparison(rows, 12).atHistoricLow).toBe(true)
    expect(summarizeComparison(rows, 8).atHistoricLow).toBe(false)
  })

  it('handles empty rows', () => {
    const summary = summarizeComparison([])
    expect(summary.storeCount).toBe(0)
    expect(summary.cheapest).toBeNull()
    expect(summary.atHistoricLow).toBe(false)
  })
})

describe('attachCheapestStores', () => {
  it('attaches the store offering the lowest price for each result', () => {
    const results = attachCheapestStores(
      [searchResult('g1'), searchResult('g2')],
      [searchDeal('g1', '1', '10.00'), searchDeal('g1', '2', '7.50'), searchDeal('g2', '3', '4.00')],
    )
    expect(results[0].cheapestStoreID).toBe('2')
    expect(results[1].cheapestStoreID).toBe('3')
  })

  it('leaves the store unknown when no matching deal is found', () => {
    const results = attachCheapestStores([searchResult('g1')], [searchDeal('g9', '1', '1.00')])
    expect(results[0].cheapestStoreID).toBeNull()
  })

  it('ignores deals with an unparseable price', () => {
    const results = attachCheapestStores([searchResult('g1')], [searchDeal('g1', '1', 'n/a')])
    expect(results[0].cheapestStoreID).toBeNull()
  })
})
