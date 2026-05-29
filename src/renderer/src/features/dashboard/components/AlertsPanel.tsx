import { AlertCircle, ArrowRight } from 'lucide-react'
import { Card } from '../../../components/ui'
import { Link } from 'react-router-dom'
import type { Membership } from '../../../types/database'
import { formatRelative } from '../../../utils/formatters'

interface AlertsPanelProps {
  expiringMemberships: Membership[]
  isLoading?: boolean
}

export function AlertsPanel({ expiringMemberships, isLoading }: AlertsPanelProps) {
  if (isLoading) {
    return (
      <Card title="Alertas">
        <div className="animate-pulse space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-12 bg-slate-200 rounded-lg" />
          ))}
        </div>
      </Card>
    )
  }

  return (
    <Card padding="none" className="overflow-hidden flex flex-col h-full">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <h3 className="font-semibold text-slate-900 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-warning-500" />
          Alertas
        </h3>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {expiringMemberships.length === 0 ? (
          <div className="p-6 text-center text-slate-500 text-sm">
            No hay alertas pendientes. Todo está en orden.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {expiringMemberships.map((membership) => (
              <div key={membership.id} className="p-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      Membresía próxima a vencer
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {membership.member?.full_name} ({membership.plan?.name})
                    </p>
                  </div>
                  <span className="text-xs font-medium text-warning-600 bg-warning-50 px-2 py-1 rounded-md">
                    Vence {formatRelative(membership.end_date)}
                  </span>
                </div>
                <div className="mt-3 flex justify-end">
                  <Link
                    to={`/members/${membership.member_id}`}
                    className="text-xs font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1"
                  >
                    Ver miembro <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  )
}
