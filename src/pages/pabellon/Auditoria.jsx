import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, Filter, Download, FileSpreadsheet, Calendar, User, Database, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useDebounce } from '@/hooks/useDebounce'
import { sanitizeString } from '@/utils/sanitizeInput'
import { logger } from '@/utils/logger'
import { exportToCSV, exportToExcel } from '@/utils/exportData'
import Pagination from '@/components/common/Pagination'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import { useTheme } from '@/contexts/ThemeContext'
import { tc } from '@/constants/theme'

// ─── Estilos ──────────────────────────────────────────────────────────────────
const STYLES = {
  page:           'space-y-6',
  header:         'flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4',
  titleDark:      'text-2xl sm:text-3xl font-bold text-white',
  titleLight:     'text-2xl sm:text-3xl font-bold text-gray-900',
  exportRow:      'flex gap-2',
  exportBtn:      'btn-secondary flex items-center gap-2 text-sm',
  exportBtnLabel: 'hidden sm:inline',
  filtersCard:    'card',
  searchWrap:     'relative',
  searchIcon:     'absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5',
  searchInput:    'input-field pl-10',
  filtersGrid:    'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4',
  filterLabel:    'label-field text-sm',
  filterSelect:   'input-field',
  filterInput:    'input-field',
  tableCard:      'card',
  loadingWrap:    'text-center py-8',
  emptyDark:      'text-center py-8 text-slate-300',
  emptyLight:     'text-center py-8 text-gray-500',
  tableWrap:      'overflow-x-auto',
  table:          'w-full',
  theadDark:      'border-b border-slate-700',
  theadLight:     'border-b border-slate-200',
  thDark:         'text-left py-3 px-4 font-medium text-slate-200',
  thLight:        'text-left py-3 px-4 font-medium text-gray-700',
  trDark:         'border-b bg-slate-800 border-slate-700 hover:bg-slate-700 transition-colors',
  trLight:        'border-b bg-white border-slate-200 hover:bg-slate-50 transition-colors',
  tdDark:         'py-3 px-4 text-sm text-slate-100',
  tdLight:        'py-3 px-4 text-sm text-gray-700',
  tdCellDark:     'py-3 px-4 text-slate-100',
  tdCellLight:    'py-3 px-4 text-gray-700',
  cellIconDark:   'flex items-center gap-2 text-slate-400',
  cellIconLight:  'flex items-center gap-2 text-gray-400',
  cellIcon:       'w-4 h-4',
  actionBadge:    'px-2 py-1 rounded text-xs font-medium',
  idMonoDark:     'text-sm font-mono text-slate-200',
  idMonoLight:    'text-sm font-mono text-gray-600',
  iconSm:         'w-4 h-4',
  spaceY4:        'space-y-4',
  textSm:         'text-sm',
  textSmMono:     'text-sm font-mono',
  tdCell:         'py-3 px-4',
}

export default function Auditoria() {
  const [busqueda, setBusqueda] = useState('')
  const [filtroTabla, setFiltroTabla] = useState('')
  const [filtroAccion, setFiltroAccion] = useState('')
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 20

  const debouncedBusqueda = useDebounce(busqueda, 300)
  const { theme } = useTheme()

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['audit-logs', filtroTabla, filtroAccion, fechaDesde, fechaHasta],
    queryFn: async () => {
      let query = supabase
        .from('audit_logs')
        .select(`
          *,
          users:user_id(email, role)
        `)
        .order('created_at', { ascending: false })
        .limit(1000) // Limitar a 1000 registros más recientes

      if (filtroTabla) {
        query = query.eq('tabla_afectada', filtroTabla)
      }

      if (filtroAccion) {
        query = query.eq('accion', filtroAccion.toUpperCase())
      }

      if (fechaDesde) {
        query = query.gte('created_at', fechaDesde)
      }

      if (fechaHasta) {
        query = query.lte('created_at', fechaHasta + 'T23:59:59')
      }

      const { data, error } = await query
      if (error) throw error
      return data || []
    },
  })

  // Filtrar por búsqueda
  const logsFiltrados = useMemo(() => {
    return logs.filter(log => {
      if (debouncedBusqueda) {
        const busquedaLower = debouncedBusqueda.toLowerCase()
        const accion = log.accion?.toLowerCase() || ''
        const tabla = log.tabla_afectada?.toLowerCase() || ''
        const email = log.users?.email?.toLowerCase() || ''
        
        if (!accion.includes(busquedaLower) && 
            !tabla.includes(busquedaLower) && 
            !email.includes(busquedaLower)) {
          return false
        }
      }
      return true
    })
  }, [logs, debouncedBusqueda])

  // Paginación
  const totalPages = Math.ceil(logsFiltrados.length / itemsPerPage)
  const logsPaginados = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return logsFiltrados.slice(startIndex, startIndex + itemsPerPage)
  }, [logsFiltrados, currentPage, itemsPerPage])

  // Obtener tablas únicas para filtro
  const tablasUnicas = useMemo(() => {
    const tablas = new Set()
    logs.forEach(log => {
      if (log.tabla_afectada) {
        tablas.add(log.tabla_afectada)
      }
    })
    return Array.from(tablas).sort()
  }, [logs])

  // Funciones de exportación
  const handleExportCSV = () => {
    try {
      const columns = [
        { key: 'created_at', label: 'Fecha y Hora' },
        { key: 'users.email', label: 'Usuario' },
        { key: 'accion', label: 'Acción' },
        { key: 'tabla_afectada', label: 'Tabla' },
        { key: 'registro_id', label: 'ID Registro' },
      ]
      exportToCSV(logsFiltrados.map(log => ({
        ...log,
        'created_at': format(new Date(log.created_at), 'dd/MM/yyyy HH:mm:ss'),
        'users.email': log.users?.email || 'Sistema',
        'registro_id': log.registro_id || '-',
      })), columns, 'auditoria')
    } catch (error) {
      logger.errorWithContext('Error al exportar CSV', error)
    }
  }

  const handleExportExcel = async () => {
    try {
      const columns = [
        { key: 'created_at', label: 'Fecha y Hora' },
        { key: 'users.email', label: 'Usuario' },
        { key: 'accion', label: 'Acción' },
        { key: 'tabla_afectada', label: 'Tabla' },
        { key: 'registro_id', label: 'ID Registro' },
      ]
      await exportToExcel(logsFiltrados.map(log => ({
        ...log,
        'created_at': format(new Date(log.created_at), 'dd/MM/yyyy HH:mm:ss'),
        'users.email': log.users?.email || 'Sistema',
        'registro_id': log.registro_id || '-',
      })), columns, 'auditoria')
    } catch (error) {
      logger.errorWithContext('Error al exportar CSV', error)
    }
  }

  const getAccionColor = (accion, currentTheme = 'light') => {
    if (currentTheme === 'dark') {
      const colores = {
        'INSERT': 'bg-green-900 text-green-200',
        'UPDATE': 'bg-blue-900 text-blue-200',
        'DELETE': 'bg-red-900 text-red-200',
      }
      return colores[accion] || 'bg-slate-700 text-slate-200'
    }
    const colores = {
      'INSERT': 'bg-green-100 text-green-800',
      'UPDATE': 'bg-blue-100 text-blue-800',
      'DELETE': 'bg-red-100 text-red-800',
    }
    return colores[accion] || 'bg-gray-100 text-gray-800'
  }

  const t = tc(theme)
  const isDark = theme === 'dark'

  return (
    <div className={STYLES.page}>
      <div className={STYLES.header}>
        <h1 className={isDark ? STYLES.titleDark : STYLES.titleLight}>Historial de Auditoría</h1>
        {logsFiltrados.length > 0 && (
          <div className={STYLES.exportRow}>
            <button onClick={handleExportCSV} className={STYLES.exportBtn} title="Exportar a CSV">
              <Download className={STYLES.iconSm} />
              <span className={STYLES.exportBtnLabel}>CSV</span>
            </button>
            <button onClick={handleExportExcel} className={STYLES.exportBtn} title="Exportar a Excel">
              <FileSpreadsheet className={STYLES.iconSm} />
              <span className={STYLES.exportBtnLabel}>Excel</span>
            </button>
          </div>
        )}
      </div>

      {/* Filtros */}
      <div className={STYLES.filtersCard}>
        <div className={STYLES.spaceY4}>
          <div className={STYLES.searchWrap}>
            <Search className={STYLES.searchIcon} />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(sanitizeString(e.target.value))}
              placeholder="Buscar por acción, tabla o usuario..."
              className={STYLES.searchInput}
            />
          </div>

          <div className={STYLES.filtersGrid}>
            <div>
              <label className={STYLES.filterLabel}>Tabla</label>
              <select
                value={filtroTabla}
                onChange={(e) => { setFiltroTabla(sanitizeString(e.target.value)); setCurrentPage(1) }}
                className={STYLES.filterSelect}
              >
                <option value="">Todas las tablas</option>
                {tablasUnicas.map(tabla => (
                  <option key={tabla} value={tabla}>{tabla}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={STYLES.filterLabel}>Acción</label>
              <select
                value={filtroAccion}
                onChange={(e) => { setFiltroAccion(sanitizeString(e.target.value)); setCurrentPage(1) }}
                className={STYLES.filterSelect}
              >
                <option value="">Todas las acciones</option>
                <option value="INSERT">Crear (INSERT)</option>
                <option value="UPDATE">Actualizar (UPDATE)</option>
                <option value="DELETE">Eliminar (DELETE)</option>
              </select>
            </div>

            <div>
              <label className={STYLES.filterLabel}>Desde</label>
              <input
                type="date"
                value={fechaDesde}
                onChange={(e) => { setFechaDesde(sanitizeString(e.target.value)); setCurrentPage(1) }}
                className={STYLES.filterInput}
              />
            </div>

            <div>
              <label className={STYLES.filterLabel}>Hasta</label>
              <input
                type="date"
                value={fechaHasta}
                onChange={(e) => { setFechaHasta(sanitizeString(e.target.value)); setCurrentPage(1) }}
                className={STYLES.filterInput}
                min={fechaDesde}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Lista de logs */}
      <div className={STYLES.tableCard}>
        {isLoading ? (
          <div className={STYLES.loadingWrap}>
            <LoadingSpinner />
          </div>
        ) : logsFiltrados.length === 0 ? (
          <div className={isDark ? STYLES.emptyDark : STYLES.emptyLight}>
            No se encontraron registros de auditoría
          </div>
        ) : (
          <>
            <div className={STYLES.tableWrap}>
              <table className={STYLES.table}>
                <thead>
                  <tr className={isDark ? STYLES.theadDark : STYLES.theadLight}>
                    {['Fecha y Hora', 'Usuario', 'Acción', 'Tabla', 'ID Registro'].map(h => (
                      <th key={h} className={isDark ? STYLES.thDark : STYLES.thLight}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {logsPaginados.map(log => (
                    <tr key={log.id} className={isDark ? STYLES.trDark : STYLES.trLight}>
                      <td className={isDark ? STYLES.tdDark : STYLES.tdLight}>
                        <div className={isDark ? STYLES.cellIconDark : STYLES.cellIconLight}>
                          <Clock className={STYLES.cellIcon} />
                          {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm:ss', { locale: es })}
                        </div>
                      </td>
                      <td className={isDark ? STYLES.tdCellDark : STYLES.tdCellLight}>
                        <div className={isDark ? STYLES.cellIconDark : STYLES.cellIconLight}>
                          <User className={STYLES.cellIcon} />
                          <span className={STYLES.textSm}>{log.users?.email || 'Sistema'}</span>
                        </div>
                      </td>
                      <td className={STYLES.tdCell}>
                        <span className={`${STYLES.actionBadge} ${getAccionColor(log.accion, theme)}`}>
                          {log.accion}
                        </span>
                      </td>
                      <td className={isDark ? STYLES.tdCellDark : STYLES.tdCellLight}>
                        <div className={isDark ? STYLES.cellIconDark : STYLES.cellIconLight}>
                          <Database className={STYLES.cellIcon} />
                          <span className={STYLES.textSmMono}>{log.tabla_afectada}</span>
                        </div>
                      </td>
                      <td className={STYLES.tdCell}>
                        <span className={isDark ? STYLES.idMonoDark : STYLES.idMonoLight}>
                          {log.registro_id ? log.registro_id.substring(0, 8) + '...' : '-'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {logsFiltrados.length > itemsPerPage && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                itemsPerPage={itemsPerPage}
                totalItems={logsFiltrados.length}
              />
            )}
          </>
        )}
      </div>
    </div>
  )
}
