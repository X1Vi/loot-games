import { useEffect, useState } from 'react'
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

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open])

  const run = async (target: ShareTarget) => {
    setError(null)
    try {
      const outcome = await share(target, payload)
      if (outcome.status === 'copied') {
        setCopied(true)
        window.setTimeout(() => {
          setCopied(false)
        }, 1500)
      }
      setOpen(false)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Share failed')
    }
  }

  const itemClasses =
    'text-left text-[10px] font-mono px-3 py-2 border-b transition-colors cursor-pointer'
  const itemHandlers = {
    onMouseEnter: (e: React.MouseEvent<HTMLElement>) => {
      e.currentTarget.style.color = 'var(--fg-primary)'
      e.currentTarget.style.backgroundColor = 'var(--accent-bg)'
    },
    onMouseLeave: (e: React.MouseEvent<HTMLElement>) => {
      e.currentTarget.style.color = 'var(--fg-dim)'
      e.currentTarget.style.backgroundColor = 'transparent'
    },
  }
  const itemStyle = {
    color: 'var(--fg-dim)',
    borderColor: 'var(--border-subtle)',
  } as const

  return (
    <div className="relative inline-block">
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => {
          setError(null)
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.65)' }}
          onClick={() => {
            setOpen(false)
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Share ${payload.title}`}
            className="w-full max-w-xs border flex flex-col"
            style={{
              borderColor: 'var(--border-mid)',
              backgroundColor: 'var(--bg-header)',
              boxShadow: '0 12px 40px rgba(0, 0, 0, 0.55)',
            }}
            onClick={(e) => {
              e.stopPropagation()
            }}
          >
            <div
              className="flex items-center justify-between gap-2 px-3 py-2 border-b"
              style={{ borderColor: 'var(--border-subtle)' }}
            >
              <span
                className="text-[10px] font-mono uppercase truncate"
                style={{ color: 'var(--fg-primary)' }}
              >
                {`> SHARE: ${payload.title}`}
              </span>
              <button
                type="button"
                aria-label="Close share dialog"
                onClick={() => {
                  setOpen(false)
                }}
                className="text-[10px] font-mono px-1 cursor-pointer shrink-0"
                style={{ color: 'var(--fg-faint)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--fg-primary)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--fg-faint)'
                }}
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col">
              {SHARE_TARGETS.map((target) => {
                if (target.id === 'native' || target.id === 'copy' || target.id === 'copy-link') {
                  return (
                    <button
                      key={target.id}
                      type="button"
                      onClick={() => {
                        void run(target.id)
                      }}
                      className={itemClasses}
                      style={itemStyle}
                      {...itemHandlers}
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
                    href={buildShareUrl(target.id, payload) ?? '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      setOpen(false)
                    }}
                    className={itemClasses}
                    style={itemStyle}
                    {...itemHandlers}
                  >
                    {target.label}
                    <span className="block text-[9px]" style={{ color: 'var(--fg-faint)' }}>
                      {target.description}
                    </span>
                  </a>
                )
              })}
            </div>

            {error !== null && (
              <span className="px-3 py-1.5 text-[9px] font-mono" style={{ color: 'var(--accent-red)' }}>
                ! {error}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
