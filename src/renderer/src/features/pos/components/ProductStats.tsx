import { AlertTriangle, Boxes, CheckCircle2 } from 'lucide-react'

interface ProductStatsProps {
  total: number
  active: number
  lowStock: number
}

export function ProductStats({ total, active, lowStock }: ProductStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Stat icon={<Boxes className="w-5 h-5" />} label="Productos" value={total.toString()} />
      <Stat
        icon={<CheckCircle2 className="w-5 h-5" />}
        label="Activos"
        value={active.toString()}
        tone="emerald"
      />
      <Stat
        icon={<AlertTriangle className="w-5 h-5" />}
        label="Stock bajo"
        value={lowStock.toString()}
        tone="amber"
      />
    </div>
  )
}

function Stat({
  icon,
  label,
  value,
  tone = 'slate',
}: {
  icon: React.ReactNode
  label: string
  value: string
  tone?: 'slate' | 'emerald' | 'amber'
}) {
  const styles = {
    slate: 'text-slate-900 bg-white border-slate-200',
    emerald: 'text-emerald-700 bg-emerald-50 border-emerald-100',
    amber: 'text-amber-700 bg-amber-50 border-amber-100',
  }[tone]

  return (
    <div className={`rounded-2xl border p-5 shadow-sm ${styles}`}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase opacity-70">{label}</p>
        <div className="opacity-70">{icon}</div>
      </div>
      <p className="mt-2 text-3xl font-extrabold">{value}</p>
    </div>
  )
}
