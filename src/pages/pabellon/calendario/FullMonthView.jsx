import { useMemo } from 'react'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react'
import {
  endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval,
  format, isSameMonth, isSameDay, isPast, startOfDay,
} from 'date-fns'
import { MESES } from './constants'

const S = {
  wrap:             'animate-in fade-in slide-in-from-bottom-4 duration-500',
  header:           'flex items-center justify-between mb-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm',
  navBtn:           'p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500 hover:text-blue-600',
  title:            'text-lg sm:text-xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-2',
  weekDayHead:      'grid grid-cols-7 gap-1 mb-2',
  weekDayCell:      'text-center text-xs font-black text-slate-400 uppercase py-2',
  daysGrid:         'grid grid-cols-7 gap-1 sm:gap-2 auto-rows-fr',
  progressBar:      'h-1.5 w-full bg-slate-100 rounded-full overflow-hidden mb-1',
  fullBadge:        'text-[9px] font-black text-red-600 bg-red-100 px-1 rounded uppercase',
  navIcon:          'w-5 h-5 sm:w-6 sm:h-6',
  calIconBlue:      'w-5 h-5 sm:w-6 sm:h-6 text-blue-500',
  dayTopRow:        'flex justify-between items-start w-full',
  dayBarWrap:       'w-full mt-2',
  dayFullBadgeWrap: 'flex justify-center mt-1',
}

const WEEK_DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

export default function FullMonthView({ anio, monthIndex, cirugias, pabellones, onDayClick, onNavigate }) {
  const days = useMemo(() => {
    const startMonth    = new Date(anio, monthIndex, 1)
    const endMonth      = endOfMonth(startMonth)
    const startCalendar = startOfWeek(startMonth, { weekStartsOn: 1 })
    const endCalendar   = endOfWeek(endMonth, { weekStartsOn: 1 })
    return eachDayOfInterval({ start: startCalendar, end: endCalendar })
  }, [anio, monthIndex])

  const getOcupacion = (day) => {
    const dayStr = format(day, 'yyyy-MM-dd')
    const cirugiasDia = cirugias.filter(c => c.fecha === dayStr)
    const minutosOcupados = cirugiasDia.reduce((acc, curr) => {
      const [h1, m1] = curr.hora_inicio.split(':').map(Number)
      const [h2, m2] = curr.hora_fin.split(':').map(Number)
      return acc + (h2 * 60 + m2) - (h1 * 60 + m1)
    }, 0)
    const totalMinutos = pabellones.length * 12 * 60
    return totalMinutos > 0 ? Math.min(100, Math.round((minutosOcupados / totalMinutos) * 100)) : 0
  }

  const handlePrevMonth = () => {
    const newMonth = monthIndex === 0 ? 11 : monthIndex - 1
    onNavigate('month', monthIndex === 0 ? anio - 1 : anio, newMonth)
  }

  const handleNextMonth = () => {
    const newMonth = monthIndex === 11 ? 0 : monthIndex + 1
    onNavigate('month', monthIndex === 11 ? anio + 1 : anio, newMonth)
  }

  return (
    <div className={S.wrap}>
      <div className={S.header}>
        <button onClick={handlePrevMonth} className={S.navBtn} title="Mes anterior">
          <ChevronLeft className={S.navIcon} />
        </button>
        <h2 className={S.title}>
          <CalendarIcon className={S.calIconBlue} />
          {MESES[monthIndex].nombre} {anio}
        </h2>
        <button onClick={handleNextMonth} className={S.navBtn} title="Mes siguiente">
          <ChevronRight className={S.navIcon} />
        </button>
      </div>

      <div className={S.weekDayHead}>
        {WEEK_DAYS.map(d => (
          <div key={d} className={S.weekDayCell}>{d}</div>
        ))}
      </div>

      <div className={S.daysGrid}>
        {days.map(day => {
          const isCurrentMonth = isSameMonth(day, new Date(anio, monthIndex))
          const ocupacion = getOcupacion(day)
          const isToday   = isSameDay(day, new Date())

          return (
            <button
              key={day.toISOString()}
              onClick={() => onDayClick(day)}
              className={`
                relative p-2 sm:p-3 h-24 sm:h-32 rounded-xl flex flex-col justify-between transition-all
                ${!isCurrentMonth ? 'bg-slate-50/50 text-slate-300' : 'bg-white hover:shadow-lg hover:scale-[1.02] hover:z-10 border border-slate-100'}
                ${isToday ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
                ${ocupacion >= 100 ? 'bg-red-50' : ''}
              `}
            >
              <div className={S.dayTopRow}>
                <span className={`text-sm sm:text-lg font-black ${!isCurrentMonth ? 'text-slate-300' : 'text-slate-700'}`}>
                  {format(day, 'd')}
                </span>
                {isCurrentMonth && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    ocupacion > 80 ? 'bg-red-100 text-red-700' :
                    ocupacion > 50 ? 'bg-yellow-100 text-yellow-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {ocupacion}%
                  </span>
                )}
              </div>

              {isCurrentMonth && (
                <div className={S.dayBarWrap}>
                  <div className={S.progressBar}>
                    <div
                      className={`h-full rounded-full ${
                        ocupacion > 80 ? 'bg-red-500' :
                        ocupacion > 50 ? 'bg-yellow-500' :
                        'bg-green-500'
                      }`}
                      style={{ width: `${ocupacion}%` }}
                    />
                  </div>
                  {ocupacion >= 100 && (
                    <div className={S.dayFullBadgeWrap}>
                      <span className={S.fullBadge}>Full</span>
                    </div>
                  )}
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
