import { useEffect, useRef, useState } from 'react'
import { ADSTERRA_BANNER_300x250 } from '../lib/ads'

interface AdSlotProps {
  label?: string
}

export function AdSlot({ label = 'SPONSORED' }: AdSlotProps) {
  const { page, width, height } = ADSTERRA_BANNER_300x250
  const frameRef = useRef<HTMLIFrameElement>(null)
  const [adReady, setAdReady] = useState(false)

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

  return (
    <div
      className="flex flex-col items-center gap-1 p-2 border"
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
      <div className="relative max-w-full" style={{ width, height }}>
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-3 border font-mono text-center transition-colors"
          style={{
            borderColor: 'var(--border-bright)',
            color: 'var(--fg-muted)',
            backgroundColor: 'var(--bg-card)',
          }}
          aria-hidden={adReady}
        >
          <span className="text-base font-bold tracking-[0.25em]">ADVERTISEMENT</span>
          <span className="px-4 text-xs" style={{ color: 'var(--fg-dim)' }}>
            No ad available
          </span>
        </div>
        <iframe
          ref={frameRef}
          title="Advertisement"
          src={page}
          width={width}
          height={height}
          sandbox="allow-scripts"
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
      </div>
    </div>
  )
}
