import { useMemo } from 'react'
import { ADSTERRA_BANNER_300x250 } from '../lib/ads'

interface AdSlotProps {
  label?: string
}

export function AdSlot({ label = 'SPONSORED' }: AdSlotProps) {
  const { key, format, width, height, scriptBase } = ADSTERRA_BANNER_300x250

  const srcDoc = useMemo(
    () => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <style>html,body{margin:0;padding:0;overflow:hidden;background:transparent}</style>
  </head>
  <body>
    <script type="text/javascript">
      atOptions = { 'key': '${key}', 'format': '${format}', 'height': ${height}, 'width': ${width}, 'params': {} };
    </script>
    <script type="text/javascript" src="${scriptBase}/${key}/invoke.js"></script>
  </body>
</html>`,
    [key, format, width, height, scriptBase],
  )

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
      <iframe
        title="Advertisement"
        width={width}
        height={height}
        srcDoc={srcDoc}
        scrolling="no"
        loading="lazy"
        className="max-w-full"
        style={{ border: 0, display: 'block' }}
      />
    </div>
  )
}
