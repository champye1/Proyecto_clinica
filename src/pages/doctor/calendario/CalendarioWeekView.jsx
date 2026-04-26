import { useMemo } from 'react'
import { eachDayOfInterval, addDays, format } from 'date-fns'
import { es } from 'date-fns/locale'

const S = {
  grid:       'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 justify-items-center',
  dayCard:    'bg-white rounded-[2rem] border border-slate-100 p-6 flex flex-col h-full w-full max-w-[400px]',
  dayCardTop: 'flex items-center justify-between mb-6',
  dayName:    'text-sm sm:text-base font-black text-slate-900 uppercase whitespace-nowrap',
  dayDate:    'text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap',
  dayBody:    'space-y-4 flex-1',
  cirCard:    'bg-blue-50 border border-blue-100 rounded-xl p-3',
  cirTime:    'text-xs font-black text-blue-900 uppercase tracking-wider',
  cirPatient: 'text-xs font-bold text-slate-700 mb-1',
  cirRoom:    'text-[10px] text-slate-500',
  emptyTxt:   'text-xs text-slate-400 italic text-center py-4',
  detailBtn:  'mt-6 w-full py-3 rounded-xl bg-slate-50 text-slate-600 text-xs font-black uppercase tracking-wider hover:bg-blue-50 hover:text-blue-600 transition-colors',
}

const ESTADO_BADGE = {
  programada: 'bg-blue-100 text-blue-800',
  en_proceso: 'bg-yellow-100 text-yellow-800',
  completada: 'bg-green-100 text-green-800',
}

export default function CalendarioWeekView({ weekStart, cirugias, onDayClick }) {
  const days = useMemo(() => {
    return eachDayOfInterval({ start: weekStart, end: addDays(weekStart, 6) })
  }, [weekStart])

  return (
    <div className={S.grid}>
      {days.map((day) => {
        const dayStr = format(day, 'yyyy-MM-dd')
        const cirugiasDia = cirugias.filter(c => c.fecha === dayStr)

        return (
          <div key={day.toISOString()} className={S.dayCard}>
            <div className={S.dayCardTop}>
              <div className="flex-1 min-w-0 pr-2">
                <h3 className={S.dayName}>{format(day, 'EEEE', { locale: es })}</h3>
                <p className={S.dayDate}>{format(day, 'd MMMM', { locale: es })}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                cirugiasDia.length > 0 ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
              }`}>
                {cirugiasDia.length > 0 ? `${cirugiasDia.length} Cirugía${cirugiasDia.length > 1 ? 's' : ''}` : 'Disponible'}
              </span>
            </div>

            <div className={S.dayBody}>
              {cirugiasDia.length > 0 ? (
                cirugiasDia.map(cirugia => (
                  <div key={cirugia.id} className={S.cirCard}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={S.cirTime}>{cirugia.hora_inicio} - {cirugia.hora_fin}</span>
                      <span className={`px-2 py-1 rounded text-[10px] font-bold ${ESTADO_BADGE[cirugia.estado] || 'bg-gray-100 text-gray-800'}`}>
                        {cirugia.estado}
                      </span>
                    </div>
                    <p className={S.cirPatient}>{cirugia.patients?.nombre} {cirugia.patients?.apellido}</p>
                    <p className={S.cirRoom}>{cirugia.operating_rooms?.nombre}</p>
                  </div>
                ))
              ) : (
                <p className={S.emptyTxt}>No hay cirugías programadas</p>
              )}
            </div>

            <button onClick={() => onDayClick(day)} className={S.detailBtn}>
              Ver Detalles
            </button>
          </div>
        )
      })}
    </div>
  )
}
