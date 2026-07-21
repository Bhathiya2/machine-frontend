import { fmtCurrency } from '../utils/formatters'

interface TooltipPayload {
  name?: string
  value?: number
  color?: string
}

interface ChartTooltipProps {
  active?: boolean
  payload?: TooltipPayload[]
  label?: string
}

export function ChartTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-primary text-white text-xs rounded-lg px-3 py-2 shadow-lg">
      <p className="font-mono font-semibold mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color ?? '#F59E0B' }}>
          {p.name}:{' '}
          {typeof p.value === 'number' && p.name?.toLowerCase().includes('cost')
            ? fmtCurrency(p.value)
            : p.value}
        </p>
      ))}
    </div>
  )
}
