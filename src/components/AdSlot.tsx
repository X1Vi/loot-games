import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ADSTERRA_DESKTOP_BANNER,
  ADSTERRA_MOBILE_BANNER,
  ADSTERRA_RECTANGLE,
  ADSTERRA_SPONSOR_URL,
} from '../lib/ads'
import type { AdFormat, AdUnit } from '../lib/ads'

interface AdSlotProps {
  label?: string
  format?: AdFormat
}

const DESKTOP_BANNER_QUERY = '(min-width: 768px)'

function getBannerPreference() {
  return typeof window !== 'undefined' && window.matchMedia(DESKTOP_BANNER_QUERY).matches
}

function adDocument({ key, width, height }: AdUnit) {
  const options = JSON.stringify({ key, format: 'iframe', height, width, params: {} })
  const compact = height <= 90
  const message = compact
    ? '<span class="message"><strong>Keep LOOT TERMINAL free</strong><small>Visit our sponsor</small></span><span class="button">VIEW SPONSOR&nbsp; ↗</span>'
    : '<span class="eyebrow">Sponsored</span><strong>Support LOOT TERMINAL</strong><span class="description">A quick sponsor visit helps keep game and deal tracking free.</span><span class="button">VIEW SPONSOR&nbsp; ↗</span>'

  return `<!doctype html><html><head><base target="_blank"><meta name="referrer" content="strict-origin-when-cross-origin"><style>
    *{box-sizing:border-box}html,body{margin:0;width:100%;height:100%;overflow:hidden;background:transparent;font-family:"JetBrains Mono","Fira Code",Consolas,monospace;color:#6fcf8a}
    body{position:relative;display:flex;align-items:center;justify-content:center}
    #fallback{position:absolute;inset:0;z-index:0;display:flex;${compact ? 'flex-direction:row;align-items:center;justify-content:space-between;text-align:left;padding:8px 14px;gap:12px' : 'flex-direction:column;align-items:flex-start;justify-content:center;text-align:left;padding:24px;gap:10px'};border:1px solid rgba(111,207,138,.28);background:linear-gradient(120deg,#1e1e32,#181825);color:#6fcf8a;text-decoration:none}
    #fallback:hover{border-color:rgba(111,207,138,.7);background:linear-gradient(120deg,#24243a,#1e1e32)}
    .message{min-width:0;display:flex;flex-direction:column;gap:2px}.message strong{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:${height <= 50 ? '10px' : '13px'}}
    small,.description{color:rgba(111,207,138,.55)}.description{font-size:12px;line-height:1.45}.eyebrow{font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:rgba(111,207,138,.5)}
    strong{font-size:${compact ? '13px' : '18px'};line-height:1.2}.button{flex:0 0 auto;display:inline-flex;align-items:center;justify-content:center;padding:${compact ? '7px 9px' : '9px 12px'};border:1px solid rgba(111,207,138,.45);background:rgba(111,207,138,.1);color:#6fcf8a;font-size:${compact ? '9px' : '11px'};font-weight:700;white-space:nowrap}
    body>iframe,body>object,body>embed{position:relative;z-index:2;border:0;max-width:100%}
  </style></head><body>
    <a id="fallback" href="${ADSTERRA_SPONSOR_URL}" rel="sponsored noopener noreferrer" aria-label="Visit our sponsor">${message}</a>
    <script>
      const fallback=document.getElementById('fallback');
      const revealCreative=()=>{if(document.querySelector('body>iframe,body>object,body>embed'))fallback.hidden=true};
      new MutationObserver(revealCreative).observe(document.body,{childList:true,subtree:true});
    </script>
    <script>window.atOptions=${options};</script>
    <script src="https://www.highrevenueformat.com/${key}/invoke.js"></script>
  </body></html>`
}

export function AdSlot({ label = 'SPONSORED', format = 'rectangle' }: AdSlotProps) {
  const slotRef = useRef<HTMLDivElement>(null)
  const [isDesktopBanner, setIsDesktopBanner] = useState(getBannerPreference)
  const [shouldLoad, setShouldLoad] = useState(false)
  const unit = format === 'rectangle'
    ? ADSTERRA_RECTANGLE
    : isDesktopBanner
      ? ADSTERRA_DESKTOP_BANNER
      : ADSTERRA_MOBILE_BANNER
  const srcDoc = useMemo(() => adDocument(unit), [unit])

  useEffect(() => {
    if (format === 'rectangle') return
    const media = window.matchMedia(DESKTOP_BANNER_QUERY)
    const handleChange = (event: MediaQueryListEvent) => {
      setIsDesktopBanner(event.matches)
    }
    media.addEventListener('change', handleChange)
    return () => media.removeEventListener('change', handleChange)
  }, [format])

  useEffect(() => {
    const slot = slotRef.current
    if (!slot || shouldLoad) return

    if (!('IntersectionObserver' in window)) {
      const timeout = setTimeout(() => setShouldLoad(true), 0)
      return () => clearTimeout(timeout)
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        setShouldLoad(true)
        observer.disconnect()
      },
      { rootMargin: '300px 0px' },
    )
    observer.observe(slot)
    return () => observer.disconnect()
  }, [shouldLoad])

  return (
    <div
      ref={slotRef}
      className="flex flex-col items-center gap-1.5 py-2 border"
      style={{
        borderColor: 'var(--border-subtle)',
        backgroundColor: 'var(--bg-card)',
      }}
    >
      <span
        className="text-[10px] font-mono uppercase tracking-wider"
        style={{ color: 'var(--fg-faint)' }}
      >
        {label}
      </span>
      <div
        className="relative max-w-full overflow-hidden"
        style={{ width: unit.width, height: unit.height }}
      >
        {shouldLoad && (
          <iframe
            key={`${unit.key}-${unit.width}`}
            title="Advertisement"
            srcDoc={srcDoc}
            width={unit.width}
            height={unit.height}
            sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"
            referrerPolicy="strict-origin-when-cross-origin"
            scrolling="no"
            loading="lazy"
            className="absolute inset-0 max-w-full"
            style={{
              border: 0,
              display: 'block',
            }}
          />
        )}
      </div>
    </div>
  )
}
