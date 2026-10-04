import type { TabId } from '../types'

export interface DeepLink {
  readonly gameID: string | null
  readonly query: string | null
}

export interface GameSearchMatch {
  readonly gameID: string
  readonly external: string
}

const GAME_ID_RE = /^[A-Za-z0-9_-]{1,64}$/
const NON_ALNUM_RE = /[^a-z0-9]+/g

function currentBase(): string {
  return `${window.location.origin}${window.location.pathname}`
}

function withParam(key: string, value: string, base: string): string {
  const url = new URL(base)
  url.search = ''
  url.hash = ''
  url.searchParams.set(key, value)
  return url.toString()
}

export function buildGameLink(gameID: string, base: string = currentBase()): string {
  return withParam('game', gameID.trim(), base)
}

export function buildGameSearchLink(title: string, base: string = currentBase()): string {
  return withParam('q', title.trim(), base)
}

export function parseDeepLink(search: string): DeepLink | null {
  const params = new URLSearchParams(search)
  const rawGameID = params.get('game')?.trim() ?? ''
  const query = params.get('q')?.trim() ?? ''
  const gameID = GAME_ID_RE.test(rawGameID) ? rawGameID : ''
  if (gameID === '' && query === '') return null
  return { gameID: gameID || null, query: query || null }
}

export function tabForDeepLink(search: string): TabId | null {
  return parseDeepLink(search) === null ? null : 'compare'
}

function normalizeTitle(value: string): string {
  return value.toLowerCase().replace(NON_ALNUM_RE, ' ').trim()
}

function titleTokens(value: string): string[] {
  const normalized = normalizeTitle(value)
  return normalized === '' ? [] : normalized.split(' ')
}

export function pickGameMatch(
  query: string,
  results: readonly GameSearchMatch[],
): string | null {
  const target = normalizeTitle(query)
  if (target === '' || results.length === 0) return null

  const normalized = results.map((result) => ({
    gameID: result.gameID,
    title: normalizeTitle(result.external),
    tokens: titleTokens(result.external),
  }))

  const exact = normalized.find((result) => result.title === target)
  if (exact !== undefined) return exact.gameID

  const targetTokens = titleTokens(query)
  if (targetTokens.length < 2) return null

  const subset = normalized
    .filter(
      (result) =>
        result.tokens.length >= targetTokens.length &&
        result.tokens.length <= targetTokens.length + 2 &&
        targetTokens.every((token) => result.tokens.includes(token)),
    )
    .sort((a, b) => a.tokens.length - b.tokens.length || a.title.localeCompare(b.title))

  return subset[0]?.gameID ?? null
}
