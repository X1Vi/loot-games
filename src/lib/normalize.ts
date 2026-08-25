import type { FreeGame, EpicGame, SteamDBItem, ITADItem } from '../types'

export interface NormalizedItem {
  title: string
  cleanTitle: string
  source: string
  url: string
  image: string | null
  endDate: string | null
  description: string | null
  platforms: string[]
  worth: string | null
  storeKey: string | null
}

export interface MergedGame {
  canonicalKey: string
  title: string
  url: string
  image: string | null
  endDate: string | null
  description: string | null
  platforms: string[]
  worth: string | null
  sources: string[]
  storeKeys: string[]
}

// ── Normalization patterns ──────────────────────────────────────────

const BRACKET_RE = /[[（【]([^\]）】]+)[\]）】]/g
const BOILERPLATE_RE =
  /\b(?:free\s*(?:to\s*keep|game|giveaway|now)|giveaway|get\s*it\s*free|claim\s*yours|limited\s*time|epic\s*games?\s*(?:store|giveaway)|prime\s*gaming|available\s*now)\b/gi
const PLATFORM_TAG_RE = /\((?:pc|mac|linux|steam|epic|gog|android|ios|web|nintendo|playstation|xbox)[^)]*\)/gi
const SEPARATOR_RE = /\s*[-–—|]\s*/
const WHITESPACE_RE = /\s+/g
const NON_ALNUM_RE = /[^a-z0-9\s]/g

// ── Store URL extractors ────────────────────────────────────────────

const STORE_PATTERNS: Array<{ re: RegExp; prefix: string; transform?: (m: string) => string }> = [
  { re: /store\.epicgames\.com\/(?:[^/]+\/)?p\/([^?#/\s]+)/i, prefix: 'epic' },
  { re: /store\.epicgames\.com\/(?:[^/]+\/)?product\/([^?#/\s]+)/i, prefix: 'epic' },
  { re: /steampowered\.com\/app\/(\d+)/i, prefix: 'steam' },
  { re: /store\.steampowered\.com\/app\/(\d+)/i, prefix: 'steam' },
  { re: /gog\.com\/(?:[^/]+\/)?game\/([^?#/\s]+)/i, prefix: 'gog' },
  { re: /humblebundle\.com\/(?:store\/)?([^?#/\s]+)/i, prefix: 'humble' },
  { re: /amazon\.com\/(?:dp|gp\/product)\/([^?#/\s]+)/i, prefix: 'amazon' },
  { re: /playstation\.com\/[^/]+\/product\/([^?#/\s]+)/i, prefix: 'ps' },
  { re: /xbox\.com\/(?:[^/]+\/)?games\/([^?#/\s]+)/i, prefix: 'xbox' },
]

function extractStoreKey(url: string): string | null {
  if (!url) return null
  for (const p of STORE_PATTERNS) {
    const m = url.match(p.re)
    if (m) {
      const id = m[1].trim().toLowerCase()
      return `${p.prefix}:${id}`
    }
  }
  return null
}

function makeStoreKey(prefix: string, id: string): string {
  return `${prefix}:${id.trim().toLowerCase()}`
}

// ── Title normalization ─────────────────────────────────────────────

function stripBoilerplate(title: string): string {
  let t = title
    .replace(BRACKET_RE, '')
    .replace(PLATFORM_TAG_RE, '')
    .replace(BOILERPLATE_RE, '')
    .replace(SEPARATOR_RE, ' ')
    .replace(WHITESPACE_RE, ' ')
    .trim()
  // Strip leading/trailing noise like dashes, dots, colons
  t = t.replace(/^[-–—.:;\s]+/, '').replace(/[-–—.:;\s]+$/, '')
  return t
}

function titleSignature(title: string): string {
  const cleaned = stripBoilerplate(title).toLowerCase()
  const words = cleaned
    .replace(NON_ALNUM_RE, ' ')
    .split(WHITESPACE_RE)
    .filter(Boolean)
  const unique = [...new Set(words)].sort()
  // First 50 chars of sorted unique tokens joined
  return unique.join(' ').slice(0, 50)
}

// ── Normalize each source type to NormalizedItem ────────────────────

function normalizeGamerPower(item: FreeGame): NormalizedItem | null {
  const storeKey =
    extractStoreKey(item.open_giveaway_url) ?? null
  return {
    title: item.title,
    cleanTitle: stripBoilerplate(item.title),
    source: 'gamerpower',
    url: item.open_giveaway_url,
    image: item.thumbnail || item.image || null,
    endDate: item.end_date || null,
    description: item.description || null,
    platforms: item.platforms ? item.platforms.split(/[,/]/).map((s) => s.trim()).filter(Boolean) : [],
    worth: item.worth || null,
    storeKey,
  }
}

function normalizeEpic(item: EpicGame): NormalizedItem | null {
  const image = item.keyImages.find((i) => i.type === 'Thumbnail' || i.type === 'DieselStoreFrontWide')?.url ?? null
  const url = `https://store.epicgames.com/en-US/p/${item.productSlug ?? item.urlSlug}`
  const storeKey = makeStoreKey('epic', item.namespace || item.id)
  return {
    title: item.title,
    cleanTitle: stripBoilerplate(item.title),
    source: 'epic',
    url,
    image,
    endDate: item.expiryDate ?? null,
    description: item.description || null,
    platforms: [],
    worth: null,
    storeKey,
  }
}

function normalizeSteamDB(item: SteamDBItem): NormalizedItem | null {
  const storeKey = item.appId ? makeStoreKey('steam', item.appId) : extractStoreKey(item.link)
  return {
    title: item.title,
    cleanTitle: stripBoilerplate(item.title),
    source: 'steamdb',
    url: item.link,
    image: null,
    endDate: null,
    description: null,
    platforms: [],
    worth: null,
    storeKey,
  }
}

function normalizeITAD(item: ITADItem): NormalizedItem | null {
  const storeKey = extractStoreKey(item.link)
  return {
    title: item.title,
    cleanTitle: stripBoilerplate(item.title),
    source: 'itad',
    url: item.link,
    image: null,
    endDate: null,
    description: null,
    platforms: [],
    worth: null,
    storeKey,
  }
}

// ── Dedup and merge ─────────────────────────────────────────────────

function makeCanonicalKey(item: NormalizedItem): string {
  // Store identity takes priority
  if (item.storeKey) return item.storeKey
  // Title signature fallback
  return `sig:${titleSignature(item.title)}`
}

/**
 * Canonical keys are ordered by reliability:
 *   1. storeKey ('epic:abc123', 'steam:203160') — exact store identity
 *   2. title signature ('sig:star wars outlaws') — fuzzy text match
 *
 * Within each bucket, items sharing the same key are merged.
 * storeKey matches are always kept; title-signature matches are
 * deduped only when both items lack a store identity.
 */
export function dedupAndMerge(
  gpGames: FreeGame[],
  epicGames: EpicGame[],
  steamDBItems: SteamDBItem[],
  itadItems: ITADItem[],
): MergedGame[] {
  // Convert all to normalized form
  const all: NormalizedItem[] = [
    ...gpGames.map(normalizeGamerPower),
    ...epicGames.map(normalizeEpic),
    ...steamDBItems.map(normalizeSteamDB),
    ...itadItems.map(normalizeITAD),
  ].filter((n): n is NormalizedItem => n !== null)

  // Build canonical key for each
  const withKey = all.map((item) => ({
    item,
    key: makeCanonicalKey(item),
  }))

  // Group by key
  const groups = new Map<string, NormalizedItem[]>()
  for (const { item, key } of withKey) {
    const existing = groups.get(key) ?? []
    existing.push(item)
    groups.set(key, existing)
  }

  // Merge each group
  const merged: MergedGame[] = []
  for (const [canonicalKey, group] of groups) {
    const isStoreKey = canonicalKey.startsWith('sig:')

    if (isStoreKey) {
      // Title-signature group: further dedup by source so same source
      // doesn't create false positives
      const bySource = new Map<string, NormalizedItem[]>()
      for (const item of group) {
        const arr = bySource.get(item.source) ?? []
        arr.push(item)
        bySource.set(item.source, arr)
      }
      // Take first from each source
      const deduped = [...bySource.values()].map((arr) => arr[0])
      // If only one source, this is not a dupe — treat as separate games
      if (deduped.length <= 1) {
        // Can't assume these are the same game; output individually
        for (const item of deduped) {
          merged.push(mergeGroup(canonicalKey, [item]))
        }
      } else {
        // Different sources, likely the same game
        merged.push(mergeGroup(canonicalKey, deduped))
      }
    } else {
      // storeKey group: these are definitely the same game
      merged.push(mergeGroup(canonicalKey, group))
    }
  }

  // Sort: most sources first, then by title
  return merged.sort((a, b) => {
    if (b.sources.length !== a.sources.length) return b.sources.length - a.sources.length
    return a.title.localeCompare(b.title)
  })
}

function mergeGroup(canonicalKey: string, items: NormalizedItem[]): MergedGame {
  const sources = [...new Set(items.map((i) => i.source))]
  const storeKeys = [...new Set(items.map((i) => i.storeKey).filter(Boolean) as string[])]
  const platforms = [...new Set(items.flatMap((i) => i.platforms))]

  // Title: pick the shortest clean title, or the shortest full title
  const byCleanLen = [...items].sort((a, b) => a.cleanTitle.length - b.cleanTitle.length)
  const byFullLen = [...items].sort((a, b) => a.title.length - b.title.length)
  const title = byCleanLen[0].cleanTitle || byFullLen[0].title

  // Image: prefer epic thumbnail, then gamerpower thumbnail
  const epicImg = items.find((i) => i.source === 'epic' && i.image)?.image
  const gpImg = items.find((i) => i.source === 'gamerpower' && i.image)?.image
  const image = epicImg || gpImg || items.find((i) => i.image)?.image || null

  // End date: pick the latest
  const dates = items
    .map((i) => i.endDate)
    .filter((d): d is string => d !== null)
    .map((d) => new Date(d))
    .filter((d) => !isNaN(d.getTime()))
  const endDate = dates.length > 0
    ? new Date(Math.max(...dates.map((d) => d.getTime()))).toISOString()
    : null

  // Description: pick the longest
  const desc = [...items]
    .filter((i) => i.description)
    .sort((a, b) => (b.description?.length ?? 0) - (a.description?.length ?? 0))
  const description = desc[0]?.description ?? null

  // URL: prefer epic store, then steam, then gamerpower redirect, then first available
  const epicItem = items.find((i) => i.source === 'epic')
  const steamItem = items.find((i) => i.source === 'steamdb')
  const gpItem = items.find((i) => i.source === 'gamerpower')
  const url = epicItem?.url ?? steamItem?.url ?? gpItem?.url ?? items[0]?.url ?? ''

  // Worth: from gamerpower
  const gp = items.find((i) => i.worth)
  const worth = gp?.worth?.toUpperCase() === 'N/A' ? null : gp?.worth ?? null

  return {
    canonicalKey,
    title,
    url,
    image,
    endDate,
    description,
    platforms,
    worth,
    sources,
    storeKeys,
  }
}

// ── Convenience export for the unified catalog ──────────────────────

export type CatalogSources = {
  gamerpower: FreeGame[]
  epic: EpicGame[]
  steamdb: SteamDBItem[]
  itad: ITADItem[]
}

export function buildCatalog(sources: CatalogSources): {
  merged: MergedGame[]
  dedupCount: number
} {
  const { gamerpower, epic, steamdb, itad } = sources
  const total = gamerpower.length + epic.length + steamdb.length + itad.length
  const merged = dedupAndMerge(gamerpower, epic, steamdb, itad)
  const dedupCount = total - merged.length
  return { merged, dedupCount }
}
