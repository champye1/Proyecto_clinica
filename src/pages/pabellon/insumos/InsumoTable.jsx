import { Edit, Trash2 } from 'lucide-react'
import Pagination from '@/components/common/Pagination'
import LoadingSpinner from '@/components/common/LoadingSpinner'

const S = {
  card:           'card',
  wrap:           'overflow-x-auto',
  table:          'w-full',
  theadDark:      'border-b border-slate-700',
  theadLight:     'border-b border-slate-200',
  thDark:         'text-left py-3 px-4 font-medium text-slate-200',
  thLight:        'text-left py-3 px-4 font-medium text-gray-700',
  trDark:         'border-b bg-slate-800 border-slate-700 hover:bg-slate-700 transition-colors',
  trLight:        'border-b bg-white border-slate-200 hover:bg-slate-50 transition-colors',
  tdPrimaryDark:  'py-3 px-4 text-white',
  tdPrimaryLight: 'py-3 px-4 text-gray-900',
  tdMonoDark:     'py-3 px-4 font-mono text-slate-100',
  tdMonoLight:    'py-3 px-4 font-mono text-gray-700',
  tdDark:         'py-3 px-4 text-slate-100',
  tdLight:        'py-3 px-4 text-gray-700',
  tdFonasaDark:   'py-3 px-4 font-mono text-sm text-slate-300',
  tdFonasaLight:  'py-3 px-4 font-mono text-sm text-gray-600',
  tdActions:      'py-3 px-4',
  actionsCell:    'flex gap-2',
  editBtn:        'p-2 text-blue-600 hover:bg-blue-50 rounded',
  deleteBtn:      'p-2 text-red-600 hover:bg-red-50 rounded',
  emptyDark:      'text-center py-8 text-slate-300',
  emptyLight:     'text-center py-8 text-gray-500',
  loadingDark:    'text-center py-8 text-slate-300',
  loadingLight:   'text-center py-8 text-gray-600',
  iconMd:         'w-5 h-5',
}

const HEADERS = ['Nombre', 'Código', 'Grupo Prestación', 'Proveedor', 'Grupos Fonasa', 'Acciones']

export default function InsumoTable({
  insumos, insumosPaginados, isLoading, isDark,
  iniciarEdicion, handleEliminar, isDeleting,
  currentPage, totalPages, setCurrentPage, itemsPerPage,
}) {
  return (
    <div className={S.card}>
      <div className={S.wrap}>
        <table className={S.table}>
          <thead>
            <tr className={isDark ? S.theadDark : S.theadLight}>
              {HEADERS.map(h => (
                <th
                  key={h}
                  className={isDark ? S.thDark : S.thLight}
                  title={h === 'Grupos Fonasa' ? 'Grupos de prestación FONASA para los que aplica este insumo. Vacío = todas las cirugías.' : undefined}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan="6" className={isDark ? S.loadingDark : S.loadingLight}>Cargando...</td></tr>
            ) : insumos.length === 0 ? (
              <tr><td colSpan="6" className={isDark ? S.emptyDark : S.emptyLight}>No se encontraron insumos</td></tr>
            ) : (
              insumosPaginados.map(insumo => (
                <tr key={insumo.id} className={isDark ? S.trDark : S.trLight}>
                  <td className={isDark ? S.tdPrimaryDark : S.tdPrimaryLight}>{insumo.nombre}</td>
                  <td className={isDark ? S.tdMonoDark : S.tdMonoLight}>{insumo.codigo}</td>
                  <td className={isDark ? S.tdDark : S.tdLight}>{insumo.grupo_prestacion}</td>
                  <td className={isDark ? S.tdDark : S.tdLight}>{insumo.proveedor || '—'}</td>
                  <td
                    className={isDark ? S.tdFonasaDark : S.tdFonasaLight}
                    title={insumo.grupos_fonasa ? `Cirugías grupo(s): ${insumo.grupos_fonasa}` : 'Todas las cirugías'}
                  >
                    {insumo.grupos_fonasa || '—'}
                  </td>
                  <td className={S.tdActions}>
                    <div className={S.actionsCell}>
                      <button onClick={() => iniciarEdicion(insumo)} className={S.editBtn}>
                        <Edit className={S.iconMd} />
                      </button>
                      <button
                        onClick={() => handleEliminar(insumo)}
                        className={S.deleteBtn}
                        disabled={isDeleting}
                        title="Eliminar insumo"
                      >
                        {isDeleting ? <LoadingSpinner size="sm" /> : <Trash2 className={S.iconMd} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {insumos.length > itemsPerPage && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          itemsPerPage={itemsPerPage}
          totalItems={insumos.length}
        />
      )}
    </div>
  )
}
