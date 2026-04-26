import SearchableSelect from '@/components/SearchableSelect'
import { tc } from '@/constants/theme'
import { Package } from 'lucide-react'
import { sanitizeNumber } from '@/utils/sanitizeInput'

const S = {
  sectionTitle:     'text-xl font-bold mb-4 flex items-center gap-2',
  packHintDark:     'text-xs mb-3 text-slate-400',
  packHintLight:    'text-xs mb-3 text-slate-500',
  insumosRow:       'flex gap-2 mb-4',
  flex1:            'flex-1',
  insumosQty:       'input-field w-24',
  insumosAddBtn:    'btn-secondary',
  insumosListDark:  'border rounded-lg p-4 space-y-2 border-slate-600 bg-slate-800/50',
  insumosListLight: 'border rounded-lg p-4 space-y-2 border-slate-200',
  insumoItemDark:   'flex justify-between items-center p-3 rounded-lg bg-slate-700 text-slate-100',
  insumoItemLight:  'flex justify-between items-center p-3 rounded-lg bg-gray-50 text-gray-900',
  insumoRemoveDark: 'text-red-400 hover:text-red-300 font-semibold',
  insumoRemoveLight:'text-red-600 hover:text-red-800 font-semibold',
  iconMd:           'w-5 h-5',
  fontMedium:       'font-medium',
}

export default function InsumosSection({
  formData, insumoSeleccionado, setInsumoSeleccionado,
  cantidadInsumo, setCantidadInsumo,
  insumosDisponibles, grupoFonasa, packData,
  agregarInsumo, eliminarInsumo, theme,
}) {
  const t = tc(theme)
  const isDark = theme === 'dark'

  return (
    <div>
      <h2 className={S.sectionTitle}>
        <Package className={S.iconMd} />
        Insumos Requeridos
      </h2>
      {formData.codigo_operacion && packData?.packItems?.length > 0 && (
        <p className={isDark ? S.packHintDark : S.packHintLight}>
          Los insumos del pack para esta operación se han añadido automáticamente. Los recomendados aparecen primero en la lista.
        </p>
      )}
      <div className={S.insumosRow}>
        <div className={S.flex1}>
          <SearchableSelect
            options={insumosDisponibles}
            value={insumoSeleccionado}
            onChange={(id) => setInsumoSeleccionado(id)}
            placeholder={grupoFonasa ? `Insumos para esta cirugía (grupo ${grupoFonasa})` : 'Primero elija código de operación'}
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
          aria-label="Cantidad de insumo"
        />
        <button type="button" onClick={agregarInsumo} className={S.insumosAddBtn} disabled={!insumoSeleccionado}>
          Agregar
        </button>
      </div>

      {formData.insumos.length > 0 && (
        <div className={isDark ? S.insumosListDark : S.insumosListLight}>
          {formData.insumos.map((insumo, index) => (
            <div key={index} className={isDark ? S.insumoItemDark : S.insumoItemLight}>
              <span className={S.fontMedium}>{insumo.nombre} ({insumo.codigo}) - Cantidad: {insumo.cantidad}</span>
              <button type="button" onClick={() => eliminarInsumo(index)} className={isDark ? S.insumoRemoveDark : S.insumoRemoveLight}>
                Eliminar
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
