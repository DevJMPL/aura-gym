import { Loader2 } from 'lucide-react'

interface LoadingStateProps {
  message?: string
  fullScreen?: boolean
}

export function LoadingState({ message, fullScreen = false }: LoadingStateProps) {
  const displayMessage = message || "Cargando..."

  const content = (
    <div className="flex flex-col items-center justify-center gap-3 animate-fade-in">
      <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
      <p className="text-sm text-slate-500 font-medium">{displayMessage}</p>
    </div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-50">
        {content}
      </div>
    )
  }

  return <div className="flex items-center justify-center py-16">{content}</div>
}
