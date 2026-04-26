import { AlertTriangle } from 'lucide-react'
import { format } from 'date-fns'
import Modal from '@/components/common/Modal'
import Button from '@/components/common/Button'

const S = {
  body:         'space-y-4 sm:space-y-5 md:space-y-6',
  warningBox:   'flex items-start gap-3 sm:gap-4 p-3 sm:p-4 bg-red-50 rounded-lg sm:rounded-xl border border-red-200',
  alertIcon:    'w-5 h-5 sm:w-6 sm:h-6 text-red-600 flex-shrink-0 mt-0.5',
  title:        'text-sm sm:text-base text-slate-900 font-bold mb-2',
  text:         'text-xs sm:text-sm text-slate-700 space-y-1',
  bold:         'font-bold',
  note:         'text-xs sm:text-sm text-slate-600',
  actions:      'flex flex-col sm:flex-row gap-3 sm:gap-4 justify-end',
}

export default function CalendarioCancelModal({ isOpen, onClose, cirugiaACancelar, slotDetalle, isSubmitting, onConfirmar }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Confirmar Cancelación">
      {cirugiaACancelar && (
        <div className={S.body}>
          <div className={S.warningBox}>
            <AlertTriangle className={S.alertIcon} />
            <div className="min-w-0 flex-1">
              <p className={S.title}>¿Está seguro de que desea cancelar esta cirugía?</p>
              <div className={S.text}>
                <p><span className={S.bold}>Paciente:</span> {cirugiaACancelar.patients?.nombre} {cirugiaACancelar.patients?.apellido}</p>
                <p><span className={S.bold}>Doctor:</span> Dr. {cirugiaACancelar.doctors?.apellido || cirugiaACancelar.doctors?.nombre}</p>
                <p><span className={S.bold}>Fecha:</span> {format(new Date(cirugiaACancelar.fecha), 'dd/MM/yyyy')}</p>
                <p><span className={S.bold}>Horario:</span> {cirugiaACancelar.hora_inicio?.substring(0,5)} - {cirugiaACancelar.hora_fin?.substring(0,5)}</p>
                <p><span className={S.bold}>Pabellón:</span> {slotDetalle?.pabellon || 'N/A'}</p>
              </div>
            </div>
          </div>
          <p className={S.note}>Esta acción no se puede deshacer. El doctor será notificado automáticamente de la cancelación.</p>
          <div className={S.actions}>
            <Button variant="secondary" onClick={onClose} disabled={isSubmitting} className="w-full sm:w-auto touch-manipulation">Cancelar</Button>
            <Button onClick={() => onConfirmar(cirugiaACancelar.id)} loading={isSubmitting} disabled={isSubmitting} className="bg-red-600 hover:bg-red-700 w-full sm:w-auto touch-manipulation">Confirmar Cancelación</Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
