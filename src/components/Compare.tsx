import { useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import { useApi } from '../hooks/useApi'
import { useUrlParam } from '../hooks/useUrlParam'
import {
  cheapsharkDealUrl,
  fetchCheapSharkGame,
  fetchCheapSharkStores,
  searchCheapSharkGamesWithStores,
} from '../api/cheapshark'
import { buildStoreComparison, formatPrice, summarizeComparison } from '../lib/compare'
import type { StorePriceRow } from '../lib/compare'
import type { CheapSharkSearchResultWithStore } from '../types'

const QUICK_PICKS = [
  'Cyberpunk 2077',
  'Elden Ring',
  'Baldurs Gate 3',
  'Hades',
  'Stardew Valley',
  'Hollow Knight',
]

function inputStyle(): CSSProperties {
  return {
    backgroundColor: 'var(--input-bg)',
    borderColor: 'var(--border-mid)',
    color: 'var(--fg-primary)',
  }
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5 min-w-[90px]">
      <span className="text-[10px] font-mono tracking-wide" style={{ color: 'var(--fg-faint)' }}>
        {label}
      </span>
      <span
        className="text-sm font-mono font-bold"
        style={{ color: accent ? 'var(--accent-green)' : 'var(--fg-primary)' }}
      >
        {value}
      </span>
    </div>
  )
}

function Spinner({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 font-mono text-sm py-6" style={{ color: 'var(--fg-muted)' }}>
      <span className="inline-block w-2 h-4 animate-pulse" style={{ backgroundColor: 'var(--fg-muted)' }} />
      <span>{label}</span>
    </div>
  )
}

function PriceRow({
  rank,
  row,
  maxPrice,
}: {
  rank: number
  row: StorePriceRow
  maxPrice: number
}) {
  const pct = maxPrice > 0 ? Math.min(100, (row.price / maxPrice) * 100) : 0
  const savings = Math.round(row.savingsPct)

  return (
    <a
      href={cheapsharkDealUrl(row.dealID)}
      target="_blank"
      rel="noopener noreferrer"
      className="block border px-3 py-2 transition-colors"
      style={{
        borderColor: row.isCheapest ? 'var(--border-bright)' : 'var(--border-subtle)',
        backgroundColor: 'var(--bg-card)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--border-bright)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = row.isCheapest ? 'var(--border-bright)' : 'var(--border-subtle)'
      }}
    >
      <div className="flex items-center gap-2 text-xs font-mono">
        <span
          className="w-6 shrink-0"
          style={{ color: row.isCheapest ? 'var(--accent-green)' : 'var(--fg-faint)' }}
        >
          #{rank}
        </span>
        <span className="w-32 shrink-0 truncate" style={{ color: 'var(--fg-primary)' }} title={row.storeName}>
          {row.storeName}
        </span>
        {row.isCheapest && (
          <span
            className="px-1 py-0.5 text-[10px] tracking-wide shrink-0"
            style={{ color: 'var(--accent-green)', backgroundColor: 'var(--accent-bg-hover)' }}
          >
            BEST
          </span>
        )}
        <span className="ml-auto shrink-0" style={{ color: 'var(--fg-primary)' }}>
          {formatPrice(row.price)}
        </span>
        {row.retailPrice > row.price && (
          <span
            className="shrink-0 hidden sm:inline"
            style={{ color: 'var(--fg-faint)', textDecoration: 'line-through' }}
          >
            {formatPrice(row.retailPrice)}
          </span>
        )}
        <span
          className="w-12 shrink-0 text-right"
          style={{ color: savings > 0 ? 'var(--accent-green)' : 'var(--fg-faint)' }}
        >
          {savings > 0 ? `-${savings}%` : '—'}
        </span>
        <span className="w-14 shrink-0 text-right" style={{ color: 'var(--fg-dim)' }}>
          {row.isCheapest ? 'BEST' : row.deltaFromBest === 0 ? 'TIE' : `+${formatPrice(row.deltaFromBest)}`}
        </span>
      </div>
      <div
        className="mt-1.5 h-3 border"
        style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-primary)' }}
      >
        <div
          className="h-full transition-all duration-300"
          style={{
            width: `${pct}%`,
            backgroundColor: row.isCheapest ? 'var(--accent-green)' : 'var(--fg-subtle)',
          }}
        />
      </div>
    </a>
  )
}

function SearchResults({
  results,
  storeMap,
  activeGameID,
  onSelect,
}: {
  results: CheapSharkSearchResultWithStore[]
  storeMap: Record<string, string>
  activeGameID: string
  onSelect: (gameID: string) => void
}) {
  if (results.length === 0) {
    return (
      <div className="font-mono text-xs py-3" style={{ color: 'var(--fg-faint)' }}>
        No matching games
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-1.5">
      {results.map((result) => (
        <button
          key={result.gameID}
          onClick={() => onSelect(result.gameID)}
          className="flex items-center gap-2 border px-2 py-1.5 text-left transition-colors cursor-pointer"
          style={{
            borderColor: result.gameID === activeGameID ? 'var(--border-bright)' : 'var(--border-subtle)',
            backgroundColor: 'var(--bg-card)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-bright)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor =
              result.gameID === activeGameID ? 'var(--border-bright)' : 'var(--border-subtle)'
          }}
        >
          {result.thumb ? (
            <img
              src={result.thumb}
              alt={result.external}
              className="w-14 h-8 object-cover border shrink-0"
              style={{ borderColor: 'var(--border-subtle)' }}
              loading="lazy"
            />
          ) : (
            <span
              className="w-14 h-8 border shrink-0 flex items-center justify-center text-[9px] font-mono"
              style={{ borderColor: 'var(--border-subtle)', color: 'var(--fg-faint)' }}
            >
              N/A
            </span>
          )}
          <span className="min-w-0 flex-1 truncate text-xs font-mono" style={{ color: 'var(--fg-primary)' }}>
            {result.external}
          </span>
          <span className="shrink-0 text-xs font-mono" style={{ color: 'var(--accent-yellow)' }}>
            from {formatPrice(Number(result.cheapest))}
          </span>
          {result.cheapestStoreID && (
            <span
              className="shrink-0 px-1.5 py-0.5 text-[10px] font-mono"
              style={{ color: 'var(--fg-muted)', backgroundColor: 'var(--accent-bg)' }}
            >
              {storeMap[result.cheapestStoreID] ?? `Store ${result.cheapestStoreID}`}
            </span>
          )}
          <span className="shrink-0 text-[10px] font-mono" style={{ color: 'var(--fg-dim)' }}>
            COMPARE &gt;
          </span>
        </button>
      ))}
    </div>
  )
}

export function Compare() {
  const [gameID, setGameID] = useUrlParam('game', '')
  const [query, setQuery] = useState('')
  const [term, setTerm] = useState('')

  const stores = useApi(fetchCheapSharkStores, [], 'cheapshark:stores', 24 * 60 * 60_000)

  const search = useApi(
    () =>
      term.trim()
        ? searchCheapSharkGamesWithStores(term.trim())
        : Promise.resolve([] as CheapSharkSearchResultWithStore[]),
    [term],
    'cheapshark:game-search',
  )

  const details = useApi(
    () => (gameID ? fetchCheapSharkGame(gameID) : Promise.resolve(null)),
    [gameID],
    'cheapshark:game',
  )

  const storeMap = useMemo(() => {
    if (!stores.data) return {} as Record<string, string>
    const map: Record<string, string> = {}
    for (const s of stores.data) {
      map[s.storeID] = s.storeName
    }
    return map
  }, [stores.data])

  const activeStoreIds = useMemo(() => {
    if (!stores.data) return null
    return new Set(stores.data.filter((s) => s.isActive).map((s) => s.storeID))
  }, [stores.data])

  const rows = useMemo(() => {
    if (!details.data) return []
    return buildStoreComparison(details.data.deals, storeMap, activeStoreIds)
  }, [details.data, storeMap, activeStoreIds])

  const summary = useMemo(() => {
    const low = details.data ? Number(details.data.cheapestPriceEver.price) : undefined
    return summarizeComparison(rows, low)
  }, [rows, details.data])

  const maxPrice = useMemo(() => Math.max(...rows.map((r) => r.price), 0.01), [rows])

  const runSearch = (value: string) => {
    setQuery(value)
    setTerm(value)
  }

  const selectGame = (id: string) => {
    setGameID(id)
    setQuery('')
    setTerm('')
  }

  const historicLow = details.data ? Number(details.data.cheapestPriceEver.price) : null

  return (
    <div className="p-4">
      <div className="mb-4 font-mono text-xs" style={{ color: 'var(--fg-faint)' }}>
        $ ./compare.sh --game {gameID ? `"${details.data?.info.title ?? gameID}"` : '"..."'} --stores all
      </div>

      <div
        className="flex flex-wrap items-center gap-2 mb-4 p-3 border"
        style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-card)' }}
      >
        <span className="font-mono text-sm font-bold shrink-0" style={{ color: 'var(--fg-primary)' }}>
          ▚ STORE COMPARE
        </span>
        <input
          type="text"
          value={query}
          placeholder="search a game to compare prices..."
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') runSearch(query)
          }}
          className="px-2 py-1 w-full sm:w-72 text-xs font-mono border focus:outline-none"
          style={inputStyle()}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-bright)'
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-mid)'
          }}
        />
        <button
          onClick={() => runSearch(query)}
          className="text-xs font-mono border px-3 py-1 transition-colors cursor-pointer"
          style={{
            color: 'var(--fg-dim)',
            borderColor: 'var(--border-mid)',
            backgroundColor: 'transparent',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--fg-primary)'
            e.currentTarget.style.borderColor = 'var(--border-bright)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--fg-dim)'
            e.currentTarget.style.borderColor = 'var(--border-mid)'
          }}
        >
          SEARCH
        </button>
        {term && (
          <button
            onClick={() => {
              setQuery('')
              setTerm('')
            }}
            className="text-xs font-mono border px-2 py-1 transition-colors cursor-pointer"
            style={{
              color: 'var(--fg-faint)',
              borderColor: 'var(--border-subtle)',
              backgroundColor: 'transparent',
            }}
          >
            CLEAR
          </button>
        )}
      </div>

      {term ? (
        <section className="mb-5">
          <div className="border-b pb-1 mb-2" style={{ borderColor: 'var(--border-subtle)' }}>
            <span className="font-mono text-sm font-bold" style={{ color: 'var(--fg-muted)' }}>
              ▸ SEARCH RESULTS
            </span>
          </div>
          {search.loading ? (
            <Spinner label="SEARCHING GAMES" />
          ) : search.error ? (
            <div className="font-mono text-sm py-3" style={{ color: 'var(--accent-red)' }}>
              ! ERR: {search.error}
            </div>
          ) : (
            <SearchResults
              results={search.data ?? []}
              storeMap={storeMap}
              activeGameID={gameID}
              onSelect={selectGame}
            />
          )}
        </section>
      ) : null}

      {!gameID ? (
        <div className="font-mono text-sm" style={{ color: 'var(--fg-faint)' }}>
          <div className="py-4">Select a game to compare prices across every store that sells it.</div>
          <div className="text-xs mb-2" style={{ color: 'var(--fg-dim)' }}>
            QUICK PICKS:
          </div>
          <div className="flex flex-wrap gap-2">
            {QUICK_PICKS.map((title) => (
              <button
                key={title}
                onClick={() => runSearch(title)}
                className="px-2 py-1 text-xs font-mono border cursor-pointer transition-colors"
                style={{
                  color: 'var(--fg-dim)',
                  borderColor: 'var(--border-mid)',
                  backgroundColor: 'transparent',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--fg-primary)'
                  e.currentTarget.style.borderColor = 'var(--border-bright)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--fg-dim)'
                  e.currentTarget.style.borderColor = 'var(--border-mid)'
                }}
              >
                {title}
              </button>
            ))}
          </div>
        </div>
      ) : details.loading ? (
        <Spinner label="FETCHING STORE PRICES" />
      ) : details.error ? (
        <div className="font-mono text-sm py-4" style={{ color: 'var(--accent-red)' }}>
          ! ERR: {details.error}
        </div>
      ) : details.data ? (
        <>
          <div
            className="flex flex-wrap items-start gap-3 mb-4 p-3 border"
            style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-card)' }}
          >
            {details.data.info.thumb && (
              <img
                src={details.data.info.thumb}
                alt={details.data.info.title}
                className="w-24 h-14 object-cover border shrink-0"
                style={{ borderColor: 'var(--border-subtle)' }}
              />
            )}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-base font-mono font-bold" style={{ color: 'var(--fg-primary)' }}>
                  {details.data.info.title}
                </span>
                {details.data.info.steamAppID && (
                  <a
                    href={`https://store.steampowered.com/app/${details.data.info.steamAppID}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] font-mono px-1.5 py-0.5 border transition-colors"
                    style={{ color: 'var(--fg-dim)', borderColor: 'var(--border-mid)' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = 'var(--fg-primary)'
                      e.currentTarget.style.borderColor = 'var(--border-bright)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = 'var(--fg-dim)'
                      e.currentTarget.style.borderColor = 'var(--border-mid)'
                    }}
                  >
                    STEAM ↗
                  </a>
                )}
                {summary.atHistoricLow && (
                  <span
                    className="text-[10px] font-mono px-1.5 py-0.5 tracking-wide"
                    style={{ color: 'var(--accent-green)', backgroundColor: 'var(--accent-bg-hover)' }}
                  >
                    ★ AT HISTORIC LOW
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-x-6 gap-y-2 mt-3">
                <Stat
                  label="BEST PRICE"
                  value={summary.cheapest ? formatPrice(summary.cheapest.price) : '—'}
                  accent
                />
                <Stat label="BEST STORE" value={summary.cheapest?.storeName ?? '—'} />
                <Stat label="RETAIL" value={formatPrice(summary.cheapest?.retailPrice ?? 0)} />
                <Stat
                  label="MAX SAVINGS"
                  value={`${formatPrice(summary.bestSavings)} (${Math.round(summary.bestSavingsPct)}%)`}
                />
                <Stat label="STORES" value={String(summary.storeCount)} />
                <Stat
                  label="SPREAD"
                  value={
                    summary.spread > 0
                      ? `${formatPrice(summary.spread)}${
                          summary.spreadPct > 0 ? ` (${Math.round(summary.spreadPct)}%)` : ''
                        }`
                      : '—'
                  }
                />
              </div>
              {historicLow !== null && Number.isFinite(historicLow) && details.data.cheapestPriceEver.date > 0 && (
                <div className="mt-2 text-[10px] font-mono" style={{ color: 'var(--fg-faint)' }}>
                  HISTORIC LOW: {formatPrice(historicLow)} on{' '}
                  {new Date(details.data.cheapestPriceEver.date * 1000).toLocaleDateString('en-US')}
                </div>
              )}
            </div>
          </div>

          <div className="border-b pb-1 mb-2" style={{ borderColor: 'var(--border-subtle)' }}>
            <span className="font-mono text-sm font-bold" style={{ color: 'var(--fg-muted)' }}>
              ▸ PRICE BY STORE
            </span>
          </div>

          {rows.length === 0 ? (
            <div className="font-mono text-sm py-4" style={{ color: 'var(--fg-faint)' }}>
              No active store listings for this game
            </div>
          ) : (
            <>
              <div className="space-y-1.5">
                {rows.map((row, i) => (
                  <PriceRow key={row.dealID} rank={i + 1} row={row} maxPrice={maxPrice} />
                ))}
              </div>
              <div className="mt-2 text-[10px] font-mono" style={{ color: 'var(--fg-faint)' }}>
                Bars scaled to the highest listed price. Click a row to open the deal on that store.
              </div>
            </>
          )}
        </>
      ) : null}
    </div>
  )
}
