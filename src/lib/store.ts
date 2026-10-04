/**
 * Central link resolver entry point for Loot Terminal.
 *
 * Every merchant click that has a known X1VI Store partner goes through
 * `${STORE_ORIGIN}/go/:merchant/:offer`, so affiliate activation is a store
 * configuration change. Unknown stores keep the direct CheapShark redirect.
 */
export const STORE_ORIGIN =
  import.meta.env.VITE_STORE_ORIGIN ?? 'https://x1vi-store.x1vi.workers.dev'

export const STORE_DISCLOSURE =
  'Some outbound links are affiliate links. X1VI may earn a commission at no additional cost to you.'

const STORE_PARTNERS: Record<string, string> = {
  '1': 'steam',
  '3': 'gmg',
  '7': 'gog',
  '11': 'humble',
  '15': 'fanatical',
  '25': 'epic',
}

const DEAL_ID = /^[A-Za-z0-9%._+-]{1,64}$/

export interface DealRef {
  readonly dealID: string
  readonly storeID: string
}

export function storePartnerFor(storeID: string): string | null {
  return STORE_PARTNERS[storeID] ?? null
}

export function storeDealUrl(deal: DealRef, placement: string, available = true): string | null {
  if (!available) {
    return null
  }
  const partner = storePartnerFor(deal.storeID)
  if (partner === null || !DEAL_ID.test(deal.dealID)) {
    return null
  }
  const params = new URLSearchParams({ src: 'loot-games', placement })
  return `${STORE_ORIGIN}/go/${partner}/cheapshark-${deal.dealID}?${params.toString()}`
}

export function storeGameUrl(title: string): string {
  const params = new URLSearchParams({ q: title.trim() })
  return `${STORE_ORIGIN}/store/games?${params.toString()}`
}
