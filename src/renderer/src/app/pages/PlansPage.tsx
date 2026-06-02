import { useState, useEffect } from 'react';
import { Plus, Edit2, Archive, Activity, Calendar, Search } from 'lucide-react';
import { planService } from '../../features/plans/services/planService';
import { PlanModal } from '../../features/plans/components/PlanModal';
import type { MembershipPlan } from '../../types/database';
import { Button } from '../../components/ui';
export function PlansPage() {
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [planToEdit, setPlanToEdit] = useState<MembershipPlan | null>(null);
  const fetchPlans = async () => {
    try {
      setIsLoading(true);
      const data = await planService.getAll();
      setPlans(data);
    } catch (error) {
      console.error("Error al cargar los planes:", error);
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    fetchPlans();
  }, []);
  const handleEdit = (plan: MembershipPlan) => {
    setPlanToEdit(plan);
    setIsModalOpen(true);
  };
  const handleCreate = () => {
    setPlanToEdit(null);
    setIsModalOpen(true);
  };
  const handleToggleActive = async (plan: MembershipPlan) => {
    try {
      await planService.toggleActive(plan.id, !plan.is_active);
      await fetchPlans();
    } catch (error) {
      console.error("Error al cambiar el estado del plan:", error);
    }
  };
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };
  const formatDuration = (days: number) => {
    if (days === 1) return "1 día";
    if (days === 7) return "1 semana";
    if (days === 15) return "1 quincena";
    if (days === 30) return "1 mes";
    if (days === 365) return "1 año";
    return "plans.days";
  };
  const filteredPlans = plans.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
  return <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{"Planes y Tarifas"}</h1>
          <p className="text-sm text-slate-500">{"Gestiona los precios y accesos para tus miembros"}</p>
        </div>
        <Button onClick={handleCreate} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          <span>{"Nuevo Plan"}</span>
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input type="text" placeholder={"Buscar por nombre de plan..."} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="block w-full pl-10 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all placeholder:text-slate-400" />
        </div>
      </div>

      {/* Grid */}
      {isLoading ? <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <div key={i} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm animate-pulse h-48"></div>)}
        </div> : filteredPlans.length === 0 ? <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Archive className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">{"No hay planes"}</h3>
          <p className="text-slate-500 text-sm max-w-sm mx-auto mb-6">
            {searchQuery ? "No se encontraron planes que coincidan con tu búsqueda." : "Comienza creando tu primer plan para que los miembros puedan registrarse."}
          </p>
          {!searchQuery && <Button onClick={handleCreate} variant="outline" className="mx-auto">
              {"Crear tu primer plan"}
            </Button>}
        </div> : <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredPlans.map(plan => <div key={plan.id} className={`bg-white rounded-2xl border p-6 flex flex-col transition-all hover:shadow-md ${plan.is_active ? 'border-slate-200' : 'border-slate-200 bg-slate-50/50 opacity-75'}`}>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 line-clamp-1">{plan.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${plan.is_active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                      {plan.is_active ? "Activo" : "Inactivo"}
                    </span>
                    <span className="text-xs text-slate-500 uppercase font-semibold">
                      {plan.type}
                    </span>
                  </div>
                </div>
                <div className="flex -mr-2 -mt-2">
                  <button onClick={() => handleEdit(plan)} className="p-2 text-slate-400 hover:text-primary-600 rounded-lg hover:bg-slate-50 transition-colors" title={"Editar plan"}>
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleToggleActive(plan)} className={`p-2 rounded-lg transition-colors ${plan.is_active ? 'text-slate-400 hover:text-orange-600 hover:bg-orange-50' : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'}`} title={plan.is_active ? "Desactivar plan" : "Activar plan"}>
                    {plan.is_active ? <Archive className="w-4 h-4" /> : <Activity className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="mb-4">
                <span className="text-3xl font-extrabold text-slate-900">
                  {formatCurrency(plan.base_price)}
                </span>
                <span className="text-slate-500 text-sm ml-1">MXN</span>
              </div>

              <div className="space-y-2 mt-auto">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span>{"Duración"}: <strong>{formatDuration(plan.duration_days)}</strong></span>
                </div>
                {plan.description && <p className="text-sm text-slate-500 line-clamp-2 mt-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                    {plan.description}
                  </p>}
              </div>
            </div>)}
        </div>}

      <PlanModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={fetchPlans} planToEdit={planToEdit} />
    </div>;
}