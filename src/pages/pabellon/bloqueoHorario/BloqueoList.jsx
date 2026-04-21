import { Edit, X } from 'lucide-react'
import Pagination from '@/components/common/Pagination'
import LoadingSpinner from '@/components/common/LoadingSpinner'

const S = {
  listCard:       'card',
  listTitleDark:  'text-xl font-bold mb-4 text-white',
  listTitleLight: 'text-xl font-bold mb-4 text-gray-900',
  listSpace:      'space-y-3',
  listEmptyDark:  'text-center py-4 text-slate-300',
  listEmptyLight: 'text-center py-4 text-gray-500',
  itemDark:       'border rounded-lg p-4 border-slate-700',
  itemLight:      'border rounded-lg p-4 border-slate-200',
  itemRow:        'flex justify-between items-start',
  itemContent:    'min-w-0 flex-1',
  itemNameDark:   'font-medium text-white',
  itemNameLight:  'font-medium text-gray-900',
  itemMetaDark:   'text-sm mt-1 text-slate-200',
  itemMetaLight:  'text-sm mt-1 text-gray-700',
  itemAccentDark: 'font-medium text-blue-300',
  itemAccentLight:'font-medium text-blue-600',
  itemDocDark:    'text-sm mt-1 text-slate-300',
  itemDocLight:   'text-sm mt-1 text-gray-600',
  itemVigDark:    'text-xs mt-1 text-slate-400',
  itemVigLight:   'text-xs mt-1 text-gray-500',
  itemActions:    'flex gap-2',
  editBtn:        'p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors',
  deleteBtn:      'p-2 text-red-600 hover:bg-red-50 rounded transition-colors',
  iconMd:         'w-5 h-5',
}

export default function BloqueoList({ bloqueos, bloqueosPaginados, currentPage, totalPages, setCurrentPage, iniciarEdicion, handleEliminar, isDeleting, isCreating, isUpdating, itemsPerPage, theme }) {
  const isDark = theme === 'dark'

  return (
    <div className={S.listCard}>
      <h2 className={isDark ? S.listTitleDark : S.listTitleLight}>Bloqueos Activos</h2>
      <div className={S.listSpace}>
        {bloqueos.length === 0 ? (
          <p className={isDark ? S.listEmptyDark : S.listEmptyLight}>No hay bloqueos activos</p>
        ) : (
          bloqueosPaginados.map(bloqueo => (
            <div key={bloqueo.id} className={isDark ? S.itemDark : S.itemLight}>
              <div className={S.itemRow}>
                <div className={S.itemContent}>
                  <p className={isDark ? S.itemNameDark : S.itemNameLight}>{bloqueo.operating_rooms?.nombre}</p>
                  <p className={isDark ? S.itemMetaDark : S.itemMetaLight}>
                    <span className={isDark ? S.itemAccentDark : S.itemAccentLight}>Inicio:</span> {bloqueo.fecha} · {bloqueo.hora_inicio} - {bloqueo.hora_fin}
                  </p>
                  <p className={isDark ? S.itemMetaDark : S.itemMetaLight}>
                    <span className={isDark ? S.itemAccentDark : S.itemAccentLight}>Fin:</span>{' '}
                    {bloqueo.fecha_auto_liberacion || bloqueo.vigencia_hasta
                      ? (bloqueo.fecha_auto_liberacion || bloqueo.vigencia_hasta)
                      : 'Permanente (hasta liberación manual)'}
                  </p>
                  {bloqueo.doctors && (
                    <p className={isDark ? S.itemDocDark : S.itemDocLight}>
                      Dr. {bloqueo.doctors.nombre} {bloqueo.doctors.apellido}
                    </p>
                  )}
                  {bloqueo.motivo && (
                    <p className={isDark ? S.itemMetaDark : S.itemMetaLight}>{bloqueo.motivo}</p>
                  )}
                  {bloqueo.dias_auto_liberacion != null && (
                    <p className={isDark ? S.itemVigDark : S.itemVigLight}>
                      Vigencia: {bloqueo.dias_auto_liberacion} día(s) desde el inicio
                    </p>
                  )}
                </div>
                <div className={S.itemActions}>
                  <button onClick={() => iniciarEdicion(bloqueo)} className={S.editBtn} disabled={isCreating || isUpdating} title="Editar bloqueo">
                    <Edit className={S.iconMd} />
                  </button>
                  <button onClick={() => handleEliminar(bloqueo)} className={S.deleteBtn} disabled={isDeleting || isCreating || isUpdating} title="Eliminar bloqueo">
                    {isDeleting ? <LoadingSpinner size="sm" /> : <X className={S.iconMd} />}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {bloqueos.length > itemsPerPage && (
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} itemsPerPage={itemsPerPage} totalItems={bloqueos.length} />
      )}
    </div>
  )
}
