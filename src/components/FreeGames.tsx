import { useMemo } from 'react'
import { useApi } from '../hooks/useApi'
import { fetchGamerPowerGiveaways } from '../api/gamerpower'
import { fetchEpicFreeGames } from '../api/epicgames'
import { fetchSteamDBFeed, fetchITADFeed } from '../api/rssfeeds'
import { buildCatalog } from '../lib/normalize'
import type { MergedGame } from '../lib/normalize'

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
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--border-bright)'
      }}
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
          <div
            className="text-sm font-mono truncate group-hover:underline"
            style={{ color: 'var(--fg-primary)' }}
          >
            {game.title}
          </div>

          <div className="flex flex-wrap gap-1.5 mt-1 text-xs font-mono">
            {game.sources.map((src) => (
              <span
                key={src}
                className="px-1.5 py-0.5 tracking-wide"
                style={{
                  color: 'var(--fg-muted)',
                  backgroundColor: 'var(--accent-bg)',
                }}
              >
                {src.toUpperCase()}
              </span>
            ))}
            {isMerged && (
              <span className="px-1.5 py-0.5" style={{
                color: 'var(--accent-yellow)',
                backgroundColor: 'var(--accent-bg)',
              }}>
                +{game.sources.length - 1} src
              </span>
            )}
            {game.platforms.length > 0 && (
              <span style={{ color: 'var(--fg-faint)' }}>
                {game.platforms.join(', ')}
              </span>
            )}
            {game.worth && (
              <span style={{ color: 'var(--accent-yellow)' }}>{game.worth}</span>
            )}
          </div>

          <div className="mt-1 text-xs font-mono">
            {expired ? (
              <span style={{ color: 'var(--accent-red)' }}>EXPIRED</span>
            ) : endsIn ? (
              <span style={{ color: 'var(--fg-faint)' }}>{endsIn}</span>
            ) : game.endDate ? (
              <span style={{ color: 'var(--fg-faint)' }}>
                Ends: {new Date(game.endDate).toLocaleDateString()}
              </span>
            ) : (
              <span style={{ color: 'var(--fg-subtle)' }}>No end date</span>
            )}
          </div>
        </div>
      </div>
    </a>
  )
}

function Spinner({ label = 'FETCHING DATA' }: { label?: string }) {
  return (
    <div
      className="flex items-center gap-2 font-mono text-sm py-8"
      style={{ color: 'var(--fg-muted)' }}
    >
      <span
        className="inline-block w-2 h-4 animate-pulse"
        style={{ backgroundColor: 'var(--fg-muted)' }}
      />
      <span>{label}</span>
    </div>
  )
}

function StatusBadge({ label, count, color }: {
  label: string
  count: number
  color: string
}) {
  return (
    <span
      className="px-2 py-1 text-xs font-mono tracking-wide"
      style={{
        color: `var(--${color})`,
        backgroundColor: 'var(--accent-bg)',
        border: '1px solid',
        borderColor: 'var(--border-subtle)',
      }}
    >
      {label}: {count}
    </span>
  )
}

export function FreeGames() {
  const gp = useApi(fetchGamerPowerGiveaways)
  const ep = useApi(fetchEpicFreeGames)
  const sd = useApi(fetchSteamDBFeed)
  const it = useApi(fetchITADFeed)

  const loading = gp.loading || ep.loading || sd.loading || it.loading
  const error = gp.error || ep.error || sd.error || it.error

  const catalog = useMemo(() => {
    if (!gp.data || !ep.data || !sd.data || !it.data) return null
    return buildCatalog({
      gamerpower: gp.data,
      epic: ep.data,
      steamdb: sd.data,
      itad: it.data,
    })
  }, [gp.data, ep.data, sd.data, it.data])

  const rawCount = (gp.data?.length ?? 0) + (ep.data?.length ?? 0) +
    (sd.data?.length ?? 0) + (it.data?.length ?? 0)

  return (
    <div className="p-4">
      <div className="mb-3 font-mono text-xs" style={{ color: 'var(--fg-faint)' }}>
        $ ./fetch_free_games.sh --dedup --merge
      </div>

      {/* Loading state */}
      {loading && (
        <div className="space-y-2">
          {gp.loading && <Spinner label="GAMERPOWER" />}
          {ep.loading && <Spinner label="EPIC" />}
          {sd.loading && <Spinner label="STEAMDB" />}
          {it.loading && <Spinner label="ITAD" />}
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div className="font-mono text-sm py-4" style={{ color: 'var(--accent-red)' }}>
          ! ERR: {error}
        </div>
      )}

      {/* Stats bar */}
      {!loading && catalog && (
        <div className="flex flex-wrap gap-2 mb-4 pb-3 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
          <StatusBadge label="TOTAL" count={catalog.merged.length} color="fg-primary" />
          <StatusBadge label="RAW" count={rawCount} color="fg-dim" />
          {catalog.dedupCount > 0 && (
            <StatusBadge label="DEDUPED" count={catalog.dedupCount} color="accent-yellow" />
          )}
          <StatusBadge label="SOURCES" count={4} color="fg-faint" />
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && catalog && catalog.merged.length === 0 && (
        <div className="font-mono text-sm py-4" style={{ color: 'var(--fg-faint)' }}>
          No free games found
        </div>
      )}

      {/* Merged game grid */}
      {!loading && catalog && catalog.merged.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
          {catalog.merged.map((game) => (
            <GameCard key={game.canonicalKey} game={game} />
          ))}
        </div>
      )}
    </div>
  )
}
