import { useMemo } from 'react'
import { Calendar as CalendarIcon, ChevronRight, Info } from 'lucide-react'
import { startOfMonth, endOfMonth, endOfWeek, eachWeekOfInterval, format, isSameMonth, isSameDay, isPast, startOfDay } from 'date-fns'
import { es } from 'date-fns/locale'
import { MESES } from './constants'

const S = {
  wrap:           'space-y-5 sm:space-y-6 lg:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 px-2 sm:px-4 lg:px-0',
  banner:         'bg-blue-50 border border-blue-100 rounded-2xl sm:rounded-3xl p-4 sm:p-5 lg:p-6 xl:p-8 flex items-center gap-3 sm:gap-4 lg:gap-5',
  grid:           'grid gap-4 sm:gap-5 lg:gap-6',
  bannerIconWrap: 'w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0',
  bannerInfoIcon: 'w-5 h-5 sm:w-6 sm:h-6',
  bannerTitle:    'text-sm sm:text-base font-black text-blue-900 uppercase tracking-wide leading-relaxed',
  bannerText:     'text-xs sm:text-sm font-medium text-blue-600 mt-1 sm:mt-2 truncate',
  historicaBadge: 'px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-slate-200 text-slate-600',
  weekRangeTxt:   'text-xs sm:text-sm font-medium text-slate-400 mt-1 sm:mt-2 uppercase tracking-wider leading-relaxed truncate',
  // shared week card styles
  dayCardWeekRow:   'flex items-center gap-3 sm:gap-4 lg:gap-5 min-w-0 flex-1',
  dayCardTextLeft:  'text-left min-w-0 flex-1',
  dayCardWeekTitle: 'flex items-center gap-2',
}

export default function MonthView({ anio, monthIndex, onWeekClick }) {
  const weeks = useMemo(() => {
    const start = startOfMonth(new Date(anio, monthIndex))
    const end   = endOfMonth(start)
    return eachWeekOfInterval({ start, end }, { weekStartsOn: 1 })
  }, [anio, monthIndex])

  return (
    <div className={S.wrap}>
      <div className={S.banner}>
        <div className={S.bannerIconWrap}>
          <Info className={S.bannerInfoIcon} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className={S.bannerTitle}>Directiva Quirúrgica</h3>
          <p className={S.bannerText}>Semanas de {MESES[monthIndex].nombre} (futuras y pasadas).</p>
        </div>
      </div>

      <div className={S.grid}>
        {weeks.map((weekStart, idx) => {
          const weekEnd        = endOfWeek(weekStart, { weekStartsOn: 1 })
          const isCurrentMonth = isSameMonth(weekStart, new Date(anio, monthIndex)) || isSameMonth(weekEnd, new Date(anio, monthIndex))
          if (!isCurrentMonth) return null

          const esSemanaPasada = isPast(startOfDay(weekEnd)) && !isSameDay(weekEnd, new Date())
          const weekNum        = idx + 1

          return (
            <button
              key={weekStart.toISOString()}
              onClick={() => onWeekClick(weekStart)}
              className={`w-full border rounded-2xl sm:rounded-3xl p-4 sm:p-5 lg:p-6 xl:p-8 flex items-center justify-between transition-all group active:scale-[0.98] touch-manipulation ${
                esSemanaPasada
                  ? 'bg-slate-50 border-slate-200 opacity-75 hover:border-slate-300 hover:opacity-90 cursor-pointer'
                  : 'bg-white border-slate-100 hover:border-blue-500 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
              }`}
              aria-label={`Semana ${weekNum} del ${format(weekStart, 'd', { locale: es })} al ${format(weekEnd, 'd', { locale: es })} de ${MESES[monthIndex].nombre}${esSemanaPasada ? ' (modo consulta)' : ''}`}
            >
              <div className={S.dayCardWeekRow}>
                <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center transition-colors flex-shrink-0 ${
                  esSemanaPasada ? 'bg-slate-100' : 'bg-slate-50 group-hover:bg-blue-50'
                }`}>
                  <CalendarIcon className={`w-6 h-6 sm:w-7 sm:h-7 transition-colors ${
                    esSemanaPasada ? 'text-slate-300' : 'text-slate-400 group-hover:text-blue-600'
                  }`} />
                </div>
                <div className={S.dayCardTextLeft}>
                  <div className={S.dayCardWeekTitle}>
                    <h3 className={`text-sm sm:text-base font-black uppercase tracking-wide leading-relaxed truncate ${
                      esSemanaPasada ? 'text-slate-500' : 'text-slate-900'
                    }`}>
                      Semana 0{weekNum}
                    </h3>
                    {esSemanaPasada && (
                      <span className={S.historicaBadge}>Histórica</span>
                    )}
                  </div>
                  <p className={S.weekRangeTxt}>
                    Del {format(weekStart, 'd', { locale: es })} al {format(weekEnd, 'd', { locale: es })} de {MESES[monthIndex].nombre}
                  </p>
                </div>
              </div>
              <ChevronRight className={`w-5 h-5 sm:w-6 sm:h-6 transition-colors flex-shrink-0 ml-2 ${
                esSemanaPasada ? 'text-slate-400 group-hover:text-slate-600' : 'text-slate-300 group-hover:text-blue-500'
              }`} />
            </button>
          )
        })}
      </div>
    </div>
  )
}
