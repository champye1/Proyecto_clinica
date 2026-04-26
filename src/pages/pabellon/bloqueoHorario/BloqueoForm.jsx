import { Clock, CheckCircle, XCircle, Lock } from 'lucide-react'
import { tc } from '@/constants/theme'
import { sanitizeString, sanitizeNumber } from '@/utils/sanitizeInput'
import { HORAS_SELECT } from '@/utils/horasOpciones'
import LoadingSpinner from '@/components/common/LoadingSpinner'

const HORAS_PARA_PREVIEW = HORAS_SELECT

const S = {
  formCard:              'card',
  formHeader:            'flex justify-between items-center mb-4',
  formTitleDark:         'text-xl font-bold text-white',
  formTitleLight:        'text-xl font-bold text-gray-900',
  cancelBtnDark:         'text-sm text-slate-300 hover:text-white',
  cancelBtnLight:        'text-sm text-gray-600 hover:text-gray-800',
  formBody:              'space-y-4',
  formLabel:             'label-field',
  formInput:             'input-field',
  formInputFull:         'input-field w-full',
  formGrid2:             'grid grid-cols-2 gap-4',
  dateHintDark:          'text-xs mt-1 text-slate-400',
  dateHintLight:         'text-xs mt-1 text-gray-500',
  scheduleGridDark:      'rounded-xl border-2 p-4 bg-slate-800/50 border-slate-600',
  scheduleGridLight:     'rounded-xl border-2 p-4 bg-slate-50 border-slate-200',
  scheduleGridTitleDark: 'text-sm font-bold mb-3 flex items-center gap-2 text-white',
  scheduleGridTitleLight:'text-sm font-bold mb-3 flex items-center gap-2 text-gray-900',
  scheduleTags:          'flex flex-wrap gap-2',
  scheduleTagBase:       'inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold',
  scheduleTagFreeDark:   'bg-green-900/50 text-green-300 border border-green-600/50',
  scheduleTagFreeLight:  'bg-green-100 text-green-800 border border-green-300',
  scheduleTagOccDark:    'bg-red-900/50 text-red-300 border border-red-600/50',
  scheduleTagOccLight:   'bg-red-100 text-red-800 border border-red-300',
  scheduleTagBlkDark:    'bg-amber-900/50 text-amber-300 border border-amber-600/50',
  scheduleTagBlkLight:   'bg-amber-100 text-amber-800 border border-amber-300',
  scheduleLegendDark:    'text-xs mt-2 text-slate-400',
  scheduleLegendLight:   'text-xs mt-2 text-gray-600',
  horaHintDark:          'text-xs mt-0.5 text-slate-400',
  horaHintLight:         'text-xs mt-0.5 text-gray-500',
  charCountDark:         'text-xs mt-1 text-slate-300',
  charCountLight:        'text-xs mt-1 text-gray-500',
  vigenciaHintDark:      'text-xs mt-1 text-slate-200',
  vigenciaHintLight:     'text-xs mt-1 text-gray-600',
  submitBtn:             'btn-primary w-full',
  submitSpinner:         'flex items-center justify-center gap-2',
  iconSm:                'w-4 h-4',
  iconXs:                'w-3.5 h-3.5',
}

export default function BloqueoForm({ formData, setFormData, bloqueoEditando, doctores, pabellones, estadoPorHora, handleSubmit, cancelarEdicion, isCreating, isUpdating, theme }) {
  const t = tc(theme)
  const isDark = theme === 'dark'

  return (
    <div className={S.formCard}>
      <div className={S.formHeader}>
        <h2 className={isDark ? S.formTitleDark : S.formTitleLight}>
          {bloqueoEditando ? 'Editar Bloqueo' : 'Crear Bloqueo'}
        </h2>
        {bloqueoEditando && (
          <button type="button" onClick={cancelarEdicion} className={isDark ? S.cancelBtnDark : S.cancelBtnLight}>
            Cancelar edición
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className={S.formBody}>
        <div>
          <label htmlFor="bloqueo-doctor" className={S.formLabel}>Doctor (Opcional)</label>
          <select id="bloqueo-doctor" value={formData.doctor_id} onChange={(e) => setFormData({ ...formData, doctor_id: sanitizeString(e.target.value) })} className={S.formInput}>
            <option value="">Seleccionar doctor...</option>
            {doctores.map(doctor => <option key={doctor.id} value={doctor.id}>{doctor.nombre} {doctor.apellido}</option>)}
          </select>
        </div>

        <div>
          <label htmlFor="bloqueo-pabellon" className={S.formLabel}>Pabellón *</label>
          <select id="bloqueo-pabellon" value={formData.operating_room_id} onChange={(e) => setFormData({ ...formData, operating_room_id: sanitizeString(e.target.value) })} className={S.formInput} required>
            <option value="">Seleccionar pabellón...</option>
            {pabellones.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </select>
        </div>

        <div>
          <label htmlFor="bloqueo-fecha" className={S.formLabel}>Fecha *</label>
          <input id="bloqueo-fecha" type="date" value={formData.fecha} onChange={(e) => setFormData({ ...formData, fecha: sanitizeString(e.target.value) })} className={S.formInputFull} required min={new Date().toISOString().split('T')[0]} />
          <p className={isDark ? S.dateHintDark : S.dateHintLight}>Elija fecha y pabellón para ver abajo los horarios disponibles u ocupados.</p>
        </div>

        {formData.fecha && formData.operating_room_id && (
          <div className={isDark ? S.scheduleGridDark : S.scheduleGridLight}>
            <h3 className={isDark ? S.scheduleGridTitleDark : S.scheduleGridTitleLight}>
              <Clock className={S.iconSm} />
              Horarios del día ({formData.fecha}) — {pabellones.find(p => p.id === formData.operating_room_id)?.nombre || 'Pabellón'}
            </h3>
            <div className={S.scheduleTags}>
              {HORAS_PARA_PREVIEW.map(h => {
                const estado = estadoPorHora[h] || 'libre'
                const tagColor = estado === 'libre'
                  ? (isDark ? S.scheduleTagFreeDark : S.scheduleTagFreeLight)
                  : estado === 'ocupado'
                  ? (isDark ? S.scheduleTagOccDark : S.scheduleTagOccLight)
                  : (isDark ? S.scheduleTagBlkDark : S.scheduleTagBlkLight)
                return (
                  <span key={h} className={`${S.scheduleTagBase} ${tagColor}`} title={estado === 'libre' ? 'Disponible para bloquear' : estado === 'ocupado' ? 'Ocupado por cirugía' : 'Ya bloqueado'}>
                    {estado === 'libre' && <CheckCircle className={S.iconXs} />}
                    {estado === 'ocupado' && <XCircle className={S.iconXs} />}
                    {estado === 'bloqueado' && <Lock className={S.iconXs} />}
                    {h}
                  </span>
                )
              })}
            </div>
            <p className={isDark ? S.scheduleLegendDark : S.scheduleLegendLight}>
              Verde = disponible · Rojo = ocupado (cirugía) · Amarillo = ya bloqueado. Elija Hora Inicio y Hora Fin entre las verdes.
            </p>
          </div>
        )}

        <div className={S.formGrid2}>
          <div>
            <label htmlFor="bloqueo-hora-inicio" className={S.formLabel}>Hora Inicio *</label>
            <select id="bloqueo-hora-inicio" value={formData.hora_inicio ? String(formData.hora_inicio).slice(0, 5) : ''} onChange={(e) => setFormData({ ...formData, hora_inicio: e.target.value })} className={S.formInputFull} required>
              <option value="">Seleccione hora</option>
              {HORAS_SELECT.map(h => <option key={h} value={h}>{h}</option>)}
            </select>
            <p className={isDark ? S.horaHintDark : S.horaHintLight}>Solo hora (sin minutos)</p>
          </div>
          <div>
            <label htmlFor="bloqueo-hora-fin" className={S.formLabel}>Hora Fin *</label>
            <select id="bloqueo-hora-fin" value={formData.hora_fin ? String(formData.hora_fin).slice(0, 5) : ''} onChange={(e) => setFormData({ ...formData, hora_fin: e.target.value })} className={S.formInputFull} required>
              <option value="">Seleccione hora</option>
              {HORAS_SELECT.filter(h => !formData.hora_inicio || h > formData.hora_inicio).map(h => <option key={h} value={h}>{h}</option>)}
            </select>
            <p className={isDark ? S.horaHintDark : S.horaHintLight}>Solo hora (sin minutos)</p>
          </div>
        </div>

        <div>
          <label htmlFor="bloqueo-motivo" className={S.formLabel}>Motivo</label>
          <textarea id="bloqueo-motivo" value={formData.motivo} onChange={(e) => setFormData({ ...formData, motivo: sanitizeString(e.target.value) })} className={S.formInput} rows="3" maxLength={500} />
          <p className={isDark ? S.charCountDark : S.charCountLight}>{formData.motivo.length}/500 caracteres</p>
        </div>

        <div>
          <label htmlFor="bloqueo-vigencia" className={S.formLabel}>Días límite de vigencia (Opcional)</label>
          <input id="bloqueo-vigencia" type="number" min={1} max={365} value={formData.dias_limite_vigencia} onChange={(e) => setFormData({ ...formData, dias_limite_vigencia: sanitizeNumber(e.target.value).slice(0, 3) })} className={S.formInput} placeholder="Ej: 5" />
          <p className={isDark ? S.vigenciaHintDark : S.vigenciaHintLight}>
            Ejemplo: si pones 5, el bloqueo dura 5 días desde la fecha del bloqueo y luego se libera si no se llenó. Puedes usar cualquier número (5, 15, etc.). Vacío = permanente hasta liberación manual.
          </p>
        </div>

        <button type="submit" className={S.submitBtn} disabled={isCreating || isUpdating}>
          {isCreating || isUpdating ? (
            <span className={S.submitSpinner}>
              <LoadingSpinner size="sm" />
              {bloqueoEditando ? 'Actualizando...' : 'Creando...'}
            </span>
          ) : (
            bloqueoEditando ? 'Actualizar Bloqueo' : 'Crear Bloqueo'
          )}
        </button>
      </form>
    </div>
  )
}
