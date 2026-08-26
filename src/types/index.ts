export interface FreeGame {
  id: number
  title: string
  worth: string
  thumbnail: string
  image: string
  description: string
  instructions: string
  open_giveaway_url: string
  published_date: string
  type: string
  platforms: string
  end_date: string
  users: number
  status: string
  source: 'gamerpower' | 'epic' | 'steamdb' | 'itad' | 'cheapshark'
}

export interface EpicGame {
  title: string
  id: string
  namespace: string
  description: string
  effectiveDate: string
  offerType: string
  expiryDate: string | null
  status: string
  isCodeRedemptionOnly: boolean
  keyImages: Array<{
    type: string
    url: string
  }>
  seller: { id: string; name: string }
  productSlug: string
  urlSlug: string
  url: string | null
  customAttributes: Array<{ key: string; value: string }>
  categories: Array<{ path: string }>
  tags: Array<{ id: string }>
  items: Array<{ id: string; namespace: string }>
}

export interface CheapSharkDeal {
  internalName: string
  title: string
  metacriticLink: string | null
  dealID: string
  storeID: string
  gameID: string
  salePrice: string
  normalPrice: string
  isOnSale: string
  savings: string
  metacriticScore: string
  steamRatingText: string | null
  steamRatingPercent: string
  steamRatingCount: string
  steamAppID: string | null
  releaseDate: number
  lastChange: number
  dealRating: string
  thumb: string
}

export interface SteamDBItem {
  title: string
  link: string
  appId: string | null
  publishedDate: string
}

export interface ITADItem {
  title: string
  link: string
  store: string
  publishedDate: string
}

export type TabId = 'free' | 'deals' | 'stats' | 'about'

export type ThemeId = 'matrix' | 'amber' | 'cyber' | 'mono' | 'retro'

export const THEMES: { id: ThemeId; label: string; swatch: string }[] = [
  { id: 'matrix', label: 'Matrix', swatch: '#6fcf8a' },
  { id: 'amber', label: 'Amber', swatch: '#d4a040' },
  { id: 'cyber', label: 'Cyber', swatch: '#67e8f9' },
  { id: 'mono', label: 'Mono', swatch: '#c8c8c8' },
  { id: 'retro', label: 'Retro', swatch: '#7bc87b' },
]
