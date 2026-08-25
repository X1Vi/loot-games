interface OutputProps {
  lines: string[]
  className?: string
}

export function Output({ lines, className = '' }: OutputProps) {
  return (
    <div className={`font-mono text-sm leading-relaxed ${className}`}>
      {lines.map((line, i) => (
        <div key={i} className="whitespace-pre-wrap break-all">
          {line || '\u00A0'}
        </div>
      ))}
    </div>
  )
}
