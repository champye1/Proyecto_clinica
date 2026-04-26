import { useState, useEffect, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Download, FileSpreadsheet } from 'lucide-react'
import { useNotifications } from '@/hooks/useNotifications'
import { useDebounce } from '@/hooks/useDebounce'
import { exportToCSV, exportToExcel } from '@/utils/exportData'
import { sanitizeString } from '@/utils/sanitizeInput'
import ConfirmModal from '@/components/common/ConfirmModal'
import { useTheme } from '@/contexts/ThemeContext'
import { tc } from '@/constants/theme'
import { fetchSupplies, checkCodeExists, createSupply, updateSupply, deleteSupply } from '@/services/supplyService'
import InsumoForm from './insumos/InsumoForm'
import InsumoTable from './insumos/InsumoTable'

const EMPTY_FORM = { nombre: '', codigo: '', grupo_prestacion: '', proveedor: '', grupos_fonasa: '' }

export default function Insumos() {
  const [busqueda, setBusqueda]                 = useState('')
  const [filtroTipo, setFiltroTipo]             = useState('nombre')
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [insumoEditando, setInsumoEditando]     = useState(null)
  const [formData, setFormData]                 = useState(EMPTY_FORM)
  const [showConfirmEliminar, setShowConfirmEliminar] = useState(false)
  const [insumoAEliminar, setInsumoAEliminar]   = useState(null)
  const [codigoError, setCodigoError]           = useState('')
  const [codigoTouched, setCodigoTouched]       = useState(false)
  const [currentPage, setCurrentPage]           = useState(1)
  const itemsPerPage = 20

  const queryClient = useQueryClient()
  const { showSuccess, showError } = useNotifications()
  const debouncedBusqueda = useDebounce(busqueda, 300)
  const { theme } = useTheme()
  const t = tc(theme)
  const isDark = theme === 'dark'

  const { data: insumos = [], isLoading } = useQuery({
    queryKey: ['insumos', debouncedBusqueda, filtroTipo],
    queryFn: () => fetchSupplies({ search: debouncedBusqueda, searchBy: filtroTipo }).then(r => { if (r.error) throw r.error; return r.data }),
  })

  const totalPages = Math.ceil(insumos.length / itemsPerPage)
  const insumosPaginados = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return insumos.slice(start, start + itemsPerPage)
  }, [insumos, currentPage, itemsPerPage])

  useEffect(() => { setCurrentPage(1) }, [debouncedBusqueda])

  const EXPORT_COLS = [
    { key: 'nombre', label: 'Nombre' },
    { key: 'codigo', label: 'Código' },
    { key: 'grupo_prestacion', label: 'Grupo Prestación' },
    { key: 'proveedor', label: 'Proveedor' },
    { key: 'grupos_fonasa', label: 'Grupos Fonasa' },
  ]

  const handleExportCSV = () => {
    try { exportToCSV(insumos, EXPORT_COLS, 'insumos'); showSuccess('Datos exportados a CSV exitosamente') }
    catch (e) { showError(`Error al exportar: ${e.message}`) }
  }

  const handleExportExcel = async () => {
    try { await exportToExcel(insumos, EXPORT_COLS, 'insumos'); showSuccess('Datos exportados a Excel exitosamente') }
    catch (e) { showError(`Error al exportar: ${e.message}`) }
  }

  const crearInsumo = useMutation({
    mutationFn: (data) => createSupply(data).then(r => { if (r.error) throw r.error }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insumos'] })
      setMostrarFormulario(false); setFormData(EMPTY_FORM); setCodigoError(''); setCodigoTouched(false)
      showSuccess('Insumo creado exitosamente')
    },
    onError: (e) => {
      const msg = e.message || e.toString()
      showError(msg.includes('Failed to fetch') ? 'Error de conexión.' : `Error al crear insumo: ${msg}`)
    },
  })

  const actualizarInsumo = useMutation({
    mutationFn: ({ id, data }) => updateSupply(id, data).then(r => { if (r.error) throw r.error }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insumos'] })
      setInsumoEditando(null); setMostrarFormulario(false); setCodigoError(''); setCodigoTouched(false)
      showSuccess('Insumo actualizado exitosamente')
    },
    onError: (e) => {
      const msg = e.message || e.toString()
      showError(msg.includes('Failed to fetch') ? 'Error de conexión.' : `Error al actualizar insumo: ${msg}`)
    },
  })

  const eliminarInsumo = useMutation({
    mutationFn: (id) => deleteSupply(id).then(r => { if (r.error) throw r.error }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['insumos'] }); showSuccess('Insumo eliminado exitosamente') },
    onError: (e) => {
      const msg = e.message || e.toString()
      showError(msg.includes('Failed to fetch') ? 'Error de conexión.' : `Error al eliminar insumo: ${msg}`)
    },
  })

  const validarCodigo = async (codigo) => {
    if (!codigo?.trim()) { setCodigoError(''); return }
    const { exists } = await checkCodeExists(codigo, insumoEditando?.id)
    setCodigoError(exists ? 'El código ya existe para otro insumo' : '')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (codigoError) { showError(codigoError); return }
    const { exists } = await checkCodeExists(formData.codigo, insumoEditando?.id)
    if (exists) { showError('El código ya existe para otro insumo'); return }
    const payload = {
      ...formData,
      codigo: (formData.codigo || '').trim(),
      proveedor: (formData.proveedor || '').trim() || null,
      grupos_fonasa: (formData.grupos_fonasa || '').trim() || null,
      stock_actual: 0, stock_minimo: 0, unidad_medida: 'unidad',
    }
    if (insumoEditando) actualizarInsumo.mutate({ id: insumoEditando.id, data: payload })
    else crearInsumo.mutate(payload)
  }

  const iniciarEdicion = (insumo) => {
    setInsumoEditando(insumo)
    setFormData({ nombre: insumo.nombre, codigo: insumo.codigo, grupo_prestacion: insumo.grupo_prestacion, proveedor: insumo.proveedor ?? '', grupos_fonasa: insumo.grupos_fonasa ?? '' })
    setCodigoError(''); setCodigoTouched(false); setMostrarFormulario(true)
  }

  const handleEliminar = (insumo) => { setInsumoAEliminar(insumo); setShowConfirmEliminar(true) }
  const confirmarEliminar = () => { if (insumoAEliminar) eliminarInsumo.mutate(insumoAEliminar.id); setInsumoAEliminar(null) }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Gestión de Insumos</h1>
        <div className="flex flex-wrap gap-2">
          {insumos.length > 0 && (
            <>
              <button onClick={handleExportCSV} className="btn-secondary flex items-center gap-2 text-sm" title="Exportar a CSV">
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">CSV</span>
              </button>
              <button onClick={handleExportExcel} className="btn-secondary flex items-center gap-2 text-sm" title="Exportar a Excel">
                <FileSpreadsheet className="w-4 h-4" />
                <span className="hidden sm:inline">Excel</span>
              </button>
            </>
          )}
          <button
            onClick={() => { setMostrarFormulario(true); setInsumoEditando(null); setFormData(EMPTY_FORM); setCodigoError(''); setCodigoTouched(false) }}
            className="btn-primary flex items-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Nuevo Insumo</span>
            <span className="sm:hidden">Nuevo</span>
          </button>
        </div>
      </div>

      <div className="card">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(sanitizeString(e.target.value, { trim: false }))}
              placeholder={`Buscar por ${filtroTipo === 'codigo' ? 'código' : 'nombre'}...`}
              className="input-field pl-10"
            />
          </div>
          <select value={filtroTipo} onChange={(e) => setFiltroTipo(sanitizeString(e.target.value))} className="input-field w-auto">
            <option value="nombre">Por Nombre</option>
            <option value="codigo">Por Código</option>
          </select>
        </div>
      </div>

      {mostrarFormulario && (
        <InsumoForm
          formData={formData}
          setFormData={setFormData}
          insumoEditando={insumoEditando}
          codigoError={codigoError}
          codigoTouched={codigoTouched}
          setCodigoTouched={setCodigoTouched}
          validarCodigo={validarCodigo}
          handleSubmit={handleSubmit}
          isCreating={crearInsumo.isPending}
          isUpdating={actualizarInsumo.isPending}
          onCancel={() => { setMostrarFormulario(false); setInsumoEditando(null) }}
          isDark={isDark}
        />
      )}

      <InsumoTable
        insumos={insumos}
        insumosPaginados={insumosPaginados}
        isLoading={isLoading}
        isDark={isDark}
        iniciarEdicion={iniciarEdicion}
        handleEliminar={handleEliminar}
        isDeleting={eliminarInsumo.isPending}
        currentPage={currentPage}
        totalPages={totalPages}
        setCurrentPage={setCurrentPage}
        itemsPerPage={itemsPerPage}
      />

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
