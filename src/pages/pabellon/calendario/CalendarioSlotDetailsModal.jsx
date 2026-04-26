import { Clock, Calendar as CalendarIcon, CheckCircle2, Info, XCircle } from 'lucide-react'
import { Stethoscope } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { isPast, startOfDay } from 'date-fns'
import Modal from '@/components/common/Modal'
import { codigosOperaciones } from '@/data/codigosOperaciones'

const S = {
  body:           'space-y-4 sm:space-y-5 md:space-y-6',
  patientBox:     'flex items-center gap-3 sm:gap-4 md:gap-5 p-3 sm:p-4 md:p-5 bg-slate-50 rounded-xl sm:rounded-2xl border border-slate-100',
  patientAvatar:  'w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center text-white font-black text-lg sm:text-xl md:text-2xl shadow-lg bg-red-600 flex-shrink-0',
  label:          'text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5',
  labelBlue:      'text-[8px] sm:text-[9px] font-black text-blue-400 uppercase tracking-widest mb-0.5',
  name:           'font-black text-slate-800 text-sm sm:text-base md:text-lg uppercase leading-none break-words',
  code:           'text-[10px] sm:text-xs text-slate-500 font-bold mt-0.5 sm:mt-1',
  doctorBox:      'flex items-center gap-3 sm:gap-4 md:gap-5 p-3 sm:p-4 md:p-5 bg-blue-50 rounded-xl sm:rounded-2xl border border-blue-100',
  doctorAvatar:   'w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center text-white font-black text-lg sm:text-xl shadow-lg bg-blue-600 flex-shrink-0',
  procBox:        'p-3 sm:p-4 md:p-5 bg-slate-50 rounded-xl sm:rounded-2xl border border-slate-100',
  detailBox:      'p-3 sm:p-4 md:p-5 bg-white rounded-xl sm:rounded-2xl border border-slate-100',
  detailBoxBlue:  'p-3 sm:p-4 md:p-5 bg-blue-50 rounded-xl sm:rounded-2xl border border-blue-100',
  labelRow:       'text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 sm:mb-2 flex items-center gap-1',
  value:          'font-black text-slate-800 text-sm sm:text-base',
  procValue:      'font-black text-slate-800 text-sm sm:text-base break-words',
  procLabel:      'text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 sm:mb-2',
  grid:           'grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4',
  infoBox:        'p-3 sm:p-4 md:p-5 bg-blue-50 rounded-xl sm:rounded-2xl border border-blue-100',
  infoRow:        'flex items-center gap-2 text-blue-700',
  infoText:       'text-xs sm:text-sm font-bold',
  iconSm:         'sm:w-3 sm:h-3',
  iconMd:         'sm:w-5 sm:h-5 md:w-6 md:h-6',
  cancelBtn:      'w-full py-2.5 sm:py-3 px-3 sm:px-4 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-xs sm:text-sm font-bold rounded-lg sm:rounded-xl transition-colors flex items-center justify-center gap-2 touch-manipulation',
  availBox:       'flex items-center gap-3 sm:gap-4 md:gap-5 p-3 sm:p-4 md:p-5 bg-green-50 rounded-xl sm:rounded-2xl border border-green-100',
  availAvatar:    'w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center text-white font-black text-lg sm:text-xl shadow-lg bg-green-600 flex-shrink-0',
  availLabel:     'text-[8px] sm:text-[9px] font-black text-green-400 uppercase tracking-widest mb-0.5',
  availInfoBox:   'p-3 sm:p-4 md:p-5 bg-blue-50 rounded-xl sm:rounded-2xl border border-blue-100',
  availInfoRow:   'text-[8px] sm:text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1.5 sm:mb-2 flex items-center gap-1',
  availInfoText:  'text-xs sm:text-sm text-slate-700 break-words',
}

const ESTADO_BADGE = {
  programada: 'bg-green-100 text-green-700',
  en_proceso: 'bg-yellow-100 text-yellow-700',
  cancelada:  'bg-red-100 text-red-700',
}

export default function CalendarioSlotDetailsModal({ isOpen, onClose, slotDetalle, onCancelar }) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={slotDetalle?.type === 'occupied' ? 'Detalles de Cirugía' : 'Detalles del Horario'}
    >
      {slotDetalle && (
        <div className={S.body}>
          {slotDetalle.type === 'occupied' && slotDetalle.data ? (
            <>
              <div className={S.patientBox}>
                <div className={S.patientAvatar}>{slotDetalle.data.patients?.nombre?.charAt(0).toUpperCase() || 'P'}</div>
                <div className="min-w-0 flex-1">
                  <div className={S.label}>Paciente</div>
                  <div className={S.name}>{slotDetalle.data.patients?.nombre || 'N/A'} {slotDetalle.data.patients?.apellido || ''}</div>
                  {slotDetalle.data.patients?.rut && <div className={S.code}>RUT: {slotDetalle.data.patients.rut}</div>}
                </div>
              </div>

              <div className={S.doctorBox}>
                <div className={S.doctorAvatar}><Stethoscope size={18} className={S.iconMd} /></div>
                <div className="min-w-0 flex-1">
                  <div className={S.labelBlue}>Cirujano</div>
                  <div className={S.name}>Dr. {slotDetalle.data.doctors?.apellido || slotDetalle.data.doctors?.nombre || 'General'}</div>
                  {slotDetalle.data.doctors?.especialidad && <div className={S.code}>{slotDetalle.data.doctors.especialidad}</div>}
                </div>
              </div>

              {(() => {
                const cod = slotDetalle.data.surgery_requests?.codigo_operacion || slotDetalle.data.codigo_operacion
                if (!cod) return null
                const obj = codigosOperaciones.find(c => c.codigo === cod)
                return (
                  <div className={S.procBox}>
                    <div className={S.procLabel}>Procedimiento</div>
                    <div className={S.procValue}>{obj?.nombre || cod}</div>
                    <div className={S.code}>Código: {cod}</div>
                  </div>
                )
              })()}

              <div className={S.grid}>
                <div className={S.detailBox}>
                  <div className={S.labelRow}><Clock size={9} className={S.iconSm} /> Horario</div>
                  <div className={S.value}>{slotDetalle.data.hora_inicio?.substring(0,5)} - {slotDetalle.data.hora_fin?.substring(0,5)}</div>
                </div>
                <div className={S.detailBox}>
                  <div className={S.labelRow}><CalendarIcon size={9} className={S.iconSm} /> Pabellón</div>
                  <div className={S.procValue}>{slotDetalle.pabellon}</div>
                </div>
              </div>

              <div className={S.detailBox}>
                <div className={S.labelRow}><CalendarIcon size={9} className={S.iconSm} /> Fecha</div>
                <div className={S.procValue}>{format(slotDetalle.date, "EEEE d 'de' MMMM 'de' yyyy", { locale: es })}</div>
              </div>

              {slotDetalle.data.observaciones && (
                <div className={S.procBox}>
                  <div className={S.procLabel}>Observaciones</div>
                  <div className={S.availInfoText}>{slotDetalle.data.observaciones}</div>
                </div>
              )}

              <div className={S.detailBox}>
                <div className={S.procLabel}>Estado</div>
                <div className={`inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full font-bold text-[10px] sm:text-xs ${ESTADO_BADGE[slotDetalle.data.estado] || 'bg-gray-100 text-gray-700'}`}>
                  <CheckCircle2 size={10} className={S.iconSm} />
                  {slotDetalle.data.estado === 'programada' ? 'Programada' : slotDetalle.data.estado === 'en_proceso' ? 'En Proceso' : slotDetalle.data.estado}
                </div>
              </div>

              {slotDetalle.data.estado === 'programada' && slotDetalle.date && !isPast(startOfDay(slotDetalle.date)) && (
                <div className={S.detailBox}>
                  <button onClick={() => onCancelar(slotDetalle.data)} className={S.cancelBtn}>
                    <XCircle size={16} className="sm:w-[18px] sm:h-[18px]" />Cancelar Cirugía
                  </button>
                </div>
              )}

              {slotDetalle.date && isPast(startOfDay(slotDetalle.date)) && (
                <div className={S.detailBoxBlue}>
                  <div className={S.infoRow}>
                    <Info size={16} className={S.iconMd} />
                    <p className={S.infoText}>Esta cirugía pertenece a un día histórico. Solo se puede consultar información.</p>
                  </div>
                </div>
              )}
            </>
          ) : slotDetalle.type === 'available' ? (
            <>
              <div className={S.availBox}>
                <div className={S.availAvatar}><CheckCircle2 size={24} className="sm:w-8 sm:h-8" /></div>
                <div className="min-w-0 flex-1">
                  <div className={S.availLabel}>Horario Disponible</div>
                  <div className={S.name}>{slotDetalle.pabellon}</div>
                  <div className={S.code}>{slotDetalle.time}</div>
                </div>
              </div>
              <div className={S.grid}>
                <div className={S.detailBox}><div className={S.labelRow}><Clock size={9} className={S.iconSm} /> Hora</div><div className={S.value}>{slotDetalle.time}</div></div>
                <div className={S.detailBox}><div className={S.labelRow}><CalendarIcon size={9} className={S.iconSm} /> Fecha</div><div className={S.procValue}>{format(slotDetalle.date, "EEEE d 'de' MMMM", { locale: es })}</div></div>
              </div>
              <div className={S.availInfoBox}>
                <div className={S.availInfoRow}><Info size={9} className={S.iconSm} /> Información</div>
                <div className={S.availInfoText}>Este horario está disponible para agendar una nueva cirugía. Para proceder, primero debe seleccionar una solicitud desde la bandeja de solicitudes.</div>
              </div>
            </>
          ) : null}
        </div>
      )}
    </Modal>
  )
}
