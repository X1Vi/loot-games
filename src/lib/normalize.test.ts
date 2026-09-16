import { describe, it, expect } from 'vitest'
import { buildCatalog, dedupAndMerge } from './normalize'
import type { EpicGame, ITADItem, SteamDBItem } from '../types'

function steam(title: string, appId: string | null = null): SteamDBItem {
  return { title, link: `https://example.com/${encodeURIComponent(title)}`, appId, publishedDate: '' }
}

function itad(title: string): ITADItem {
  return { title, link: `https://example.org/${encodeURIComponent(title)}`, store: 'steam', publishedDate: '' }
}

function epic(title: string, namespace: string): EpicGame {
  return {
    title,
    id: 'id-1',
    namespace,
    description: '',
    effectiveDate: '',
    offerType: '',
    expiryDate: null,
    status: '',
    isCodeRedemptionOnly: false,
    keyImages: [],
    seller: { id: '', name: '' },
    productSlug: 'slug',
    urlSlug: 'slug',
    url: null,
    customAttributes: [],
    categories: [],
    tags: [],
    items: [],
  }
}

describe('dedupAndMerge', () => {
  it('merges same-titled games across sources when neither has a store key', () => {
    const merged = dedupAndMerge([], [], [steam('Cool Game')], [itad('Cool Game')])
    expect(merged).toHaveLength(1)
    expect([...merged[0].sources].sort()).toEqual(['itad', 'steamdb'])
  })

  it('strips boilerplate and platform tags before matching', () => {
    const merged = dedupAndMerge([], [], [steam('[FREE] Cool Game (PC)')], [itad('Cool Game - Free Giveaway')])
    expect(merged).toHaveLength(1)
  })

  it('keeps distinct titles separate', () => {
    const merged = dedupAndMerge([], [], [steam('Alpha')], [itad('Beta')])
    expect(merged).toHaveLength(2)
  })

  it('uses the store namespace as the canonical key for Epic games', () => {
    const merged = dedupAndMerge([], [epic('Some Game', 'ns-123')], [], [])
    expect(merged).toHaveLength(1)
    expect(merged[0].canonicalKey).toBe('epic:ns-123')
  })

  it('sorts merged games by number of sources desc', () => {
    const merged = dedupAndMerge([], [], [steam('Cool Game'), steam('Alpha')], [itad('Cool Game')])
    expect(merged[0].title.toLowerCase()).toContain('cool')
  })
})

describe('buildCatalog', () => {
  it('reports the number of deduplicated entries', () => {
    const result = buildCatalog({
      gamerpower: [],
      epic: [],
      steamdb: [steam('Cool Game')],
      itad: [itad('Cool Game')],
    })
    expect(result.merged).toHaveLength(1)
    expect(result.dedupCount).toBe(1)
  })
})
