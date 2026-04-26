import LoadingSpinner from '@/components/common/LoadingSpinner'
import { sanitizeString, sanitizeCode } from '@/utils/sanitizeInput'

const S = {
  card:       'card',
  title:      'text-xl font-bold mb-4',
  body:       'space-y-4',
  label:      'label-field',
  input:      'input-field',
  inputError: 'input-field border-red-500',
  error:      'text-xs text-red-600 mt-1',
  hintDark:   'text-xs mt-1 text-slate-400',
  hintLight:  'text-xs mt-1 text-gray-500',
  footer:     'flex gap-2',
  submitBtn:  'btn-primary',
  cancelBtn:  'btn-secondary',
  loadingRow: 'flex items-center gap-2',
}

export default function InsumoForm({
  formData, setFormData, insumoEditando, codigoError, codigoTouched, setCodigoTouched,
  validarCodigo, handleSubmit, isCreating, isUpdating, onCancel, isDark,
}) {
  return (
    <div className={S.card}>
      <h2 className={S.title}>{insumoEditando ? 'Editar Insumo' : 'Nuevo Insumo'}</h2>
      <form onSubmit={handleSubmit} className={S.body}>
        <div>
          <label htmlFor="insumo-nombre" className={S.label}>Nombre *</label>
          <input
            id="insumo-nombre"
            type="text"
            value={formData.nombre}
            onChange={(e) => setFormData({ ...formData, nombre: sanitizeString(e.target.value) })}
            className={S.input}
            required
          />
        </div>

        <div>
          <label htmlFor="insumo-codigo" className={S.label}>Código *</label>
          <input
            id="insumo-codigo"
            type="text"
            value={formData.codigo}
            onChange={(e) => {
              const sanitized = sanitizeCode(e.target.value)
              setFormData({ ...formData, codigo: sanitized })
              if (codigoTouched && !insumoEditando) validarCodigo(sanitized)
            }}
            onBlur={() => {
              setCodigoTouched(true)
              if (!insumoEditando) validarCodigo(formData.codigo)
            }}
            className={codigoError ? S.inputError : S.input}
            required
            disabled={!!insumoEditando}
          />
          {codigoError && codigoTouched && <p className={S.error}>{codigoError}</p>}
        </div>

        <div>
          <label htmlFor="insumo-grupo" className={S.label}>Grupo de Prestación *</label>
          <input
            id="insumo-grupo"
            type="text"
            value={formData.grupo_prestacion}
            onChange={(e) => setFormData({ ...formData, grupo_prestacion: sanitizeString(e.target.value) })}
            className={S.input}
            required
          />
        </div>

        <div>
          <label htmlFor="insumo-proveedor" className={S.label}>Proveedor (opcional)</label>
          <input
            id="insumo-proveedor"
            type="text"
            value={formData.proveedor}
            onChange={(e) => setFormData({ ...formData, proveedor: sanitizeString(e.target.value) })}
            className={S.input}
            placeholder="Quien proveyó el item"
          />
        </div>

        <div>
          <label htmlFor="insumo-fonasa" className={S.label}>Grupos Fonasa (opcional)</label>
          <input
            id="insumo-fonasa"
            type="text"
            value={formData.grupos_fonasa}
            onChange={(e) => setFormData({ ...formData, grupos_fonasa: sanitizeString(e.target.value) })}
            className={S.input}
            placeholder="Ej: 18, 11, 30 — Vacío = disponible para todas las cirugías"
          />
          <p className={isDark ? S.hintDark : S.hintLight}>
            Códigos FONASA separados por coma. Vacío = aplica a todas las cirugías.
          </p>
        </div>

        <div className={S.footer}>
          <button type="submit" className={S.submitBtn} disabled={isCreating || isUpdating}>
            {isCreating || isUpdating ? (
              <span className={S.loadingRow}>
                <LoadingSpinner size="sm" />
                {insumoEditando ? 'Actualizando...' : 'Creando...'}
              </span>
            ) : (
              insumoEditando ? 'Actualizar' : 'Crear'
            )}
          </button>
          <button type="button" onClick={onCancel} className={S.cancelBtn} disabled={isCreating || isUpdating}>
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}
