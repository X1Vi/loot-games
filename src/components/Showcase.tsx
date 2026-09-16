import { useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import { useApi } from '../hooks/useApi'
import { useNewKeys } from '../hooks/useNewKeys'
import { fetchGamerPowerGiveaways } from '../api/gamerpower'
import { fetchEpicFreeGames } from '../api/epicgames'
import { fetchSteamDBFeed, fetchITADFeed } from '../api/rssfeeds'
import { buildCatalog } from '../lib/normalize'
import { downloadIcs } from '../lib/ics'
import type { MergedGame } from '../lib/normalize'
import type { FreeGame, EpicGame, SteamDBItem, ITADItem } from '../types'

type SortMode = 'value' | 'new' | 'expiring' | 'sources'

const SORTS: { id: SortMode; label: string }[] = [
  { id: 'value', label: 'HIGHEST VALUE' },
  { id: 'new', label: 'NEWEST' },
  { id: 'expiring', label: 'ENDING SOON' },
  { id: 'sources', label: 'MOST SOURCES' },
]

function parseWorth(worth: string | null): number {
  if (!worth) return 0
  const match = worth.replace(/,/g, '').match(/\d+(\.\d+)?/)
  return match ? Number(match[0]) : 0
}

function formatWorth(total: number): string {
  return `$${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function timeLeft(endDate: string | null): string | null {
  if (!endDate) return null
  const diff = new Date(endDate).getTime() - Date.now()
  if (diff <= 0) return 'EXPIRED'
  const days = Math.floor(diff / 86400000)
  const hours = Math.floor((diff % 86400000) / 3600000)
  if (days > 0) return `${days}d ${hours}h`
  const mins = Math.floor((diff % 3600000) / 60000)
  return `${hours}h ${mins}m`
}

function inputStyle(): CSSProperties {
  return {
    backgroundColor: 'var(--input-bg)',
    borderColor: 'var(--border-mid)',
    color: 'var(--fg-primary)',
  }
}

function ShowcaseCard({ game, isNew, rank }: { game: MergedGame; isNew: boolean; rank: number }) {
  const left = timeLeft(game.endDate)
  const expired = left === 'EXPIRED'
  const canCal = Boolean(game.endDate) && !expired
  const value = parseWorth(game.worth)

  return (
    <a
      href={game.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col border transition-colors"
      style={{ borderColor: isNew ? 'var(--border-bright)' : 'var(--border-subtle)', backgroundColor: 'var(--bg-card)' }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--border-bright)' }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = isNew ? 'var(--border-bright)' : 'var(--border-subtle)' }}
    >
      <div className="relative aspect-video overflow-hidden shrink-0" style={{ backgroundColor: 'var(--bg-primary)' }}>
        {game.image ? (
          <img
            src={game.image}
            alt={game.title}
            className="w-full h-full object-cover opacity-90 transition-opacity group-hover:opacity-100"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs font-mono" style={{ color: 'var(--fg-faint)' }}>
            [ NO PREVIEW ]
          </div>
        )}

        <span className="absolute top-2 left-2 px-1.5 py-0.5 text-[10px] font-mono" style={{ color: 'var(--fg-dim)', backgroundColor: 'rgba(0,0,0,0.6)' }}>
          #{rank}
        </span>
        {isNew && (
          <span className="absolute top-2 right-2 px-1.5 py-0.5 text-[10px] font-mono tracking-wide" style={{ color: 'var(--accent-red)', backgroundColor: 'rgba(0,0,0,0.6)' }}>
            NEW
          </span>
        )}
        {value > 0 && (
          <span className="absolute bottom-2 right-2 px-1.5 py-0.5 text-[10px] font-mono" style={{ color: 'var(--accent-yellow)', backgroundColor: 'rgba(0,0,0,0.6)' }}>
            {formatWorth(value)}
          </span>
        )}
      </div>

      <div className="flex flex-col flex-1 p-3">
        <div className="text-sm font-mono leading-snug line-clamp-2 group-hover:underline" style={{ color: 'var(--fg-primary)' }}>
          {game.title}
        </div>

        <div className="flex flex-wrap gap-1.5 mt-2 text-[10px] font-mono">
          {game.sources.map((src) => (
            <span key={src} className="px-1.5 py-0.5 tracking-wide" style={{ color: 'var(--fg-muted)', backgroundColor: 'var(--accent-bg)' }}>
              {src.toUpperCase()}
            </span>
          ))}
          {game.sources.length > 1 && (
            <span className="px-1.5 py-0.5" style={{ color: 'var(--accent-yellow)', backgroundColor: 'var(--accent-bg)' }}>
              +{game.sources.length - 1} SRC
            </span>
          )}
        </div>

        {game.platforms.length > 0 && (
          <div className="mt-1 text-[10px] font-mono truncate" style={{ color: 'var(--fg-faint)' }}>
            {game.platforms.join(' · ')}
          </div>
        )}

        <div className="mt-auto pt-2 flex items-center justify-between text-xs font-mono">
          {expired ? (
            <span style={{ color: 'var(--accent-red)' }}>EXPIRED</span>
          ) : left ? (
            <span style={{ color: 'var(--accent-green)' }}>ENDS {left}</span>
          ) : (
            <span style={{ color: 'var(--fg-faint)' }}>KEEP FOREVER</span>
          )}
          {canCal && (
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                downloadIcs(game.title, game.endDate as string, game.url)
              }}
              className="px-1.5 py-0.5 border cursor-pointer transition-colors"
              style={{ color: 'var(--fg-dim)', borderColor: 'var(--border-mid)' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--fg-primary)'; e.currentTarget.style.borderColor = 'var(--border-bright)' }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--fg-dim)'; e.currentTarget.style.borderColor = 'var(--border-mid)' }}
              title="Add expiry reminder to calendar"
            >
              + CAL
            </button>
          )}
        </div>
      </div>
    </a>
  )
}

export function Showcase() {
  const gp = useApi(fetchGamerPowerGiveaways, [], 'gamerpower')
  const ep = useApi(fetchEpicFreeGames, [], 'epic')
  const sd = useApi(fetchSteamDBFeed, [], 'steamdb')
  const it = useApi(fetchITADFeed, [], 'itad')

  const [sort, setSort] = useState<SortMode>('value')
  const [onlyNew, setOnlyNew] = useState(false)

  const anyLoading = gp.loading || ep.loading || sd.loading || it.loading

  const catalog = useMemo(() => {
    const data: { gamerpower: FreeGame[]; epic: EpicGame[]; steamdb: SteamDBItem[]; itad: ITADItem[] } = {
      gamerpower: gp.data ?? [],
      epic: ep.data ?? [],
      steamdb: sd.data ?? [],
      itad: it.data ?? [],
    }
    return buildCatalog(data)
  }, [gp.data, ep.data, sd.data, it.data])

  const newKeys = useNewKeys('loot-terminal-seen-free-v1', catalog.merged.map((g) => g.canonicalKey), !anyLoading)

  const games = useMemo(() => {
    const list = catalog.merged.filter((g) => !onlyNew || newKeys.has(g.canonicalKey))
    const published = (g: MergedGame) => (g.publishedAt ? new Date(g.publishedAt).getTime() : 0)
    const expiry = (g: MergedGame) => (g.endDate ? new Date(g.endDate).getTime() : Number.POSITIVE_INFINITY)
    const expiredRank = (g: MergedGame) => (g.endDate && new Date(g.endDate).getTime() < Date.now() ? 1 : 0)

    return [...list].sort((a, b) => {
      if (sort === 'new') return published(b) - published(a)
      if (sort === 'expiring') {
        if (expiredRank(a) !== expiredRank(b)) return expiredRank(a) - expiredRank(b)
        return expiry(a) - expiry(b)
      }
      if (sort === 'sources') {
        if (b.sources.length !== a.sources.length) return b.sources.length - a.sources.length
        return parseWorth(b.worth) - parseWorth(a.worth)
      }
      const byValue = parseWorth(b.worth) - parseWorth(a.worth)
      if (byValue !== 0) return byValue
      const byNew = (newKeys.has(b.canonicalKey) ? 1 : 0) - (newKeys.has(a.canonicalKey) ? 1 : 0)
      if (byNew !== 0) return byNew
      return a.title.localeCompare(b.title)
    })
  }, [catalog.merged, sort, onlyNew, newKeys])

  const totalValue = useMemo(() => games.reduce((sum, g) => sum + parseWorth(g.worth), 0), [games])
  const newCount = newKeys.size

  if (anyLoading && catalog.merged.length === 0) {
    return (
      <div className="p-4 font-mono text-sm" style={{ color: 'var(--fg-faint)' }}>
        <div className="mb-3 text-xs">$ ./showcase.sh --top --new</div>
        <div className="flex items-center gap-2 py-6" style={{ color: 'var(--fg-muted)' }}>
          <span className="inline-block w-2 h-4 animate-pulse" style={{ backgroundColor: 'var(--fg-muted)' }} />
          <span>BUILDING SHOWCASE</span>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4">
      <div className="mb-3 font-mono text-xs" style={{ color: 'var(--fg-faint)' }}>
        $ ./showcase.sh --top --new --grid
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-3 p-3 border" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-card)' }}>
        <span className="font-mono text-sm font-bold" style={{ color: 'var(--fg-primary)' }}>
          ▚ SHOWCASE
        </span>
        <label className="flex items-center gap-1 text-xs font-mono" style={{ color: 'var(--fg-muted)' }}>
          SORT:
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortMode)}
            className="px-2 py-1 text-xs font-mono border focus:outline-none cursor-pointer"
            style={inputStyle()}
          >
            {SORTS.map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
        </label>
        <button
          onClick={() => setOnlyNew((v) => !v)}
          className="text-xs font-mono border px-2 py-1 transition-colors cursor-pointer"
          style={{
            color: onlyNew ? 'var(--fg-primary)' : 'var(--fg-dim)',
            borderColor: onlyNew ? 'var(--border-bright)' : 'var(--border-mid)',
            backgroundColor: onlyNew ? 'var(--accent-bg-hover)' : 'transparent',
          }}
        >
          NEW ONLY: {onlyNew ? 'ON' : 'OFF'}
        </button>
        <span className="text-xs font-mono ml-auto flex flex-wrap gap-3" style={{ color: 'var(--fg-faint)' }}>
          <span>SHOWING: {games.length}</span>
          {newCount > 0 && <span style={{ color: 'var(--accent-red)' }}>NEW: {newCount}</span>}
          <span style={{ color: 'var(--accent-yellow)' }}>VALUE: {formatWorth(totalValue)}</span>
        </span>
      </div>

      {games.length === 0 ? (
        <div className="font-mono text-sm py-4" style={{ color: 'var(--fg-faint)' }}>
          {onlyNew ? 'No new games since your last visit' : 'No free games found'}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {games.map((game, i) => (
            <ShowcaseCard key={game.canonicalKey} game={game} isNew={newKeys.has(game.canonicalKey)} rank={i + 1} />
          ))}
        </div>
      )}
    </div>
  )
}
