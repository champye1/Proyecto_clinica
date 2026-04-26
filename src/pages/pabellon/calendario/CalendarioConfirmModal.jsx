import { Clock, Calendar as CalendarIcon, Activity, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Stethoscope } from 'lucide-react'
import Modal from '@/components/common/Modal'
import Button from '@/components/common/Button'
import TimeInput from '@/components/TimeInput'
import { codigosOperaciones } from '@/data/codigosOperaciones'

const S = {
  body:              'space-y-4 sm:space-y-5 md:space-y-6',
  gradBox:           'bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 border-2 border-blue-200',
  avatarRow:         'flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4',
  avatar:            'w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center text-white font-black text-lg sm:text-xl md:text-2xl shadow-lg bg-blue-600 flex-shrink-0',
  patientLabel:      'text-[8px] sm:text-[9px] font-black text-blue-400 uppercase tracking-widest mb-0.5 sm:mb-1',
  patientName:       'font-black text-slate-900 text-base sm:text-lg md:text-xl uppercase leading-relaxed tracking-wide truncate',
  patientRut:        'text-[10px] sm:text-xs text-slate-600 font-bold mt-0.5 sm:mt-1',
  procBox:           'bg-white/60 rounded-lg sm:rounded-xl p-2.5 sm:p-3 border border-blue-200',
  procLabelRow:      'text-[8px] sm:text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1 flex items-center gap-1.5 sm:gap-2',
  procName:          'text-xs sm:text-sm font-black text-slate-800 break-words',
  procCode:          'text-[10px] sm:text-xs text-slate-500 font-bold mt-0.5 sm:mt-1',
  grid:              'grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4',
  gridCell:          'bg-slate-50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-slate-200',
  cellLabelRow:      'text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 sm:mb-2 flex items-center gap-1.5 sm:gap-2',
  cellValue:         'text-sm sm:text-base font-black text-slate-900 break-words',
  iconSm:            'sm:w-3 sm:h-3',
  horaFinLabel:      'text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block',
  horaFinInput:      'w-full bg-slate-50 border-2 border-slate-200 rounded-xl sm:rounded-2xl py-3 sm:py-3.5 px-4 sm:px-5 focus:border-blue-500 focus:bg-white transition-all outline-none font-bold text-slate-700 text-base touch-manipulation',
  overlapAlert:      'mt-2 p-3 bg-red-50 border border-red-200 rounded-lg animate-pulse',
  overlapTitle:      'text-xs sm:text-sm text-red-700 font-black flex items-center gap-2',
  overlapText:       'text-[10px] sm:text-xs text-red-600 mt-1',
  errorMsg:          'mt-2 text-xs sm:text-sm text-red-600 font-bold',
  successMsg:        'mt-2 text-xs sm:text-sm text-green-600 font-bold flex items-center gap-1',
  actions:           'flex flex-col sm:flex-row gap-3 sm:gap-4 pt-3 sm:pt-4 border-t border-slate-200',
}

export default function CalendarioConfirmModal({
  isOpen, onClose, cirugiaAReagendar, currentRequest, selectedSlot,
  horaFin, setHoraFin, isOverlap, pabellones, isSubmitting, onConfirmar, showError,
}) {
  if (!isOpen || !selectedSlot || !currentRequest) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={cirugiaAReagendar ? 'Confirmar Reagendamiento' : 'Confirmar Agendamiento'}>
      <div className={S.body}>
        <div className={S.gradBox}>
          <div className={S.avatarRow}>
            <div className={S.avatar}>{currentRequest.patients?.nombre?.charAt(0).toUpperCase() || 'P'}</div>
            <div className="flex-1 min-w-0">
              <div className={S.patientLabel}>Paciente</div>
              <div className={S.patientName}>{currentRequest.patients?.nombre} {currentRequest.patients?.apellido}</div>
              <div className={S.patientRut}>RUT: {currentRequest.patients?.rut}</div>
            </div>
          </div>
          <div className={S.procBox}>
            <div className={S.procLabelRow}><Activity size={10} className={S.iconSm} />Procedimiento</div>
            <div className={S.procName}>{codigosOperaciones.find(c => c.codigo === currentRequest.codigo_operacion)?.nombre || currentRequest.codigo_operacion}</div>
            <div className={S.procCode}>Código: {currentRequest.codigo_operacion}</div>
          </div>
        </div>

        <div className={S.grid}>
          {[
            { icon: <Clock size={10} className={S.iconSm} />, label: 'Horario', value: `${selectedSlot.time} - ${horaFin || '--:--'}` },
            { icon: <CalendarIcon size={10} className={S.iconSm} />, label: 'Pabellón', value: pabellones.find(p => p.id === selectedSlot.pabellonId)?.nombre || 'N/A' },
            { icon: <CalendarIcon size={10} className={S.iconSm} />, label: 'Fecha', value: format(selectedSlot.date, 'EEEE d', { locale: es }), sub: format(selectedSlot.date, 'MMMM yyyy', { locale: es }) },
            { icon: <Stethoscope size={10} className={S.iconSm} />, label: 'Cirujano', value: `Dr. ${currentRequest.doctors?.apellido || currentRequest.doctors?.nombre}` },
          ].map(({ icon, label, value, sub }) => (
            <div key={label} className={S.gridCell}>
              <div className={S.cellLabelRow}>{icon}{label}</div>
              <div className={S.cellValue}>{value}</div>
              {sub && <div className={S.procCode}>{sub}</div>}
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <label htmlFor="hora-fin" className={S.horaFinLabel}>Hora Fin *</label>
          <TimeInput
            id="hora-fin"
            value={horaFin}
            onChange={(e) => {
              const v = e.target.value
              if (selectedSlot && v?.match(/^\d{2}:\d{2}$/)) {
                const [ih, im] = selectedSlot.time.split(':').map(Number)
                const [fh, fm] = v.split(':').map(Number)
                if (fh * 60 + fm <= ih * 60 + im) { showError('La hora de fin debe ser mayor que la hora de inicio'); return }
              }
              setHoraFin(v)
            }}
            min={selectedSlot?.time}
            className={S.horaFinInput}
            required
            aria-required="true"
            aria-label="Hora de fin de la cirugía"
          />
          {selectedSlot && horaFin && (() => {
            const [ih, im] = selectedSlot.time.split(':').map(Number)
            const [fh, fm] = horaFin.split(':').map(Number)
            const esValido = fh * 60 + fm > ih * 60 + im
            if (isOverlap) return (
              <div className={S.overlapAlert}>
                <p className={S.overlapTitle}><AlertTriangle size={16} />Conflicto de horario detectado</p>
                <p className={S.overlapText}>El horario se solapa con otra cirugía existente en este pabellón.</p>
              </div>
            )
            return !esValido
              ? <p className={S.errorMsg} role="alert">La hora de fin debe ser mayor que {selectedSlot.time}</p>
              : <p className={S.successMsg}><CheckCircle2 size={14} />Duración: {Math.round((fh * 60 + fm - ih * 60 - im) / 60)} horas</p>
          })()}
        </div>

        <div className={S.actions}>
          <Button variant="secondary" onClick={onClose} className="flex-1 w-full sm:w-auto touch-manipulation" disabled={isSubmitting}>Cancelar</Button>
          <Button
            loading={isSubmitting}
            onClick={onConfirmar}
            disabled={!horaFin || isSubmitting || isOverlap}
            className="flex-1 w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cirugiaAReagendar ? 'Confirmar Reagendamiento' : 'Confirmar Agendamiento'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
