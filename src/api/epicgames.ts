import type { EpicGame } from '../types'
import { fetchWithCorsFallback } from './utils'

const EPIC_API =
  'https://store-site-backend-static.ak.epicgames.com/freeGamesPromotions?locale=en-US&country=US&allowCountries=US'

interface EpicResponse {
  data: {
    Catalog: {
      searchStore: {
        elements: Array<{
          title: string
          id: string
          namespace: string
          description: string
          effectiveDate: string
          offerType: string
          expiryDate: string | null
          status: string
          isCodeRedemptionOnly: boolean
          keyImages: Array<{ type: string; url: string }>
          seller: { id: string; name: string }
          productSlug: string
          urlSlug: string
          url: string | null
          customAttributes: Array<{ key: string; value: string }>
          categories: Array<{ path: string }>
          tags: Array<{ id: string }>
          items: Array<{ id: string; namespace: string }>
          price?: {
            totalPrice: {
              discountPrice: number
              originalPrice: number
              currencyCode: string
            }
            lineOffers: Array<{
              appliedRules: Array<{
                id: string
                endDate: string
                discountSetting: { discountType: string }
              }>
            }>
          }
          promotions?: {
            promotionalOffers: Array<{
              promotionalOffers: Array<{
                startDate: string
                endDate: string
                discountSetting: { discountType: string; discountPercentage: number }
              }>
            }>
            upcomingPromotionalOffers: Array<{
              promotionalOffers: Array<{
                startDate: string
                endDate: string
                discountSetting: { discountType: string; discountPercentage: number }
              }>
            }>
          }
        }>
      }
    }
  }
}

export async function fetchEpicFreeGames(): Promise<EpicGame[]> {
  const res = await fetchWithCorsFallback(EPIC_API)
  if (!res.ok) throw new Error(`Epic API error: ${res.status}`)
  const json: EpicResponse = await res.json()
  const elements = json.data.Catalog.searchStore.elements

  return elements
    .filter((game) => {
      const promos = game.promotions?.promotionalOffers
      return promos && promos.length > 0
    })
    .map((game) => {
      const promo =
        game.promotions?.promotionalOffers?.[0]?.promotionalOffers?.[0]
      return {
        title: game.title,
        id: game.id,
        namespace: game.namespace,
        description: game.description,
        effectiveDate: game.effectiveDate,
        offerType: game.offerType,
        expiryDate: promo?.endDate ?? game.expiryDate ?? null,
        status: game.status,
        isCodeRedemptionOnly: game.isCodeRedemptionOnly,
        keyImages: game.keyImages,
        seller: game.seller,
        productSlug: game.productSlug,
        urlSlug: game.urlSlug,
        url: game.url,
        customAttributes: game.customAttributes,
        categories: game.categories,
        tags: game.tags,
        items: game.items,
      }
    })
}
