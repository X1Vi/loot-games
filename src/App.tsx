import { useState, useCallback, useEffect } from 'react'
import { TerminalHeader } from './components/TerminalHeader'
import { FreeGames } from './components/FreeGames'
import { Deals } from './components/Deals'
import { About } from './components/About'
import { useLocalStorage } from './hooks/useLocalStorage'
import type { TabId, ThemeId } from './types'

function TabContent({ tab }: { tab: TabId }) {
  switch (tab) {
    case 'free':
      return <FreeGames />
    case 'deals':
      return <Deals />
    case 'about':
      return <About />
  }
}

export default function App() {
  const [theme, setTheme] = useLocalStorage<ThemeId>('loot-terminal-theme', 'matrix')
  const [activeTab, setActiveTab] = useState<TabId>('free')
  const [status, setStatus] = useState('READY')
  const apiCount = 5

  const handleTabChange = useCallback((tab: TabId) => {
    setActiveTab(tab)
    setStatus(`SWITCHED TO ${tab.toUpperCase()}`)
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F1') handleTabChange('free')
      else if (e.key === 'F2') handleTabChange('deals')
      else if (e.key === 'F3') handleTabChange('about')
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
        className="flex-1 overflow-y-auto relative"
        style={{ backgroundColor: 'var(--bg-primary)' }}
      >
        <TabContent tab={activeTab} />
      </main>

      <footer
        className="border-t px-4 py-1 flex items-center justify-between text-xs font-mono shrink-0"
        style={{
          borderColor: 'var(--border-subtle)',
          backgroundColor: 'var(--bg-header)',
        }}
      >
        <div className="flex items-center gap-4">
          <span style={{ color: 'var(--fg-dim)' }}>
            [{activeTab.toUpperCase()}]
          </span>
          <span style={{ color: 'var(--fg-muted)' }}>
            STATUS: {status}
          </span>
        </div>
        <div className="flex items-center gap-4" style={{ color: 'var(--fg-faint)' }}>
          <span>APIS: {apiCount}</span>
          <span className="hidden sm:inline">LOOT TERMINAL v2.0.0</span>
          <span
            className="inline-block w-2 h-4 animate-pulse"
            style={{ backgroundColor: 'var(--fg-primary)' }}
          />
        </div>
      </footer>
    </div>
  )
}
