import { getWeek, startOfMonth, format } from 'date-fns'
import { es } from 'date-fns/locale'

const MESES = [
  { indice: 0, nombre: 'ENERO' },
  { indice: 1, nombre: 'FEBRERO' },
  { indice: 2, nombre: 'MARZO' },
  { indice: 3, nombre: 'ABRIL' },
  { indice: 4, nombre: 'MAYO' },
  { indice: 5, nombre: 'JUNIO' },
  { indice: 6, nombre: 'JULIO' },
  { indice: 7, nombre: 'AGOSTO' },
  { indice: 8, nombre: 'SEPTIEMBRE' },
  { indice: 9, nombre: 'OCTUBRE' },
  { indice: 10, nombre: 'NOVIEMBRE' },
  { indice: 11, nombre: 'DICIEMBRE' },
]

const S = {
  nav:     'flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6',
  sep:     'text-slate-300',
  current: 'text-slate-900',
}

export default function CalendarioBreadcrumbs({ anio, view, selectedMonth, selectedWeek, selectedDay, onNavigate }) {
  const monthName = selectedMonth !== null ? MESES[selectedMonth].nombre : ''
  const weekNumber = selectedWeek
    ? getWeek(selectedWeek, { weekStartsOn: 1 }) - getWeek(startOfMonth(selectedWeek), { weekStartsOn: 1 }) + 1
    : ''

  return (
    <div className={S.nav}>
      <button
        onClick={() => onNavigate('year')}
        className={`hover:text-blue-600 ${view === 'year' ? 'text-slate-900' : ''}`}
      >
        Calendario {anio}
      </button>

      {(view === 'month' || view === 'week' || view === 'day') && (
        <>
          <span className={S.sep}>/</span>
          <button
            onClick={() => onNavigate('month')}
            className={`hover:text-blue-600 ${view === 'month' ? 'text-slate-900' : ''}`}
          >
            {monthName}
          </button>
        </>
      )}

      {(view === 'week' || view === 'day') && (
        <>
          <span className={S.sep}>/</span>
          <button
            onClick={() => onNavigate('week')}
            className={`hover:text-blue-600 ${view === 'week' ? 'text-slate-900' : ''}`}
          >
            Semana {weekNumber}
          </button>
        </>
      )}

      {view === 'day' && selectedDay && (
        <>
          <span className={S.sep}>/</span>
          <span className={S.current}>
            {format(selectedDay, 'EEEE d', { locale: es })}
          </span>
        </>
      )}
    </div>
  )
}
