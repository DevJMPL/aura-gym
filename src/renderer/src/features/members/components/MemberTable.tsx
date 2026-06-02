import { Link } from 'react-router-dom';
import { formatRelative } from '../../../utils/formatters';
import type { Member } from '../../../types/database';
import { Table, Badge } from '../../../components/ui';
import { ChevronRight, UserCircle } from 'lucide-react';
interface MemberTableProps {
  members: Member[];
}
export function MemberTable({
  members
}: MemberTableProps) {
  const columns = [{
    key: 'member',
    header: "Empleado".replace('Empleado', 'Miembro') || 'Miembro',
    render: (member: Member) => <div className="flex items-center gap-3">
          {member.photo_url ? <img src={member.photo_url} alt={member.full_name} className="w-10 h-10 rounded-full object-cover border border-slate-200" /> : <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
              <UserCircle className="w-6 h-6" />
            </div>}
          <div>
            <div className="font-medium text-slate-900">{member.full_name}</div>
            <div className="text-sm text-slate-500">{member.email || 'Sin email'}</div>
          </div>
        </div>
  }, {
    key: 'code',
    header: "Código",
    render: (member: Member) => <span className="font-mono text-sm text-slate-600 bg-slate-100 px-2 py-1 rounded">
          {member.member_code}
        </span>
  }, {
    key: 'status',
    header: "Estado",
    accessor: (member: Member) => {
      const variants = {
        active: 'success',
        expired: 'danger',
        suspended: 'warning',
        inactive: 'default'
      } as const;
      const labels = {
        active: "Activo",
        expired: "Vence",
        suspended: "Suspendido",
        inactive: "Inactivo"
      };
      return <Badge variant={variants[member.status] || 'default'}>
            {labels[member.status] || member.status}
          </Badge>;
    }
  }, {
    key: 'registered',
    header: 'Registro',
    render: (member: Member) => <span className="text-slate-500 text-sm">
          {formatRelative(member.created_at)}
        </span>
  }, {
    key: 'actions',
    header: '',
    render: (member: Member) => <div className="flex justify-end">
          <Link to={`/members/${member.id}`} className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
            <ChevronRight className="w-5 h-5" />
          </Link>
        </div>
  }];
  return <Table columns={columns} data={members} keyExtractor={member => member.id} emptyMessage="No se encontraron miembros." />;
}