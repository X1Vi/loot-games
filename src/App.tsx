import { useState, useCallback, useEffect, useLayoutEffect, useRef } from 'react'
import { TerminalHeader } from './components/TerminalHeader'
import { FreeGames } from './components/FreeGames'
import { Showcase } from './components/Showcase'
import { Deals } from './components/Deals'
import { Compare } from './components/Compare'
import { About } from './components/About'
import { SocialLinks } from './components/SocialLinks'
import { useLocalStorage } from './hooks/useLocalStorage'
import type { TabId, ThemeId } from './types'

import { Stats } from './components/Stats'

const SCROLL_POSITIONS_KEY = 'loot-terminal-scroll-positions'

function loadScrollPositions(): Partial<Record<TabId, number>> {
  try {
    const saved = JSON.parse(window.localStorage.getItem(SCROLL_POSITIONS_KEY) ?? '{}') as Record<string, unknown>
    return Object.fromEntries(
      Object.entries(saved).filter(([, value]) => typeof value === 'number' && Number.isFinite(value)),
    ) as Partial<Record<TabId, number>>
  } catch {
    return {}
  }
}

function TabContent({ tab }: { tab: TabId }) {
  switch (tab) {
    case 'free':
      return <FreeGames />
    case 'showcase':
      return <Showcase />
    case 'deals':
      return <Deals />
    case 'compare':
      return <Compare />
    case 'stats':
      return <Stats />
    case 'about':
      return <About />
  }
}

export default function App() {
  const [theme, setTheme] = useLocalStorage<ThemeId>('loot-terminal-theme', 'matrix')
  const [activeTab, setActiveTab] = useLocalStorage<TabId>('loot-terminal-active-tab', 'showcase')
  const [status, setStatus] = useState('READY')
  const mainRef = useRef<HTMLElement>(null)
  const scrollPositionsRef = useRef(loadScrollPositions())
  const scrollSaveTimerRef = useRef<number>(undefined)
  const restoringScrollRef = useRef(false)
  const apiCount = 5

  const persistScrollPositions = useCallback(() => {
    try {
      window.localStorage.setItem(SCROLL_POSITIONS_KEY, JSON.stringify(scrollPositionsRef.current))
    } catch {
      // localStorage full or unavailable
    }
  }, [])

  const saveScrollPosition = useCallback(
    (tab: TabId) => {
      if (!mainRef.current) return
      scrollPositionsRef.current[tab] = mainRef.current.scrollTop
      persistScrollPositions()
    },
    [persistScrollPositions],
  )

  const handleTabChange = useCallback(
    (tab: TabId) => {
      saveScrollPosition(activeTab)
      setActiveTab(tab)
      setStatus(`SWITCHED TO ${tab.toUpperCase()}`)
    },
    [activeTab, saveScrollPosition, setActiveTab],
  )

  const handleMainScroll = useCallback(() => {
    if (!mainRef.current || restoringScrollRef.current) return
    scrollPositionsRef.current[activeTab] = mainRef.current.scrollTop
    window.clearTimeout(scrollSaveTimerRef.current)
    scrollSaveTimerRef.current = window.setTimeout(persistScrollPositions, 150)
  }, [activeTab, persistScrollPositions])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  useLayoutEffect(() => {
    const main = mainRef.current
    if (!main) return

    const target = scrollPositionsRef.current[activeTab] ?? 0
    let animationFrame = 0
    restoringScrollRef.current = true

    const restore = () => {
      main.scrollTop = target
      if (target === 0 || Math.abs(main.scrollTop - target) <= 1) {
        restoringScrollRef.current = false
        observer.disconnect()
        window.clearTimeout(timeout)
      }
    }

    const observer = new MutationObserver(() => {
      window.cancelAnimationFrame(animationFrame)
      animationFrame = window.requestAnimationFrame(restore)
    })
    observer.observe(main, { childList: true, subtree: true })
    animationFrame = window.requestAnimationFrame(restore)
    const timeout = window.setTimeout(() => {
      restoringScrollRef.current = false
      observer.disconnect()
    }, 5_000)

    return () => {
      window.cancelAnimationFrame(animationFrame)
      window.clearTimeout(timeout)
      observer.disconnect()
      restoringScrollRef.current = false
    }
  }, [activeTab])

  useEffect(() => {
    const saveBeforeLeaving = () => saveScrollPosition(activeTab)
    window.addEventListener('pagehide', saveBeforeLeaving)
    return () => {
      window.removeEventListener('pagehide', saveBeforeLeaving)
      window.clearTimeout(scrollSaveTimerRef.current)
    }
  }, [activeTab, saveScrollPosition])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F1') handleTabChange('free')
      else if (e.key === 'F2') handleTabChange('showcase')
      else if (e.key === 'F3') handleTabChange('deals')
      else if (e.key === 'F4') handleTabChange('compare')
      else if (e.key === 'F5') handleTabChange('stats')
      else if (e.key === 'F6') handleTabChange('about')
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleTabChange])

  return (
    <div
      className="h-dvh flex flex-col overflow-hidden scanlines"
      style={{
        backgroundColor: 'var(--bg-primary)',
        color: 'var(--fg-primary)',
      }}
    >
      <TerminalHeader
        activeTab={activeTab}
        onTabChange={handleTabChange}
        theme={theme}
        onThemeChange={setTheme}
      />

      <main
        ref={mainRef}
        onScroll={handleMainScroll}
        className="flex-1 overflow-y-auto relative"
        style={{ backgroundColor: 'var(--bg-primary)' }}
      >
        <TabContent tab={activeTab} />
      </main>

      <footer
        className="border-t px-2 sm:px-4 py-1 flex items-center gap-2 sm:gap-4 text-xs font-mono shrink-0"
        style={{
          borderColor: 'var(--border-subtle)',
          backgroundColor: 'var(--bg-header)',
        }}
      >
        <div className="flex shrink-0 items-center gap-4">
          <span style={{ color: 'var(--fg-dim)' }}>
            [{activeTab.toUpperCase()}]
          </span>
          <span className="hidden md:inline" style={{ color: 'var(--fg-muted)' }}>
            STATUS: {status}
          </span>
        </div>

        <a
          href="https://launchfree.io/listings/loot-games.html"
          target="_blank"
          rel="noopener"
          className="ml-auto shrink-0 opacity-85 transition-opacity hover:opacity-100 focus-visible:opacity-100"
          aria-label="View Loot Terminal on The Runway at LaunchFree.io"
        >
          <img
            src="https://launchfree.io/badge-dark.svg"
            alt="Listed on The Runway - LaunchFree.io"
            width="250"
            height="56"
            className="h-auto w-[130px] sm:w-[160px] lg:w-[180px]"
          />
        </a>

        <div className="flex shrink-0 items-center gap-4" style={{ color: 'var(--fg-faint)' }}>
          <div className="hidden lg:block">
            <SocialLinks />
          </div>
          <span className="hidden xl:inline">APIS: {apiCount}</span>
          <span className="hidden xl:inline">LOOT TERMINAL v2.0.0</span>
          <span
            className="inline-block w-2 h-4 animate-pulse"
            style={{ backgroundColor: 'var(--fg-primary)' }}
          />
        </div>
      </footer>
    </div>
  )
}
