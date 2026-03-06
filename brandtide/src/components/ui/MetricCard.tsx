import GlassCard from './GlassCard'
import { TrendingUp, TrendingDown } from 'lucide-react'

export default function MetricCard({ label, value, delta }: { label: string; value: string; delta?: number }) {
  const isPositive = (delta ?? 0) >= 0

  return (
    <GlassCard className="flex flex-col gap-3">
      <span className="text-sm font-medium text-content-muted">{label}</span>
      <div className="text-3xl font-bold text-content">{value}</div>
      {delta !== undefined && (
        <div className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full w-fit ${isPositive ? 'bg-accent-50 text-accent-700' : 'bg-red-50 text-red-700'
          }`}>
          {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          {isPositive ? '+' : ''}{delta.toFixed(1)}%
        </div>
      )}
    </GlassCard>
  )
}
