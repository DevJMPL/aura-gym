interface TrainingDaysSelectorProps {
  selectedDays: number[]
  onChange: (days: number[]) => void
  error?: string
}
export function TrainingDaysSelector({ selectedDays, onChange, error }: TrainingDaysSelectorProps) {
  const DAYS = [
    {
      id: 1,
      label: 'L',
    },
    {
      id: 2,
      label: 'M',
    },
    {
      id: 3,
      label: 'X',
    },
    {
      id: 4,
      label: 'J',
    },
    {
      id: 5,
      label: 'V',
    },
    {
      id: 6,
      label: 'S',
    },
    {
      id: 0,
      label: 'D',
    },
  ]
  const toggleDay = (dayId: number) => {
    if (selectedDays.includes(dayId)) {
      onChange(selectedDays.filter((d) => d !== dayId))
    } else {
      onChange([...selectedDays, dayId])
    }
  }
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-700">
        Días de Entrenamiento (Opcional, para cálculo de rachas)
      </label>
      <div className="flex gap-2 flex-wrap">
        {DAYS.map((day) => {
          const isSelected = selectedDays.includes(day.id)
          return (
            <button
              key={day.id}
              type="button"
              onClick={() => toggleDay(day.id)}
              className={`
                w-10 h-10 rounded-full font-medium text-sm transition-all
                ${isSelected ? 'bg-primary-600 text-white shadow-md shadow-primary-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}
              `}
            >
              {day.label}
            </button>
          )
        })}
      </div>
      {error && <p className="text-sm text-error-600">{error}</p>}
    </div>
  )
}
