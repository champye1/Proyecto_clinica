import { Edit, Trash2, CheckCircle2, XCircle, Palmtree, UserCheck } from 'lucide-react'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import Pagination from '@/components/common/Pagination'
import { formatRut } from '@/utils/rutFormatter'

const S = {
  tableCard:          'card',
  tableWrap:          'overflow-x-auto',
  table:              'w-full',
  theadDark:          'border-b border-slate-700',
  theadLight:         'border-b border-slate-200',
  thDark:             'text-left py-3 px-4 font-medium text-slate-200',
  thLight:            'text-left py-3 px-4 font-medium text-gray-700',
  trDark:             'border-b bg-slate-800 border-slate-700 hover:bg-slate-700 transition-colors',
  trLight:            'border-b bg-white border-slate-200 hover:bg-slate-50 transition-colors',
  tdPrimaryDark:      'py-3 px-4 text-white',
  tdPrimaryLight:     'py-3 px-4 text-gray-900',
  tdDark:             'py-3 px-4 text-slate-100',
  tdLight:            'py-3 px-4 text-gray-700',
  tdActions:          'py-3 px-4',
  actionsCell:        'flex gap-2',
  editBtnDark:        'p-2 rounded transition-colors text-blue-400 hover:bg-blue-900/30 hover:text-blue-300',
  editBtnLight:       'p-2 rounded transition-colors text-blue-600 hover:bg-blue-50',
  accessBtnDark:      'p-2 rounded transition-colors text-green-400 hover:bg-green-900/30 hover:text-green-300',
  accessBtnLight:     'p-2 rounded transition-colors text-green-600 hover:bg-green-50',
  estadoActivoBtnDark:  'p-2 rounded transition-colors text-yellow-400 hover:bg-yellow-900/30 hover:text-yellow-300',
  estadoActivoBtnLight: 'p-2 rounded transition-colors text-yellow-600 hover:bg-yellow-50',
  estadoVacaBtnDark:    'p-2 rounded transition-colors text-blue-400 hover:bg-blue-900/30 hover:text-blue-300',
  estadoVacaBtnLight:   'p-2 rounded transition-colors text-blue-600 hover:bg-blue-50',
  deleteBtnDark:      'p-2 rounded transition-colors text-red-400 hover:bg-red-900/30 hover:text-red-300',
  deleteBtnLight:     'p-2 rounded transition-colors text-red-600 hover:bg-red-50',
  checkIconDark:      'w-5 h-5 text-green-400',
  checkIconLight:     'w-5 h-5 text-green-600',
  crossIconDark:      'w-5 h-5 text-slate-500',
  crossIconLight:     'w-5 h-5 text-gray-400',
  stateBadge:         'px-2 py-1 rounded text-xs',
  emptyDark:          'text-center py-8 text-slate-300',
  emptyLight:         'text-center py-8 text-gray-500',
  iconMd:             'w-5 h-5',
}

export default function MedicosTable({
  medicos, medicosFiltrados, medicosPaginados,
  busqueda, filtroEspecialidad, filtroEstado,
  isLoading,
  currentPage, totalPages, itemsPerPage, setCurrentPage,
  toggleAccesoWeb, toggleEstado, eliminarMedico,
  iniciarEdicion, handleEliminar,
  getEstadoBadge, theme,
}) {
  const isDark = theme === 'dark'

  return (
    <div className={S.tableCard}>
      <div className={S.tableWrap}>
        <table className={S.table}>
          <thead>
            <tr className={isDark ? S.theadDark : S.theadLight}>
              {['Nombre', 'RUT', 'Correo', 'Especialidad', 'Estado', 'Acceso Web', 'Acciones'].map(h => (
                <th key={h} className={isDark ? S.thDark : S.thLight}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan="7" className={isDark ? 'text-center py-8 text-slate-300' : 'text-center py-8 text-gray-600'}>Cargando...</td></tr>
            ) : medicosFiltrados.length === 0 ? (
              <tr>
                <td colSpan="7" className={isDark ? S.emptyDark : S.emptyLight}>
                  {busqueda || filtroEspecialidad || filtroEstado ? 'No se encontraron médicos con los filtros aplicados' : 'No hay médicos registrados'}
                </td>
              </tr>
            ) : (
              medicosPaginados.map(medico => (
                <tr key={medico.id} className={isDark ? S.trDark : S.trLight}>
                  <td className={isDark ? S.tdPrimaryDark : S.tdPrimaryLight}>{medico.nombre} {medico.apellido}</td>
                  <td className={isDark ? S.tdDark : S.tdLight}>{formatRut(medico.rut)}</td>
                  <td className={isDark ? S.tdDark : S.tdLight}>{(medico.email || '').toLowerCase()}</td>
                  <td className={isDark ? S.tdDark : S.tdLight}>{medico.especialidad.replace(/_/g, ' ')}</td>
                  <td className={S.tdActions}>
                    <span className={`${S.stateBadge} ${getEstadoBadge(medico.estado)}`}>{medico.estado}</span>
                  </td>
                  <td className={S.tdActions}>
                    {medico.acceso_web_enabled
                      ? <CheckCircle2 className={isDark ? S.checkIconDark : S.checkIconLight} />
                      : <XCircle className={isDark ? S.crossIconDark : S.crossIconLight} />}
                  </td>
                  <td className={S.tdActions}>
                    <div className={S.actionsCell}>
                      <button onClick={() => iniciarEdicion(medico)} className={isDark ? S.editBtnDark : S.editBtnLight} title="Editar médico">
                        <Edit className={S.iconMd} />
                      </button>
                      <button onClick={() => toggleAccesoWeb.mutate({ id: medico.id, acceso_web_enabled: !medico.acceso_web_enabled })} className={isDark ? S.accessBtnDark : S.accessBtnLight} title={medico.acceso_web_enabled ? 'Deshabilitar acceso web' : 'Habilitar acceso web'} disabled={toggleAccesoWeb.isPending}>
                        {toggleAccesoWeb.isPending ? <LoadingSpinner size="sm" /> : medico.acceso_web_enabled ? <XCircle className={S.iconMd} /> : <CheckCircle2 className={S.iconMd} />}
                      </button>
                      <button onClick={() => toggleEstado.mutate({ id: medico.id, estado: medico.estado })} className={medico.estado === 'activo' ? (isDark ? S.estadoActivoBtnDark : S.estadoActivoBtnLight) : (isDark ? S.estadoVacaBtnDark : S.estadoVacaBtnLight)} title={medico.estado === 'activo' ? 'Poner en vacaciones' : 'Activar médico'} disabled={toggleEstado.isPending}>
                        {toggleEstado.isPending ? <LoadingSpinner size="sm" /> : medico.estado === 'activo' ? <Palmtree className={S.iconMd} /> : <UserCheck className={S.iconMd} />}
                      </button>
                      <button onClick={() => handleEliminar(medico)} className={isDark ? S.deleteBtnDark : S.deleteBtnLight} title="Eliminar médico" disabled={eliminarMedico.isPending}>
                        {eliminarMedico.isPending ? <LoadingSpinner size="sm" /> : <Trash2 className={S.iconMd} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {medicosFiltrados.length > itemsPerPage && (
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} itemsPerPage={itemsPerPage} totalItems={medicosFiltrados.length} />
      )}
    </div>
  )
}
