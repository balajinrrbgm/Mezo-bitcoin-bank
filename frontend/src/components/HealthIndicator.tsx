interface HealthIndicatorProps {
  icrPercent?: number
  size?: 'sm' | 'md' | 'lg'
}

function getHealthColor(icr?: number) {
  if (!icr) return { text: 'text-gray-500', bg: 'bg-gray-600', fill: 'bg-gray-600', label: 'No Position' }
  if (icr >= 200) return { text: 'text-bank-green', bg: 'bg-bank-green/20', fill: 'bg-bank-green', label: 'Safe' }
  if (icr >= 150) return { text: 'text-bank-yellow', bg: 'bg-bank-yellow/20', fill: 'bg-bank-yellow', label: 'Warning' }
  return { text: 'text-bank-red', bg: 'bg-bank-red/20', fill: 'bg-bank-red', label: 'At Risk' }
}

export function HealthIndicator({ icrPercent, size = 'md' }: HealthIndicatorProps) {
  const colors = getHealthColor(icrPercent)
  // Cap fill at 300% for display
  const fillPct = icrPercent ? Math.min((icrPercent / 300) * 100, 100) : 0

  const textSize = size === 'lg' ? 'text-4xl' : size === 'md' ? 'text-2xl' : 'text-lg'

  return (
    <div className="space-y-2">
      <div className="flex items-end justify-between">
        <span className={`font-display font-bold ${textSize} ${colors.text}`}>
          {icrPercent ? `${icrPercent.toFixed(1)}%` : '—'}
        </span>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${colors.bg} ${colors.text}`}>
          {colors.label}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-3 bg-bank-border rounded-full overflow-hidden">
        {/* Danger zone marker at 150% */}
        <div className="relative h-full">
          <div
            className={`h-full rounded-full health-bar-fill ${colors.fill}`}
            style={{ width: `${fillPct}%` }}
          />
          {/* 150% marker */}
          <div
            className="absolute top-0 bottom-0 w-px bg-bank-red/60"
            style={{ left: `${(150 / 300) * 100}%` }}
          />
          {/* 200% marker */}
          <div
            className="absolute top-0 bottom-0 w-px bg-bank-green/60"
            style={{ left: `${(200 / 300) * 100}%` }}
          />
        </div>
      </div>

      {/* Scale labels */}
      <div className="flex justify-between text-[10px] text-gray-600">
        <span>100%</span>
        <span className="text-bank-red/80">150% MCR</span>
        <span className="text-bank-green/80">200%</span>
        <span>300%+</span>
      </div>
    </div>
  )
}

// Compact badge version
export function HealthBadge({ icrPercent }: { icrPercent?: number }) {
  const colors = getHealthColor(icrPercent)
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${colors.bg} ${colors.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${colors.fill}`} />
      {icrPercent ? `${icrPercent.toFixed(1)}%` : '—'} {colors.label}
    </span>
  )
}
