interface Props {
  battery: number
  maxBattery: number
}

export default function BatteryBar({ battery, maxBattery }: Props) {
  const pct = maxBattery > 0 ? (battery / maxBattery) * 100 : 0
  const color =
    pct > 50 ? '#22c55e'
    : pct > 25 ? '#f59e0b'
    : '#ef4444'

  return (
    <div className="flex items-center gap-3">
      <span className="text-[10px] text-slate-400 uppercase tracking-widest whitespace-nowrap">
        Battery
      </span>
      <div className="flex-1 h-3 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-xs font-mono font-bold" style={{ color }}>
        {battery}/{maxBattery}
      </span>
    </div>
  )
}
