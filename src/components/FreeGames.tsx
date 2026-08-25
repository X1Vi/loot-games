import { useMemo } from 'react'
import { useApi } from '../hooks/useApi'
import { fetchGamerPowerGiveaways } from '../api/gamerpower'
import { fetchEpicFreeGames } from '../api/epicgames'
import { fetchSteamDBFeed, fetchITADFeed } from '../api/rssfeeds'
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

function GameCard({
  title,
  source,
  url,
  platforms,
  endDate,
  worth,
  image,
}: {
  title: string
  source: string
  url: string
  platforms?: string
  endDate?: string | null
  worth?: string
  image?: string
}) {
  const endsIn = endDate ? getTimeLeft(endDate) : null
  const expired = endDate ? new Date(endDate) < new Date() : false

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="block border p-3 transition-colors group"
      style={{
        borderColor: 'var(--border-subtle)',
        backgroundColor: 'var(--bg-card)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--border-bright)'
        e.currentTarget.style.opacity = '1'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border-subtle)'
      }}
    >
      <div className="flex gap-3">
        {image && (
          <img
            src={image}
            alt={title}
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
            {title}
          </div>
          <div className="flex flex-wrap gap-2 mt-1 text-xs font-mono">
            <span
              className="px-1.5 py-0.5"
              style={{
                color: 'var(--fg-muted)',
                backgroundColor: 'var(--accent-bg)',
              }}
            >
              {source.toUpperCase()}
            </span>
            {platforms && (
              <span style={{ color: 'var(--fg-faint)' }}>{platforms}</span>
            )}
            {worth && worth !== 'N/A' && (
              <span style={{ color: 'var(--accent-yellow)' }}>{worth}</span>
            )}
          </div>
          <div className="mt-1 text-xs font-mono">
            {expired ? (
              <span style={{ color: 'var(--accent-red)' }}>EXPIRED</span>
            ) : endsIn ? (
              <span style={{ color: 'var(--fg-faint)' }}>{endsIn}</span>
            ) : endDate ? (
              <span style={{ color: 'var(--fg-faint)' }}>
                Ends: {new Date(endDate).toLocaleDateString()}
              </span>
            ) : (
              <span style={{ color: 'var(--fg-faint)' }}>--</span>
            )}
          </div>
        </div>
      </div>
    </a>
  )
}

function Spinner() {
  return (
    <div
      className="flex items-center gap-2 font-mono text-sm py-8"
      style={{ color: 'var(--fg-muted)' }}
    >
      <span
        className="inline-block w-2 h-4 animate-pulse"
        style={{ backgroundColor: 'var(--fg-muted)' }}
      />
      <span>FETCHING DATA</span>
    </div>
  )
}

function SourceSection({
  title,
  source,
  loading,
  error,
  data,
  renderItem,
}: {
  title: string
  source: string
  loading: boolean
  error: string | null
  data: unknown
  renderItem: (item: unknown) => {
    title: string
    url: string
    platforms?: string
    endDate?: string | null
    worth?: string
    image?: string
  }
}) {
  const items = useMemo(() => (Array.isArray(data) ? data : []), [data])

  return (
    <section className="mb-6">
      <div
        className="border-b pb-1 mb-2"
        style={{ borderColor: 'var(--border-subtle)' }}
      >
        <span
          className="font-mono text-sm font-bold"
          style={{ color: 'var(--fg-muted)' }}
        >
          [{source}] {title}
        </span>
        {!loading && (
          <span className="font-mono text-xs ml-2" style={{ color: 'var(--fg-faint)' }}>
            ({items.length})
          </span>
        )}
      </div>
      {loading ? (
        <Spinner />
      ) : error ? (
        <div className="font-mono text-sm py-2" style={{ color: 'var(--accent-red)' }}>
          ! ERR: {error}
        </div>
      ) : items.length === 0 ? (
        <div className="font-mono text-sm py-2" style={{ color: 'var(--fg-faint)' }}>
          No items found
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
          {items.map((item, i) => {
            const rendered = renderItem(item)
            return <GameCard key={i} {...rendered} source={source} />
          })}
        </div>
      )}
    </section>
  )
}

function mapGamerPower(item: unknown) {
  const g = item as FreeGame
  return {
    title: g.title,
    url: g.open_giveaway_url,
    platforms: g.platforms,
    endDate: g.end_date,
    worth: g.worth,
    image: g.thumbnail,
  }
}

function mapEpic(item: unknown) {
  const g = item as EpicGame
  const image = g.keyImages.find((i) => i.type === 'Thumbnail')?.url
  return {
    title: g.title,
    url: `https://store.epicgames.com/en-US/p/${g.productSlug ?? g.urlSlug}`,
    endDate: g.expiryDate,
    image,
  }
}

function mapSteamDB(item: unknown) {
  const i = item as SteamDBItem
  return {
    title: i.title,
    url: i.link,
    endDate: null,
  }
}

function mapITAD(item: unknown) {
  const i = item as ITADItem
  return {
    title: i.title,
    url: i.link,
    platforms: i.store,
    endDate: null,
  }
}

export function FreeGames() {
  const gp = useApi(fetchGamerPowerGiveaways)
  const ep = useApi(fetchEpicFreeGames)
  const sd = useApi(fetchSteamDBFeed)
  const it = useApi(fetchITADFeed)

  return (
    <div className="p-4">
      <div className="mb-4 font-mono text-xs" style={{ color: 'var(--fg-faint)' }}>
        $ ./fetch_free_games.sh --all-sources
      </div>
      <SourceSection title="Giveaways" source="gamerpower" {...gp} data={gp.data} renderItem={mapGamerPower} />
      <SourceSection title="Free Games" source="epic" {...ep} data={ep.data} renderItem={mapEpic} />
      <SourceSection title="Steam Free" source="steamdb" {...sd} data={sd.data} renderItem={mapSteamDB} />
      <SourceSection title="Free Deals" source="itad" {...it} data={it.data} renderItem={mapITAD} />
    </div>
  )
}
