import { useMemo } from 'react'
import { Calendar as CalendarIcon } from 'lucide-react'
import { eachDayOfInterval, addDays, format, isSameDay, isPast, startOfDay } from 'date-fns'
import { es } from 'date-fns/locale'

const S = {
  wrap:           'space-y-5 sm:space-y-6 lg:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 px-2 sm:px-4 lg:px-0',
  banner:         'bg-blue-50 border border-blue-100 rounded-2xl sm:rounded-3xl p-4 sm:p-5 lg:p-6 xl:p-8 flex items-center gap-3 sm:gap-4 lg:gap-5',
  grid:           'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-5 md:gap-6 lg:gap-6 xl:gap-7 auto-rows-fr items-stretch',
  progBar:        'h-3 sm:h-4 lg:h-5 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner mb-2 sm:mb-3',
  bannerIconWrap: 'w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0',
  bannerCalIcon:  'w-6 h-6 sm:w-7 sm:h-7 text-blue-600',
  bannerTitle:    'text-sm sm:text-base font-black text-blue-900 uppercase tracking-wide leading-relaxed',
  bannerText:     'text-xs sm:text-sm font-medium text-blue-600 mt-1 sm:mt-2 truncate',
  ocupLabels:     'flex items-center justify-between text-[10px] sm:text-xs lg:text-sm font-bold text-slate-500',
  dayCardTopRow:  'flex items-start justify-between mb-4 sm:mb-6 w-full gap-2 sm:gap-3',
  dayCardLeft:    'flex-1 min-w-0 pr-2',
  dayCardDateSub: 'text-xs sm:text-sm lg:text-sm font-bold text-slate-500 uppercase tracking-wider leading-relaxed whitespace-nowrap',
  dayCardOccupRow:'flex items-center justify-between mb-2 sm:mb-3',
  dayCardOccupLbl:'text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-wider leading-relaxed truncate',
  dayCardCirCount:'text-xs sm:text-sm font-bold text-slate-600 ml-2 flex-shrink-0',
  monthCardBottom:'mt-auto w-full',
}

export default function WeekView({ weekStart, cirugias, pabellonId, onDayClick, pabellones, selectedDay }) {
  const days = useMemo(() =>
    eachDayOfInterval({ start: weekStart, end: addDays(weekStart, 6) }),
    [weekStart]
  )

  const getOcupacion = (day) => {
    const dayStr = format(day, 'yyyy-MM-dd')
    const cirugiasDia = cirugias.filter(c => {
      if (pabellonId !== 'todos' && c.operating_room_id !== pabellonId) return false
      return c.fecha === dayStr
    })
    const minutosOcupados = cirugiasDia.reduce((acc, curr) => {
      const [h1, m1] = curr.hora_inicio.split(':').map(Number)
      const [h2, m2] = curr.hora_fin.split(':').map(Number)
      return acc + (h2 * 60 + m2) - (h1 * 60 + m1)
    }, 0)
    const totalMinutos = pabellones.length * 12 * 60
    return Math.min(100, Math.round((minutosOcupados / totalMinutos) * 100))
  }

  return (
    <div className={S.wrap}>
      <div className={S.banner}>
        <div className={S.bannerIconWrap}>
          <CalendarIcon className={S.bannerCalIcon} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className={S.bannerTitle}>Semana Laboral</h3>
          <p className={S.bannerText}>
            {format(weekStart, 'd', { locale: es })} - {format(addDays(weekStart, 6), 'd MMMM', { locale: es })}
          </p>
        </div>
      </div>

      <div className={S.grid}>
        {days.map((day) => {
          const dayStr          = format(day, 'yyyy-MM-dd')
          const esDiaPasado     = isPast(startOfDay(day)) && !isSameDay(day, new Date())
          const esSeleccionado  = selectedDay && isSameDay(day, selectedDay)
          const ocupacionGlobal = getOcupacion(day)
          const cirugiasDia     = cirugias.filter(c => {
            if (pabellonId !== 'todos' && c.operating_room_id !== pabellonId) return false
            return c.fecha === dayStr
          })

          return (
            <button
              key={day.toISOString()}
              onClick={() => onDayClick(day)}
              className={`bg-white rounded-xl sm:rounded-2xl lg:rounded-[2.5rem] border-2 p-4 sm:p-5 md:p-6 lg:p-7 xl:p-8 flex flex-col h-full text-left hover:shadow-xl transition-all group w-full min-h-[160px] sm:min-h-[180px] lg:min-h-[200px] xl:min-h-[220px] 2xl:min-h-[240px] active:scale-[0.98] touch-manipulation ${
                esDiaPasado
                  ? 'border-slate-200 opacity-75 hover:border-slate-300 hover:opacity-90 cursor-pointer'
                  : esSeleccionado
                  ? 'border-blue-500 shadow-lg shadow-blue-200/50 bg-blue-50/30 ring-2 ring-blue-500 ring-offset-2'
                  : 'border-slate-100 hover:border-blue-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
              }`}
              aria-label={`${format(day, 'EEEE d MMMM', { locale: es })} - ${ocupacionGlobal}% ocupado${esDiaPasado ? ' (modo consulta)' : ''}`}
              aria-pressed={esSeleccionado}
            >
              <div className={S.dayCardTopRow}>
                <div className={S.dayCardLeft}>
                  <h3 className={`text-base sm:text-lg lg:text-xl xl:text-xl font-black uppercase mb-1 sm:mb-2 whitespace-nowrap ${
                    esDiaPasado ? 'text-slate-400' : esSeleccionado ? 'text-blue-700' : 'text-slate-900 group-hover:text-blue-600'
                  } transition-colors`}>
                    {format(day, 'EEEE', { locale: es })}
                  </h3>
                  <p className={S.dayCardDateSub}>{format(day, 'd MMMM', { locale: es })}</p>
                </div>
                <div className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider leading-relaxed ml-2 sm:ml-4 flex-shrink-0 ${
                  esDiaPasado        ? 'bg-slate-200 text-slate-600' :
                  ocupacionGlobal > 80 ? 'bg-red-100 text-red-700' :
                  ocupacionGlobal > 50 ? 'bg-yellow-100 text-yellow-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {esDiaPasado ? 'Histórico' : `${ocupacionGlobal}%`}
                </div>
              </div>

              <div className={S.monthCardBottom}>
                <div className={S.dayCardOccupRow}>
                  <span className={S.dayCardOccupLbl}>Ocupación Global</span>
                  <span className={S.dayCardCirCount}>{cirugiasDia.length} cirugías</span>
                </div>
                <div className={S.progBar}>
                  <div
                    className={`h-full rounded-full transition-all ${
                      ocupacionGlobal > 80 ? 'bg-gradient-to-r from-red-500 to-red-600' :
                      ocupacionGlobal > 50 ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' :
                      'bg-gradient-to-r from-green-500 to-emerald-500'
                    }`}
                    style={{ width: `${ocupacionGlobal}%` }}
                    aria-label={`${ocupacionGlobal}% ocupado`}
                  />
                </div>
                <div className={S.ocupLabels}>
                  <span className="truncate">{pabellones.length} pabellones</span>
                  <span className={`ml-2 flex-shrink-0 ${ocupacionGlobal > 80 ? 'text-red-600' : ocupacionGlobal > 50 ? 'text-yellow-600' : 'text-green-600'}`}>
                    {100 - ocupacionGlobal}% disponible
                  </span>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
