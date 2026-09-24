import { SocialLinks } from './SocialLinks'
import { LIFE_SYS_URL } from '../lib/links'

export function About() {
  return (
    <div className="p-4 font-mono text-sm">
      <div className="mb-4 text-xs" style={{ color: 'var(--fg-faint)' }}>
        $ cat README.md
      </div>

      <pre
        className="leading-relaxed whitespace-pre-wrap text-sm"
        style={{ color: 'var(--fg-muted)' }}
      >
{`
╔══════════════════════════════════════════════════╗
║              ▓ LOOT TERMINAL v2.0.0              ║
╚══════════════════════════════════════════════════╝

[ SOURCES ]
  GamerPower      — Free game giveaways aggregator
  Epic Games      — Weekly free games store
  SteamDB         — Upcoming free Steam titles
  IsThereAnyDeal  — Free deals across storefronts
  CheapShark      — Game price comparison & deals

[ FEATURES ]
  • Real-time free game monitoring
  • Price tracking with sorting & filtering
  • Multi-source aggregation
  • Terminal-themed responsive UI
  • Zero backend — 100% client-side
  • Hostable on GitHub Pages
  • 5 terminal color themes (palette button)

[ USAGE ]
  [FREE]   — Browse all current free games (F1)
  [DEALS]  — Search game deals with filters (F2)
  [ABOUT]  — This information (F3)
  Click any game card to open its store page
  Click the palette button ▸ THEME to switch themes

[ THEMES ]
  Matrix  — Classic green on black
  Amber   — Retro orange phosphor
  Cyber   — Cyan on deep navy
  Mono    — High contrast white on black
  Retro   — Soft green on CRT tint

[ API REFERENCE ]
  • GamerPower:  https://www.gamerpower.com/api
  • Epic Games:  https://store-site-backend-static.ak.epicgames.com
  • SteamDB:     https://steamdb.info/rss
  • ITAD:        https://isthereanydeal.com/rss
  • CheapShark:  https://www.cheapshark.com/api

[ LICENSE ]
  MIT License — Free and open source

[ AUTHOR ]
  Made by X1Vi
  https://github.com/X1Vi

[ PROJECTS ]
  LIFE.SYS — stocks + life sim, free in browser
  https://x1vi.itch.io/life-sim

[ ACKNOWLEDGMENTS ]
  This project aggregates APIs from:
  freebie-finder-bot, lootscraper, MercuryBot,
  and PriceStalker open-source projects.
`}
      </pre>

      <div className="mt-4 text-xs" style={{ color: 'var(--fg-faint)' }}>
        $ projects --open
      </div>
      <div className="mt-2">
        <a
          href={LIFE_SYS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-mono border transition-colors"
          style={{ borderColor: 'var(--border-mid)', color: 'var(--fg-dim)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--fg-primary)'
            e.currentTarget.style.borderColor = 'var(--border-bright)'
            e.currentTarget.style.backgroundColor = 'var(--accent-bg)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--fg-dim)'
            e.currentTarget.style.borderColor = 'var(--border-mid)'
            e.currentTarget.style.backgroundColor = 'transparent'
          }}
        >
          <span>▶</span>
          <span>LIFE.SYS — stocks + life sim, free in browser</span>
        </a>
      </div>

      <div className="mt-4 text-xs" style={{ color: 'var(--fg-faint)' }}>
        $ donate --open
      </div>
      <div className="mt-2">
        <SocialLinks />
      </div>
    </div>
  )
}
