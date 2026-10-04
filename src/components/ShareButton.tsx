import { useState } from 'react'
import { SHARE_TARGETS, buildShareUrl, share } from '../lib/share'
import type { SharePayload, ShareTarget } from '../lib/share'

interface ShareButtonProps {
  readonly payload: SharePayload
  readonly label?: string
}

export function ShareButton({ payload, label = 'SHARE' }: ShareButtonProps) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const run = async (target: ShareTarget) => {
    setError(null)
    try {
      if (target === 'copy' || target === 'copy-link') {
        await share(target, payload)
        setCopied(true)
        window.setTimeout(() => {
          setCopied(false)
        }, 1500)
        return
      }
      await share('native', payload)
      setOpen(false)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Share failed')
    }
  }

  return (
    <div className="relative inline-block">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => {
          setOpen((value) => !value)
        }}
        className="text-[10px] font-mono border px-2 py-0.5 transition-colors cursor-pointer"
        style={{
          color: copied ? 'var(--accent-green)' : 'var(--fg-dim)',
          borderColor: 'var(--border-mid)',
          backgroundColor: 'transparent',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = copied ? 'var(--accent-green)' : 'var(--fg-primary)'
          e.currentTarget.style.borderColor = 'var(--border-bright)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = copied ? 'var(--accent-green)' : 'var(--fg-dim)'
          e.currentTarget.style.borderColor = 'var(--border-mid)'
        }}
      >
        {copied ? 'COPIED' : `▸ ${label}`}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-30 mt-1 border flex flex-col"
          style={{
            minWidth: '190px',
            borderColor: 'var(--border-mid)',
            backgroundColor: 'var(--bg-header)',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.55)',
          }}
        >
          {SHARE_TARGETS.map((target) => {
            const itemStyle = {
              color: 'var(--fg-dim)',
              borderColor: 'var(--border-subtle)',
            } as const

            if (target.id === 'native' || target.id === 'copy' || target.id === 'copy-link') {
              return (
                <button
                  key={target.id}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    void run(target.id)
                  }}
                  className="text-left text-[10px] font-mono px-2 py-1.5 border-b transition-colors cursor-pointer"
                  style={itemStyle}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = 'var(--fg-primary)'
                    e.currentTarget.style.backgroundColor = 'var(--accent-bg)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'var(--fg-dim)'
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }}
                >
                  {target.label}
                  <span className="block text-[9px]" style={{ color: 'var(--fg-faint)' }}>
                    {target.description}
                  </span>
                </button>
              )
            }

            return (
              <a
                key={target.id}
                role="menuitem"
                href={buildShareUrl(target.id, payload) ?? '#'}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  setOpen(false)
                }}
                className="text-left text-[10px] font-mono px-2 py-1.5 border-b transition-colors"
                style={itemStyle}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--fg-primary)'
                  e.currentTarget.style.backgroundColor = 'var(--accent-bg)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--fg-dim)'
                  e.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                {target.label}
                <span className="block text-[9px]" style={{ color: 'var(--fg-faint)' }}>
                  {target.description}
                </span>
              </a>
            )
          })}
          {error !== null && (
            <span className="px-2 py-1 text-[9px] font-mono" style={{ color: 'var(--accent-red)' }}>
              ! {error}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
