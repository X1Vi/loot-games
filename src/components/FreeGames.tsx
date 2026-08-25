import { useMemo } from 'react'
import { useApi } from '../hooks/useApi'
import { fetchGamerPowerGiveaways } from '../api/gamerpower'
import { fetchEpicFreeGames } from '../api/epicgames'
import { fetchSteamDBFeed, fetchITADFeed } from '../api/rssfeeds'
import { buildCatalog } from '../lib/normalize'
import type { MergedGame } from '../lib/normalize'
import type { FreeGame, EpicGame, SteamDBItem, ITADItem } from '../types'

function getTimeLeft(endDate: string): string {
  const diff = new Date(endDate).getTime() - Date.now()
  if (diff <= 0) return 'EXPIRED'
  const days = Math.floor(diff / 86400000)
  const hours = Math.floor((diff % 86400000) / 3600000)
  if (days > 0) return `Ends in ${days}d ${hours}h`
  const mins = Math.floor((diff % 3600000) / 60000)
  return `Ends in ${hours}h ${mins}m`
}

function GameCard({ game }: { game: MergedGame }) {
  const endsIn = game.endDate ? getTimeLeft(game.endDate) : null
  const expired = game.endDate ? new Date(game.endDate) < new Date() : false
  const isMerged = game.sources.length > 1

  return (
    <a
      href={game.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block border p-3 transition-colors group"
      style={{
        borderColor: isMerged ? 'var(--border-bright)' : 'var(--border-subtle)',
        backgroundColor: 'var(--bg-card)',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--border-bright)' }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = isMerged ? 'var(--border-bright)' : 'var(--border-subtle)'
      }}
    >
      <div className="flex gap-3">
        {game.image && (
          <img
            src={game.image}
            alt={game.title}
            className="w-16 h-9 object-cover border flex-shrink-0"
            style={{ borderColor: 'var(--border-subtle)' }}
            loading="lazy"
          />
        )}
        <div className="min-w-0 flex-1">
          <div className="text-sm font-mono truncate group-hover:underline" style={{ color: 'var(--fg-primary)' }}>
            {game.title}
          </div>
          <div className="flex flex-wrap gap-1.5 mt-1 text-xs font-mono">
            {game.sources.map((src) => (
              <span key={src} className="px-1.5 py-0.5 tracking-wide" style={{ color: 'var(--fg-muted)', backgroundColor: 'var(--accent-bg)' }}>
                {src.toUpperCase()}
              </span>
            ))}
            {isMerged && (
              <span className="px-1.5 py-0.5" style={{ color: 'var(--accent-yellow)', backgroundColor: 'var(--accent-bg)' }}>
                +{game.sources.length - 1} src
              </span>
            )}
            {game.platforms.length > 0 && (
              <span style={{ color: 'var(--fg-faint)' }}>{game.platforms.join(', ')}</span>
            )}
            {game.worth && <span style={{ color: 'var(--accent-yellow)' }}>{game.worth}</span>}
          </div>
          <div className="mt-1 text-xs font-mono">
            {expired ? (
              <span style={{ color: 'var(--accent-red)' }}>EXPIRED</span>
            ) : endsIn ? (
              <span style={{ color: 'var(--fg-faint)' }}>{endsIn}</span>
            ) : game.endDate ? (
              <span style={{ color: 'var(--fg-faint)' }}>Ends: {new Date(game.endDate).toLocaleDateString()}</span>
            ) : (
              <span style={{ color: 'var(--fg-subtle)' }}>No end date</span>
            )}
          </div>
        </div>
      </div>
    </a>
  )
}

function Spinner({ label = 'FETCHING' }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 font-mono text-sm py-6" style={{ color: 'var(--fg-muted)' }}>
      <span className="inline-block w-2 h-4 animate-pulse" style={{ backgroundColor: 'var(--fg-muted)' }} />
      <span>{label}</span>
    </div>
  )
}

function SourceStatus({ label, loading, error, count }: { label: string; loading: boolean; error: string | null; count: number }) {
  return (
    <span className="flex items-center gap-1.5 text-xs font-mono" style={{ color: 'var(--fg-faint)' }}>
      <span className="inline-block w-1.5 h-1.5 rounded-full" style={{
        backgroundColor: loading ? 'var(--fg-faint)' : error ? 'var(--accent-red)' : 'var(--fg-primary)',
      }} />
      {label.toUpperCase()}
      {!loading && !error && <span>({count})</span>}
      {!loading && error && <span style={{ color: 'var(--accent-red)' }}>ERR</span>}
    </span>
  )
}

export function FreeGames() {
  const gp = useApi(fetchGamerPowerGiveaways)
  const ep = useApi(fetchEpicFreeGames)
  const sd = useApi(fetchSteamDBFeed)
  const it = useApi(fetchITADFeed)

  const anyLoading = gp.loading || ep.loading || sd.loading || it.loading

  const catalog = useMemo(() => {
    // Use whatever data we have — empty arrays for failed/missing sources
    const data: { gamerpower: FreeGame[]; epic: EpicGame[]; steamdb: SteamDBItem[]; itad: ITADItem[] } = {
      gamerpower: gp.data ?? [],
      epic: ep.data ?? [],
      steamdb: sd.data ?? [],
      itad: it.data ?? [],
    }
    return buildCatalog(data)
  }, [gp.data, ep.data, sd.data, it.data])

  const rawCount = (gp.data?.length ?? 0) + (ep.data?.length ?? 0) +
    (sd.data?.length ?? 0) + (it.data?.length ?? 0)
  const hasData = catalog.merged.length > 0
  const hasErrors = gp.error || ep.error || sd.error || it.error

  return (
    <div className="p-4">
      <div className="mb-3 font-mono text-xs" style={{ color: 'var(--fg-faint)' }}>
        $ ./fetch_free_games.sh --dedup --merge
      </div>

      {/* Source status line */}
      <div className="flex flex-wrap gap-3 mb-4 pb-3 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
        <SourceStatus label="gamerpower" loading={gp.loading} error={gp.error} count={gp.data?.length ?? 0} />
        <SourceStatus label="epic" loading={ep.loading} error={ep.error} count={ep.data?.length ?? 0} />
        <SourceStatus label="steamdb" loading={sd.loading} error={sd.error} count={sd.data?.length ?? 0} />
        <SourceStatus label="itad" loading={it.loading} error={it.error} count={it.data?.length ?? 0} />
      </div>

      {/* Per-source errors */}
      {hasErrors && (
        <div className="mb-4 space-y-1">
          {gp.error && <div className="font-mono text-xs" style={{ color: 'var(--accent-red)' }}>! gamerpower: {gp.error}</div>}
          {ep.error && <div className="font-mono text-xs" style={{ color: 'var(--accent-red)' }}>! epic: {ep.error}</div>}
          {sd.error && <div className="font-mono text-xs" style={{ color: 'var(--accent-red)' }}>! steamdb: {sd.error}</div>}
          {it.error && <div className="font-mono text-xs" style={{ color: 'var(--accent-red)' }}>! itad: {it.error}</div>}
        </div>
      )}

      {/* Loading spinners (only when no data yet) */}
      {anyLoading && !hasData && (
        <div className="space-y-2">
          {gp.loading && <Spinner label="GAMERPOWER" />}
          {ep.loading && <Spinner label="EPIC" />}
          {sd.loading && <Spinner label="STEAMDB" />}
          {it.loading && <Spinner label="ITAD" />}
        </div>
      )}

      {/* Empty state */}
      {!anyLoading && !hasData && (
        <div className="font-mono text-sm py-4" style={{ color: 'var(--fg-faint)' }}>
          No free games found
          {hasErrors && <span> — some sources had errors, try again later</span>}
        </div>
      )}

      {/* Stats bar */}
      {hasData && (
        <div className="flex flex-wrap gap-2 mb-4" style={{ color: 'var(--fg-dim)' }}>
          <span className="font-mono text-xs px-2 py-1 border" style={{ borderColor: 'var(--border-subtle)' }}>
            TOTAL: {catalog.merged.length}
          </span>
          <span className="font-mono text-xs px-2 py-1 border" style={{ borderColor: 'var(--border-subtle)' }}>
            RAW: {rawCount}
          </span>
          {catalog.dedupCount > 0 && (
            <span className="font-mono text-xs px-2 py-1 border" style={{ borderColor: 'var(--border-subtle)', color: 'var(--accent-yellow)' }}>
              DEDUPED: {catalog.dedupCount}
            </span>
          )}
          <span className="font-mono text-xs px-2 py-1 border" style={{ borderColor: 'var(--border-subtle)' }}>
            ACTIVE: {gp.data?.length ? 1 : 0}/{ep.data?.length ? 1 : 0}/{sd.data?.length ? 1 : 0}/{it.data?.length ? 1 : 0}
          </span>
        </div>
      )}

      {/* Game grid */}
      {hasData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
          {catalog.merged.map((game) => (
            <GameCard key={game.canonicalKey} game={game} />
          ))}
        </div>
      )}
    </div>
  )
}
