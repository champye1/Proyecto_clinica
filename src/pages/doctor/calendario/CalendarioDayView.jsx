import { useMemo } from 'react'
import { format } from 'date-fns'
import { XCircle } from 'lucide-react'

const S = {
  wrapper:        'flex gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500',
  sidebar:        'w-80 flex-shrink-0 space-y-6',
  darkCard:       'bg-[#0f172a] rounded-[2rem] p-6 text-white overflow-hidden relative',
  darkTitle:      'text-xs font-black uppercase tracking-[0.2em] opacity-70 mb-1',
  darkSub:        'text-sm font-medium opacity-50',
  blob:           'absolute top-0 right-0 w-32 h-32 bg-blue-500 rounded-full blur-[60px] opacity-20 transform translate-x-10 -translate-y-10',
  cirList:        'bg-white rounded-[2rem] border border-slate-100 p-6 space-y-4',
  cirListTitle:   'text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4',
  cirItem:        'bg-blue-50 border border-blue-100 rounded-xl p-4',
  cirTime:        'text-xs font-black text-blue-900 uppercase tracking-wider',
  cirPatient:     'text-sm font-bold text-slate-900 mb-1',
  cirRut:         'text-xs text-slate-600 mb-2',
  cirRoom:        'text-xs font-bold text-blue-600',
  cirObs:         'text-xs text-slate-500 mt-2 italic',
  cancelBtn:      'mt-3 w-full py-2 px-4 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2',
  cancelIcon:     'w-4 h-4',
  emptyCard:      'bg-white rounded-[2rem] border border-slate-100 p-6 text-center',
  emptyTxt:       'text-xs text-slate-400',
  legendCard:     'bg-white rounded-[2rem] border border-slate-100 p-6',
  legendTitle:    'text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2',
  legendIcon:     'w-4 h-4 rounded-md bg-blue-50 flex items-center justify-center text-blue-500 text-xs',
  legendDotAvail: 'w-3 h-3 rounded-full border-2 border-slate-200',
  legendTxt:      'text-xs font-bold text-slate-500 uppercase tracking-wide',
  legendDotMine:  'w-3 h-3 rounded-full bg-blue-50 border-2 border-blue-100',
  main:           'flex-1 bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm overflow-hidden relative',
  gridHeader:     'grid grid-cols-[auto_1fr_1fr_1fr_1fr] gap-4 mb-4',
  timeSpacer:     'w-12',
  pabName:        'text-xs font-black text-slate-900 uppercase tracking-wider',
  pabCount:       'text-[10px] font-bold text-green-600 uppercase tracking-wider',
  gridRow:        'grid grid-cols-[auto_1fr_1fr_1fr_1fr] gap-4 items-center group',
  timeLabel:      'w-12 text-[10px] font-bold text-slate-400 text-right',
  occupied:       'h-16 rounded-2xl bg-blue-50 border border-blue-200 p-3 flex flex-col justify-center',
  occupiedLabel:  'text-[10px] font-black text-blue-600 uppercase tracking-wider mb-1',
  occupiedName:   'text-xs font-bold text-blue-900 truncate',
  available:      'h-16 rounded-2xl border-2 border-dashed border-slate-100',
}

const ESTADO_BADGE = {
  programada: 'bg-blue-100 text-blue-800',
  en_proceso: 'bg-yellow-100 text-yellow-800',
  completada: 'bg-green-100 text-green-800',
  cancelada:  'bg-red-100 text-red-800',
}

export default function CalendarioDayView({ day, pabellones, cirugias, onCancelarClick }) {
  const slots = useMemo(() => {
    const hours = []
    for (let i = 8; i < 24; i++) {
      hours.push(`${i.toString().padStart(2, '0')}:00`)
    }
    return hours
  }, [])

  const dayStr = format(day, 'yyyy-MM-dd')
  const cirugiasDia = cirugias.filter(c => c.fecha === dayStr)

  const getSlotStatus = (pabellonId, time) => {
    const cirugia = cirugiasDia.find(c =>
      c.operating_room_id === pabellonId &&
      c.hora_inicio <= time + ':00' && c.hora_fin > time + ':00'
    )
    if (cirugia) return { status: 'occupied', data: cirugia }
    return { status: 'available' }
  }

  return (
    <div className={S.wrapper}>
      <div className={S.sidebar}>
        <div className={S.darkCard}>
          <div className="relative z-10">
            <h3 className={S.darkTitle}>Mis Cirugías</h3>
            <p className={S.darkSub}>Vista detallada del día</p>
          </div>
          <div className={S.blob} />
        </div>

        {cirugiasDia.length > 0 ? (
          <div className={S.cirList}>
            <h4 className={S.cirListTitle}>Cirugías Programadas</h4>
            {cirugiasDia.map(cirugia => (
              <div key={cirugia.id} className={S.cirItem}>
                <div className="flex items-center justify-between mb-2">
                  <span className={S.cirTime}>{cirugia.hora_inicio} - {cirugia.hora_fin}</span>
                  <span className={`px-2 py-1 rounded text-[10px] font-bold ${ESTADO_BADGE[cirugia.estado] || 'bg-gray-100 text-gray-800'}`}>
                    {cirugia.estado}
                  </span>
                </div>
                <p className={S.cirPatient}>{cirugia.patients?.nombre} {cirugia.patients?.apellido}</p>
                <p className={S.cirRut}>RUT: {cirugia.patients?.rut}</p>
                <p className={S.cirRoom}>{cirugia.operating_rooms?.nombre}</p>
                {cirugia.observaciones && (
                  <p className={S.cirObs}>{cirugia.observaciones}</p>
                )}
                {cirugia.estado === 'programada' && (
                  <button onClick={() => onCancelarClick(cirugia)} className={S.cancelBtn}>
                    <XCircle className={S.cancelIcon} />
                    Cancelar Cirugía
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className={S.emptyCard}>
            <p className={S.emptyTxt}>No hay cirugías programadas para este día</p>
          </div>
        )}

        <div className={S.legendCard}>
          <h4 className={S.legendTitle}>
            <span className={S.legendIcon}>?</span>
            Leyenda
          </h4>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className={S.legendDotAvail} />
              <span className={S.legendTxt}>Disponible</span>
            </div>
            <div className="flex items-center gap-3">
              <div className={S.legendDotMine} />
              <span className={S.legendTxt}>Mi Cirugía</span>
            </div>
          </div>
        </div>
      </div>

      <div className={S.main}>
        <div className={S.gridHeader}>
          <div className={S.timeSpacer} />
          {pabellones.map(p => (
            <div key={p.id} className="text-center">
              <h4 className={S.pabName}>{p.nombre}</h4>
              <span className={S.pabCount}>
                {cirugiasDia.filter(c => c.operating_room_id === p.id).length} Cirugía{cirugiasDia.filter(c => c.operating_room_id === p.id).length !== 1 ? 's' : ''}
              </span>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          {slots.map(time => (
            <div key={time} className={S.gridRow}>
              <span className={S.timeLabel}>{time}</span>
              {pabellones.map(p => {
                const { status, data } = getSlotStatus(p.id, time)

                if (status === 'occupied') {
                  return (
                    <div key={p.id} className={S.occupied}>
                      <span className={S.occupiedLabel}>Mi Cirugía</span>
                      <span className={S.occupiedName}>{data.patients?.nombre} {data.patients?.apellido}</span>
                    </div>
                  )
                }

                return <div key={p.id} className={S.available} />
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
