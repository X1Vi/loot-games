import { useEffect, useRef, useState } from 'react'
import {
  ADSTERRA_DESKTOP_BANNER,
  ADSTERRA_MOBILE_BANNER,
  ADSTERRA_RECTANGLE,
} from '../lib/ads'
import type { AdFormat } from '../lib/ads'

interface AdSlotProps {
  label?: string
  format?: AdFormat
}

const DESKTOP_BANNER_QUERY = '(min-width: 768px)'

function getBannerPreference() {
  return typeof window !== 'undefined' && window.matchMedia(DESKTOP_BANNER_QUERY).matches
}

export function AdSlot({ label = 'SPONSORED', format = 'rectangle' }: AdSlotProps) {
  const slotRef = useRef<HTMLDivElement>(null)
  const frameRef = useRef<HTMLIFrameElement>(null)
  const [isDesktopBanner, setIsDesktopBanner] = useState(getBannerPreference)
  const [shouldLoad, setShouldLoad] = useState(false)
  const [adReady, setAdReady] = useState(false)
  const [timedOut, setTimedOut] = useState(false)
  const unit = format === 'rectangle'
    ? ADSTERRA_RECTANGLE
    : isDesktopBanner
      ? ADSTERRA_DESKTOP_BANNER
      : ADSTERRA_MOBILE_BANNER

  useEffect(() => {
    if (format === 'rectangle') return
    const media = window.matchMedia(DESKTOP_BANNER_QUERY)
    const handleChange = (event: MediaQueryListEvent) => {
      setIsDesktopBanner(event.matches)
      setAdReady(false)
      setTimedOut(false)
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

  useEffect(() => {
    if (!shouldLoad || adReady) return
    const timeout = window.setTimeout(() => setTimedOut(true), 10_000)
    return () => window.clearTimeout(timeout)
  }, [adReady, shouldLoad, unit.page])

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (
        event.source === frameRef.current?.contentWindow &&
        event.data?.type === 'loot-terminal-ad-rendered'
      ) {
        setAdReady(true)
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  if (timedOut && !adReady) return null

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
        <div
          className="absolute inset-0 flex items-center justify-center border font-mono text-center transition-colors"
          style={{
            borderColor: 'var(--border-bright)',
            color: 'var(--fg-muted)',
            backgroundColor: 'var(--bg-card)',
          }}
          aria-hidden={adReady}
        >
          <span className="text-xs font-bold tracking-[0.2em]">ADVERTISEMENT</span>
        </div>
        {shouldLoad && (
          <iframe
            key={unit.page}
            ref={frameRef}
            title="Advertisement"
            src={unit.page}
            width={unit.width}
            height={unit.height}
            allow="autoplay 'none'; camera 'none'; geolocation 'none'; microphone 'none'; payment 'none'; usb 'none'"
            referrerPolicy="strict-origin-when-cross-origin"
            scrolling="no"
            loading="lazy"
            className="absolute inset-0 max-w-full transition-opacity"
            style={{
              border: 0,
              display: 'block',
              opacity: adReady ? 1 : 0,
              pointerEvents: adReady ? 'auto' : 'none',
            }}
          />
        )}
      </div>
    </div>
  )
}
