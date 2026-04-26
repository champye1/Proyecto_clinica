import { useMemo } from 'react'
import { Calendar as CalendarIcon, ChevronRight, Info } from 'lucide-react'
import { startOfMonth, endOfMonth, eachWeekOfInterval, endOfWeek, format, isSameMonth } from 'date-fns'
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
  wrapper:     'space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500',
  infoBanner:  'bg-blue-50 border border-blue-100 rounded-3xl p-6 flex items-center gap-4',
  infoIcon:    'w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600',
  infoSvg:     'w-5 h-5',
  infoTitle:   'text-sm font-black text-blue-900 uppercase tracking-wide',
  infoText:    'text-xs font-medium text-blue-600 mt-1',
  grid:        'grid gap-4',
  weekBtn:     'w-full bg-white border border-slate-100 rounded-3xl p-6 flex items-center justify-between hover:border-blue-500 hover:shadow-md transition-all group',
  weekIconBox: 'w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center group-hover:bg-blue-50 transition-colors',
  weekCalIcon: 'w-6 h-6 text-slate-400 group-hover:text-blue-600',
  weekTitle:   'text-sm font-black text-slate-900 uppercase tracking-wide',
  weekSub:     'text-xs font-medium text-slate-400 mt-1 uppercase tracking-wider',
  weekChevron: 'w-5 h-5 text-slate-300 group-hover:text-blue-500',
}

export default function CalendarioMonthView({ anio, monthIndex, onWeekClick }) {
  const weeks = useMemo(() => {
    const start = startOfMonth(new Date(anio, monthIndex))
    const end = endOfMonth(start)
    return eachWeekOfInterval({ start, end }, { weekStartsOn: 1 })
  }, [anio, monthIndex])

  return (
    <div className={S.wrapper}>
      <div className={S.infoBanner}>
        <div className={S.infoIcon}>
          <Info className={S.infoSvg} />
        </div>
        <div>
          <h3 className={S.infoTitle}>Mis Cirugías Programadas</h3>
          <p className={S.infoText}>Semanas disponibles para {MESES[monthIndex].nombre}.</p>
        </div>
      </div>

      <div className={S.grid}>
        {weeks.map((weekStart, idx) => {
          const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 })
          const isCurrentMonth =
            isSameMonth(weekStart, new Date(anio, monthIndex)) ||
            isSameMonth(weekEnd, new Date(anio, monthIndex))

          if (!isCurrentMonth) return null

          const weekNum = idx + 1

          return (
            <button
              key={weekStart.toISOString()}
              onClick={() => onWeekClick(weekStart)}
              className={S.weekBtn}
            >
              <div className="flex items-center gap-4">
                <div className={S.weekIconBox}>
                  <CalendarIcon className={S.weekCalIcon} />
                </div>
                <div className="text-left">
                  <h3 className={S.weekTitle}>Semana 0{weekNum}</h3>
                  <p className={S.weekSub}>
                    Del {format(weekStart, 'd', { locale: es })} al {format(weekEnd, 'd', { locale: es })} de {MESES[monthIndex].nombre}
                  </p>
                </div>
              </div>
              <ChevronRight className={S.weekChevron} />
            </button>
          )
        })}
      </div>
    </div>
  )
}
