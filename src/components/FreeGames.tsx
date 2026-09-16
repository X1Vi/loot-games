import { useMemo, useEffect, useRef } from 'react'
import type { CSSProperties } from 'react'
import { useApi } from '../hooks/useApi'
import { useNewKeys } from '../hooks/useNewKeys'
import { useNotifications } from '../hooks/useNotifications'
import { useUrlParam } from '../hooks/useUrlParam'
import { fetchGamerPowerGiveaways } from '../api/gamerpower'
import { fetchEpicFreeGames } from '../api/epicgames'
import { fetchSteamDBFeed, fetchITADFeed } from '../api/rssfeeds'
import { buildCatalog } from '../lib/normalize'
import { downloadIcs } from '../lib/ics'
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

function isExpired(game: MergedGame): boolean {
  return game.endDate ? new Date(game.endDate).getTime() < Date.now() : false
}

function fieldStyle(): CSSProperties {
  return {
    backgroundColor: 'var(--input-bg)',
    borderColor: 'var(--border-mid)',
    color: 'var(--fg-primary)',
  }
}

function GameCard({ game, isNew }: { game: MergedGame; isNew: boolean }) {
  const endsIn = game.endDate ? getTimeLeft(game.endDate) : null
  const expired = isExpired(game)
  const isMerged = game.sources.length > 1
  const canCal = Boolean(game.endDate) && !expired

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
          <div className="flex items-center gap-2">
            {isNew && (
              <span className="px-1 py-0.5 text-[10px] font-mono tracking-wide shrink-0" style={{ color: 'var(--accent-red)', backgroundColor: 'var(--accent-bg)' }}>
                NEW
              </span>
            )}
            <div className="text-sm font-mono truncate group-hover:underline" style={{ color: 'var(--fg-primary)' }}>
              {game.title}
            </div>
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
          <div className="mt-1 flex items-center gap-2 text-xs font-mono">
            {expired ? (
              <span style={{ color: 'var(--accent-red)' }}>EXPIRED</span>
            ) : endsIn ? (
              <span style={{ color: 'var(--fg-faint)' }}>{endsIn}</span>
            ) : game.endDate ? (
              <span style={{ color: 'var(--fg-faint)' }}>Ends: {new Date(game.endDate).toLocaleDateString()}</span>
            ) : (
              <span style={{ color: 'var(--fg-subtle)' }}>No end date</span>
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

function ToolbarButton({ label, onClick, active, disabled, title }: {
  label: string
  onClick: () => void
  active?: boolean
  disabled?: boolean
  title?: string
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="text-xs font-mono border px-2 py-1 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
      style={{
        color: active ? 'var(--fg-primary)' : 'var(--fg-dim)',
        borderColor: active ? 'var(--border-bright)' : 'var(--border-mid)',
        backgroundColor: active ? 'var(--accent-bg-hover)' : 'transparent',
      }}
      onMouseEnter={(e) => { if (!disabled) { e.currentTarget.style.color = 'var(--fg-primary)'; e.currentTarget.style.borderColor = 'var(--border-bright)' } }}
      onMouseLeave={(e) => {
        if (disabled) return
        e.currentTarget.style.color = active ? 'var(--fg-primary)' : 'var(--fg-dim)'
        e.currentTarget.style.borderColor = active ? 'var(--border-bright)' : 'var(--border-mid)'
      }}
    >
      {label}
    </button>
  )
}

export function FreeGames() {
  const gp = useApi(fetchGamerPowerGiveaways, [], 'gamerpower')
  const ep = useApi(fetchEpicFreeGames, [], 'epic')
  const sd = useApi(fetchSteamDBFeed, [], 'steamdb')
  const it = useApi(fetchITADFeed, [], 'itad')

  const [query, setQuery] = useUrlParam('q', '')
  const [source, setSource] = useUrlParam('src', '')
  const [platform, setPlatform] = useUrlParam('platform', '')
  const [sort, setSort] = useUrlParam('sort', 'expiry')
  const [hideExpired, setHideExpired] = useUrlParam('hide', '1')

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

  const rawCount = (gp.data?.length ?? 0) + (ep.data?.length ?? 0) +
    (sd.data?.length ?? 0) + (it.data?.length ?? 0)
  const hasData = catalog.merged.length > 0
  const hasErrors = gp.error || ep.error || sd.error || it.error

  const newKeys = useNewKeys('loot-terminal-seen-free-v1', catalog.merged.map((g) => g.canonicalKey), !anyLoading)
  const { enabled: alertsEnabled, permission: alertsPermission, toggle: toggleAlerts, notify } = useNotifications()
  const notified = useRef(false)

  useEffect(() => {
    if (newKeys.size > 0 && !notified.current) {
      notified.current = true
      notify('LOOT TERMINAL', `${newKeys.size} new free game${newKeys.size > 1 ? 's' : ''} detected`)
    }
  }, [newKeys, notify])

  const platforms = useMemo(() => {
    const set = new Set<string>()
    for (const g of catalog.merged) {
      for (const p of g.platforms) set.add(p)
    }
    return [...set].sort((a, b) => a.localeCompare(b))
  }, [catalog.merged])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = catalog.merged.filter((g) => {
      if (hideExpired === '1' && isExpired(g)) return false
      if (q && !g.title.toLowerCase().includes(q)) return false
      if (source && !g.sources.includes(source)) return false
      if (platform && !g.platforms.some((p) => p.toLowerCase() === platform.toLowerCase())) return false
      return true
    })

    const expiry = (g: MergedGame) => (g.endDate ? new Date(g.endDate).getTime() : Number.POSITIVE_INFINITY)
    const expiredRank = (g: MergedGame) => (isExpired(g) ? 1 : 0)

    return [...list].sort((a, b) => {
      if (sort === 'title') return a.title.localeCompare(b.title)
      if (sort === 'sources') {
        if (b.sources.length !== a.sources.length) return b.sources.length - a.sources.length
        return a.title.localeCompare(b.title)
      }
      if (expiredRank(a) !== expiredRank(b)) return expiredRank(a) - expiredRank(b)
      return expiry(a) - expiry(b)
    })
  }, [catalog.merged, query, source, platform, sort, hideExpired])

  const activeSources = [gp.data, ep.data, sd.data, it.data].filter((d) => (d?.length ?? 0) > 0).length

  const ages = [gp.updatedAt, ep.updatedAt, sd.updatedAt, it.updatedAt].filter((t): t is number => t !== null)
  const updatedAt = ages.length > 0 ? Math.min(...ages) : null
  const ageLabel = updatedAt ? `${Math.max(0, Math.round((Date.now() - updatedAt) / 60000))}m ago` : '—'

  const alertsLabel =
    alertsPermission === 'unsupported' ? 'ALERTS N/A' : alertsEnabled ? 'ALERTS ON' : 'ALERTS OFF'

  return (
    <div className="p-4">
      <div className="mb-3 font-mono text-xs" style={{ color: 'var(--fg-faint)' }}>
        $ ./fetch_free_games.sh --dedup --merge --new --alerts
      </div>

      <div className="flex flex-wrap gap-3 mb-4 pb-3 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
        <SourceStatus label="gamerpower" loading={gp.loading} error={gp.error} count={gp.data?.length ?? 0} />
        <SourceStatus label="epic" loading={ep.loading} error={ep.error} count={ep.data?.length ?? 0} />
        <SourceStatus label="steamdb" loading={sd.loading} error={sd.error} count={sd.data?.length ?? 0} />
        <SourceStatus label="itad" loading={it.loading} error={it.error} count={it.data?.length ?? 0} />
      </div>

      {hasErrors && (
        <div className="mb-4 space-y-1">
          {gp.error && <div className="font-mono text-xs" style={{ color: 'var(--accent-red)' }}>! gamerpower: {gp.error}</div>}
          {ep.error && <div className="font-mono text-xs" style={{ color: 'var(--accent-red)' }}>! epic: {ep.error}</div>}
          {sd.error && <div className="font-mono text-xs" style={{ color: 'var(--accent-red)' }}>! steamdb: {sd.error}</div>}
          {it.error && <div className="font-mono text-xs" style={{ color: 'var(--accent-red)' }}>! itad: {it.error}</div>}
        </div>
      )}

      {anyLoading && !hasData && (
        <div className="space-y-2">
          {gp.loading && <Spinner label="GAMERPOWER" />}
          {ep.loading && <Spinner label="EPIC" />}
          {sd.loading && <Spinner label="STEAMDB" />}
          {it.loading && <Spinner label="ITAD" />}
        </div>
      )}

      {!anyLoading && !hasData && (
        <div className="font-mono text-sm py-4" style={{ color: 'var(--fg-faint)' }}>
          No free games found
          {hasErrors && <span> — some sources had errors, try again later</span>}
        </div>
      )}

      {hasData && (
        <>
          <div
            className="flex flex-wrap items-center gap-3 mb-3 p-3 border"
            style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-card)' }}
          >
            <label className="flex items-center gap-1 text-xs font-mono" style={{ color: 'var(--fg-muted)' }}>
              SEARCH:
              <input
                type="text"
                value={query}
                placeholder="game name..."
                onChange={(e) => setQuery(e.target.value)}
                className="px-2 py-1 w-32 text-xs font-mono border focus:outline-none"
                style={fieldStyle()}
              />
            </label>
            <label className="flex items-center gap-1 text-xs font-mono" style={{ color: 'var(--fg-muted)' }}>
              SRC:
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="px-2 py-1 text-xs font-mono border focus:outline-none cursor-pointer"
                style={fieldStyle()}
              >
                <option value="">All</option>
                <option value="gamerpower">GamerPower</option>
                <option value="epic">Epic</option>
                <option value="steamdb">SteamDB</option>
                <option value="itad">ITAD</option>
              </select>
            </label>
            {platforms.length > 0 && (
              <label className="flex items-center gap-1 text-xs font-mono" style={{ color: 'var(--fg-muted)' }}>
                PLATFORM:
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  className="px-2 py-1 text-xs font-mono border focus:outline-none cursor-pointer max-w-[140px]"
                  style={fieldStyle()}
                >
                  <option value="">All</option>
                  {platforms.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </label>
            )}
            <label className="flex items-center gap-1 text-xs font-mono" style={{ color: 'var(--fg-muted)' }}>
              SORT:
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="px-2 py-1 text-xs font-mono border focus:outline-none cursor-pointer"
                style={fieldStyle()}
              >
                <option value="expiry">Expiry</option>
                <option value="title">Title</option>
                <option value="sources">Sources</option>
              </select>
            </label>
            <ToolbarButton
              label={hideExpired === '1' ? 'HIDE EXPIRED: ON' : 'HIDE EXPIRED: OFF'}
              active={hideExpired === '1'}
              onClick={() => setHideExpired(hideExpired === '1' ? '0' : '1')}
            />
            <ToolbarButton
              label={alertsLabel}
              active={alertsEnabled}
              disabled={alertsPermission === 'unsupported'}
              onClick={toggleAlerts}
              title="Browser notification when new games appear"
            />
            <ToolbarButton
              label="REFRESH"
              onClick={() => { gp.refetch(); ep.refetch(); sd.refetch(); it.refetch() }}
            />
            <span className="text-xs font-mono ml-auto" style={{ color: 'var(--fg-faint)' }}>
              UPDATED {ageLabel}
            </span>
          </div>

          <div className="flex flex-wrap gap-2 mb-4" style={{ color: 'var(--fg-dim)' }}>
            <span className="font-mono text-xs px-2 py-1 border" style={{ borderColor: 'var(--border-subtle)' }}>
              SHOWING: {filtered.length}
            </span>
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
            {newKeys.size > 0 && (
              <span className="font-mono text-xs px-2 py-1 border" style={{ borderColor: 'var(--border-subtle)', color: 'var(--accent-red)' }}>
                NEW: {newKeys.size}
              </span>
            )}
            <span className="font-mono text-xs px-2 py-1 border" style={{ borderColor: 'var(--border-subtle)' }}>
              ACTIVE: {activeSources}/4
            </span>
          </div>

          {filtered.length === 0 ? (
            <div className="font-mono text-sm py-4" style={{ color: 'var(--fg-faint)' }}>
              No games match your filters
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
              {filtered.map((game) => (
                <GameCard key={game.canonicalKey} game={game} isNew={newKeys.has(game.canonicalKey)} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
