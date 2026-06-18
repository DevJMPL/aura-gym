import { GymSetupWizard } from '../../features/settings/components/GymSetupWizard'
import { Dumbbell } from 'lucide-react'

export function SetupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden animate-scale-in border border-slate-200">
        <div className="bg-primary-600 px-8 py-8 text-center relative overflow-hidden">
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500 rounded-full translate-x-1/2 -translate-y-1/2 opacity-50" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary-700 rounded-full -translate-x-1/2 translate-y-1/2 opacity-50" />

          <div className="relative z-10 flex flex-col items-center">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-4 border border-white/20 shadow-inner">
              <Dumbbell className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">{'Configura tu Gimnasio'}</h1>
            <p className="text-primary-100 text-sm mt-2 max-w-sm">
              {'Para comenzar a usar Aura, necesitamos algunos datos básicos sobre tu negocio.'}
            </p>
          </div>
        </div>

        <div className="p-8">
          <GymSetupWizard />
        </div>
      </div>
    </div>
  )
}
