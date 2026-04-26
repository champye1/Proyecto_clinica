import { Package, X } from 'lucide-react'
import { HORAS_SELECT } from '@/utils/horasOpciones'
import { sanitizeString, sanitizeNumber } from '@/utils/sanitizeInput'
import Modal from '@/components/common/Modal'
import Button from '@/components/common/Button'
import SearchableSelect from '@/components/SearchableSelect'
import { codigosOperaciones } from '@/data/codigosOperaciones'

const S = {
  form:               'space-y-6',
  patientInfo:        'text-sm text-slate-600 mb-4',
  fontBold:           'font-bold',
  hint:               'text-xs text-gray-500 mt-0.5',
  charCount:          'text-xs text-gray-500 mt-1',
  insumosTitle:       'text-lg font-bold mb-4 flex items-center gap-2',
  insumosRow:         'flex gap-2 mb-4',
  flex1:              'flex-1',
  insumosQty:         'input-field w-24',
  insumosAddBtn:      'btn-secondary',
  insumosList:        'border rounded-lg p-4 space-y-2',
  insumoItem:         'flex justify-between items-center p-2 bg-gray-50 rounded',
  insumoRemove:       'text-red-600 hover:text-red-800',
  footer:             'flex gap-4 justify-end',
  iconMd:             'w-5 h-5',
  iconSm:             'w-4 h-4',
}

export default function SolicitudEditModal({
  solicitudEditando,
  onClose,
  formEdicion,
  setFormEdicion,
  insumoSeleccionado,
  setInsumoSeleccionado,
  cantidadInsumo,
  setCantidadInsumo,
  insumosDisponiblesEdicion,
  grupoFonasaEdicion,
  agregarInsumo,
  eliminarInsumo,
  handleGuardarEdicion,
  isSubmitting,
}) {
  return (
    <Modal isOpen={!!solicitudEditando} onClose={onClose} title="Editar Solicitud">
      {solicitudEditando && (
        <form onSubmit={handleGuardarEdicion} className={S.form}>
          <div>
            <p className={S.patientInfo}>
              <span className={S.fontBold}>Paciente:</span> {solicitudEditando.patients?.nombre} {solicitudEditando.patients?.apellido}
            </p>
          </div>

          <div>
            <label className="label-field">Código de Operación *</label>
            <SearchableSelect
              options={codigosOperaciones}
              value={formEdicion.codigo_operacion}
              onChange={(codigo) => setFormEdicion({ ...formEdicion, codigo_operacion: codigo })}
              placeholder="Buscar código de operación..."
              required
            />
          </div>

          <div>
            <label className="label-field">Hora Recomendada (Opcional)</label>
            <select
              value={formEdicion.hora_recomendada ? String(formEdicion.hora_recomendada).slice(0, 5) : ''}
              onChange={(e) => setFormEdicion({ ...formEdicion, hora_recomendada: e.target.value })}
              className="input-field"
            >
              <option value="">Sin preferencia</option>
              {HORAS_SELECT.map(h => (
                <option key={h} value={h}>{h}</option>
              ))}
            </select>
            <p className={S.hint}>Solo hora (sin minutos)</p>
          </div>

          <div>
            <label className="label-field">Observaciones</label>
            <textarea
              value={formEdicion.observaciones}
              onChange={(e) => setFormEdicion({ ...formEdicion, observaciones: sanitizeString(e.target.value) })}
              className="input-field"
              rows="3"
              maxLength={500}
            />
            <p className={S.charCount}>{formEdicion.observaciones?.length || 0}/500 caracteres</p>
          </div>

          <div>
            <h3 className={S.insumosTitle}>
              <Package className={S.iconMd} />
              Insumos Requeridos
            </h3>
            <div className={S.insumosRow}>
              <div className={S.flex1}>
                <SearchableSelect
                  options={insumosDisponiblesEdicion}
                  value={insumoSeleccionado}
                  onChange={(id) => setInsumoSeleccionado(id)}
                  placeholder={grupoFonasaEdicion ? `Insumos para esta cirugía (grupo ${grupoFonasaEdicion})` : 'Buscar insumo...'}
                  valueKey="id"
                  displayFormat={(insumo) => `${insumo.codigo} - ${insumo.nombre}`}
                />
              </div>
              <input
                type="number"
                value={cantidadInsumo}
                onChange={(e) => setCantidadInsumo(parseInt(sanitizeNumber(e.target.value)) || 1)}
                className={S.insumosQty}
                min="1"
                placeholder="Cant."
              />
              <button
                type="button"
                onClick={agregarInsumo}
                className={S.insumosAddBtn}
                disabled={!insumoSeleccionado}
              >
                Agregar
              </button>
            </div>

            {formEdicion.insumos.length > 0 && (
              <div className={S.insumosList}>
                {formEdicion.insumos.map((insumo, index) => (
                  <div key={index} className={S.insumoItem}>
                    <span>
                      {insumo.nombre} ({insumo.codigo}) - Cantidad: {insumo.cantidad}
                    </span>
                    <button
                      type="button"
                      onClick={() => eliminarInsumo(index)}
                      className={S.insumoRemove}
                    >
                      <X className={S.iconSm} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={S.footer}>
            <Button variant="secondary" type="button" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" loading={isSubmitting}>
              Guardar Cambios
            </Button>
          </div>
        </form>
      )}
    </Modal>
  )
}
