import { describe, expect, it } from 'vitest'
import { STORE_ORIGIN, storeDealUrl, storeGameUrl, storePartnerFor } from './store'

describe('storePartnerFor', () => {
  it('maps known CheapShark stores to store partners', () => {
    expect(storePartnerFor('1')).toBe('steam')
    expect(storePartnerFor('15')).toBe('fanatical')
  })

  it('returns null for unmapped stores', () => {
    expect(storePartnerFor('999')).toBeNull()
  })
})

describe('storeDealUrl', () => {
  it('routes known stores through the X1VI Store resolver', () => {
    const url = storeDealUrl({ dealID: 'abc123', storeID: '1' }, 'compare')
    expect(url).toBe(`${STORE_ORIGIN}/go/steam/cheapshark-abc123?src=loot-games&placement=compare`)
  })

  it('preserves percent-encoded deal ids exactly once', () => {
    const url = storeDealUrl({ dealID: 'a%2Fb', storeID: '3' }, 'deal-card')
    expect(url).toContain('/go/gmg/cheapshark-a%2Fb?')
  })

  it('returns null for stores without a partner', () => {
    expect(storeDealUrl({ dealID: 'abc123', storeID: '99' }, 'compare')).toBeNull()
  })

  it('returns null when the store is unavailable', () => {
    expect(storeDealUrl({ dealID: 'abc123', storeID: '1' }, 'compare', false)).toBeNull()
    expect(storeDealUrl({ dealID: 'abc123', storeID: '1' }, 'compare', true)).not.toBeNull()
  })

  it('rejects unsafe deal ids', () => {
    expect(storeDealUrl({ dealID: 'abc/def', storeID: '1' }, 'compare')).toBeNull()
    expect(storeDealUrl({ dealID: 'abc?x', storeID: '1' }, 'compare')).toBeNull()
  })
})

describe('storeGameUrl', () => {
  it('builds an encoded store search URL', () => {
    expect(storeGameUrl('Baldurs Gate 3')).toBe(`${STORE_ORIGIN}/store/games?q=Baldurs+Gate+3`)
  })
})
