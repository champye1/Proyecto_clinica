import { useMemo } from 'react'
import { Clock, Activity, XCircle, Stethoscope } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import Modal from '@/components/common/Modal'
import { codigosOperaciones } from '@/data/codigosOperaciones'

const S = {
  grid:            'grid grid-cols-1 md:grid-cols-2 gap-6 h-[60vh]',
  section1:        'bg-slate-50 rounded-2xl p-4 flex flex-col h-full overflow-hidden border border-slate-100',
  secTitle1:       'text-sm font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2 sticky top-0 bg-slate-50 z-10 py-2',
  secScroll:       'overflow-y-auto space-y-3 pr-2 custom-scrollbar flex-1 pb-4',
  emptyState:      'h-full flex flex-col items-center justify-center text-slate-400 opacity-60',
  surgItem:        'bg-white p-3 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group',
  surgTime:        'text-xs font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100',
  surgRoom:        'text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded',
  section2:        'bg-blue-50/30 rounded-2xl p-4 flex flex-col h-full overflow-hidden border border-blue-100',
  secTitle2:       'text-sm font-black text-blue-900 uppercase tracking-widest mb-1 flex items-center gap-2 sticky top-0 bg-transparent z-10 py-2',
  pabCard:         'mb-4 bg-white rounded-xl border border-blue-100 p-3 shadow-sm hover:border-blue-300 transition-colors',
  slotGrid:        'grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2',
  slotBtn:         'group relative flex flex-col items-center justify-center py-2 px-1 rounded-lg border transition-all active:scale-95 bg-green-50 border-green-100 text-green-700 hover:bg-green-100 hover:border-green-200 hover:shadow-sm',
  noSlots:         'text-center py-4 bg-slate-50 rounded-lg border border-dashed border-slate-200',
  emptyFull:       'h-full flex flex-col items-center justify-center text-red-400 opacity-60',
  redDot:          'w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm',
  greenDot:        'w-2.5 h-2.5 rounded-full bg-green-500 shadow-sm',
  emptyClockIcon:  'w-12 h-12 mb-2 stroke-1',
  emptyText:       'text-xs font-medium italic',
  surgBlueLine:    'absolute left-0 top-0 bottom-0 w-1 bg-blue-500 group-hover:w-1.5 transition-all',
  surgItemHeader:  'flex justify-between items-start mb-2 pl-2',
  surgItemBody:    'pl-2',
  surgName:        'text-sm font-bold text-slate-800 mb-0.5',
  surgMeta:        'text-xs text-slate-500 font-medium flex items-center gap-1.5',
  stethoscopeIcon: 'w-3 h-3',
  metaSep:         'w-1 h-1 rounded-full bg-slate-300',
  availScroll:     'overflow-y-auto pr-2 custom-scrollbar flex-1 pb-4',
  pabHeader:       'flex justify-between items-center mb-3 pb-2 border-b border-slate-100',
  pabTitle:        'text-xs font-black text-slate-700 uppercase flex items-center gap-2',
  activityIcon:    'w-3.5 h-3.5 text-blue-500',
  camillasSpan:    'text-[9px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full',
  availInfoText:   'text-[10px] text-slate-500 mb-4 px-1 font-medium',
  slotTimeText:    'text-xs font-black',
  slotMaxDurText:  'text-[8px] font-bold opacity-70 group-hover:opacity-100 transition-opacity',
  noSlotsText:     'text-[10px] font-bold text-slate-400 uppercase',
}

export default function DayDetailsModal({ isOpen, onClose, day, cirugias, pabellones, onSelectSlot }) {
  const dayCirugias = useMemo(() => {
    if (!day) return []
    const dayStr = format(day, 'yyyy-MM-dd')
    return cirugias
      .filter(c => c.fecha === dayStr)
      .sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio))
  }, [day, cirugias])

  const availableSlots = useMemo(() => {
    if (!day) return []
    const slots = []
    pabellones.forEach(pabellon => {
      const pabellonCirugias = dayCirugias.filter(c => c.operating_room_id === pabellon.id)
      for (let h = 8; h < 20; h++) {
        for (let m = 0; m < 60; m += 30) {
          const timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
          const isOccupied = pabellonCirugias.some(c => c.hora_inicio <= timeStr && c.hora_fin > timeStr)
          if (!isOccupied) {
            const nextSurgery = pabellonCirugias.find(c => c.hora_inicio > timeStr)
            let maxDurationMinutes = 0
            if (nextSurgery) {
              const [h1, m1] = timeStr.split(':').map(Number)
              const [h2, m2] = nextSurgery.hora_inicio.split(':').map(Number)
              maxDurationMinutes = (h2 * 60 + m2) - (h1 * 60 + m1)
            } else {
              const [h1, m1] = timeStr.split(':').map(Number)
              maxDurationMinutes = (24 * 60) - (h1 * 60 + m1)
            }
            const hours = Math.floor(maxDurationMinutes / 60)
            const mins  = maxDurationMinutes % 60
            slots.push({ pabellon, time: timeStr, maxDuration: `${hours}h${mins > 0 ? ` ${mins}m` : ''}`, maxDurationMinutes })
          }
        }
      }
    })
    return slots
  }, [day, dayCirugias, pabellones])

  if (!day) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Detalles del ${format(day, "d 'de' MMMM", { locale: es })}`}
      className="max-w-5xl"
    >
      <div className={S.grid}>
        <div className={S.section1}>
          <h3 className={S.secTitle1}>
            <div className={S.redDot} />
            Horarios Ocupados ({dayCirugias.length})
          </h3>
          <div className={S.secScroll}>
            {dayCirugias.length === 0 ? (
              <div className={S.emptyState}>
                <Clock className={S.emptyClockIcon} />
                <p className={S.emptyText}>No hay cirugías programadas</p>
              </div>
            ) : (
              dayCirugias.map(c => (
                <div key={c.id} className={S.surgItem}>
                  <div className={S.surgBlueLine} />
                  <div className={S.surgItemHeader}>
                    <span className={S.surgTime}>{c.hora_inicio.slice(0, 5)} - {c.hora_fin.slice(0, 5)}</span>
                    <span className={S.surgRoom}>{pabellones.find(p => p.id === c.operating_room_id)?.nombre || 'Pabellón ?'}</span>
                  </div>
                  <div className={S.surgItemBody}>
                    <p className={S.surgName}>{c.patients?.nombre} {c.patients?.apellido}</p>
                    <p className={S.surgMeta}>
                      <Stethoscope className={S.stethoscopeIcon} />
                      Dr. {c.doctors?.apellido}
                      <span className={S.metaSep} />
                      {codigosOperaciones.find(op => op.codigo === c.codigo_operacion)?.nombre || c.codigo_operacion}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className={S.section2}>
          <h3 className={S.secTitle2}>
            <div className={S.greenDot} />
            Disponibilidad
          </h3>
          <p className={S.availInfoText}>
            Seleccione un horario de inicio. Se muestra el tiempo disponible hasta el próximo bloqueo.
          </p>
          <div className={S.availScroll}>
            {pabellones.map(p => {
              const pSlots = availableSlots.filter(s => s.pabellon.id === p.id)
              return (
                <div key={p.id} className={S.pabCard}>
                  <div className={S.pabHeader}>
                    <h4 className={S.pabTitle}>
                      <Activity className={S.activityIcon} />
                      {p.nombre}
                    </h4>
                    {p.camillas_disponibles && (
                      <span className={S.camillasSpan}>
                        {p.camillas_disponibles} camilla{p.camillas_disponibles !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  {pSlots.length > 0 ? (
                    <div className={S.slotGrid}>
                      {pSlots.map((slot, idx) => (
                        <button key={idx} onClick={() => onSelectSlot(slot)} className={S.slotBtn}>
                          <span className={S.slotTimeText}>{slot.time}</span>
                          <span className={S.slotMaxDurText}>max {slot.maxDuration}</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className={S.noSlots}>
                      <p className={S.noSlotsText}>Sin disponibilidad</p>
                    </div>
                  )}
                </div>
              )
            })}
            {availableSlots.length === 0 && (
              <div className={S.emptyFull}>
                <XCircle className={S.emptyClockIcon} />
                <p className={S.emptyText}>Día completamente ocupado</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  )
}
