import type { TabId, ThemeId } from '../types'
import { THEMES } from '../types'
import { useState, useRef, useEffect } from 'react'

const TABS: { id: TabId; label: string; shortcut: string }[] = [
  { id: 'free', label: 'FREE', shortcut: 'F1' },
  { id: 'deals', label: 'DEALS', shortcut: 'F2' },
  { id: 'stats', label: 'STATS', shortcut: 'F3' },
  { id: 'about', label: 'ABOUT', shortcut: 'F4' },
]

interface TerminalHeaderProps {
  activeTab: TabId
  onTabChange: (tab: TabId) => void
  theme: ThemeId
  onThemeChange: (theme: ThemeId) => void
}

export function TerminalHeader({ activeTab, onTabChange, theme, onThemeChange }: TerminalHeaderProps) {
  const [paletteOpen, setPaletteOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setPaletteOpen(false)
      }
    }
    if (paletteOpen) {
      document.addEventListener('mousedown', handleClick)
      return () => document.removeEventListener('mousedown', handleClick)
    }
  }, [paletteOpen])

  return (
    <header
      className="border-b px-4 py-2 flex items-center justify-between shrink-0"
      style={{
        borderColor: 'var(--border-mid)',
        backgroundColor: 'var(--bg-header)',
      }}
    >
      <div className="flex items-center gap-2">
        <span
          className="font-bold text-sm tracking-wider"
          style={{ color: 'var(--fg-primary)' }}
        >
          ▓ LOOT TERMINAL
        </span>
        <span
          className="text-xs hidden sm:inline"
          style={{ color: 'var(--fg-faint)' }}
        >
          v2.0.0
        </span>
      </div>

      <nav className="flex gap-0.5">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className="px-3 py-1 text-xs font-mono border transition-colors cursor-pointer"
            style={
              activeTab === tab.id
                ? {
                    borderColor: 'var(--border-bright)',
                    backgroundColor: 'var(--accent-bg-hover)',
                    color: 'var(--fg-primary)',
                  }
                : {
                    borderColor: 'transparent',
                    color: 'var(--fg-dim)',
                  }
            }
            onMouseEnter={(e) => {
              if (activeTab !== tab.id) {
                e.currentTarget.style.color = 'var(--fg-muted)'
                e.currentTarget.style.borderColor = 'var(--border-mid)'
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== tab.id) {
                e.currentTarget.style.color = 'var(--fg-dim)'
                e.currentTarget.style.borderColor = 'transparent'
              }
            }}
          >
            [{tab.label}]
          </button>
        ))}
      </nav>

      <div className="flex items-center gap-3">
        {/* Theme palette */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setPaletteOpen(!paletteOpen)}
            className="flex items-center gap-1 px-2 py-1 text-xs font-mono border cursor-pointer transition-colors"
            style={{
              borderColor: 'var(--border-mid)',
              color: 'var(--fg-dim)',
              backgroundColor: 'transparent',
            }}
            title="Theme palette"
          >
            <span
              className="inline-block w-3 h-3 rounded-full border"
              style={{
                backgroundColor: THEMES.find((t) => t.id === theme)?.swatch,
                borderColor: 'var(--fg-dim)',
              }}
            />
            <span className="hidden sm:inline" style={{ color: 'var(--fg-dim)' }}>
              THEME
            </span>
          </button>

          {paletteOpen && (
            <div
              className="absolute right-0 top-full mt-1 py-1 border z-50 min-w-[140px] shadow-lg"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                borderColor: 'var(--border-bright)',
              }}
            >
              <div
                className="px-3 py-1 text-[10px] uppercase tracking-wider border-b mb-1"
                style={{
                  color: 'var(--fg-dim)',
                  borderColor: 'var(--border-subtle)',
                }}
              >
                Terminal Theme
              </div>
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    onThemeChange(t.id)
                    setPaletteOpen(false)
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs font-mono cursor-pointer transition-colors text-left"
                  style={{
                    color: theme === t.id ? 'var(--fg-primary)' : 'var(--fg-muted)',
                    backgroundColor: theme === t.id ? 'var(--accent-bg-hover)' : 'transparent',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--accent-bg)'
                    e.currentTarget.style.color = 'var(--fg-primary)'
                  }}
                  onMouseLeave={(e) => {
                    if (theme !== t.id) {
                      e.currentTarget.style.backgroundColor = 'transparent'
                      e.currentTarget.style.color = 'var(--fg-muted)'
                    }
                  }}
                >
                  <span
                    className="inline-block w-3 h-3 rounded-full border flex-shrink-0"
                    style={{
                      backgroundColor: t.swatch,
                      borderColor: 'var(--fg-dim)',
                    }}
                  />
                  <span>{t.label}</span>
                  {theme === t.id && (
                    <span className="ml-auto" style={{ color: 'var(--fg-primary)' }}>
                      ✓
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <span className="text-xs font-mono hidden sm:block" style={{ color: 'var(--fg-faint)' }}>
          {new Date().toLocaleTimeString('en-US', { hour12: false })}
        </span>
      </div>
    </header>
  )
}
