import { useMemo } from 'react'
import { useApi } from '../hooks/useApi'
import { fetchGamerPowerGiveaways } from '../api/gamerpower'
import { fetchEpicFreeGames } from '../api/epicgames'
import { fetchCheapSharkDeals } from '../api/cheapshark'
import { fetchSteamDBFeed, fetchITADFeed } from '../api/rssfeeds'
import { groupByFranchise } from '../lib/franchises'

// ── Shared helpers ─────────────────────────────────────────

function Bar({ value, max, label, color, count }: { value: number; max: number; label: string; color: string; count: number }) {
  const pct = max > 0 ? (value / max) * 100 : 0
  return (
    <div className="flex items-center gap-2 text-xs font-mono mb-1.5">
      <span className="w-32 truncate shrink-0 text-right" style={{ color: 'var(--fg-dim)' }}>{label}</span>
      <div className="flex-1 h-4 border" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-card)' }}>
        <div className="h-full transition-all duration-300" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="w-8 shrink-0 text-right" style={{ color: 'var(--fg-faint)' }}>{count}</span>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6">
      <div className="border-b pb-1 mb-3" style={{ borderColor: 'var(--border-subtle)' }}>
        <span className="font-mono text-sm font-bold" style={{ color: 'var(--fg-muted)' }}>▸ {title}</span>
      </div>
      {children}
    </section>
  )
}

function Sub({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <div className="text-xs font-mono mb-2" style={{ color: 'var(--fg-faint)' }}>{title}</div>
      {children}
    </div>
  )
}

// ── Donut chart ───────────────────────────────────────────

function Donut({ data, size = 140 }: {
  data: { label: string; value: number; color: string }[]
  size?: number
}) {
  const total = data.reduce((s, d) => s + d.value, 0)
  if (total === 0) return <div className="text-xs font-mono" style={{ color: 'var(--fg-faint)' }}>No data</div>

  const cx = size / 2
  const cy = size / 2
  const r = size * 0.35
  const strokeW = size * 0.18
  const circ = 2 * Math.PI * r

  let offset = 0
  const slices = data.map((d) => {
    const len = (d.value / total) * circ
    const dash = len < 1 ? `${len},${circ}` : `${len},${circ - len}`
    const dashOffset = -offset
    offset += len
    return {
      ...d,
      dash,
      dashOffset,
      pct: Math.round((d.value / total) * 100),
    }
  })

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--bg-card)" strokeWidth={strokeW} />
        {slices.map((s, i) => (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={s.color}
            strokeWidth={strokeW}
            strokeDasharray={s.dash}
            strokeDashoffset={s.dashOffset}
            transform={`rotate(-90 ${cx} ${cy})`}
            style={{ transition: 'stroke-dasharray 0.3s, stroke-dashoffset 0.3s' }}
          />
        ))}
      </svg>
      <div className="flex flex-wrap justify-center gap-x-3 gap-y-1">
        {slices.map((s, i) => (
          <div key={i} className="flex items-center gap-1 text-[10px] font-mono">
            <span className="inline-block w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
            <span style={{ color: 'var(--fg-dim)' }}>{s.label}</span>
            <span style={{ color: 'var(--fg-faint)' }}>{s.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Colors ────────────────────────────────────────────────

const COLORS = [
  '#6fcf8a', '#67e8f9', '#d4a040', '#c8c8c8', '#7bc87b',
  '#f472b6', '#a78bfa', '#fb923c', '#38bdf8', '#fbbf24',
  '#e879f9', '#34d399', '#f87171', '#60a5fa', '#a3e635',
]

const SOURCE_COLORS: Record<string, string> = {
  gamerpower: '#6fcf8a',
  epic: '#67e8f9',
  steamdb: '#d4a040',
  itad: '#c8c8c8',
  cheapshark: '#f472b6',
}

// ── Stats component ──────────────────────────────────────

export function Stats() {
  const gp = useApi(fetchGamerPowerGiveaways)
  const ep = useApi(fetchEpicFreeGames)
  const sd = useApi(fetchSteamDBFeed)
  const it = useApi(fetchITADFeed)
  const deals = useApi(() => fetchCheapSharkDeals({ onSale: 1, pageSize: 50 }))

  const loading = gp.loading || ep.loading || sd.loading || it.loading || deals.loading

  const sourceData = useMemo(() => {
    const items: { label: string; value: number; color: string }[] = []
    if (gp.data?.length) items.push({ label: 'GamerPower', value: gp.data.length, color: SOURCE_COLORS.gamerpower })
    if (ep.data?.length) items.push({ label: 'Epic', value: ep.data.length, color: SOURCE_COLORS.epic })
    if (sd.data?.length) items.push({ label: 'SteamDB', value: sd.data.length, color: SOURCE_COLORS.steamdb })
    if (it.data?.length) items.push({ label: 'ITAD', value: it.data.length, color: SOURCE_COLORS.itad })
    if (deals.data?.length) items.push({ label: 'CheapShark', value: deals.data.length, color: SOURCE_COLORS.cheapshark })
    return items
  }, [gp.data, ep.data, sd.data, it.data, deals.data])


  const platformData = useMemo(() => {
    const map = new Map<string, number>()
    if (gp.data) {
      for (const g of gp.data) {
        if (g.platforms) {
          g.platforms.split(/[,/]/).map((p) => p.trim()).filter(Boolean).forEach((p) => {
            map.set(p, (map.get(p) ?? 0) + 1)
          })
        }
      }
    }
    return [...map.entries()]
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10)
  }, [gp.data])

  const maxPlatform = Math.max(...platformData.map((p) => p.value), 1)

  const freeEndingSoon = useMemo(() => {
    const now = Date.now()
    const soon: { title: string; source: string; endDate: string }[] = []

    if (gp.data) {
      for (const g of gp.data) {
        if (!g.end_date) continue
        const diff = new Date(g.end_date).getTime() - now
        if (diff > 0 && diff < 172800000) {
          soon.push({ title: g.title, source: 'gamerpower', endDate: g.end_date })
        }
      }
    }
    if (ep.data) {
      for (const g of ep.data) {
        if (!g.expiryDate) continue
        const diff = new Date(g.expiryDate).getTime() - now
        if (diff > 0 && diff < 172800000) {
          soon.push({ title: g.title, source: 'epic', endDate: g.expiryDate })
        }
      }
    }
    return soon.sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime()).slice(0, 10)
  }, [gp.data, ep.data])

  const priceBrackets = useMemo(() => {
    const brackets: Record<string, number> = { 'Free': 0, '$0–5': 0, '$5–10': 0, '$10–20': 0, '$20+': 0 }
    if (deals.data) {
      for (const d of deals.data) {
        const p = Number(d.salePrice)
        if (p === 0) brackets['Free']++
        else if (p < 5) brackets['$0–5']++
        else if (p < 10) brackets['$5–10']++
        else if (p < 20) brackets['$10–20']++
        else brackets['$20+']++
      }
    }
    return Object.entries(brackets).map(([label, value]) => ({ label, value }))
  }, [deals.data])

  const maxPrice = Math.max(...priceBrackets.map((b) => b.value), 1)

  // Franchise grouping
  const franchiseData = useMemo(() => {
    const all = [
      ...(gp.data?.map((g) => ({ title: g.title, source: 'gamerpower' })) ?? []),
      ...(ep.data?.map((g) => ({ title: g.title, source: 'epic' })) ?? []),
      ...(sd.data?.map((g) => ({ title: g.title, source: 'steamdb' })) ?? []),
      ...(it.data?.map((g) => ({ title: g.title, source: 'itad' })) ?? []),
    ]
    return groupByFranchise(all).slice(0, 20)
  }, [gp.data, ep.data, sd.data, it.data])

  const maxFranchise = Math.max(...franchiseData.map((f) => f.games), 1)

  if (loading && !sourceData.some((s) => s.value > 0)) {
    return (
      <div className="p-4 font-mono text-sm" style={{ color: 'var(--fg-faint)' }}>
        <div className="mb-3 text-xs" style={{ color: 'var(--fg-faint)' }}>$ ./stats.sh --overview</div>
        <div className="flex items-center gap-2 py-6" style={{ color: 'var(--fg-muted)' }}>
          <span className="inline-block w-2 h-4 animate-pulse" style={{ backgroundColor: 'var(--fg-muted)' }} />
          <span>FETCHING DATA</span>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4">
      <div className="mb-4 font-mono text-xs" style={{ color: 'var(--fg-faint)' }}>
        $ ./stats.sh --overview --eagle-eye
      </div>

      <Section title="Source Distribution">
        <Donut data={sourceData} />
      </Section>

      {franchiseData.length > 0 && (
        <Section title="Franchises & Series">
          <div className="text-xs font-mono mb-2" style={{ color: 'var(--fg-faint)' }}>
            {franchiseData.filter((f) => f.franchise !== 'Other').length} franchises identified — browsing by series
          </div>
          <Sub title="Top franchises (by game count)">
            {franchiseData.slice(0, 10).map((f, i) => (
              <Bar key={f.franchise} label={f.franchise} value={f.games} max={maxFranchise} color={COLORS[i % COLORS.length]} count={f.games} />
            ))}
            {franchiseData.length > 10 && (
              <div className="text-xs font-mono mt-1" style={{ color: 'var(--fg-faint)' }}>
                +{franchiseData.length - 10} more
              </div>
            )}
          </Sub>
        </Section>
      )}

      {platformData.length > 0 && (
        <Section title="Platforms">
          <Sub title="Game platforms (GamerPower)">
            {platformData.map((p, i) => (
              <Bar key={p.label} label={p.label} value={p.value} max={maxPlatform} color={COLORS[i % COLORS.length]} count={p.value} />
            ))}
          </Sub>
        </Section>
      )}

      <Section title="Deal Pricing">
        <Sub title="Price distribution (CheapShark)">
          {priceBrackets.filter((b) => b.value > 0).map((b, i) => (
            <Bar key={b.label} label={b.label} value={b.value} max={maxPrice} color={COLORS[i % COLORS.length]} count={b.value} />
          ))}
        </Sub>
      </Section>

      {freeEndingSoon.length > 0 && (
        <Section title="⚡ Ending Soon">
          <div className="text-xs font-mono mb-2" style={{ color: 'var(--fg-muted)' }}>
            9 games expiring within 48 hours
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-1.5">
            {freeEndingSoon.map((g, i) => {
              const hours = Math.round((new Date(g.endDate).getTime() - Date.now()) / 3600000)
              return (
                <div key={i} className="flex items-center justify-between px-3 py-1.5 border text-xs font-mono"
                  style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-card)' }}>
                  <span className="truncate" style={{ color: 'var(--fg-primary)' }}>{g.title}</span>
                  <span className="shrink-0 ml-2" style={{ color: hours <= 6 ? 'var(--accent-red)' : 'var(--accent-yellow)' }}>
                    {hours}h
                  </span>
                </div>
              )
            })}
          </div>
        </Section>
      )}
    </div>
  )
}
