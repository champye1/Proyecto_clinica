import { useState, useEffect, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/config/supabase'
import { Plus, Edit, Trash2, Search, Download, FileSpreadsheet } from 'lucide-react'
import { useNotifications } from '@/hooks/useNotifications'
import { useDebounce } from '@/hooks/useDebounce'
import { exportToCSV, exportToExcel } from '@/utils/exportData'
import { sanitizeString, sanitizeCode } from '@/utils/sanitizeInput'
import Pagination from '@/components/common/Pagination'
import ConfirmModal from '@/components/common/ConfirmModal'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import { useTheme } from '@/contexts/ThemeContext'

// ─── Estilos ──────────────────────────────────────────────────────────────────
const STYLES = {
  page:           'space-y-6',
  header:         'flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4',
  title:          'text-2xl sm:text-3xl font-bold text-gray-900',
  actionsRow:     'flex flex-wrap gap-2',
  exportBtn:      'btn-secondary flex items-center gap-2 text-sm',
  exportLabel:    'hidden sm:inline',
  newBtn:         'btn-primary flex items-center gap-2 text-sm',
  newBtnLabelSm:  'hidden sm:inline',
  newBtnLabelXs:  'sm:hidden',
  searchCard:     'card',
  searchRow:      'flex gap-4',
  searchWrap:     'flex-1 relative',
  searchIcon:     'absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5',
  searchInput:    'input-field pl-10',
  filterSelect:   'input-field w-auto',
  formCard:       'card',
  formTitle:      'text-xl font-bold mb-4',
  formBody:       'space-y-4',
  formLabel:      'label-field',
  formInput:      'input-field',
  formInputError: 'input-field border-red-500',
  formError:      'text-xs text-red-600 mt-1',
  formHintDark:   'text-xs mt-1 text-slate-400',
  formHintLight:  'text-xs mt-1 text-gray-500',
  formFooter:     'flex gap-2',
  tableCard:      'card',
  tableWrap:      'overflow-x-auto',
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
  iconSm:         'w-4 h-4',
  iconMd:         'w-5 h-5',
  iconSmMd:       'w-4 h-4 sm:w-5 sm:h-5',
  submitBtn:      'btn-primary',
  cancelBtn:      'btn-secondary',
  loadingRow:     'flex items-center gap-2',
  selectWrap:     'relative',
}

export default function Insumos() {
  const [busqueda, setBusqueda] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('nombre') // nombre o codigo
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [insumoEditando, setInsumoEditando] = useState(null)
  const [formData, setFormData] = useState({
    nombre: '',
    codigo: '',
    grupo_prestacion: '',
    proveedor: '',
    grupos_fonasa: '',
  })
  const [showConfirmEliminar, setShowConfirmEliminar] = useState(false)
  const [insumoAEliminar, setInsumoAEliminar] = useState(null)
  const [codigoError, setCodigoError] = useState('')
  const [codigoTouched, setCodigoTouched] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 20

  const queryClient = useQueryClient()
  const { showSuccess, showError } = useNotifications()
  const debouncedBusqueda = useDebounce(busqueda, 300)
  const { theme } = useTheme()

  const { data: insumos = [], isLoading } = useQuery({
    queryKey: ['insumos', debouncedBusqueda, filtroTipo],
    queryFn: async () => {
      let query = supabase
        .from('supplies')
        .select('*')
        .eq('activo', true)
        .is('deleted_at', null)
        .order('nombre', { ascending: true })

      const termino = debouncedBusqueda.trim()
      if (termino) {
        if (filtroTipo === 'codigo') {
          query = query.ilike('codigo', `%${termino}%`)
        } else {
          query = query.ilike('nombre', `%${termino}%`)
        }
      }

      const { data, error } = await query
      if (error) throw error
      return data
    },
  })

  // Paginación
  const totalPages = Math.ceil(insumos.length / itemsPerPage)
  const insumosPaginados = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return insumos.slice(startIndex, startIndex + itemsPerPage)
  }, [insumos, currentPage, itemsPerPage])

  // Resetear página cuando cambia la búsqueda
  useEffect(() => {
    setCurrentPage(1)
  }, [debouncedBusqueda])

  // Funciones de exportación
  const handleExportCSV = () => {
    try {
      const columns = [
        { key: 'nombre', label: 'Nombre' },
        { key: 'codigo', label: 'Código' },
        { key: 'grupo_prestacion', label: 'Grupo Prestación' },
        { key: 'proveedor', label: 'Proveedor' },
        { key: 'grupos_fonasa', label: 'Grupos Fonasa' },
      ]
      exportToCSV(insumos, columns, 'insumos')
      showSuccess('Datos exportados a CSV exitosamente')
    } catch (error) {
      showError(`Error al exportar: ${error.message}`)
    }
  }

  const handleExportExcel = async () => {
    try {
      const columns = [
        { key: 'nombre', label: 'Nombre' },
        { key: 'codigo', label: 'Código' },
        { key: 'grupo_prestacion', label: 'Grupo Prestación' },
        { key: 'proveedor', label: 'Proveedor' },
        { key: 'grupos_fonasa', label: 'Grupos Fonasa' },
      ]
      await exportToExcel(insumos, columns, 'insumos')
      showSuccess('Datos exportados a Excel exitosamente')
    } catch (error) {
      showError(`Error al exportar: ${error.message}`)
    }
  }

  const crearInsumo = useMutation({
    mutationFn: async (data) => {
      const { error } = await supabase
        .from('supplies')
        .insert(data)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insumos'] })
      setMostrarFormulario(false)
      setFormData({ nombre: '', codigo: '', grupo_prestacion: '', proveedor: '', grupos_fonasa: '' })
      setCodigoError('')
      setCodigoTouched(false)
      showSuccess('Insumo creado exitosamente')
    },
    onError: (error) => {
      const errorMessage = error.message || error.toString() || 'Error desconocido'
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
        showError('Error de conexión. Verifique su conexión a internet e intente nuevamente.')
      } else {
        showError(`Error al crear insumo: ${errorMessage}`)
      }
    },
  })

  const actualizarInsumo = useMutation({
    mutationFn: async ({ id, data }) => {
      const { error } = await supabase
        .from('supplies')
        .update(data)
        .eq('id', id)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insumos'] })
      setInsumoEditando(null)
      setMostrarFormulario(false)
      setCodigoError('')
      setCodigoTouched(false)
      showSuccess('Insumo actualizado exitosamente')
    },
    onError: (error) => {
      const errorMessage = error.message || error.toString() || 'Error desconocido'
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
        showError('Error de conexión. Verifique su conexión a internet e intente nuevamente.')
      } else {
        showError(`Error al actualizar insumo: ${errorMessage}`)
      }
    },
  })

  const eliminarInsumo = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase
        .from('supplies')
        .update({ deleted_at: new Date().toISOString(), activo: false })
        .eq('id', id)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insumos'] })
      showSuccess('Insumo eliminado exitosamente')
    },
    onError: (error) => {
      const errorMessage = error.message || error.toString() || 'Error desconocido'
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
        showError('Error de conexión. Verifique su conexión a internet e intente nuevamente.')
      } else {
        showError(`Error al eliminar insumo: ${errorMessage}`)
      }
    },
  })

  // Validar solo que el código no esté duplicado (código libre por clínica)
  const validarCodigo = async (codigo) => {
    if (!codigo || codigo.trim() === '') {
      setCodigoError('')
      return
    }

    let query = supabase
      .from('supplies')
      .select('id')
      .eq('codigo', codigo.trim())
      .is('deleted_at', null)
    if (insumoEditando?.id) {
      query = query.neq('id', insumoEditando.id)
    }
    const { data: insumoExistente, error: errorBusqueda } = await query.maybeSingle()
    
    // Si falla la consulta (red, RLS, etc.) no bloquear: el código queda libre
    if (errorBusqueda) {
      setCodigoError('')
      return
    }
    
    if (insumoExistente) {
      setCodigoError('El código ya existe para otro insumo')
    } else {
      setCodigoError('')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validar solo duplicado; si la consulta falla no bloquear (código libre por clínica)
    if (codigoError) {
      showError(codigoError)
      return
    }

    const codigoTrim = (formData.codigo || '').trim()
    let queryCodigo = supabase
      .from('supplies')
      .select('id')
      .eq('codigo', codigoTrim)
      .is('deleted_at', null)
    if (insumoEditando?.id) {
      queryCodigo = queryCodigo.neq('id', insumoEditando.id)
    }
    const { data: insumoExistente, error: errorBusqueda } = await queryCodigo.maybeSingle()
    
    if (!errorBusqueda && insumoExistente) {
      showError('El código ya existe para otro insumo')
      return
    }
    
    const payload = {
      ...formData,
      codigo: codigoTrim,
      proveedor: (formData.proveedor || '').trim() || null,
      grupos_fonasa: (formData.grupos_fonasa || '').trim() || null,
      stock_actual: 0,
      stock_minimo: 0,
      unidad_medida: 'unidad',
    }
    if (insumoEditando) {
      actualizarInsumo.mutate({ id: insumoEditando.id, data: payload })
    } else {
      crearInsumo.mutate(payload)
    }
  }

  const handleEliminar = (insumo) => {
    setInsumoAEliminar(insumo)
    setShowConfirmEliminar(true)
  }

  const confirmarEliminar = () => {
    if (insumoAEliminar) {
      eliminarInsumo.mutate(insumoAEliminar.id)
    }
    setInsumoAEliminar(null)
  }

  const iniciarEdicion = (insumo) => {
    setInsumoEditando(insumo)
    setFormData({
      nombre: insumo.nombre,
      codigo: insumo.codigo,
      grupo_prestacion: insumo.grupo_prestacion,
      proveedor: insumo.proveedor ?? '',
      grupos_fonasa: insumo.grupos_fonasa ?? '',
    })
    setCodigoError('')
    setCodigoTouched(false)
    setMostrarFormulario(true)
  }

  const isDark = theme === 'dark'

  return (
    <div className={STYLES.page}>
      <div className={STYLES.header}>
        <div>
          <h1 className={STYLES.title}>Gestión de Insumos</h1>
        </div>
        <div className={STYLES.actionsRow}>
          {insumos.length > 0 && (
            <>
              <button onClick={handleExportCSV} className={STYLES.exportBtn} title="Exportar a CSV">
                <Download className={STYLES.iconSm} />
                <span className={STYLES.exportLabel}>CSV</span>
              </button>
              <button onClick={handleExportExcel} className={STYLES.exportBtn} title="Exportar a Excel">
                <FileSpreadsheet className={STYLES.iconSm} />
                <span className={STYLES.exportLabel}>Excel</span>
              </button>
            </>
          )}
          <button
            onClick={() => {
              setMostrarFormulario(true)
              setInsumoEditando(null)
              setFormData({ nombre: '', codigo: '', grupo_prestacion: '', proveedor: '', grupos_fonasa: '' })
              setCodigoError('')
              setCodigoTouched(false)
            }}
            className={STYLES.newBtn}
          >
            <Plus className={STYLES.iconSmMd} />
            <span className={STYLES.newBtnLabelSm}>Nuevo Insumo</span>
            <span className={STYLES.newBtnLabelXs}>Nuevo</span>
          </button>
        </div>
      </div>

      {/* Búsqueda */}
      <div className={STYLES.searchCard}>
        <div className={STYLES.searchRow}>
          <div className={STYLES.searchWrap}>
            <div className={STYLES.selectWrap}>
              <Search className={STYLES.searchIcon} />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(sanitizeString(e.target.value, { trim: false }))}
                placeholder={`Buscar por ${filtroTipo === 'codigo' ? 'código' : 'nombre'}...`}
                className={STYLES.searchInput}
              />
            </div>
          </div>
          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(sanitizeString(e.target.value))}
            className={STYLES.filterSelect}
          >
            <option value="nombre">Por Nombre</option>
            <option value="codigo">Por Código</option>
          </select>
        </div>
      </div>

      {mostrarFormulario && (
        <div className={STYLES.formCard}>
          <h2 className={STYLES.formTitle}>{insumoEditando ? 'Editar Insumo' : 'Nuevo Insumo'}</h2>
          <form onSubmit={handleSubmit} className={STYLES.formBody}>
            <div>
              <label className={STYLES.formLabel}>Nombre *</label>
              <input
                type="text"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: sanitizeString(e.target.value) })}
                className={STYLES.formInput}
                required
              />
            </div>

            <div>
              <label className={STYLES.formLabel}>Código *</label>
              <input
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
                className={codigoError ? STYLES.formInputError : STYLES.formInput}
                required
                disabled={!!insumoEditando}
              />
              {codigoError && codigoTouched && (
                <p className={STYLES.formError}>{codigoError}</p>
              )}
            </div>

            <div>
              <label className={STYLES.formLabel}>Grupo de Prestación *</label>
              <input
                type="text"
                value={formData.grupo_prestacion}
                onChange={(e) => setFormData({ ...formData, grupo_prestacion: sanitizeString(e.target.value) })}
                className={STYLES.formInput}
                required
              />
            </div>

            <div>
              <label className={STYLES.formLabel}>Proveedor (opcional)</label>
              <input
                type="text"
                value={formData.proveedor}
                onChange={(e) => setFormData({ ...formData, proveedor: sanitizeString(e.target.value) })}
                className={STYLES.formInput}
                placeholder="Quien proveyó el item"
              />
            </div>

            <div>
              <label className={STYLES.formLabel}>Grupos Fonasa (opcional)</label>
              <input
                type="text"
                value={formData.grupos_fonasa}
                onChange={(e) => setFormData({ ...formData, grupos_fonasa: sanitizeString(e.target.value) })}
                className={STYLES.formInput}
                placeholder="Ej: 18, 11, 30 — Vacío = disponible para todas las cirugías"
              />
              <p className={isDark ? STYLES.formHintDark : STYLES.formHintLight}>
                Códigos de grupo de prestación FONASA (según tipo de cirugía): 18 = general, 11 = ortopedia, 20 = plástica, 30 = oftalmología, 40 = otorrino, 50 = urología, 60 = gineco. Separados por coma. Vacío = el insumo aplica a todas las cirugías.
              </p>
            </div>

            <div className={STYLES.formFooter}>
              <button
                type="submit"
                className={STYLES.submitBtn}
                disabled={crearInsumo.isPending || actualizarInsumo.isPending}
              >
                {crearInsumo.isPending || actualizarInsumo.isPending ? (
                  <span className={STYLES.loadingRow}>
                    <LoadingSpinner size="sm" />
                    {insumoEditando ? 'Actualizando...' : 'Creando...'}
                  </span>
                ) : (
                  insumoEditando ? 'Actualizar' : 'Crear'
                )}
              </button>
              <button
                type="button"
                onClick={() => { setMostrarFormulario(false); setInsumoEditando(null) }}
                className={STYLES.cancelBtn}
                disabled={crearInsumo.isPending || actualizarInsumo.isPending}
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className={STYLES.tableCard}>
        <div className={STYLES.tableWrap}>
          <table className={STYLES.table}>
            <thead>
              <tr className={isDark ? STYLES.theadDark : STYLES.theadLight}>
                {['Nombre', 'Código', 'Grupo Prestación', 'Proveedor'].map(h => (
                  <th key={h} className={isDark ? STYLES.thDark : STYLES.thLight}>{h}</th>
                ))}
                <th
                  className={isDark ? STYLES.thDark : STYLES.thLight}
                  title="Grupos de prestación FONASA para los que aplica este insumo (ej. 18=general, 11=ortopedia). Vacío = todas las cirugías."
                >
                  Grupos Fonasa
                </th>
                <th className={isDark ? STYLES.thDark : STYLES.thLight}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="6" className={isDark ? STYLES.loadingDark : STYLES.loadingLight}>Cargando...</td>
                </tr>
              ) : insumos.length === 0 ? (
                <tr>
                  <td colSpan="6" className={isDark ? STYLES.emptyDark : STYLES.emptyLight}>
                    No se encontraron insumos
                  </td>
                </tr>
              ) : (
                insumosPaginados.map(insumo => (
                  <tr key={insumo.id} className={isDark ? STYLES.trDark : STYLES.trLight}>
                    <td className={isDark ? STYLES.tdPrimaryDark : STYLES.tdPrimaryLight}>{insumo.nombre}</td>
                    <td className={isDark ? STYLES.tdMonoDark : STYLES.tdMonoLight}>{insumo.codigo}</td>
                    <td className={isDark ? STYLES.tdDark : STYLES.tdLight}>{insumo.grupo_prestacion}</td>
                    <td className={isDark ? STYLES.tdDark : STYLES.tdLight}>{insumo.proveedor || '—'}</td>
                    <td
                      className={isDark ? STYLES.tdFonasaDark : STYLES.tdFonasaLight}
                      title={insumo.grupos_fonasa ? `Cirugías grupo(s): ${insumo.grupos_fonasa}` : 'Todas las cirugías'}
                    >
                      {insumo.grupos_fonasa || '—'}
                    </td>
                    <td className={STYLES.tdActions}>
                      <div className={STYLES.actionsCell}>
                        <button onClick={() => iniciarEdicion(insumo)} className={STYLES.editBtn}>
                          <Edit className={STYLES.iconMd} />
                        </button>
                        <button
                          onClick={() => handleEliminar(insumo)}
                          className={STYLES.deleteBtn}
                          disabled={eliminarInsumo.isPending}
                          title="Eliminar insumo"
                        >
                          {eliminarInsumo.isPending ? <LoadingSpinner size="sm" /> : <Trash2 className={STYLES.iconMd} />}
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

      <ConfirmModal
        isOpen={showConfirmEliminar}
        onClose={() => { setShowConfirmEliminar(false); setInsumoAEliminar(null) }}
        onConfirm={confirmarEliminar}
        title="Eliminar Insumo"
        message={insumoAEliminar ? `¿Estás seguro de eliminar el insumo "${insumoAEliminar.nombre}"?\n\nCódigo: ${insumoAEliminar.codigo}\nGrupo: ${insumoAEliminar.grupo_prestacion}` : ''}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
      />
    </div>
  )
}
